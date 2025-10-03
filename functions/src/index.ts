import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {google} from "googleapis";

// Initialize Firebase Admin
admin.initializeApp();

// Weather API endpoints
export const weatherApi = onRequest(
  {
    memory: "512MiB",
    timeoutSeconds: 30,
    maxInstances: 10,
    cors: true,
  },
  async (req, res) => {
    try {
      // Set CORS headers - SECURE: Only allow specific origins
      const origin = req.headers.origin;
      const allowedOrigins = [
        "http://localhost:3000",
        "https://scott-weather-service.web.app",
        "https://scott-weather-service.firebaseapp.com"
      ];
      
      if (origin && allowedOrigins.includes(origin)) {
        res.set("Access-Control-Allow-Origin", origin);
      } else {
        // Reject requests from unauthorized origins
        res.status(403).json({ error: "CORS policy violation: Origin not allowed" });
        return;
      }
      res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      const {method} = req;
      const {location, date} = req.query;

      switch (method) {
      case "GET":
        if (req.path === "/current") {
          const weatherData = await getCurrentWeather(location as string);
          res.json(weatherData);
        } else if (req.path === "/forecast") {
          const forecastData = await getWeatherForecast(
            location as string, date as string);
          res.json(forecastData);
        } else {
          res.status(404).json({error: "Endpoint not found"});
        }
        break;
      default:
        res.status(405).json({error: "Method not allowed"});
      }
    } catch (error) {
      console.error("Weather API error:", error);
      res.status(500).json({error: "Internal server error"});
    }
  }
);

// Calendar API endpoints
export const calendarApi = onRequest(
  {
    memory: "512MiB",
    timeoutSeconds: 30,
    maxInstances: 10,
    cors: true,
  },
  async (req, res) => {
    try {
      // Set CORS headers - SECURE: Only allow specific origins
      const origin = req.headers.origin;
      const allowedOrigins = [
        "http://localhost:3000",
        "https://scott-weather-service.web.app",
        "https://scott-weather-service.firebaseapp.com"
      ];
      
      if (origin && allowedOrigins.includes(origin)) {
        res.set("Access-Control-Allow-Origin", origin);
      } else {
        // Reject requests from unauthorized origins
        res.status(403).json({ error: "CORS policy violation: Origin not allowed" });
        return;
      }
      res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      const {method} = req;
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        res.status(401).json({error: "Authorization header required"});
        return;
      }

      switch (method) {
      case "GET":
        if (req.path === "/events") {
          const events = await getCalendarEvents(authHeader);
          res.json(events);
        } else if (req.path === "/sync") {
          const syncResult = await syncCalendarEvents(authHeader);
          res.json(syncResult);
        } else if (req.path === "/auth") {
          const authResult = await handleCalendarAuth(authHeader, req.body);
          res.json(authResult);
        } else {
          res.status(404).json({error: "Endpoint not found"});
        }
        break;
      case "POST":
        if (req.path === "/sync") {
          const syncResult = await syncCalendarEvents(authHeader);
          res.json(syncResult);
        } else if (req.path === "/auth") {
          const authResult = await handleCalendarAuth(authHeader, req.body);
          res.json(authResult);
        } else {
          res.status(404).json({error: "Endpoint not found"});
        }
        break;
      default:
        res.status(405).json({error: "Method not allowed"});
      }
    } catch (error) {
      console.error("Calendar API error:", error);
      res.status(500).json({error: "Internal server error"});
    }
  }
);

// Recommendations API
export const recommendationsApi = onRequest(
  {
    memory: "1GiB",
    timeoutSeconds: 30,
    maxInstances: 10,
    cors: true,
  },
  async (req, res) => {
    try {
      // Set CORS headers - SECURE: Only allow specific origins
      const origin = req.headers.origin;
      const allowedOrigins = [
        "http://localhost:3000",
        "https://scott-weather-service.web.app",
        "https://scott-weather-service.firebaseapp.com"
      ];
      
      if (origin && allowedOrigins.includes(origin)) {
        res.set("Access-Control-Allow-Origin", origin);
      } else {
        // Reject requests from unauthorized origins
        res.status(403).json({ error: "CORS policy violation: Origin not allowed" });
        return;
      }
      res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      const {method} = req;
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        res.status(401).json({error: "Authorization header required"});
        return;
      }

      switch (method) {
      case "GET": {
        const recommendations = await generateRecommendations(authHeader);
        res.json(recommendations);
        break;
      }
      default:
        res.status(405).json({error: "Method not allowed"});
      }
    } catch (error) {
      console.error("Recommendations API error:", error);
      res.status(500).json({error: "Internal server error"});
    }
  }
);

// Helper functions
/**
 * Get current weather data for a location
 * @param {string} location - The location to get weather for
 * @return {Promise<Object>} Weather data object
 */
async function getCurrentWeather(location: string) {
  // Mock weather data - replace with real weather API
  const weatherData = {
    location: location || "San Francisco, CA",
    temperature: 72,
    condition: "Sunny",
    humidity: 65,
    windSpeed: 5,
    windDirection: "NW",
    uvIndex: 7,
    feelsLike: 75,
    timestamp: new Date().toISOString(),
  };

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  return weatherData;
}

/**
 * Get weather forecast for a location
 * @param {string} location - The location to get forecast for
 * @param {string} date - Optional date for forecast
 * @return {Promise<Object>} Forecast data object
 */
async function getWeatherForecast(location: string, date?: string) {
  // Mock forecast data - replace with real weather API
  const forecast = [
    {
      date: date || new Date().toISOString().split("T")[0],
      high: 78,
      low: 62,
      condition: "Partly Cloudy",
      precipitation: 10,
      windSpeed: 7,
    },
    {
      date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      high: 82,
      low: 64,
      condition: "Sunny",
      precipitation: 0,
      windSpeed: 5,
    },
    {
      date: new Date(Date.now() + 172800000).toISOString().split("T")[0],
      high: 75,
      low: 58,
      condition: "Rainy",
      precipitation: 80,
      windSpeed: 12,
    },
  ];

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 150));

  return {location, forecast};
}

/**
 * Get calendar events for a user from Google Calendar
 * @param {string} authHeader - Authorization header with access token
 * @return {Promise<Object>} Calendar events object
 */
async function getCalendarEvents(authHeader: string) {
  try {
    // Extract Firebase token and get user info
    const firebaseToken = authHeader.replace("Bearer ", "");
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    const userId = decodedToken.uid;
    
    console.log(`Attempting to fetch Google Calendar for user: ${userId}`);
    
    // Check if user has stored Google Calendar access token in Firestore
    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData?.googleCalendarToken) {
      console.log("No Google Calendar token found for user - using mock data");
      console.log("User data keys:", Object.keys(userData || {}));
      return getMockCalendarData();
    }
    
    console.log("Found Google Calendar token, fetching real calendar data...");
    console.log("Token details:", {
      hasAccessToken: !!userData.googleCalendarToken.access_token,
      hasRefreshToken: !!userData.googleCalendarToken.refresh_token,
      scope: userData.googleCalendarToken.scope,
      tokenType: userData.googleCalendarToken.type
    });
    
    // Check if this is a JWT credential from Google Identity Services
    if (userData.googleCalendarToken.type === "jwt_credential") {
      console.log("Found JWT credential - Google Identity Services doesn't provide " +
        "direct Calendar API access");
      console.log("For now, using mock data. In production, you'd need to implement OAuth flow.");
      return getMockCalendarData();
    }
    
    // Check if we have a proper OAuth access token
    if (!userData.googleCalendarToken.access_token) {
      console.log("No access token found in stored token - using mock data");
      return getMockCalendarData();
    }
    
    // Initialize Google Calendar API with stored token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: userData.googleCalendarToken.access_token,
      refresh_token: userData.googleCalendarToken.refresh_token,
    });
    
    const calendar = google.calendar({version: "v3", auth: oauth2Client});
    
    // Get current time and 7 days from now
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Fetch events from Google Calendar
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: weekFromNow.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 50,
    });
    
    const events = response.data.items || [];
    
    // Transform Google Calendar events to our format
    const formattedEvents = events.map((event) => ({
      id: event.id,
      title: event.summary || "No Title",
      start: event.start?.dateTime || event.start?.date || new Date().toISOString(),
      end: event.end?.dateTime || event.end?.date || new Date().toISOString(),
      location: event.location || "",
      description: event.description || "",
      attendees: event.attendees?.map(attendee => ({
        email: attendee.email,
        name: attendee.displayName,
        responseStatus: attendee.responseStatus
      })) || [],
      allDay: !event.start?.dateTime,
      status: event.status,
      created: event.created,
      updated: event.updated
    }));
    
    console.log(`Successfully retrieved ${formattedEvents.length} real calendar events`);
    
    return {
      events: formattedEvents,
      total: formattedEvents.length,
      nextSyncToken: response.data.nextSyncToken,
      timeZone: response.data.timeZone,
      updated: new Date().toISOString(),
      source: "google_calendar"
    };
    
  } catch (error) {
    console.error("Calendar data generation error:", error);
    console.log("Falling back to mock data due to error");
    return getMockCalendarData();
  }
}


/**
 * Handle Google Calendar OAuth token storage
 * @param {string} authHeader - Authorization header with Firebase token
 * @param {Object} body - Request body containing Google OAuth token
 * @return {Promise<Object>} Auth result
 */
async function handleCalendarAuth(authHeader: string, body: any) {
  try {
    const firebaseToken = authHeader.replace("Bearer ", "");
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    const userId = decodedToken.uid;
    
    if (!body.googleToken) {
      return {
        success: false,
        error: "Google OAuth token required"
      };
    }
    
    console.log(`Received Google token for user ${userId}:`, {
      hasAccessToken: !!body.googleToken.access_token,
      hasRefreshToken: !!body.googleToken.refresh_token,
      scope: body.googleToken.scope,
      tokenType: typeof body.googleToken
    });
    
    // Check if this is a JWT credential from Google Identity Services
    if (typeof body.googleToken === "string" && body.googleToken.startsWith("eyJ")) {
      console.log("Received JWT credential from Google Identity Services");
      
      // For now, we'll store the JWT credential and handle it in getCalendarEvents
      // In a production app, you'd exchange this JWT for a proper OAuth token
      const db = admin.firestore();
      await db.collection("users").doc(userId).set({
        googleCalendarToken: {
          credential: body.googleToken,
          type: "jwt_credential",
          lastUpdated: new Date().toISOString()
        }
      }, { merge: true });
      
      console.log(`Stored JWT credential for user ${userId}`);
      
      return {
        success: true,
        message: "Google Calendar JWT credential stored successfully"
      };
    }
    
    // Handle traditional OAuth tokens
    console.log("Received OAuth token");
    
    // Store Google Calendar token in Firestore with OAuth type
    const db = admin.firestore();
    await db.collection("users").doc(userId).set({
      googleCalendarToken: {
        access_token: body.googleToken.access_token,
        refresh_token: body.googleToken.refresh_token,
        scope: body.googleToken.scope,
        type: "oauth_token",
        lastUpdated: new Date().toISOString()
      }
    }, { merge: true });
    
    console.log(`Stored OAuth token for user ${userId}`);
    
    return {
      success: true,
      message: "Google Calendar OAuth token stored successfully"
    };
    
  } catch (error) {
    console.error("Calendar auth error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown auth error"
    };
  }
}

/**
 * Get mock calendar data as fallback
 * @return {Object} Mock calendar data
 */
function getMockCalendarData() {
  // Enhanced mock data that simulates real calendar events
  const now = new Date();
  const events = [
    {
      id: "mock-1",
      title: "Team Standup",
      start: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      end: new Date(now.getTime() + 2.5 * 60 * 60 * 1000).toISOString(),
      location: "Conference Room A",
      description: "Daily team standup meeting",
      attendees: [
        { email: "john@company.com", name: "John Doe", responseStatus: "accepted" },
        { email: "jane@company.com", name: "Jane Smith", responseStatus: "accepted" }
      ],
      allDay: false,
      status: "confirmed",
      created: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      updated: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "mock-2",
      title: "Client Presentation",
      start: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      end: new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString(),
      location: "Downtown Office",
      description: "Present Q4 results to key clients",
      attendees: [
        { 
          email: "client@example.com", 
          name: "Client Representative", 
          responseStatus: "tentative" 
        }
      ],
      allDay: false,
      status: "confirmed",
      created: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
      updated: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "mock-3",
      title: "All Day Conference",
      start: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
        .toISOString().split("T")[0], // Day after tomorrow
      end: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
        .toISOString().split("T")[0],
      location: "Convention Center",
      description: "Annual tech conference",
      attendees: [],
      allDay: true,
      status: "confirmed",
      created: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
      updated: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    }
  ];
    
  console.log(`Generated ${events.length} mock calendar events`);
    
  return {
    events: events,
    total: events.length,
    nextSyncToken: "mock-sync-token-" + Date.now(),
    timeZone: "America/New_York",
    updated: new Date().toISOString(),
    note: "Using enhanced mock data - Google Calendar API requires OAuth setup"
  };
}

/**
 * Sync calendar events and store them in Firestore
 * @param {string} authHeader - Authorization header with access token
 * @return {Promise<Object>} Sync result object
 */
async function syncCalendarEvents(authHeader: string) {
  try {
    // Get calendar events from Google Calendar
    const calendarData = await getCalendarEvents(authHeader);
    
    if ("error" in calendarData && calendarData.error) {
      return {
        success: false,
        error: calendarData.error,
        events: calendarData.events,
        total: calendarData.total
      };
    }
    
    // Get user ID from the auth token (you'll need to implement this)
    const userId = await getUserIdFromToken(authHeader);
    
    if (!userId) {
      return {
        success: false,
        error: "Unable to identify user from token"
      };
    }
    
    // Store events in Firestore
    const db = admin.firestore();
    const userCalendarRef = db.collection("users").doc(userId).collection("calendar");
    
    // Batch write for efficiency
    const batch = db.batch();
    
    // Store each event
    for (const event of calendarData.events) {
      if (event.id) {
        const eventRef = userCalendarRef.doc(event.id);
        
        // Clean the event data to remove undefined values
        const cleanEvent = {
          id: event.id,
          title: event.title || "No Title",
          start: event.start,
          end: event.end,
          location: event.location || "",
          description: event.description || "",
          attendees: event.attendees?.map(attendee => ({
            email: attendee.email || "",
            name: attendee.name || "",
            responseStatus: attendee.responseStatus || "needsAction"
          })) || [],
          allDay: event.allDay || false,
          status: event.status || "confirmed",
          created: event.created,
          updated: event.updated,
          syncedAt: new Date().toISOString(),
          source: "google_calendar"
        };
        
        batch.set(eventRef, cleanEvent);
      }
    }
    
    // Store sync metadata
    const syncRef = userCalendarRef.doc("_sync_metadata");
    batch.set(syncRef, {
      lastSync: new Date().toISOString(),
      totalEvents: calendarData.total || 0,
      nextSyncToken: calendarData.nextSyncToken || null,
      timeZone: calendarData.timeZone || "UTC",
      source: "google_calendar"
    });
    
    await batch.commit();
    
    console.log(`Synced ${calendarData.total} calendar events for user ${userId}`);
    
    return {
      success: true,
      events: calendarData.events,
      total: calendarData.total,
      syncedAt: new Date().toISOString(),
      userId: userId
    };
    
  } catch (error) {
    console.error("Calendar sync error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown sync error"
    };
  }
}

/**
 * Get user ID from Firebase Auth token
 * @param {string} authHeader - Authorization header with Firebase token
 * @return {Promise<string|null>} User ID or null if invalid
 */
async function getUserIdFromToken(authHeader: string) {
  try {
    const token = authHeader.replace("Bearer ", "");
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

/**
 * Generate AI recommendations (mock implementation)
 * @param {string} authHeader - Authorization header
 * @return {Promise<Object>} Recommendations object
 */
async function generateRecommendations(authHeader: string) {
  // Mock recommendations - replace with AI/ML logic
  // Note: authHeader is available for future user-specific recommendations
  console.log("Auth header provided:", authHeader ? "Yes" : "No");
  const recommendations = [
    {
      id: "1",
      type: "weather",
      title: "Bring an umbrella",
      description: "There's a 80% chance of rain tomorrow during " +
        "your outdoor meeting.",
      priority: "high",
      action: "Check weather before leaving",
    },
    {
      id: "2",
      type: "calendar",
      title: "Reschedule outdoor event",
      description: "Your park meeting on Friday conflicts with " +
        "expected thunderstorms.",
      priority: "medium",
      action: "Consider indoor alternative",
    },
    {
      id: "3",
      type: "clothing",
      title: "Dress warmly",
      description: "Temperature will drop to 58°F by evening.",
      priority: "low",
      action: "Bring a jacket",
    },
  ];

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {recommendations};
}
