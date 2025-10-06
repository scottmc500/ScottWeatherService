// Current weather logic

import axios from "axios";
import * as logger from "firebase-functions/logger";
import { WeatherRequest, WeatherData, WeatherResponse, OpenWeatherCurrentResponse } from "../../types";
import { getCacheKey, getCachedWeatherData, setCachedWeatherData } from "../shared/cache";
import { getDetailedLocation } from "../shared/location";
import { CACHE_TTL, weatherApiKey } from "../../config";

// Helper function to convert wind degrees to direction
function getWindDirection(degrees: number): string {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// Get current weather data
export async function getCurrentWeather(request: WeatherRequest): Promise<WeatherResponse> {
  try {
    const { latitude, longitude, units = "metric" } = request;

    if (!latitude || !longitude) {
      throw new Error("Latitude and longitude are required");
    }

    // Check cache first
    const cacheKey = getCacheKey("current", latitude, longitude, units);
    const cachedData = await getCachedWeatherData(cacheKey, CACHE_TTL.CURRENT_WEATHER);
    
    if (cachedData) {
      logger.info(`Returning cached weather data for ${(cachedData as WeatherData).location}`);
      return {
        success: true,
        data: cachedData as WeatherData,
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
    
    let data: OpenWeatherCurrentResponse;
    
    if (!apiKey) {
      // Return mock data for local development/testing
      logger.info("No weather API key found, returning mock data");
      data = {
        main: {
          temp: 22,
          temp_min: 18,
          temp_max: 25,
          humidity: 65,
          pressure: 1013
        },
        weather: [{
          description: "sunny",
          icon: "01d"
        }],
        wind: {
          speed: 3.2,
          deg: 180
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
