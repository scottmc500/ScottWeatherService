package repository

import (
	"time"

	"github.com/scottmchenry/scott-weather-service/internal/model"
	"gorm.io/gorm"
)

type UserRepository interface {
	Create(user *model.User) error
	GetByID(id uint) (*model.User, error)
	GetByEmail(email string) (*model.User, error)
	GetByProviderID(providerID string) (*model.User, error)
	Update(user *model.User) error
	UpdateLastLogin(userID uint) error
	Delete(userID uint) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(user *model.User) error {
	return r.db.Create(user).Error
}

func (r *userRepository) GetByID(id uint) (*model.User, error) {
	var user model.User
	err := r.db.First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetByEmail(email string) (*model.User, error) {
	var user model.User
	err := r.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetByProviderID(providerID string) (*model.User, error) {
	var user model.User
	err := r.db.Where("provider_id = ?", providerID).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) Update(user *model.User) error {
	return r.db.Save(user).Error
}

func (r *userRepository) UpdateLastLogin(userID uint) error {
	now := time.Now()
	return r.db.Model(&model.User{}).Where("id = ?", userID).Update("last_login", now).Error
}

func (r *userRepository) Delete(userID uint) error {
	return r.db.Delete(&model.User{}, userID).Error
}

