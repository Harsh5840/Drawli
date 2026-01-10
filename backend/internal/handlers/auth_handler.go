package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/user/drawli/internal/auth"
	"github.com/user/drawli/internal/models"
)

// AuthHandler handles authentication endpoints
type AuthHandler struct {
	userStore *models.UserStore
}

// NewAuthHandler creates a new AuthHandler
func NewAuthHandler(userStore *models.UserStore) *AuthHandler {
	return &AuthHandler{userStore: userStore}
}

// SignUpRequest represents the signup request body
type SignUpRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Name     string `json:"name"` // Optional display name
}

// SignInRequest represents the signin request body
type SignInRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// AuthResponse represents the authentication response
type AuthResponse struct {
	Token   string       `json:"token"`
	User    *models.User `json:"user,omitempty"`
	Message string       `json:"message,omitempty"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error,omitempty"`
	Message string `json:"message,omitempty"` // For compatibility with frontend typo "massege"
}

// SignUp handles user registration
func (h *AuthHandler) SignUp(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req SignUpRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid request body"})
		return
	}

	// Validate
	if req.Username == "" || req.Password == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Username and password required"})
		return
	}

	if len(req.Password) < 6 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Password must be at least 6 characters"})
		return
	}

	// Create user
	user, err := h.userStore.Create(r.Context(), req.Username, req.Password)
	if err != nil {
		if err == models.ErrUserExists {
			w.WriteHeader(http.StatusConflict)
			json.NewEncoder(w).Encode(ErrorResponse{Error: "Username already taken", Message: "Username already taken"})
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to create user"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(AuthResponse{
		Message: "User created successfully",
		User:    user,
	})
}

// SignIn handles user authentication
func (h *AuthHandler) SignIn(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req SignInRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid request body"})
		return
	}

	// Validate
	if req.Username == "" || req.Password == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Username and password required"})
		return
	}

	// Authenticate
	user, err := h.userStore.Authenticate(r.Context(), req.Username, req.Password)
	if err != nil {
		if err == models.ErrUserNotFound || err == models.ErrInvalidPassword {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid credentials", Message: "Invalid credentials"})
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Authentication failed"})
		return
	}

	// Generate JWT
	token, err := auth.GenerateToken(user.ID, user.Username)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to generate token"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AuthResponse{
		Token: token,
		User:  user,
	})
}

// GoogleLogin initiates the Google OAuth flow
func (h *AuthHandler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	config := auth.GetGoogleOAuthConfig()

	// Generate state token for CSRF protection
	state := "drawli-oauth-state" // In production, use a random secure token stored in session

	url := config.AuthCodeURL(state)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

// GoogleCallback handles the OAuth callback from Google
func (h *AuthHandler) GoogleCallback(w http.ResponseWriter, r *http.Request) {
	// Get the authorization code
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "Code not found", http.StatusBadRequest)
		return
	}

	// Exchange code for token
	config := auth.GetGoogleOAuthConfig()
	token, err := config.Exchange(r.Context(), code)
	if err != nil {
		http.Error(w, "Failed to exchange token: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Get user info from Google
	userInfo, err := auth.GetGoogleUserInfo(token.AccessToken)
	if err != nil {
		http.Error(w, "Failed to get user info: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Find or create user in our database
	user, err := h.userStore.FindOrCreateByGoogleID(r.Context(), userInfo.ID, userInfo.Email, userInfo.Name, userInfo.Picture)
	if err != nil {
		http.Error(w, "Failed to create user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Generate JWT for our app
	jwtToken, err := auth.GenerateToken(user.ID, user.Username)
	if err != nil {
		http.Error(w, "Failed to generate token: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Redirect to frontend with token
	frontendURL := "http://localhost:3000/auth/callback?token=" + jwtToken
	http.Redirect(w, r, frontendURL, http.StatusTemporaryRedirect)
}
