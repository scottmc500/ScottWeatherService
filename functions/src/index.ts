import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/v2/https";
import {onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {google} from "googleapis";
import axios from "axios";

// Set global options for cost control
setGlobalOptions({ maxInstances: 10 });

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
  location: string;
  timestamp: string;
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
  {cors: true},
  async (request) => {
    try {
      const {latitude, longitude, units = "metric"} = request.data;

      if (!latitude || !longitude) {
        throw new Error("Latitude and longitude are required");
      }

      // Get API key from environment variables
      const apiKey = process.env.WEATHER_API_KEY;
      if (!apiKey) {
        throw new Error("Weather API key not configured");
      }

      // Use OpenWeatherMap API (you can replace with any weather API)
      const url = `https://api.openweathermap.org/data/2.5/weather`;
      const params = {
        lat: latitude,
        lon: longitude,
        appid: apiKey,
        units,
      };

      const response = await axios.get(url, {params});
      const data = response.data;

      // Transform weather data to our format
      const weatherData: WeatherData = {
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        location: `${data.name}, ${data.sys.country}`,
        timestamp: new Date().toISOString(),
      };

      logger.info(`Retrieved weather data for ${weatherData.location}`);

      return {
        success: true,
        data: weatherData,
      };
    } catch (error) {
      logger.error("Error fetching weather data:", error);
      throw new Error(`Failed to fetch weather data: ${error instanceof Error ? error.message : "Unknown error"}`);
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
