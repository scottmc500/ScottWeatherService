package repository

import (
	"github.com/scottmchenry/scott-weather-service/internal/model"
	"gorm.io/gorm"
)

type CalendarRepository interface {
	SaveToken(token *model.CalendarToken) error
	GetTokenByUserID(userID uint) (*model.CalendarToken, error)
	UpdateToken(token *model.CalendarToken) error
	DeleteToken(userID uint) error
	HasToken(userID uint) (bool, error)
}

type calendarRepository struct {
	db *gorm.DB
}

func NewCalendarRepository(db *gorm.DB) CalendarRepository {
	return &calendarRepository{db: db}
}

func (r *calendarRepository) SaveToken(token *model.CalendarToken) error {
	return r.db.Create(token).Error
}

func (r *calendarRepository) GetTokenByUserID(userID uint) (*model.CalendarToken, error) {
	var token model.CalendarToken
	err := r.db.Where("user_id = ?", userID).First(&token).Error
	if err != nil {
		return nil, err
	}
	return &token, nil
}

func (r *calendarRepository) UpdateToken(token *model.CalendarToken) error {
	return r.db.Save(token).Error
}

func (r *calendarRepository) DeleteToken(userID uint) error {
	return r.db.Where("user_id = ?", userID).Delete(&model.CalendarToken{}).Error
}

func (r *calendarRepository) HasToken(userID uint) (bool, error) {
	var count int64
	err := r.db.Model(&model.CalendarToken{}).Where("user_id = ?", userID).Count(&count).Error
	return count > 0, err
}

