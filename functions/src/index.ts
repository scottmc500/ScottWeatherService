import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/v2/https";
import {onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {google} from "googleapis";
import axios from "axios";
import {defineSecret} from "firebase-functions/params";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

// Initialize Firebase Admin for Firestore caching
initializeApp();
const db = getFirestore();

// Set global options for cost control
setGlobalOptions({ maxInstances: 10 });

// Define secrets
const weatherApiKey = defineSecret("weather_api_key");

// In-memory cache for weather data (5-10 minute cache)
const weatherCache = new Map<string, {data: any; timestamp: number; ttl: number}>();

// Cache configuration - temporarily reduced for debugging
const CACHE_TTL = {
  CURRENT_WEATHER: 1 * 60 * 1000, // 1 minute (temporarily reduced)
  FORECAST: 1 * 60 * 1000, // 1 minute (temporarily reduced)
  LOCATION: 60 * 60 * 1000, // 1 hour (location rarely changes)
  FIRESTORE_CACHE: 30 * 60 * 1000, // 30 minutes
};

// Helper function to generate cache key
function getCacheKey(type: string, latitude: number, longitude: number, units: string): string {
  return `${type}:${Math.round(latitude * 1000) / 1000}:${Math.round(longitude * 1000) / 1000}:${units}`;
}

// Helper function to generate location cache key (no units needed)
function getLocationCacheKey(latitude: number, longitude: number): string {
  return `location:${Math.round(latitude * 1000) / 1000}:${Math.round(longitude * 1000) / 1000}`;
}

// Helper function to check if cache is valid
function isCacheValid(timestamp: number, ttl: number): boolean {
  return Date.now() - timestamp < ttl;
}

// Helper function to get cached data
async function getCachedWeatherData(cacheKey: string, ttl: number): Promise<any | null> {
  // Check in-memory cache first
  const memoryCache = weatherCache.get(cacheKey);
  if (memoryCache && isCacheValid(memoryCache.timestamp, memoryCache.ttl)) {
    logger.info(`Cache hit (memory): ${cacheKey}`);
    return memoryCache.data;
  }

  // Check Firestore cache
  try {
    const doc = await db.collection("weather_cache").doc(cacheKey).get();
    if (doc.exists) {
      const cacheData = doc.data();
      if (cacheData && isCacheValid(cacheData.timestamp, ttl)) {
        logger.info(`Cache hit (firestore): ${cacheKey}`);
        // Update memory cache
        weatherCache.set(cacheKey, {
          data: cacheData.data,
          timestamp: cacheData.timestamp,
          ttl: ttl
        });
        return cacheData.data;
      }
    }
  } catch {
    logger.warn("Firestore cache read failed");
  }

  return null;
}

// Helper function to set cached data
async function setCachedWeatherData(cacheKey: string, data: any, ttl: number): Promise<void> {
  const timestamp = Date.now();
  
  // Update memory cache
  weatherCache.set(cacheKey, { data, timestamp, ttl });
  
  // Update Firestore cache (with longer TTL for backup)
  try {
    await db.collection("weather_cache").doc(cacheKey).set({
      data,
      timestamp,
      ttl: CACHE_TTL.FIRESTORE_CACHE
    });
    logger.info(`Cache set: ${cacheKey}`);
  } catch {
    logger.warn("Firestore cache write failed");
  }
}

// Helper function to get detailed location information using reverse geocoding
async function getDetailedLocation(latitude: number, longitude: number, apiKey: string): Promise<string> {
  // Check cache first
  const locationCacheKey = getLocationCacheKey(latitude, longitude);
  const cachedLocation = await getCachedWeatherData(locationCacheKey, CACHE_TTL.LOCATION);
  
  if (cachedLocation) {
    logger.info(`Cache hit (location): ${locationCacheKey}`);
    return cachedLocation;
  }

  try {
    // Use OpenWeatherMap's reverse geocoding API
    const url = "http://api.openweathermap.org/geo/1.0/reverse";
    const params = {
      lat: latitude,
      lon: longitude,
      limit: 1,
      appid: apiKey,
    };

    const response = await axios.get(url, {params});
    const data = response.data;

    if (data && data.length > 0) {
      const location = data[0];
      const parts = [location.name]; // City name
      
      // Add state/province if available
      if (location.state) {
        parts.push(location.state);
      }
      
      // Add country
      parts.push(location.country);
      
      const detailedLocation = parts.join(", ");
      
      // Cache the location data
      await setCachedWeatherData(locationCacheKey, detailedLocation, CACHE_TTL.LOCATION);
      
      logger.info(`Cached location data: ${detailedLocation}`);
      return detailedLocation;
    }
  } catch (error) {
    logger.warn("Reverse geocoding failed:", error);
  }
  
  // Fallback to basic location format
  const fallbackLocation = `Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`;
  
  // Cache the fallback as well (shorter TTL)
  await setCachedWeatherData(locationCacheKey, fallbackLocation, CACHE_TTL.LOCATION);
  
  return fallbackLocation;
}

// Types for our functions
interface CalendarRequest {
  accessToken: string;
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
}

interface WeatherRequest {
  latitude: number;
  longitude: number;
  units?: "metric" | "imperial";
}

interface ForecastRequest {
  latitude: number;
  longitude: number;
  units?: "metric" | "imperial";
}

interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string | null;
    date?: string | null;
  };
  end: {
    dateTime?: string | null;
    date?: string | null;
  };
  location?: string | null;
  description?: string | null;
}

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
  location: string;
  timestamp: string;
}

interface ForecastDay {
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

interface ForecastData {
  location: string;
  days: ForecastDay[];
}

/**
 * Calendar Function - Retrieves events from Google Calendar
 */
export const getCalendarEvents = onCall<CalendarRequest>(
  {cors: true},
  async (request) => {
    try {
      const {accessToken, calendarId = "primary", timeMin, timeMax, maxResults = 10} = request.data;

      if (!accessToken) {
        throw new Error("Access token is required");
      }

      // Initialize Google Calendar API
      const auth = new google.auth.OAuth2();
      auth.setCredentials({access_token: accessToken});

      const calendar = google.calendar({version: "v3", auth});

      // Prepare parameters
      const params: any = {
        calendarId,
        maxResults,
        singleEvents: true,
        orderBy: "startTime",
      };

      if (timeMin) params.timeMin = timeMin;
      if (timeMax) params.timeMax = timeMax;

      // Fetch events
      const response = await calendar.events.list(params);
      const events = response.data.items || [];

      // Transform events to our format
      const formattedEvents: CalendarEvent[] = events.map((event) => ({
        id: event.id || "",
        summary: event.summary || "No title",
        start: {
          dateTime: event.start?.dateTime,
          date: event.start?.date,
        },
        end: {
          dateTime: event.end?.dateTime,
          date: event.end?.date,
        },
        location: event.location,
        description: event.description,
      }));

      logger.info(`Retrieved ${formattedEvents.length} calendar events`);

      return {
        success: true,
        events: formattedEvents,
        count: formattedEvents.length,
      };
    } catch (error) {
      logger.error("Error fetching calendar events:", error);
      throw new Error(`Failed to fetch calendar events: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
);

/**
 * Weather Function - Retrieves weather data based on location
 */
export const getWeatherData = onCall<WeatherRequest>(
  {
    cors: true,
    memory: "256MiB",
    timeoutSeconds: 30,
    secrets: [weatherApiKey],
  },
  async (request) => {
    try {
      const {latitude, longitude, units = "metric"} = request.data;

      if (!latitude || !longitude) {
        throw new Error("Latitude and longitude are required");
      }

      // Check cache first
      const cacheKey = getCacheKey("current", latitude, longitude, units);
      const cachedData = await getCachedWeatherData(cacheKey, CACHE_TTL.CURRENT_WEATHER);
      
      if (cachedData) {
        logger.info(`Returning cached weather data for ${cachedData.location}`);
        return {
          success: true,
          data: cachedData,
          cached: true,
        };
      }

      // Get API key from Firebase Secret Manager or environment variable
      let apiKey: string;
      try {
        apiKey = weatherApiKey.value().trim();
        logger.info("Using secret manager API key");
      } catch {
        // Fallback to environment variable for local development
        logger.info("Secret not available, trying environment variable");
        apiKey = process.env.WEATHER_API_KEY || "";
      }
      
      let data: any;
      
      if (!apiKey) {
        // Return mock data for local development/testing
        logger.info("No weather API key found, returning mock data");
        data = {
          main: {
            temp: 22,
            humidity: 65
          },
          weather: [{
            description: "sunny"
          }],
          wind: {
            speed: 3.2
          },
          name: "San Francisco",
          sys: {
            country: "US"
          }
        };
      } else {
        // Use OpenWeatherMap API
        logger.info("Calling OpenWeatherMap API with real data");
        const url = "https://api.openweathermap.org/data/2.5/weather";
        const params = {
          lat: latitude,
          lon: longitude,
          appid: apiKey.trim(),
          units: units || "metric",
        };

        const response = await axios.get(url, {params});
        data = response.data;
      }

      // Helper function to convert wind degrees to direction
      const getWindDirection = (degrees: number): string => {
        const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
      };

      // Convert pressure based on units
      const pressureInHPa = data.main.pressure;
      const convertedPressure = units === "imperial" 
        ? Math.round((pressureInHPa * 0.02953) * 100) / 100 // Convert hPa to inHg
        : Math.round(pressureInHPa); // Keep hPa for metric

      // Get detailed location information
      const detailedLocation = apiKey ? 
        await getDetailedLocation(latitude, longitude, apiKey) : 
        `${data.name}, ${data.sys.country}`;

      // Transform weather data to our format
      const weatherData: WeatherData = {
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        windDirection: data.wind.deg ? getWindDirection(data.wind.deg) : "N/A",
        pressure: convertedPressure,
        location: detailedLocation,
        timestamp: new Date().toISOString(),
      };

      logger.info(`Retrieved weather data for ${weatherData.location}`);

      // Cache the data
      await setCachedWeatherData(cacheKey, weatherData, CACHE_TTL.CURRENT_WEATHER);

      return {
        success: true,
        data: weatherData,
        cached: false,
      };
    } catch (error) {
      logger.error("Error fetching weather data:", error);
      throw new Error(`Failed to fetch weather data: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
);

/**
 * Weather Forecast Function - Retrieves 5-day weather forecast
 */
export const getWeatherForecast = onCall<ForecastRequest>(
  {
    cors: true,
    memory: "256MiB",
    timeoutSeconds: 30,
    secrets: [weatherApiKey],
  },
  async (request) => {
    try {
      const {latitude, longitude, units = "metric"} = request.data;

      if (!latitude || !longitude) {
        throw new Error("Latitude and longitude are required");
      }

      // Check cache first
      const cacheKey = getCacheKey("forecast", latitude, longitude, units);
      const cachedData = await getCachedWeatherData(cacheKey, CACHE_TTL.FORECAST);
      
      if (cachedData) {
        logger.info(`Returning cached forecast data for ${cachedData.location}`);
        return {
          success: true,
          data: cachedData,
          cached: true,
        };
      }

      // Get API key from Firebase Secret Manager or environment variable
      let apiKey: string;
      try {
        apiKey = weatherApiKey.value();
        logger.info("Using secret manager API key for forecast");
      } catch {
        // Fallback to environment variable for local development
        logger.info("Secret not available, trying environment variable for forecast");
        apiKey = process.env.WEATHER_API_KEY || "";
      }
      
      let data: any;
      
      if (!apiKey) {
        // Return mock data for local development/testing
        logger.info("No weather API key found, returning mock forecast data");
        
        // Generate mock data for the next 5 days starting from today
        const mockList = [];
        const today = new Date();
        
        for (let i = 0; i < 5; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          date.setHours(12, 0, 0, 0); // Set to noon for consistent data
          
          mockList.push({
            dt: Math.floor(date.getTime() / 1000),
            main: { 
              temp: 22 + (i * 2), // Vary temperature slightly
              temp_min: 18 + (i * 2), 
              temp_max: 25 + (i * 2), 
              humidity: 65 - (i * 5), 
              pressure: 1013 
            },
            weather: [{ 
              description: i % 2 === 0 ? "sunny" : "partly cloudy", 
              icon: i % 2 === 0 ? "01d" : "02d" 
            }],
            wind: { speed: 3.2 + (i * 0.5), deg: 180 + (i * 30) },
            pop: i === 2 ? 0.3 : 0 // Add some precipitation on day 3
          });
        }
        
        data = {
          city: { name: "San Francisco", country: "US", timezone: -28800 }, // PST timezone offset
          list: mockList
        };
      } else {
        // Use OpenWeatherMap 5-day forecast API
        logger.info("Calling OpenWeatherMap forecast API");
        const url = "https://api.openweathermap.org/data/2.5/forecast";
        const params = {
          lat: latitude,
          lon: longitude,
          appid: apiKey.trim(),
          units: units || "metric",
        };

        const response = await axios.get(url, {params});
        data = response.data;
      }

      // Helper function to convert wind degrees to direction
      const getWindDirection = (degrees: number): string => {
        const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
      };

      // Group forecast data by day and find high/low temps
      const dailyData: { [key: string]: any[] } = {};
      
      data.list.forEach((item: any) => {
        // Use the timezone offset from the API response to get correct local date
        const timezoneOffset = data.city.timezone || 0; // timezone offset in seconds
        const localTime = new Date((item.dt + timezoneOffset) * 1000);
        const date = localTime.toDateString();
        if (!dailyData[date]) {
          dailyData[date] = [];
        }
        dailyData[date].push(item);
      });

      // Convert to our format - take first 5 days, but filter out past dates
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      
      const forecastDays: ForecastDay[] = Object.keys(dailyData)
        .filter(dateStr => {
          const date = new Date(dateStr);
          return date >= today; // Only include today and future dates
        })
        .slice(0, 5)
        .map(dateStr => {
          const dayData = dailyData[dateStr];
          
          // Find high and low temps for the day
          const temps = dayData.map((item: any) => item.main.temp);
          const highTemp = Math.round(Math.max(...temps));
          const lowTemp = Math.round(Math.min(...temps));
          
          // Use midday data (around 12pm) for condition and other details
          const middayData = dayData.find((item: any) => {
            const hour = new Date(item.dt * 1000).getHours();
            return hour >= 10 && hour <= 14;
          }) || dayData[Math.floor(dayData.length / 2)];
          
          // Convert pressure based on units
          const pressureInHPa = middayData.main.pressure;
          const convertedPressure = units === "imperial" 
            ? Math.round((pressureInHPa * 0.02953) * 100) / 100
            : Math.round(pressureInHPa);

          // Use the same timezone-aware date for both date and dayName
          const timezoneOffset = data.city.timezone || 0;
          const localDate = new Date((middayData.dt + timezoneOffset) * 1000);

          // Debug logging
          logger.info("Forecast day processing:", {
            originalDt: middayData.dt,
            timezoneOffset,
            localDate: localDate.toISOString(),
            dateString: localDate.toISOString().split("T")[0],
            dayName: localDate.toLocaleDateString("en-US", { weekday: "long" }),
            today: new Date().toISOString().split("T")[0]
          });

          return {
            date: localDate.toISOString().split("T")[0], // Use timezone-aware date
            dayName: localDate.toLocaleDateString("en-US", { weekday: "long" }),
            highTemp,
            lowTemp,
            condition: middayData.weather[0].description,
            icon: middayData.weather[0].icon,
            humidity: Math.round(middayData.main.humidity),
            windSpeed: Math.round(middayData.wind.speed * 10) / 10,
            windDirection: getWindDirection(middayData.wind.deg),
            pressure: convertedPressure,
            precipitation: Math.round((middayData.pop || 0) * 100),
          };
        });

      // Get detailed location information for forecast
      const detailedLocation = apiKey ? 
        await getDetailedLocation(latitude, longitude, apiKey) : 
        `${data.city.name}, ${data.city.country}`;

      const forecastData: ForecastData = {
        location: detailedLocation,
        days: forecastDays,
      };

      logger.info(`Retrieved 5-day forecast for ${forecastData.location}`);

      // Cache the data
      await setCachedWeatherData(cacheKey, forecastData, CACHE_TTL.FORECAST);

      return {
        success: true,
        data: forecastData,
        cached: false,
      };
    } catch (error) {
      logger.error("Error fetching weather forecast:", error);
      throw new Error(`Failed to fetch weather forecast: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
);

/**
 * Health check endpoint
 */
export const healthCheck = onRequest((request, response) => {
  response.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    functions: ["getCalendarEvents", "getWeatherData"],
  });
});
