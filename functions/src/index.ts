import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

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
 * Get calendar events (mock implementation)
 * @param {string} authHeader - Authorization header
 * @return {Promise<Object>} Calendar events object
 */
async function getCalendarEvents(authHeader: string) {
  // Mock calendar data - replace with real Google/Microsoft Calendar API
  // Note: authHeader is available for future calendar API integration
  console.log("Auth header provided:", authHeader ? "Yes" : "No");
  const events = [
    {
      id: "1",
      title: "Team Meeting",
      start: new Date(Date.now() + 3600000).toISOString(),
      end: new Date(Date.now() + 7200000).toISOString(),
      location: "Office",
      description: "Weekly team standup",
    },
    {
      id: "2",
      title: "Lunch with Client",
      start: new Date(Date.now() + 86400000).toISOString(),
      end: new Date(Date.now() + 90000000).toISOString(),
      location: "Downtown Restaurant",
      description: "Discuss project requirements",
    },
  ];

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  return {events};
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
