package models

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserNotFound    = errors.New("user not found")
	ErrUserExists      = errors.New("user already exists")
	ErrInvalidPassword = errors.New("invalid password")
)

// User represents a user in the system
type User struct {
	ID             string    `json:"id"`
	Username       string    `json:"username"`
	Password       string    `json:"-"` // Never expose password in JSON
	Email          string    `json:"email,omitempty"`
	GoogleID       string    `json:"googleId,omitempty"`
	ProfilePicture string    `json:"profilePicture,omitempty"`
	CreatedAt      time.Time `json:"createdAt"`
}

// UserStore handles user database operations
type UserStore struct {
	db *sql.DB
}

// NewUserStore creates a new UserStore
func NewUserStore(db *sql.DB) *UserStore {
	return &UserStore{db: db}
}

// InitSchema creates the users table if it doesn't exist
func (s *UserStore) InitSchema() error {
	_, err := s.db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			username TEXT UNIQUE NOT NULL,
			password TEXT,
			email TEXT,
			google_id TEXT UNIQUE,
			profile_picture TEXT,
			created_at TIMESTAMP DEFAULT NOW()
		);
	`)
	if err != nil {
		return err
	}

	// Add columns if they don't exist (for existing databases)
	migrations := []string{
		"ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT",
		"ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE",
		"ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT",
		"ALTER TABLE users ALTER COLUMN password DROP NOT NULL",
	}
	for _, m := range migrations {
		s.db.Exec(m) // Ignore errors for already-applied migrations
	}

	return nil
}

// Create creates a new user with hashed password
func (s *UserStore) Create(ctx context.Context, username, password string) (*User, error) {
	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	var user User
	err = s.db.QueryRowContext(ctx, `
		INSERT INTO users (username, password)
		VALUES ($1, $2)
		RETURNING id, username, created_at
	`, username, string(hashedPassword)).Scan(&user.ID, &user.Username, &user.CreatedAt)

	if err != nil {
		// Check for unique constraint violation
		if strings.Contains(err.Error(), "duplicate key") ||
			strings.Contains(err.Error(), "UNIQUE constraint") {
			return nil, ErrUserExists
		}
		return nil, err
	}

	return &user, nil
}

// GetByUsername finds a user by username
func (s *UserStore) GetByUsername(ctx context.Context, username string) (*User, error) {
	var user User
	err := s.db.QueryRowContext(ctx, `
		SELECT id, username, password, created_at
		FROM users
		WHERE username = $1
	`, username).Scan(&user.ID, &user.Username, &user.Password, &user.CreatedAt)

	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}

	return &user, nil
}

// GetByID finds a user by ID
func (s *UserStore) GetByID(ctx context.Context, id string) (*User, error) {
	var user User
	err := s.db.QueryRowContext(ctx, `
		SELECT id, username, created_at
		FROM users
		WHERE id = $1
	`, id).Scan(&user.ID, &user.Username, &user.CreatedAt)

	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}

	return &user, nil
}

// Authenticate validates username and password
func (s *UserStore) Authenticate(ctx context.Context, username, password string) (*User, error) {
	user, err := s.GetByUsername(ctx, username)
	if err != nil {
		return nil, err
	}

	// Compare password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, ErrInvalidPassword
	}

	return user, nil
}

// FindOrCreateByGoogleID finds a user by Google ID or creates a new one
func (s *UserStore) FindOrCreateByGoogleID(ctx context.Context, googleID, email, name, picture string) (*User, error) {
	// First try to find by Google ID
	var user User
	err := s.db.QueryRowContext(ctx, `
		SELECT id, username, email, google_id, profile_picture, created_at
		FROM users
		WHERE google_id = $1
	`, googleID).Scan(&user.ID, &user.Username, &user.Email, &user.GoogleID, &user.ProfilePicture, &user.CreatedAt)

	if err == nil {
		return &user, nil
	}

	if err != sql.ErrNoRows {
		return nil, err
	}

	// User doesn't exist, create new one
	// Use email as username (or generate unique one if email exists)
	username := email
	err = s.db.QueryRowContext(ctx, `
		INSERT INTO users (username, email, google_id, profile_picture)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (username) DO UPDATE SET username = users.username || '_' || gen_random_uuid()::text
		RETURNING id, username, email, google_id, profile_picture, created_at
	`, username, email, googleID, picture).Scan(&user.ID, &user.Username, &user.Email, &user.GoogleID, &user.ProfilePicture, &user.CreatedAt)

	if err != nil {
		return nil, err
	}

	return &user, nil
}
