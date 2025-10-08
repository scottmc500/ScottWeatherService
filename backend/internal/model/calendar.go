package model

import "time"

type CalendarEvent struct {
	ID          string    `json:"id"`
	Summary     string    `json:"summary"`
	Description string    `json:"description"`
	Location    string    `json:"location"`
	Start       time.Time `json:"start"`
	End         time.Time `json:"end"`
	AllDay      bool      `json:"all_day"`
	Attendees   []string  `json:"attendees,omitempty"`
}

type CalendarSyncRequest struct {
	TimeMin    time.Time `json:"time_min"`
	TimeMax    time.Time `json:"time_max"`
	MaxResults int       `json:"max_results"`
}

type CalendarSyncResponse struct {
	Success   bool            `json:"success"`
	Events    []CalendarEvent `json:"events,omitempty"`
	Total     int             `json:"total"`
	SyncedAt  time.Time       `json:"synced_at"`
	Error     string          `json:"error,omitempty"`
}

