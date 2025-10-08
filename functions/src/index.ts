// Main Firebase Functions entry point
// Clean, modular structure

import { onRequest } from "firebase-functions/v2/https";
import { onCall } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions";
import { google } from "googleapis";
import * as logger from "firebase-functions/logger";

// Import configuration
import { weatherApiKey, googleClientId, googleClientSecret, auth } from "./config";

// Import types
import { CalendarRequest, CalendarEventsRequest } from "./types";

// Import modules
import { getCalendarEventsWithToken, getCalendarEventsWithAuth, checkCalendarAccess, storeCalendarTokens, clearCalendarTokens } from "./modules/calendar";
import { getCurrentWeather, getWeatherForecast } from "./modules/weather";

// Set global options for cost control
setGlobalOptions({ maxInstances: 10 });

// ============================================================================
// CALENDAR FUNCTIONS
// ============================================================================

/**
 * Calendar Function - Retrieves events from Google Calendar (legacy)
 */
export const getCalendarEvents = onCall<CalendarRequest>(
  { cors: true },
  async (request) => {
    return await getCalendarEventsWithToken(request.data);
  }
);

/**
 * Get calendar events with automatic token retrieval
 */
export const getCalendarEventsWithAuthFunction = onCall<CalendarEventsRequest>(
  { cors: true },
  async (request) => {
    const userId = request.auth?.uid;
    if (!userId) {
      throw new Error("User must be authenticated");
    }
    return await getCalendarEventsWithAuth(userId, request.data);
  }
);

/**
 * OAuth token exchange endpoint
 */
export const oauthExchange = onRequest(
  { secrets: [googleClientId, googleClientSecret] },
  async (request, response) => {
    // Set CORS headers
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    if (request.method !== "POST") {
      response.status(405).json({ success: false, error: "Method not allowed" });
      return;
    }

    try {
      const { code } = request.body;
      
      if (!code) {
        response.status(400).json({ success: false, error: "Authorization code required" });
        return;
      }

      // Get redirect URI from environment or use default
      const redirectUri = process.env.NODE_ENV === "development" 
        ? "http://localhost:3000/auth/callback/"
        : "https://scott-weather-service.web.app/auth/callback/";

      logger.info("🔍 OAuth exchange using redirect URI:", redirectUri);
      
      const oAuth2Client = new google.auth.OAuth2(
        googleClientId.value(),
        googleClientSecret.value(),
        redirectUri
      );

      // Exchange code for tokens
      const { tokens } = await oAuth2Client.getToken(code);
      
      if (!tokens.access_token) {
        response.status(400).json({ success: false, error: "No access token received" });
        return;
      }

      // Return the tokens - frontend will store them
      response.json({ 
        success: true, 
        tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          scope: tokens.scope,
          token_type: tokens.token_type,
          expiry_date: tokens.expiry_date
        }
      });

    } catch (error) {
      logger.error("Token exchange error:", error);
      response.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  }
);

/**
 * Calendar authentication endpoint
 */
export const calendarAuth = onRequest(async (request, response) => {
  // Set CORS headers
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    logger.info("🔍 Calendar auth API called");
    
    // Get the Firebase ID token from the Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.info("❌ No Firebase token provided in Authorization header");
      response.status(401).json({ error: "No Firebase token provided" });
      return;
    }

    const idToken = authHeader.replace("Bearer ", "");
    logger.info("🔑 Firebase token received, verifying...");
    
    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    logger.info("✅ Firebase token verified for user:", userId);
    
    if (request.method === "POST") {
      // Store Google Calendar token
      const { googleToken } = request.body;
      
      if (!googleToken) {
        response.status(400).json({ 
          success: false, 
          error: "Google OAuth token required" 
        });
        return;
      }
      
      await storeCalendarTokens(userId, googleToken);
      
      response.json({
        success: true,
        message: "Google Calendar OAuth token stored successfully"
      });
      
    } else if (request.method === "DELETE") {
      // Remove Google Calendar token
      await clearCalendarTokens(userId);
      
      response.json({
        success: true,
        message: "Google Calendar OAuth token cleared successfully"
      });
    } else {
      response.status(405).json({ success: false, error: "Method not allowed" });
    }
    
  } catch (error) {
    logger.error("Calendar auth error:", error);
    response.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

/**
 * Calendar status check function (callable)
 */
export const calendarStatus = onCall(
  { cors: true },
  async (request) => {
    const userId = request.auth?.uid;
    if (!userId) {
      throw new Error("User must be authenticated");
    }
    
    const hasAccess = await checkCalendarAccess(userId);
    return { hasAccess };
  }
);

// ============================================================================
// WEATHER FUNCTIONS
// ============================================================================

/**
 * Weather Function - Retrieves weather data based on location
 */
export const getWeatherData = onCall(
  {
    cors: true,
    memory: "256MiB",
    timeoutSeconds: 30,
    secrets: [weatherApiKey, googleClientId, googleClientSecret],
  },
  async (request) => {
    return await getCurrentWeather(request.data);
  }
);

/**
 * Weather Forecast Function - Retrieves 5-day weather forecast
 */
export const getWeatherForecastFunction = onCall(
  {
    cors: true,
    memory: "256MiB",
    timeoutSeconds: 30,
    secrets: [weatherApiKey, googleClientId, googleClientSecret],
  },
  async (request) => {
    return await getWeatherForecast(request.data);
  }
);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Health check endpoint
 */
export const healthCheck = onRequest((request, response) => {
  response.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    functions: [
      "getCalendarEvents", 
      "getCalendarEventsWithAuthFunction", 
      "getWeatherData", 
      "getWeatherForecastFunction",
      "oauthExchange", 
      "calendarAuth", 
      "calendarStatus"
    ],
  });
});
