// Weather API service (Functions removed - update to use direct APIs)
import { auth } from '@/lib/firebase';

// Determine API base URL based on environment
// NOTE: Firebase Functions have been removed - update these URLs to point to your actual APIs
const getApiBaseUrl = () => {
  // Check if we're using emulators (Functions emulator no longer available)
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
    // TODO: Update to point to your actual API endpoints
    return 'http://localhost:3001/api'; // Example: Next.js API routes
  }
  
  // Production - update to your actual API endpoints
  return 'https://your-api-domain.com/api'; // TODO: Update this
};

const API_BASE_URL = getApiBaseUrl();

// Types
export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  windDirection: string;
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

// Helper function to get auth token
async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

// Weather API calls
export class WeatherApiService {
  // Get current weather
  static async getCurrentWeather(location?: string): Promise<WeatherData> {
    const token = await getAuthToken();
    const url = new URL(`${API_BASE_URL}/weatherApi/current`);
    
    if (location) {
      url.searchParams.set('location', location);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Get weather forecast
  static async getWeatherForecast(location?: string, date?: string): Promise<WeatherForecast> {
    const token = await getAuthToken();
    const url = new URL(`${API_BASE_URL}/weatherApi/forecast`);
    
    if (location) {
      url.searchParams.set('location', location);
    }
    if (date) {
      url.searchParams.set('date', date);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Forecast API error: ${response.statusText}`);
    }

    return response.json();
  }
}

// Calendar API calls
export class CalendarApiService {
  // Get calendar events
  static async getCalendarEvents(): Promise<CalendarData> {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required for calendar access');
    }

    const response = await fetch(`${API_BASE_URL}/calendarApi/events`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Calendar API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Sync calendar events with Google Calendar and store in Firestore
  static async syncCalendarEvents(): Promise<CalendarSyncResult> {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required for calendar sync');
    }

    const response = await fetch(`${API_BASE_URL}/calendarApi/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Calendar sync error: ${response.statusText}`);
    }

    return response.json();
  }

  // Authenticate with Google Calendar (store OAuth token)
  static async authenticateGoogleCalendar(googleToken: unknown): Promise<{success: boolean, message?: string, error?: string}> {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required for Google Calendar auth');
    }

    const response = await fetch(`${API_BASE_URL}/calendarApi/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ googleToken }),
    });

    if (!response.ok) {
      throw new Error(`Google Calendar auth error: ${response.statusText}`);
    }

    return response.json();
  }
}

// Recommendations API calls
export class RecommendationsApiService {
  // Get personalized recommendations
  static async getRecommendations(): Promise<RecommendationsData> {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required for recommendations');
    }

    const response = await fetch(`${API_BASE_URL}/recommendationsApi`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Recommendations API error: ${response.statusText}`);
    }

    return response.json();
  }
}

// Combined service for easy access
export class ApiService {
  static weather = WeatherApiService;
  static calendar = CalendarApiService;
  static recommendations = RecommendationsApiService;
}
