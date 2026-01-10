package models

import (
	"context"
	"database/sql"
	"errors"
	"math/rand"
	"time"
)

var (
	ErrRoomNotFound = errors.New("room not found")
)

// Room represents a collaborative drawing room
type Room struct {
	ID        string    `json:"id"`
	Slug      string    `json:"slug"`
	Name      string    `json:"name"`
	CreatorID string    `json:"creatorId"`
	CreatedAt time.Time `json:"createdAt"`
}

// RoomMessage represents a drawing operation in a room
type RoomMessage struct {
	ID        int64     `json:"id"`
	RoomID    string    `json:"roomId"`
	UserID    string    `json:"userId"`
	Message   string    `json:"message"` // JSON stringified shape data
	CreatedAt time.Time `json:"createdAt"`
}

// RoomStore handles room database operations
type RoomStore struct {
	db *sql.DB
}

// NewRoomStore creates a new RoomStore
func NewRoomStore(db *sql.DB) *RoomStore {
	return &RoomStore{db: db}
}

// InitSchema creates the rooms and room_messages tables
func (s *RoomStore) InitSchema() error {
	// Rooms table
	_, err := s.db.Exec(`
		CREATE TABLE IF NOT EXISTS rooms (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			slug TEXT UNIQUE NOT NULL,
			name TEXT NOT NULL,
			creator_id UUID,
			created_at TIMESTAMP DEFAULT NOW()
		);
	`)
	if err != nil {
		return err
	}

	// Room messages table
	_, err = s.db.Exec(`
		CREATE TABLE IF NOT EXISTS room_messages (
			id SERIAL PRIMARY KEY,
			room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
			user_id TEXT,
			message JSONB NOT NULL,
			created_at TIMESTAMP DEFAULT NOW()
		);
		
		CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON room_messages(room_id);
	`)
	return err
}

// generateSlug creates a random slug for a room
func generateSlug() string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	const length = 8

	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	slug := make([]byte, length)
	for i := range slug {
		slug[i] = charset[r.Intn(len(charset))]
	}
	return string(slug)
}

// Create creates a new room
func (s *RoomStore) Create(ctx context.Context, name, creatorID string) (*Room, error) {
	slug := generateSlug()

	var room Room
	err := s.db.QueryRowContext(ctx, `
		INSERT INTO rooms (slug, name, creator_id)
		VALUES ($1, $2, $3)
		RETURNING id, slug, name, creator_id, created_at
	`, slug, name, creatorID).Scan(&room.ID, &room.Slug, &room.Name, &room.CreatorID, &room.CreatedAt)

	if err != nil {
		return nil, err
	}

	return &room, nil
}

// GetBySlug finds a room by its slug
func (s *RoomStore) GetBySlug(ctx context.Context, slug string) (*Room, error) {
	var room Room
	err := s.db.QueryRowContext(ctx, `
		SELECT id, slug, name, creator_id, created_at
		FROM rooms
		WHERE slug = $1
	`, slug).Scan(&room.ID, &room.Slug, &room.Name, &room.CreatorID, &room.CreatedAt)

	if err == sql.ErrNoRows {
		return nil, ErrRoomNotFound
	}
	if err != nil {
		return nil, err
	}

	return &room, nil
}

// GetByID finds a room by its ID
func (s *RoomStore) GetByID(ctx context.Context, id string) (*Room, error) {
	var room Room
	err := s.db.QueryRowContext(ctx, `
		SELECT id, slug, name, creator_id, created_at
		FROM rooms
		WHERE id = $1
	`, id).Scan(&room.ID, &room.Slug, &room.Name, &room.CreatorID, &room.CreatedAt)

	if err == sql.ErrNoRows {
		return nil, ErrRoomNotFound
	}
	if err != nil {
		return nil, err
	}

	return &room, nil
}

// AddMessage adds a drawing operation to a room
func (s *RoomStore) AddMessage(ctx context.Context, roomID, userID, message string) (*RoomMessage, error) {
	var msg RoomMessage
	err := s.db.QueryRowContext(ctx, `
		INSERT INTO room_messages (room_id, user_id, message)
		VALUES ($1, $2, $3)
		RETURNING id, room_id, user_id, message, created_at
	`, roomID, userID, message).Scan(&msg.ID, &msg.RoomID, &msg.UserID, &msg.Message, &msg.CreatedAt)

	if err != nil {
		return nil, err
	}

	return &msg, nil
}

// GetMessages gets all messages for a room
func (s *RoomStore) GetMessages(ctx context.Context, roomID string) ([]RoomMessage, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, room_id, user_id, message, created_at
		FROM room_messages
		WHERE room_id = $1
		ORDER BY created_at ASC
	`, roomID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []RoomMessage
	for rows.Next() {
		var msg RoomMessage
		if err := rows.Scan(&msg.ID, &msg.RoomID, &msg.UserID, &msg.Message, &msg.CreatedAt); err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}

	return messages, nil
}
