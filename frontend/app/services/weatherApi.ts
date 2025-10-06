// Weather API service - Updated to use Firebase Functions
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { GoogleCalendarOAuthService } from './googleCalendarOAuth';

// Firebase Function response interfaces
interface FirebaseFunctionResponse<T> {
  success: boolean;
  data: T;
  cached?: boolean;
}

interface CalendarFunctionResponse {
  success: boolean;
  events: Array<{
    id: string;
    summary: string;
    start: { dateTime?: string | null; date?: string | null };
    end: { dateTime?: string | null; date?: string | null };
    location?: string | null;
    description?: string | null;
  }>;
}


// Types
export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
  uvIndex: number;
  feelsLike: number;
  timestamp: string;
}

export interface ForecastDay {
  date: string;
  high: number;
  low: number;
  condition: string;
  precipitation: number;
  windSpeed: number;
}

export interface WeatherForecast {
  location: string;
  forecast: ForecastDay[];
}

export interface ForecastDay {
  date: string;
  dayName: string;
  highTemp: number;
  lowTemp: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
  precipitation: number;
}

export interface ForecastData {
  location: string;
  days: ForecastDay[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string;
  description: string;
  allDay?: boolean;
  attendees?: Array<{
    email: string;
    name: string;
    responseStatus: string;
  }>;
}

export interface CalendarData {
  events: CalendarEvent[];
}

export interface CalendarSyncResult {
  success: boolean;
  events?: CalendarEvent[];
  total?: number;
  syncedAt?: string;
  userId?: string;
  error?: string;
  note?: string;
}

export interface Recommendation {
  id: string;
  type: 'weather' | 'calendar' | 'clothing' | 'general';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
}

export interface RecommendationsData {
  recommendations: Recommendation[];
}

// Helper function to get auth token (currently unused but kept for future use)
// async function getAuthToken(): Promise<string | null> {
//   const user = auth.currentUser;
//   if (!user) return null;
//   
//   try {
//     return await user.getIdToken();
//   } catch (error) {
//     console.error('Error getting auth token:', error);
//     return null;
//   }
// }

// Weather API calls using Firebase Functions
export class WeatherApiService {
  // Get current weather using Firebase Functions
  static async getCurrentWeather(latitude: number, longitude: number, units: 'metric' | 'imperial' = 'metric'): Promise<WeatherData> {
    try {
      const getWeatherData = httpsCallable(functions, 'getWeatherData');
      
      const result = await getWeatherData({
        latitude,
        longitude,
        units,
      });

      const response = result.data as FirebaseFunctionResponse<WeatherData>;
      
      if (!response || !response.success) {
        throw new Error('Weather function returned error');
      }

      const weatherData = response.data;
      
      // Transform Firebase Function response to our interface
      return {
        location: weatherData.location,
        temperature: weatherData.temperature,
        condition: weatherData.condition,
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
        windDirection: weatherData.windDirection || 'N/A', // Use actual wind direction from API
        pressure: weatherData.pressure || 0, // Atmospheric pressure in hPa
        uvIndex: 0, // Not provided by basic API
        feelsLike: weatherData.temperature, // Approximation
        timestamp: weatherData.timestamp,
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw new Error(`Weather API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get weather forecast (placeholder - would need extended weather API)
  static async getWeatherForecast(latitude: number, longitude: number, units: 'metric' | 'imperial' = 'metric'): Promise<ForecastData> {
    // For now, return a mock forecast based on current weather
    try {
      const getWeatherForecast = httpsCallable(functions, 'getWeatherForecastFunction');
      
      const result = await getWeatherForecast({
        latitude,
        longitude,
        units,
      });

      const response = result.data as FirebaseFunctionResponse<ForecastData>;
      
      if (!response || !response.success) {
        throw new Error('Weather forecast function returned error');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      throw new Error(`Weather forecast error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Calendar API calls using Firebase Functions
export class CalendarApiService {
  // Get calendar events using Firebase Functions
  static async getCalendarEvents(accessToken: string, maxResults: number = 10): Promise<CalendarData> {
    try {
      const getCalendarEvents = httpsCallable(functions, 'getCalendarEvents');
      
      const result = await getCalendarEvents({
        accessToken,
        maxResults,
      });

      const response = result.data as CalendarFunctionResponse;
      
      if (!response || !response.success) {
        throw new Error('Calendar function returned error');
      }

      const events = response.events;
      
      // Transform Firebase Function response to our interface
      const formattedEvents: CalendarEvent[] = events.map((event: {
        id: string;
        summary: string;
        start: { dateTime?: string | null; date?: string | null };
        end: { dateTime?: string | null; date?: string | null };
        location?: string | null;
        description?: string | null;
      }) => ({
        id: event.id,
        title: event.summary,
        start: event.start.dateTime || event.start.date || '',
        end: event.end.dateTime || event.end.date || '',
        location: event.location || '',
        description: event.description || '',
        allDay: !event.start.dateTime && !!event.start.date,
      }));

      return {
        events: formattedEvents,
      };
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw new Error(`Calendar API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Sync calendar events with Google Calendar and store in Firestore
  static async syncCalendarEvents(): Promise<CalendarSyncResult> {
    try {
      // For now, just get events (in a real app, you'd implement sync logic)
      const tokens = GoogleCalendarOAuthService.getStoredTokens();
      
      if (!tokens?.access_token) {
        throw new Error('No Google Calendar access token found. Please authenticate first.');
      }

      const calendarData = await this.getCalendarEvents(tokens.access_token);
      
      return {
        success: true,
        events: calendarData.events,
        total: calendarData.events.length,
        syncedAt: new Date().toISOString(),
        note: 'Events synced successfully',
      };
    } catch (error) {
      console.error('Error syncing calendar events:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Authenticate with Google Calendar (store OAuth token)
  static async authenticateGoogleCalendar(googleToken: {access_token: string; refresh_token?: string}): Promise<{success: boolean, message?: string, error?: string}> {
    try {
      // Store the token using the OAuth service
      GoogleCalendarOAuthService.storeTokens(googleToken);
      
      // Test the connection by fetching one event
      await this.getCalendarEvents(googleToken.access_token, 1);
      
      return {
        success: true,
        message: 'Google Calendar authentication successful',
      };
    } catch (error) {
      console.error('Error authenticating with Google Calendar:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Recommendations API calls (placeholder - not implemented yet)
export class RecommendationsApiService {
  // Get personalized recommendations
  static async getRecommendations(): Promise<RecommendationsData> {
    // For now, return mock recommendations
    // In a real app, this would call a Firebase Function or AI service
    const mockRecommendations: Recommendation[] = [
      {
        id: '1',
        type: 'weather',
        title: 'Weather-based recommendation',
        description: 'Based on current weather conditions',
        priority: 'medium',
        action: 'Check weather before going out',
      },
      {
        id: '2',
        type: 'calendar',
        title: 'Upcoming events',
        description: 'You have events coming up',
        priority: 'high',
        action: 'Review your calendar',
      },
    ];

    return {
      recommendations: mockRecommendations,
    };
  }
}

// Combined service for easy access
export class ApiService {
  static weather = WeatherApiService;
  static calendar = CalendarApiService;
  static recommendations = RecommendationsApiService;
}
