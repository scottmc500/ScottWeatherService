import axios from 'axios';
import io from 'socket.io-client';

class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    this.socket = null;
    this.setupAxios();
  }

  setupAxios() {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.reload();
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async loginWithGoogle() {
    try {
      const response = await this.api.get('/auth/google');
      return response.data;
    } catch (error) {
      throw new Error('Google login failed');
    }
  }

  async loginWithMicrosoft() {
    try {
      const response = await this.api.get('/auth/microsoft');
      return response.data;
    } catch (error) {
      throw new Error('Microsoft login failed');
    }
  }

  async logout() {
    try {
      await this.api.post('/auth/logout');
      localStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  async getUser() {
    try {
      const response = await this.api.get('/api/auth/me');
      return response.data;
    } catch (error) {
      return null;
    }
  }

  // Weather API
  async getCurrentWeather(location) {
    try {
      const response = await this.api.get(`/weather/current?location=${encodeURIComponent(location)}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch weather data');
    }
  }

  async getWeatherForecast(location, days = 5) {
    try {
      const response = await this.api.get(`/weather/forecast?location=${encodeURIComponent(location)}&days=${days}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch weather forecast');
    }
  }

  async getWeatherAlerts(location) {
    try {
      const response = await this.api.get(`/weather/alerts?location=${encodeURIComponent(location)}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch weather alerts');
    }
  }

  // Calendar API
  async getEvents(startDate, endDate) {
    try {
      const response = await this.api.get(`/calendars/events?start=${startDate}&end=${endDate}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch calendar events');
    }
  }

  async syncCalendar() {
    try {
      const response = await this.api.post('/calendars/sync');
      return response.data;
    } catch (error) {
      throw new Error('Failed to sync calendar');
    }
  }

  // Recommendations API
  async getRecommendations() {
    try {
      const response = await this.api.get('/recommendations');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch recommendations');
    }
  }

  async generateRecommendations() {
    try {
      const response = await this.api.post('/recommendations/generate');
      return response.data;
    } catch (error) {
      throw new Error('Failed to generate recommendations');
    }
  }

  // WebSocket connection for real-time updates
  connect() {
    if (this.socket) {
      return;
    }

    this.socket = io(this.baseURL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // WebSocket event listeners
  onWeatherUpdate(callback) {
    if (this.socket) {
      this.socket.on('weather_update', callback);
    }
  }

  onCalendarUpdate(callback) {
    if (this.socket) {
      this.socket.on('calendar_update', callback);
    }
  }

  onRecommendationUpdate(callback) {
    if (this.socket) {
      this.socket.on('recommendation_update', callback);
    }
  }

  // Remove event listeners
  offWeatherUpdate(callback) {
    if (this.socket) {
      this.socket.off('weather_update', callback);
    }
  }

  offCalendarUpdate(callback) {
    if (this.socket) {
      this.socket.off('calendar_update', callback);
    }
  }

  offRecommendationUpdate(callback) {
    if (this.socket) {
      this.socket.off('recommendation_update', callback);
    }
  }
}

export const api = new ApiService();
