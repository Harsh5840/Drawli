package main

import (
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/user/drawli/internal/hub"
	"github.com/user/drawli/internal/storage"
)

func main() {
	log.Println("Starting Distributed Spatial Engine...")

	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, finding env vars from OS")
	}

	// 1. Setup Storage
	// Defaults for docker-compose
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}

	pgDSN := os.Getenv("POSTGRES_DSN")
	if pgDSN == "" {
		pgDSN = "postgres://user:password@localhost:5432/drawli?sslmode=disable"
	}

	store, err := storage.NewManager(redisAddr, pgDSN)
	if err != nil {
		log.Printf("Warning: Storage init failed: %v. Running in memory-only mode.", err)
		// Provide nil store for MVP dev without DB
		store = nil
	} else {
		defer store.Close()
		log.Println("Connected to Redis and Postgres.")
	}

	// 2. Initialize Hub
	hubInstance := hub.NewHub(store)
	go hubInstance.Run()

	// 3. Define Handlers
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		hub.ServeWs(hubInstance, w, r)
	})

	// Basic health check
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	// 4. Start Server
	addr := ":8080"
	log.Printf("Server listening on %s", addr)
	if err = http.ListenAndServe(addr, nil); err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
