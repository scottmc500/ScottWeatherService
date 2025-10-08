package handler

import (
	"context"
	"encoding/json"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/scottmchenry/scott-weather-service/internal/config"
	"github.com/scottmchenry/scott-weather-service/internal/service"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type AuthHandler struct {
	authService service.AuthService
	oauthConfig *oauth2.Config
}

func NewAuthHandler(authService service.AuthService, googleCfg config.GoogleConfig) *AuthHandler {
	oauthConfig := &oauth2.Config{
		ClientID:     googleCfg.ClientID,
		ClientSecret: googleCfg.ClientSecret,
		RedirectURL:  googleCfg.RedirectURL,
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}

	return &AuthHandler{
		authService: authService,
		oauthConfig: oauthConfig,
	}
}

func (h *AuthHandler) GoogleAuth(c *gin.Context) {
	// Generate OAuth URL
	url := h.oauthConfig.AuthCodeURL("state", oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	
	c.JSON(http.StatusOK, gin.H{
		"url": url,
	})
}

func (h *AuthHandler) GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Authorization code required"})
		return
	}

	// Exchange code for token
	ctx := context.Background()
	token, err := h.oauthConfig.Exchange(ctx, code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to exchange code"})
		return
	}

	// Get user info from Google
	client := h.oauthConfig.Client(ctx, token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user info"})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read user info"})
		return
	}

	var userInfo struct {
		ID      string `json:"id"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}

	if err := json.Unmarshal(body, &userInfo); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user info"})
		return
	}

	// Create or update user
	user, err := h.authService.CreateOrUpdateUser(
		userInfo.Email,
		userInfo.Name,
		userInfo.Picture,
		"google",
		userInfo.ID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Generate JWT token
	jwtToken, err := h.authService.GenerateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": jwtToken,
		"user":  user,
	})
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req struct {
		Token string `json:"token"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Validate and refresh token
	claims, err := h.authService.ValidateToken(req.Token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	userID := uint((*claims)["user_id"].(float64))
	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Generate new token
	newToken, err := h.authService.GenerateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": newToken,
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	// For JWT, logout is typically handled client-side by removing the token
	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully",
	})
}

func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	userID := c.GetUint("user_id")
	
	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *AuthHandler) UpdateUser(c *gin.Context) {
	userID := c.GetUint("user_id")
	
	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var req struct {
		DisplayName   *string `json:"display_name"`
		Timezone      *string `json:"timezone"`
		Units         *string `json:"units"`
		Notifications *bool   `json:"notifications"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if req.DisplayName != nil {
		user.DisplayName = *req.DisplayName
	}
	if req.Timezone != nil {
		user.Timezone = *req.Timezone
	}
	if req.Units != nil {
		user.Units = *req.Units
	}
	if req.Notifications != nil {
		user.Notifications = *req.Notifications
	}

	if err := h.authService.UpdateUser(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, user)
}

