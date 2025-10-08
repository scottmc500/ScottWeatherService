package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/scottmchenry/scott-weather-service/internal/config"
	"github.com/scottmchenry/scott-weather-service/internal/database"
	"github.com/scottmchenry/scott-weather-service/internal/handler"
	"github.com/scottmchenry/scott-weather-service/internal/middleware"
	"github.com/scottmchenry/scott-weather-service/internal/repository"
	"github.com/scottmchenry/scott-weather-service/internal/service"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize database
	db, err := database.NewPostgresDB(cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Run migrations
	if err := database.RunMigrations(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Initialize Redis client
	redisClient := database.NewRedisClient(cfg.Redis)

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	calendarRepo := repository.NewCalendarRepository(db)
	weatherCacheRepo := repository.NewWeatherCacheRepository(redisClient)

	// Initialize services
	authService := service.NewAuthService(userRepo, cfg.JWT)
	weatherService := service.NewWeatherService(cfg.WeatherAPI, weatherCacheRepo)
	calendarService := service.NewCalendarService(calendarRepo, cfg.Google)

	// Initialize handlers
	healthHandler := handler.NewHealthHandler(db, redisClient)
	authHandler := handler.NewAuthHandler(authService, cfg.Google)
	weatherHandler := handler.NewWeatherHandler(weatherService)
	calendarHandler := handler.NewCalendarHandler(calendarService, authService)

	// Set Gin mode
	if cfg.Server.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Create router
	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(middleware.CORS(cfg.CORS))
	router.Use(middleware.RateLimiter(cfg.RateLimit))

	// Register routes
	registerRoutes(router, healthHandler, authHandler, weatherHandler, calendarHandler, cfg)

	// Create HTTP server
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in goroutine
	go func() {
		log.Printf("Starting server on port %d", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}

func registerRoutes(
	router *gin.Engine,
	healthHandler *handler.HealthHandler,
	authHandler *handler.AuthHandler,
	weatherHandler *handler.WeatherHandler,
	calendarHandler *handler.CalendarHandler,
	cfg *config.Config,
) {
	// Health check
	router.GET("/health", healthHandler.Health)
	router.GET("/health/ready", healthHandler.Ready)
	router.GET("/health/live", healthHandler.Live)

	// API v1
	v1 := router.Group("/api/v1")
	{
		// Auth routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/google", authHandler.GoogleAuth)
			auth.GET("/google/callback", authHandler.GoogleCallback)
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.POST("/logout", authHandler.Logout)
		}

		// Protected routes
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware(cfg.JWT.Secret))
		{
			// User routes
			user := protected.Group("/user")
			{
				user.GET("/me", authHandler.GetCurrentUser)
				user.PUT("/me", authHandler.UpdateUser)
			}

			// Weather routes
			weather := protected.Group("/weather")
			{
				weather.GET("/current", weatherHandler.GetCurrentWeather)
				weather.GET("/forecast", weatherHandler.GetForecast)
			}

			// Calendar routes
			calendar := protected.Group("/calendar")
			{
				calendar.POST("/connect", calendarHandler.ConnectGoogleCalendar)
				calendar.GET("/status", calendarHandler.GetCalendarStatus)
				calendar.GET("/events", calendarHandler.GetCalendarEvents)
				calendar.POST("/sync", calendarHandler.SyncCalendar)
				calendar.DELETE("/disconnect", calendarHandler.DisconnectCalendar)
			}

			// Recommendations routes
			recommendations := protected.Group("/recommendations")
			{
				recommendations.GET("", weatherHandler.GetRecommendations)
			}
		}
	}
}

