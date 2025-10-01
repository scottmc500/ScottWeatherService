import React from 'react';
import { format } from 'date-fns';
import { Thermometer, Droplets, Wind, Eye } from 'lucide-react';

const WeatherCard = ({ weather }) => {
  if (!weather) {
    return (
      <div className="weather-card">
        <h2>Weather</h2>
        <div className="no-weather">
          <p>No weather data available</p>
        </div>
      </div>
    );
  }

  const formatTemperature = (temp) => {
    return `${Math.round(temp)}°F`;
  };

  const formatWindSpeed = (speed) => {
    return `${Math.round(speed)} mph`;
  };

  const formatHumidity = (humidity) => {
    return `${humidity}%`;
  };

  const formatPressure = (pressure) => {
    return `${Math.round(pressure)} hPa`;
  };

  const formatVisibility = (visibility) => {
    return `${Math.round(visibility / 1609.34)} mi`;
  };

  const getWeatherIcon = (condition) => {
    const icons = {
      'clear': '☀️',
      'clouds': '☁️',
      'rain': '🌧️',
      'snow': '❄️',
      'thunderstorm': '⛈️',
      'drizzle': '🌦️',
      'mist': '🌫️',
      'fog': '🌫️',
      'haze': '🌫️',
      'dust': '🌪️',
      'sand': '🌪️',
      'ash': '🌋',
      'squall': '💨',
      'tornado': '🌪️'
    };
    
    const conditionKey = condition?.toLowerCase() || 'clear';
    return icons[conditionKey] || '☀️';
  };

  return (
    <div className="weather-card">
      <h2>Current Weather</h2>
      <div className="weather-info">
        <div className="temperature">
          {formatTemperature(weather.main.temp)}
        </div>
        <div className="conditions">
          {getWeatherIcon(weather.weather[0].main)} {weather.weather[0].description}
        </div>
        <div className="location">
          {weather.name}, {weather.sys.country}
        </div>
        <div className="weather-details">
          <div className="weather-detail">
            <span className="weather-detail-label">
              <Thermometer size={16} />
              Feels Like
            </span>
            <span className="weather-detail-value">
              {formatTemperature(weather.main.feels_like)}
            </span>
          </div>
          <div className="weather-detail">
            <span className="weather-detail-label">
              <Droplets size={16} />
              Humidity
            </span>
            <span className="weather-detail-value">
              {formatHumidity(weather.main.humidity)}
            </span>
          </div>
          <div className="weather-detail">
            <span className="weather-detail-label">
              <Wind size={16} />
              Wind
            </span>
            <span className="weather-detail-value">
              {formatWindSpeed(weather.wind.speed)}
            </span>
          </div>
          <div className="weather-detail">
            <span className="weather-detail-label">
              <Thermometer size={16} />
              Pressure
            </span>
            <span className="weather-detail-value">
              {formatPressure(weather.main.pressure)}
            </span>
          </div>
          <div className="weather-detail">
            <span className="weather-detail-label">
              <Eye size={16} />
              Visibility
            </span>
            <span className="weather-detail-value">
              {formatVisibility(weather.visibility)}
            </span>
          </div>
          <div className="weather-detail">
            <span className="weather-detail-label">UV Index</span>
            <span className="weather-detail-value">
              {weather.uvi || 'N/A'}
            </span>
          </div>
        </div>
        
        {weather.alerts && weather.alerts.length > 0 && (
          <div className="weather-alerts">
            <h3>Weather Alerts</h3>
            {weather.alerts.map((alert, index) => (
              <div key={index} className="alert">
                <strong>{alert.event}</strong>
                <p>{alert.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherCard;
