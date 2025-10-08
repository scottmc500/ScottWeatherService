package service

import (
	"context"
	"fmt"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/option"

	"github.com/scottmchenry/scott-weather-service/internal/config"
	"github.com/scottmchenry/scott-weather-service/internal/model"
	"github.com/scottmchenry/scott-weather-service/internal/repository"
)

type CalendarService interface {
	GetOAuthConfig() *oauth2.Config
	ExchangeCodeForToken(code string) (*oauth2.Token, error)
	SaveToken(userID uint, token *oauth2.Token) error
	GetCalendarStatus(userID uint) (bool, error)
	GetCalendarEvents(userID uint, timeMin, timeMax time.Time, maxResults int) ([]model.CalendarEvent, error)
	SyncCalendar(userID uint, req model.CalendarSyncRequest) (*model.CalendarSyncResponse, error)
	DisconnectCalendar(userID uint) error
}

type calendarService struct {
	repo      repository.CalendarRepository
	oauthCfg  *oauth2.Config
}

func NewCalendarService(repo repository.CalendarRepository, googleCfg config.GoogleConfig) CalendarService {
	oauthConfig := &oauth2.Config{
		ClientID:     googleCfg.ClientID,
		ClientSecret: googleCfg.ClientSecret,
		RedirectURL:  googleCfg.RedirectURL,
		Scopes: []string{
			"https://www.googleapis.com/auth/calendar.readonly",
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}

	return &calendarService{
		repo:     repo,
		oauthCfg: oauthConfig,
	}
}

func (s *calendarService) GetOAuthConfig() *oauth2.Config {
	return s.oauthCfg
}

func (s *calendarService) ExchangeCodeForToken(code string) (*oauth2.Token, error) {
	ctx := context.Background()
	token, err := s.oauthCfg.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %w", err)
	}
	return token, nil
}

func (s *calendarService) SaveToken(userID uint, token *oauth2.Token) error {
	calendarToken := &model.CalendarToken{
		UserID:       userID,
		AccessToken:  token.AccessToken,
		RefreshToken: token.RefreshToken,
		TokenType:    token.TokenType,
		Expiry:       token.Expiry,
		Scope:        "", // Can be extracted from token if needed
	}

	// Check if token already exists
	existingToken, err := s.repo.GetTokenByUserID(userID)
	if err == nil && existingToken != nil {
		calendarToken.ID = existingToken.ID
		return s.repo.UpdateToken(calendarToken)
	}

	return s.repo.SaveToken(calendarToken)
}

func (s *calendarService) GetCalendarStatus(userID uint) (bool, error) {
	return s.repo.HasToken(userID)
}

func (s *calendarService) GetCalendarEvents(userID uint, timeMin, timeMax time.Time, maxResults int) ([]model.CalendarEvent, error) {
	// Get user's token
	tokenData, err := s.repo.GetTokenByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("no calendar token found: %w", err)
	}

	// Create OAuth2 token
	token := &oauth2.Token{
		AccessToken:  tokenData.AccessToken,
		RefreshToken: tokenData.RefreshToken,
		TokenType:    tokenData.TokenType,
		Expiry:       tokenData.Expiry,
	}

	// Create calendar client
	ctx := context.Background()
	client := s.oauthCfg.Client(ctx, token)
	
	srv, err := calendar.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return nil, fmt.Errorf("failed to create calendar service: %w", err)
	}

	// Fetch events
	events, err := srv.Events.List("primary").
		ShowDeleted(false).
		SingleEvents(true).
		TimeMin(timeMin.Format(time.RFC3339)).
		TimeMax(timeMax.Format(time.RFC3339)).
		MaxResults(int64(maxResults)).
		OrderBy("startTime").
		Do()
	
	if err != nil {
		return nil, fmt.Errorf("failed to fetch calendar events: %w", err)
	}

	// Convert to our model
	var calendarEvents []model.CalendarEvent
	for _, item := range events.Items {
		event := model.CalendarEvent{
			ID:          item.Id,
			Summary:     item.Summary,
			Description: item.Description,
			Location:    item.Location,
		}

		// Parse start time
		if item.Start.DateTime != "" {
			startTime, _ := time.Parse(time.RFC3339, item.Start.DateTime)
			event.Start = startTime
			event.AllDay = false
		} else if item.Start.Date != "" {
			startTime, _ := time.Parse("2006-01-02", item.Start.Date)
			event.Start = startTime
			event.AllDay = true
		}

		// Parse end time
		if item.End.DateTime != "" {
			endTime, _ := time.Parse(time.RFC3339, item.End.DateTime)
			event.End = endTime
		} else if item.End.Date != "" {
			endTime, _ := time.Parse("2006-01-02", item.End.Date)
			event.End = endTime
		}

		// Extract attendees
		for _, attendee := range item.Attendees {
			if attendee.Email != "" {
				event.Attendees = append(event.Attendees, attendee.Email)
			}
		}

		calendarEvents = append(calendarEvents, event)
	}

	return calendarEvents, nil
}

func (s *calendarService) SyncCalendar(userID uint, req model.CalendarSyncRequest) (*model.CalendarSyncResponse, error) {
	events, err := s.GetCalendarEvents(userID, req.TimeMin, req.TimeMax, req.MaxResults)
	if err != nil {
		return &model.CalendarSyncResponse{
			Success:  false,
			Error:    err.Error(),
			SyncedAt: time.Now(),
		}, err
	}

	return &model.CalendarSyncResponse{
		Success:  true,
		Events:   events,
		Total:    len(events),
		SyncedAt: time.Now(),
	}, nil
}

func (s *calendarService) DisconnectCalendar(userID uint) error {
	return s.repo.DeleteToken(userID)
}

