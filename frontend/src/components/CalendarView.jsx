import React from 'react';
import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';
import { Calendar } from 'lucide-react';

const CalendarView = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="calendar-view">
        <h2>
          <Calendar size={20} />
          Calendar Events
        </h2>
        <div className="no-events">
          <p>No upcoming events</p>
        </div>
      </div>
    );
  }

  const formatEventTime = (startTime, endTime) => {
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    
    let dateStr = '';
    if (isToday(start)) {
      dateStr = 'Today';
    } else if (isTomorrow(start)) {
      dateStr = 'Tomorrow';
    } else if (isYesterday(start)) {
      dateStr = 'Yesterday';
    } else {
      dateStr = format(start, 'MMM d');
    }
    
    const timeStr = `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
    return `${dateStr} • ${timeStr}`;
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

  const formatTemperature = (temp) => {
    return `${Math.round(temp)}°F`;
  };

  return (
    <div className="calendar-view">
      <h2>Upcoming Events</h2>
      <div className="events-list">
        {events.map((event, index) => (
          <div key={index} className="event-card">
            <h3>{event.title}</h3>
            <div className="event-time">
              {formatEventTime(event.start_time, event.end_time)}
            </div>
            {event.location && (
              <div className="event-location">
                📍 {event.location}
              </div>
            )}
            {event.weather && (
              <div className="event-weather">
                <span className="weather-icon">
                  {getWeatherIcon(event.weather.condition)}
                </span>
                <span className="weather-temp">
                  {formatTemperature(event.weather.temperature)}
                </span>
                <span className="weather-condition">
                  {event.weather.condition}
                </span>
              </div>
            )}
            {event.weather_alert && (
              <div className="weather-alert">
                ⚠️ {event.weather_alert}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
