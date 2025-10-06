// Location utilities

import * as logger from "firebase-functions/logger";
import axios from "axios";
import { getLocationCacheKey, getCachedWeatherData, setCachedWeatherData } from "./cache";
import { CACHE_TTL } from "../../config";

// Helper function to get detailed location information using reverse geocoding
export async function getDetailedLocation(latitude: number, longitude: number, apiKey: string): Promise<string> {
  // Check cache first
  const locationCacheKey = getLocationCacheKey(latitude, longitude);
  const cachedLocation = await getCachedWeatherData(locationCacheKey, CACHE_TTL.LOCATION);
  
  if (cachedLocation) {
    logger.info(`Cache hit (location): ${locationCacheKey}`);
    return cachedLocation as string;
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
