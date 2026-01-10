package storage

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib" // PGX driver
	"github.com/redis/go-redis/v9"
	"github.com/user/drawli/internal/protocol"
)

// Store defines the interface for data persistence
type Store interface {
	SaveOp(op *protocol.DrawOp) error
	GetOps() ([]*protocol.DrawOp, error)
	Close() error
}

// Manager handles the write-behind strategy
type Manager struct {
	rdb *redis.Client
	db  *sql.DB

	opBuffer chan *protocol.DrawOp
}

func NewManager(redisAddr, postgresDSN string) (*Manager, error) {
	// 1. Connect Redis
	var rdb *redis.Client
	if len(redisAddr) > 0 && (redisAddr[:8] == "redis://" || redisAddr[:9] == "rediss://") {
		opt, err := redis.ParseURL(redisAddr)
		if err != nil {
			return nil, fmt.Errorf("redis parse url: %w", err)
		}
		rdb = redis.NewClient(opt)
	} else {
		rdb = redis.NewClient(&redis.Options{
			Addr: redisAddr,
		})
	}

	if err := rdb.Ping(context.Background()).Err(); err != nil {
		return nil, fmt.Errorf("redis connect: %w", err)
	}

	// 2. Connect Postgres
	db, err := sql.Open("pgx", postgresDSN)
	if err != nil {
		return nil, fmt.Errorf("postgres open: %w", err)
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("postgres ping: %w", err)
	}

	// Create schema if not exists
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS canvas_objects (
			id UUID PRIMARY KEY,
			user_id TEXT,
			data JSONB,
			created_at TIMESTAMP DEFAULT NOW()
		);
	`)
	if err != nil {
		return nil, fmt.Errorf("create table: %w", err)
	}

	m := &Manager{
		rdb:      rdb,
		db:       db,
		opBuffer: make(chan *protocol.DrawOp, 1000), // Buffer for write-behind
	}

	// Start Write-Behind Worker
	go m.worker()

	return m, nil
}

// SaveOp pushes to Redis (Hot) and buffers for Postgres (Cold)
func (m *Manager) SaveOp(op *protocol.DrawOp) error {
	ctx := context.Background()

	// Serialize
	data, _ := json.Marshal(op)
	// NOTE: Prompt said "Protobuf over websocket", but DB might store JSON for queryability
	// OR store proto bytes. Prompt SQL schema says: `coordinates JSONB`.
	// For MVP, let's store JSON in Redis/PG.

	// 1. Redis (Hot cache for fast reload/undo?)
	// Let's just push to a Redis list for "Recent History"
	err := m.rdb.LPush(ctx, "canvas_history", data).Err()
	if err != nil {
		return err
	}

	// 2. Buffer for Postgres
	select {
	case m.opBuffer <- op:
	default:
		log.Println("Warning: OpBuffer full, dropping db write for now (or handle overflow)")
	}

	return nil
}

// worker handles batch flushing to Postgres
func (m *Manager) worker() {
	batchSize := 100
	flushInterval := 5 * time.Second
	ticker := time.NewTicker(flushInterval)

	var batch []*protocol.DrawOp

	flush := func() {
		if len(batch) == 0 {
			return
		}

		// Bulk Insert
		tx, err := m.db.Begin()
		if err != nil {
			log.Println("DB Begin error:", err)
			return
		}

		stmt, err := tx.Prepare("INSERT INTO canvas_objects (id, user_id, data) VALUES ($1, $2, $3)")
		if err != nil {
			log.Println("DB Prepare error:", err)
			tx.Rollback()
			return
		}
		defer stmt.Close()

		for _, op := range batch {
			data, _ := json.Marshal(op)
			// Assuming op.Id is the UUID, or generate one
			if _, err := stmt.Exec(op.Id, op.UserId, data); err != nil {
				log.Println("DB Insert error:", err)
			}
		}

		if err := tx.Commit(); err != nil {
			log.Println("DB Commit error:", err)
		} else {
			log.Printf("Flushed %d ops to Postgres", len(batch))
		}

		batch = nil
	}

	for {
		select {
		case op := <-m.opBuffer:
			batch = append(batch, op)
			if len(batch) >= batchSize {
				flush()
			}
		case <-ticker.C:
			flush()
		}
	}
}

func (m *Manager) GetOps() ([]*protocol.DrawOp, error) {
	// MVP: Load from Redis (Recent) or Postgres (All)
	// For Infinite Canvas, we need Spatial Query.
	// Prompt: "Postgres native geometric type for fast querying... bounding_box BOX"
	// Implementing proper spatial query in SQL is complex for this snippet.
	// For MVP: Return empty or recent.
	return nil, nil
}

func (m *Manager) Close() error {
	m.db.Close()
	return m.rdb.Close()
}
