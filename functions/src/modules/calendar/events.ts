// Calendar events logic

import { google } from "googleapis";
import * as logger from "firebase-functions/logger";
import { CalendarRequest, CalendarEvent, CalendarEventsResponse } from "../../types";

// Get calendar events using provided access token
export async function getCalendarEventsWithToken(request: CalendarRequest): Promise<CalendarEventsResponse> {
  try {
    const { accessToken, calendarId = "primary", timeMin, timeMax, maxResults = 10 } = request;

    if (!accessToken) {
      throw new Error("Access token is required");
    }

    // Initialize Google Calendar API
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth });

    // Prepare parameters
    const params: {
      calendarId: string;
      maxResults: number;
      singleEvents: boolean;
      orderBy: string;
      timeMin?: string;
      timeMax?: string;
    } = {
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
