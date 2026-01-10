package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
	"github.com/user/drawli/internal/auth"
	"github.com/user/drawli/internal/handlers"
	"github.com/user/drawli/internal/hub"
	"github.com/user/drawli/internal/models"
	"github.com/user/drawli/internal/storage"
)

func main() {
	log.Println("Starting Drawli Server...")

	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Database configuration
	redisAddr := getEnv("REDIS_ADDR", "localhost:6379")
	pgDSN := getEnv("POSTGRES_DSN", "postgres://user:password@localhost:5432/drawli?sslmode=disable")

	// Initialize storage manager (for canvas ops)
	store, err := storage.NewManager(redisAddr, pgDSN)
	if err != nil {
		log.Printf("Warning: Storage init failed: %v. Running in memory-only mode.", err)
		store = nil
	} else {
		defer store.Close()
		log.Println("Connected to Redis and Postgres.")
	}

	// Connect to database for API handlers
	db, err := sql.Open("pgx", pgDSN)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize model stores
	userStore := models.NewUserStore(db)
	roomStore := models.NewRoomStore(db)

	// Initialize database schema
	if err := userStore.InitSchema(); err != nil {
		log.Printf("Warning: Failed to init users schema: %v", err)
	}
	if err := roomStore.InitSchema(); err != nil {
		log.Printf("Warning: Failed to init rooms schema: %v", err)
	}

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(userStore)
	roomHandler := handlers.NewRoomHandler(roomStore)

	// Initialize WebSocket hub
	hubInstance := hub.NewHub(store)
	go hubInstance.Run()

	// Create router
	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	// WebSocket endpoint
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		hub.ServeWs(hubInstance, w, r)
	})

	// Auth endpoints (public)
	mux.HandleFunc("/v1/auth/signup", authHandler.SignUp)
	mux.HandleFunc("/v1/auth/signin", authHandler.SignIn)
	mux.HandleFunc("/v1/auth/google", authHandler.GoogleLogin)
	mux.HandleFunc("/v1/auth/google/callback", authHandler.GoogleCallback)

	// Room endpoints
	mux.HandleFunc("/v1/room/create-room", auth.AuthMiddlewareFunc(roomHandler.CreateRoom))
	mux.HandleFunc("/v1/room/chat/", roomHandler.GetRoomChat) // No auth required for viewing
	mux.HandleFunc("/v1/room/", roomHandler.GetRoom)          // No auth required for viewing

	// Apply CORS middleware
	handler := corsMiddleware(mux)

	// Start server
	addr := getEnv("PORT", ":8080")
	log.Printf("Server listening on %s", addr)
	log.Println("API Endpoints:")
	log.Println("  POST /v1/auth/signup - Register new user")
	log.Println("  POST /v1/auth/signin - Login")
	log.Println("  POST /v1/room/create-room - Create room (auth required)")
	log.Println("  GET  /v1/room/{slug} - Get room by slug")
	log.Println("  GET  /v1/room/chat/{roomId} - Get room history")
	log.Println("  WS   /ws - WebSocket connection")

	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

// corsMiddleware adds CORS headers for frontend communication
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Allow frontend origins
		origin := r.Header.Get("Origin")
		if origin == "" {
			origin = "*"
		}

		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		// Handle preflight
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// getEnv gets an environment variable with a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
