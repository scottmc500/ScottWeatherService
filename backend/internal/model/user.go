package model

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID            uint           `gorm:"primarykey" json:"id"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
	Email         string         `gorm:"uniqueIndex;not null" json:"email"`
	DisplayName   string         `json:"display_name"`
	PhotoURL      string         `json:"photo_url"`
	Provider      string         `json:"provider"` // google, etc.
	ProviderID    string         `gorm:"uniqueIndex" json:"provider_id"`
	Timezone      string         `json:"timezone"`
	Units         string         `json:"units"` // metric or imperial
	Notifications bool           `json:"notifications"`
	LastLogin     *time.Time     `json:"last_login"`
}

type CalendarToken struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
	UserID       uint           `gorm:"not null;uniqueIndex" json:"user_id"`
	User         User           `gorm:"foreignKey:UserID" json:"-"`
	AccessToken  string         `gorm:"not null" json:"-"`
	RefreshToken string         `json:"-"`
	TokenType    string         `json:"token_type"`
	Expiry       time.Time      `json:"expiry"`
	Scope        string         `json:"scope"`
}

