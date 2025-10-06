// Weather forecast logic

import axios from "axios";
import * as logger from "firebase-functions/logger";
import { ForecastRequest, ForecastData, ForecastResponse, OpenWeatherForecastResponse, ForecastDay } from "../../types";
import { getCacheKey, getCachedWeatherData, setCachedWeatherData } from "../shared/cache";
import { getDetailedLocation } from "../shared/location";
import { CACHE_TTL, weatherApiKey } from "../../config";

// Helper function to convert wind degrees to direction
function getWindDirection(degrees: number): string {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// Get weather forecast data
export async function getWeatherForecast(request: ForecastRequest): Promise<ForecastResponse> {
  try {
    const { latitude, longitude, units = "metric" } = request;

    if (!latitude || !longitude) {
      throw new Error("Latitude and longitude are required");
    }

    // Check cache first
    const cacheKey = getCacheKey("forecast", latitude, longitude, units);
    const cachedData = await getCachedWeatherData(cacheKey, CACHE_TTL.FORECAST);
    
    if (cachedData) {
      logger.info(`Returning cached forecast data for ${(cachedData as ForecastData).location}`);
      return {
        success: true,
        data: cachedData as ForecastData,
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
    
    let data: OpenWeatherForecastResponse;
    
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
