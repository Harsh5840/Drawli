package auth

import (
	"context"
	"net/http"
	"strings"
)

// ContextKey for storing claims in request context
type ContextKey string

const ClaimsKey ContextKey = "claims"

// AuthMiddleware validates the JWT token and adds claims to context
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error": "Authorization header required"}`, http.StatusUnauthorized)
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		var tokenString string
		if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
			tokenString = parts[1]
		} else {
			// Also accept just the token directly
			tokenString = authHeader
		}

		// Validate token
		claims, err := ValidateToken(tokenString)
		if err != nil {
			if err == ErrExpiredToken {
				http.Error(w, `{"error": "Token expired"}`, http.StatusUnauthorized)
				return
			}
			http.Error(w, `{"error": "Invalid token"}`, http.StatusUnauthorized)
			return
		}

		// Add claims to context
		ctx := context.WithValue(r.Context(), ClaimsKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetClaimsFromContext extracts claims from request context
func GetClaimsFromContext(ctx context.Context) *Claims {
	claims, ok := ctx.Value(ClaimsKey).(*Claims)
	if !ok {
		return nil
	}
	return claims
}

// AuthMiddlewareFunc is a helper for http.HandlerFunc
func AuthMiddlewareFunc(next http.HandlerFunc) http.HandlerFunc {
	return AuthMiddleware(next).ServeHTTP
}
