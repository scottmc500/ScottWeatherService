package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/scottmchenry/scott-weather-service/internal/model"
	"github.com/scottmchenry/scott-weather-service/internal/service"
)

type CalendarHandler struct {
	calendarService service.CalendarService
	authService     service.AuthService
}

func NewCalendarHandler(calendarService service.CalendarService, authService service.AuthService) *CalendarHandler {
	return &CalendarHandler{
		calendarService: calendarService,
		authService:     authService,
	}
}

func (h *CalendarHandler) ConnectGoogleCalendar(c *gin.Context) {
	var req struct {
		Code string `json:"code" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Authorization code required"})
		return
	}

	userID := c.GetUint("user_id")

	// Exchange code for token
	token, err := h.calendarService.ExchangeCodeForToken(req.Code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to exchange code for token"})
		return
	}

	// Save token
	if err := h.calendarService.SaveToken(userID, token); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Google Calendar connected successfully",
	})
}

func (h *CalendarHandler) GetCalendarStatus(c *gin.Context) {
	userID := c.GetUint("user_id")

	hasAccess, err := h.calendarService.GetCalendarStatus(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"has_access": hasAccess,
	})
}

func (h *CalendarHandler) GetCalendarEvents(c *gin.Context) {
	userID := c.GetUint("user_id")

	// Parse query parameters
	timeMinStr := c.DefaultQuery("time_min", time.Now().Format(time.RFC3339))
	timeMaxStr := c.DefaultQuery("time_max", time.Now().AddDate(0, 0, 30).Format(time.RFC3339))
	maxResults, _ := strconv.Atoi(c.DefaultQuery("max_results", "50"))

	timeMin, err := time.Parse(time.RFC3339, timeMinStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid time_min format"})
		return
	}

	timeMax, err := time.Parse(time.RFC3339, timeMaxStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid time_max format"})
		return
	}

	events, err := h.calendarService.GetCalendarEvents(userID, timeMin, timeMax, maxResults)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"events":  events,
		"count":   len(events),
	})
}

func (h *CalendarHandler) SyncCalendar(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req model.CalendarSyncRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Use defaults if no body provided
		req = model.CalendarSyncRequest{
			TimeMin:    time.Now(),
			TimeMax:    time.Now().AddDate(0, 0, 30),
			MaxResults: 50,
		}
	}

	response, err := h.calendarService.SyncCalendar(userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

func (h *CalendarHandler) DisconnectCalendar(c *gin.Context) {
	userID := c.GetUint("user_id")

	if err := h.calendarService.DisconnectCalendar(userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Google Calendar disconnected successfully",
	})
}

