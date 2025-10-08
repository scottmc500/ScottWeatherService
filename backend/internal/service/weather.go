package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/scottmchenry/scott-weather-service/internal/config"
	"github.com/scottmchenry/scott-weather-service/internal/model"
	"github.com/scottmchenry/scott-weather-service/internal/repository"
)

type WeatherService interface {
	GetCurrentWeather(lat, lon float64, units string) (*model.WeatherData, error)
	GetForecast(lat, lon float64, units string) (*model.ForecastData, error)
	GetRecommendations(userID uint) ([]model.Recommendation, error)
}

type weatherService struct {
	cfg       config.WeatherAPIConfig
	cacheRepo repository.WeatherCacheRepository
	cacheTTL  time.Duration
}

func NewWeatherService(cfg config.WeatherAPIConfig, cacheRepo repository.WeatherCacheRepository) WeatherService {
	return &weatherService{
		cfg:       cfg,
		cacheRepo: cacheRepo,
		cacheTTL:  5 * time.Minute,
	}
}

func (s *weatherService) GetCurrentWeather(lat, lon float64, units string) (*model.WeatherData, error) {
	ctx := context.Background()
	cacheKey := fmt.Sprintf("weather:current:%f:%f:%s", lat, lon, units)

	// Try cache first
	var weatherData model.WeatherData
	err := s.cacheRepo.Get(ctx, cacheKey, &weatherData)
	if err == nil {
		return &weatherData, nil
	}

	// Cache miss or error - fetch from API
	url := fmt.Sprintf("%s/weather?lat=%f&lon=%f&units=%s&appid=%s",
		s.cfg.BaseURL, lat, lon, units, s.cfg.APIKey)

	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch weather: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("weather API error: %s", string(body))
	}

	var apiResp struct {
		Name string `json:"name"`
		Main struct {
			Temp      float64 `json:"temp"`
			FeelsLike float64 `json:"feels_like"`
			Humidity  int     `json:"humidity"`
			Pressure  float64 `json:"pressure"`
		} `json:"main"`
		Weather []struct {
			Main        string `json:"main"`
			Description string `json:"description"`
		} `json:"weather"`
		Wind struct {
			Speed float64 `json:"speed"`
			Deg   int     `json:"deg"`
		} `json:"wind"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, fmt.Errorf("failed to decode weather response: %w", err)
	}

	weatherData = model.WeatherData{
		Location:      apiResp.Name,
		Temperature:   apiResp.Main.Temp,
		Condition:     apiResp.Weather[0].Description,
		Humidity:      apiResp.Main.Humidity,
		WindSpeed:     apiResp.Wind.Speed,
		WindDirection: degToDirection(apiResp.Wind.Deg),
		Pressure:      apiResp.Main.Pressure,
		UVIndex:       0, // Requires separate API call
		FeelsLike:     apiResp.Main.FeelsLike,
		Timestamp:     time.Now(),
	}

	// Cache the result
	_ = s.cacheRepo.Set(ctx, cacheKey, weatherData, s.cacheTTL)

	return &weatherData, nil
}

func (s *weatherService) GetForecast(lat, lon float64, units string) (*model.ForecastData, error) {
	ctx := context.Background()
	cacheKey := fmt.Sprintf("weather:forecast:%f:%f:%s", lat, lon, units)

	// Try cache first
	var forecastData model.ForecastData
	err := s.cacheRepo.Get(ctx, cacheKey, &forecastData)
	if err == nil && err != redis.Nil {
		return &forecastData, nil
	}

	// Fetch from API
	url := fmt.Sprintf("%s/forecast?lat=%f&lon=%f&units=%s&appid=%s",
		s.cfg.BaseURL, lat, lon, units, s.cfg.APIKey)

	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch forecast: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("forecast API error: %s", string(body))
	}

	var apiResp struct {
		City struct {
			Name string `json:"name"`
		} `json:"city"`
		List []struct {
			Dt   int64 `json:"dt"`
			Main struct {
				Temp     float64 `json:"temp"`
				TempMin  float64 `json:"temp_min"`
				TempMax  float64 `json:"temp_max"`
				Humidity int     `json:"humidity"`
				Pressure float64 `json:"pressure"`
			} `json:"main"`
			Weather []struct {
				Main        string `json:"main"`
				Description string `json:"description"`
				Icon        string `json:"icon"`
			} `json:"weather"`
			Wind struct {
				Speed float64 `json:"speed"`
				Deg   int     `json:"deg"`
			} `json:"wind"`
			Pop float64 `json:"pop"` // Probability of precipitation
		} `json:"list"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, fmt.Errorf("failed to decode forecast response: %w", err)
	}

	// Group by day and take midday reading
	dayMap := make(map[string]model.ForecastDay)
	for _, item := range apiResp.List {
		t := time.Unix(item.Dt, 0)
		dateStr := t.Format("2006-01-02")

		if _, exists := dayMap[dateStr]; !exists {
			dayMap[dateStr] = model.ForecastDay{
				Date:          dateStr,
				DayName:       t.Format("Monday"),
				HighTemp:      item.Main.TempMax,
				LowTemp:       item.Main.TempMin,
				Condition:     item.Weather[0].Description,
				Icon:          item.Weather[0].Icon,
				Humidity:      item.Main.Humidity,
				WindSpeed:     item.Wind.Speed,
				WindDirection: degToDirection(item.Wind.Deg),
				Pressure:      item.Main.Pressure,
				Precipitation: int(item.Pop * 100),
			}
		} else {
			day := dayMap[dateStr]
			if item.Main.TempMax > day.HighTemp {
				day.HighTemp = item.Main.TempMax
			}
			if item.Main.TempMin < day.LowTemp {
				day.LowTemp = item.Main.TempMin
			}
			dayMap[dateStr] = day
		}
	}

	// Convert map to slice
	var days []model.ForecastDay
	for _, day := range dayMap {
		days = append(days, day)
		if len(days) >= 5 {
			break
		}
	}

	forecastData = model.ForecastData{
		Location: apiResp.City.Name,
		Days:     days,
	}

	// Cache the result
	_ = s.cacheRepo.Set(ctx, cacheKey, forecastData, 30*time.Minute)

	return &forecastData, nil
}

func (s *weatherService) GetRecommendations(userID uint) ([]model.Recommendation, error) {
	// Mock recommendations for now
	return []model.Recommendation{
		{
			ID:          "1",
			Type:        "weather",
			Title:       "Rain Expected",
			Description: "Bring an umbrella today",
			Priority:    "high",
			Action:      "Check weather before leaving",
		},
	}, nil
}

func degToDirection(deg int) string {
	directions := []string{"N", "NE", "E", "SE", "S", "SW", "W", "NW"}
	index := int((float64(deg) + 22.5) / 45.0) % 8
	return directions[index]
}

