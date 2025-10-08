package handler

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type HealthHandler struct {
	db    *gorm.DB
	redis *redis.Client
}

func NewHealthHandler(db *gorm.DB, redis *redis.Client) *HealthHandler {
	return &HealthHandler{
		db:    db,
		redis: redis,
	}
}

func (h *HealthHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "scott-weather-service",
	})
}

func (h *HealthHandler) Ready(c *gin.Context) {
	// Check database connection
	sqlDB, err := h.db.DB()
	if err != nil || sqlDB.Ping() != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "not ready",
			"error":  "database connection failed",
		})
		return
	}

	// Check Redis connection (optional)
	if h.redis != nil {
		ctx := context.Background()
		if err := h.redis.Ping(ctx).Err(); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status": "not ready",
				"error":  "redis connection failed",
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":   "ready",
		"database": "connected",
		"redis":    h.redis != nil,
	})
}

func (h *HealthHandler) Live(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "alive",
	})
}

