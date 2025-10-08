package model

import "time"

type WeatherData struct {
	Location      string    `json:"location"`
	Temperature   float64   `json:"temperature"`
	Condition     string    `json:"condition"`
	Humidity      int       `json:"humidity"`
	WindSpeed     float64   `json:"wind_speed"`
	WindDirection string    `json:"wind_direction"`
	Pressure      float64   `json:"pressure"`
	UVIndex       int       `json:"uv_index"`
	FeelsLike     float64   `json:"feels_like"`
	Timestamp     time.Time `json:"timestamp"`
}

type ForecastDay struct {
	Date          string  `json:"date"`
	DayName       string  `json:"day_name"`
	HighTemp      float64 `json:"high_temp"`
	LowTemp       float64 `json:"low_temp"`
	Condition     string  `json:"condition"`
	Icon          string  `json:"icon"`
	Humidity      int     `json:"humidity"`
	WindSpeed     float64 `json:"wind_speed"`
	WindDirection string  `json:"wind_direction"`
	Pressure      float64 `json:"pressure"`
	Precipitation int     `json:"precipitation"`
}

type ForecastData struct {
	Location string        `json:"location"`
	Days     []ForecastDay `json:"days"`
}

type Recommendation struct {
	ID          string `json:"id"`
	Type        string `json:"type"` // weather, calendar, clothing, general
	Title       string `json:"title"`
	Description string `json:"description"`
	Priority    string `json:"priority"` // high, medium, low
	Action      string `json:"action"`
}

