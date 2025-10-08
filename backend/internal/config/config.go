package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Server     ServerConfig
	Database   DatabaseConfig
	Redis      RedisConfig
	JWT        JWTConfig
	Google     GoogleConfig
	WeatherAPI WeatherAPIConfig
	CORS       CORSConfig
	RateLimit  RateLimitConfig
	Cache      CacheConfig
}

type ServerConfig struct {
	Port int
	Env  string
}

type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
}

type RedisConfig struct {
	Host     string
	Port     int
	Password string
	DB       int
}

type JWTConfig struct {
	Secret     string
	Expiration time.Duration
}

type GoogleConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURL  string
}

type WeatherAPIConfig struct {
	APIKey  string
	BaseURL string
}

type CORSConfig struct {
	AllowedOrigins []string
	AllowedMethods []string
	AllowedHeaders []string
}

type RateLimitConfig struct {
	Requests int
	Duration time.Duration
}

type CacheConfig struct {
	WeatherTTL  time.Duration
	ForecastTTL time.Duration
	CalendarTTL time.Duration
}

func Load() (*Config, error) {
	// Load .env file if it exists
	_ = godotenv.Load()

	cfg := &Config{
		Server: ServerConfig{
			Port: getEnvAsInt("PORT", 8080),
			Env:  getEnv("ENV", "development"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnvAsInt("DB_PORT", 5432),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", "postgres"),
			DBName:   getEnv("DB_NAME", "weather_service"),
			SSLMode:  getEnv("DB_SSL_MODE", "disable"),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnvAsInt("REDIS_PORT", 6379),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvAsInt("REDIS_DB", 0),
		},
		JWT: JWTConfig{
			Secret:     getEnv("JWT_SECRET", "change-me-in-production"),
			Expiration: getEnvAsDuration("JWT_EXPIRATION", 24*time.Hour),
		},
		Google: GoogleConfig{
			ClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
			ClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
			RedirectURL:  getEnv("GOOGLE_REDIRECT_URL", "http://localhost:3000/auth/callback"),
		},
		WeatherAPI: WeatherAPIConfig{
			APIKey:  getEnv("WEATHER_API_KEY", ""),
			BaseURL: getEnv("WEATHER_API_BASE_URL", "https://api.openweathermap.org/data/2.5"),
		},
		CORS: CORSConfig{
			AllowedOrigins: getEnvAsSlice("CORS_ALLOWED_ORIGINS", []string{"http://localhost:3000"}),
			AllowedMethods: getEnvAsSlice("CORS_ALLOWED_METHODS", []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
			AllowedHeaders: getEnvAsSlice("CORS_ALLOWED_HEADERS", []string{"Content-Type", "Authorization"}),
		},
		RateLimit: RateLimitConfig{
			Requests: getEnvAsInt("RATE_LIMIT_REQUESTS", 100),
			Duration: getEnvAsDuration("RATE_LIMIT_DURATION", time.Minute),
		},
		Cache: CacheConfig{
			WeatherTTL:  getEnvAsDuration("CACHE_TTL_WEATHER", 5*time.Minute),
			ForecastTTL: getEnvAsDuration("CACHE_TTL_FORECAST", 30*time.Minute),
			CalendarTTL: getEnvAsDuration("CACHE_TTL_CALENDAR", 10*time.Minute),
		},
	}

	// Validate required fields
	if cfg.JWT.Secret == "change-me-in-production" && cfg.Server.Env == "production" {
		return nil, fmt.Errorf("JWT_SECRET must be set in production")
	}

	if cfg.Google.ClientID == "" {
		return nil, fmt.Errorf("GOOGLE_CLIENT_ID is required")
	}

	if cfg.Google.ClientSecret == "" {
		return nil, fmt.Errorf("GOOGLE_CLIENT_SECRET is required")
	}

	if cfg.WeatherAPI.APIKey == "" {
		return nil, fmt.Errorf("WEATHER_API_KEY is required")
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}

func getEnvAsSlice(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		return parseCommaSeparated(value)
	}
	return defaultValue
}

func parseCommaSeparated(value string) []string {
	var result []string
	for i := 0; i < len(value); {
		j := i
		for j < len(value) && value[j] != ',' {
			j++
		}
		result = append(result, value[i:j])
		i = j + 1
	}
	return result
}

