// Caching utilities

import * as logger from "firebase-functions/logger";
import { db } from "../../config";
import { WeatherData, ForecastData } from "../../types";

// In-memory cache for weather data
const weatherCache = new Map<string, {data: WeatherData | ForecastData | string; timestamp: number; ttl: number}>();

// Helper function to generate cache key
export function getCacheKey(type: string, latitude: number, longitude: number, units: string): string {
  return `${type}:${Math.round(latitude * 1000) / 1000}:${Math.round(longitude * 1000) / 1000}:${units}`;
}

// Helper function to generate location cache key (no units needed)
export function getLocationCacheKey(latitude: number, longitude: number): string {
  return `location:${Math.round(latitude * 1000) / 1000}:${Math.round(longitude * 1000) / 1000}`;
}

// Helper function to check if cache is valid
export function isCacheValid(timestamp: number, ttl: number): boolean {
  return Date.now() - timestamp < ttl;
}

// Helper function to get cached data
export async function getCachedWeatherData(cacheKey: string, ttl: number): Promise<WeatherData | ForecastData | string | null> {
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
export async function setCachedWeatherData(cacheKey: string, data: WeatherData | ForecastData | string, ttl: number): Promise<void> {
  const timestamp = Date.now();
  
  // Update memory cache
  weatherCache.set(cacheKey, { data, timestamp, ttl });
  
  // Update Firestore cache (with longer TTL for backup)
  try {
    await db.collection("weather_cache").doc(cacheKey).set({
      data,
      timestamp,
      ttl: 30 * 60 * 1000 // 30 minutes for Firestore backup
    });
    logger.info(`Cache set: ${cacheKey}`);
  } catch {
    logger.warn("Firestore cache write failed");
  }
}
