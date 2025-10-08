package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/scottmchenry/scott-weather-service/internal/service"
)

type WeatherHandler struct {
	weatherService service.WeatherService
}

func NewWeatherHandler(weatherService service.WeatherService) *WeatherHandler {
	return &WeatherHandler{
		weatherService: weatherService,
	}
}

func (h *WeatherHandler) GetCurrentWeather(c *gin.Context) {
	latStr := c.Query("lat")
	lonStr := c.Query("lon")
	units := c.DefaultQuery("units", "metric")

	if latStr == "" || lonStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "lat and lon parameters required"})
		return
	}

	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid latitude"})
		return
	}

	lon, err := strconv.ParseFloat(lonStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid longitude"})
		return
	}

	weather, err := h.weatherService.GetCurrentWeather(lat, lon, units)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    weather,
	})
}

func (h *WeatherHandler) GetForecast(c *gin.Context) {
	latStr := c.Query("lat")
	lonStr := c.Query("lon")
	units := c.DefaultQuery("units", "metric")

	if latStr == "" || lonStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "lat and lon parameters required"})
		return
	}

	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid latitude"})
		return
	}

	lon, err := strconv.ParseFloat(lonStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid longitude"})
		return
	}

	forecast, err := h.weatherService.GetForecast(lat, lon, units)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    forecast,
	})
}

func (h *WeatherHandler) GetRecommendations(c *gin.Context) {
	userID := c.GetUint("user_id")

	recommendations, err := h.weatherService.GetRecommendations(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":         true,
		"recommendations": recommendations,
	})
}

