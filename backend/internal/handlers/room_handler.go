package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/user/drawli/internal/auth"
	"github.com/user/drawli/internal/models"
)

// RoomHandler handles room-related endpoints
type RoomHandler struct {
	roomStore *models.RoomStore
}

// NewRoomHandler creates a new RoomHandler
func NewRoomHandler(roomStore *models.RoomStore) *RoomHandler {
	return &RoomHandler{roomStore: roomStore}
}

// CreateRoomRequest represents the create room request body
type CreateRoomRequest struct {
	Name string `json:"name"`
}

// RoomResponse represents a room response
type RoomResponse struct {
	Room    *models.Room `json:"room,omitempty"`
	RoomID  string       `json:"roomId,omitempty"`
	Message string       `json:"message,omitempty"`
}

// MessagesResponse represents room messages response
type MessagesResponse struct {
	Messages []models.RoomMessage `json:"masseges"` // Typo intentional to match frontend
}

// CreateRoom creates a new drawing room (requires auth)
func (h *RoomHandler) CreateRoom(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	// Get user from context (set by auth middleware)
	claims := auth.GetClaimsFromContext(r.Context())
	if claims == nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Unauthorized"})
		return
	}

	var req CreateRoomRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid request body"})
		return
	}

	// Validate
	if req.Name == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Room name required"})
		return
	}

	// Create room
	room, err := h.roomStore.Create(r.Context(), req.Name, claims.UserID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to create room"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(RoomResponse{
		Room:    room,
		Message: "Room created successfully",
	})
}

// GetRoom gets a room by its slug
func (h *RoomHandler) GetRoom(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	// Extract slug from URL path: /v1/room/{slug}
	path := r.URL.Path
	parts := strings.Split(path, "/")
	if len(parts) < 4 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Room slug required"})
		return
	}
	slug := parts[3]

	// Find room
	room, err := h.roomStore.GetBySlug(r.Context(), slug)
	if err != nil {
		if err == models.ErrRoomNotFound {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(ErrorResponse{Error: "Room not found", Message: "Room not found"})
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to get room"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(RoomResponse{
		Room:   room,
		RoomID: room.ID,
	})
}

// GetRoomChat gets drawing history for a room
func (h *RoomHandler) GetRoomChat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	// Extract roomId from URL path: /v1/room/chat/{roomId}
	path := r.URL.Path
	parts := strings.Split(path, "/")
	if len(parts) < 5 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Room ID required"})
		return
	}
	roomID := parts[4]

	// Get messages
	messages, err := h.roomStore.GetMessages(r.Context(), roomID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to get messages"})
		return
	}

	if messages == nil {
		messages = []models.RoomMessage{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(MessagesResponse{
		Messages: messages,
	})
}
