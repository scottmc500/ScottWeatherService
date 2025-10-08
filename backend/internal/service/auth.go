package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/scottmchenry/scott-weather-service/internal/config"
	"github.com/scottmchenry/scott-weather-service/internal/model"
	"github.com/scottmchenry/scott-weather-service/internal/repository"
	"gorm.io/gorm"
)

type AuthService interface {
	CreateOrUpdateUser(email, displayName, photoURL, provider, providerID string) (*model.User, error)
	GenerateToken(user *model.User) (string, error)
	ValidateToken(tokenString string) (*jwt.MapClaims, error)
	GetUserByID(userID uint) (*model.User, error)
	UpdateUser(user *model.User) error
}

type authService struct {
	userRepo repository.UserRepository
	jwtCfg   config.JWTConfig
}

func NewAuthService(userRepo repository.UserRepository, jwtCfg config.JWTConfig) AuthService {
	return &authService{
		userRepo: userRepo,
		jwtCfg:   jwtCfg,
	}
}

func (s *authService) CreateOrUpdateUser(email, displayName, photoURL, provider, providerID string) (*model.User, error) {
	// Try to find existing user by provider ID
	user, err := s.userRepo.GetByProviderID(providerID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}

	if user != nil {
		// Update existing user
		user.Email = email
		user.DisplayName = displayName
		user.PhotoURL = photoURL
		now := time.Now()
		user.LastLogin = &now

		if err := s.userRepo.Update(user); err != nil {
			return nil, fmt.Errorf("failed to update user: %w", err)
		}
		return user, nil
	}

	// Create new user
	now := time.Now()
	newUser := &model.User{
		Email:         email,
		DisplayName:   displayName,
		PhotoURL:      photoURL,
		Provider:      provider,
		ProviderID:    providerID,
		Timezone:      "America/Los_Angeles",
		Units:         "imperial",
		Notifications: true,
		LastLogin:     &now,
	}

	if err := s.userRepo.Create(newUser); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return newUser, nil
}

func (s *authService) GenerateToken(user *model.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"exp":     time.Now().Add(s.jwtCfg.Expiration).Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.jwtCfg.Secret))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

func (s *authService) ValidateToken(tokenString string) (*jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.jwtCfg.Secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return &claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

func (s *authService) GetUserByID(userID uint) (*model.User, error) {
	return s.userRepo.GetByID(userID)
}

func (s *authService) UpdateUser(user *model.User) error {
	return s.userRepo.Update(user)
}

