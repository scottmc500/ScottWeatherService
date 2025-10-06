// Calendar authentication logic

import { google } from "googleapis";
import * as logger from "firebase-functions/logger";
import { db, auth } from "../../config";
import { CalendarEventsRequest, CalendarEventsResponse, CalendarEvent } from "../../types";
import { getCalendarEventsWithToken } from "./events";

// Get calendar events with automatic token retrieval from Firestore
export async function getCalendarEventsWithAuth(
  userId: string,
  request: CalendarEventsRequest
): Promise<CalendarEventsResponse> {
  try {
    const { timeMin, timeMax, maxResults = 10, calendarId = "primary" } = request;

    // Get stored calendar token from Firestore
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      throw new Error("User not found");
    }

    const userData = userDoc.data();
    const calendarToken = userData?.googleCalendarToken?.access_token;

    if (!calendarToken) {
      throw new Error("No calendar access token found. Please connect to Google Calendar first.");
    }

    // Use the existing events function with the retrieved token
    return await getCalendarEventsWithToken({
      accessToken: calendarToken,
      calendarId,
      timeMin,
      timeMax,
      maxResults,
    });
  } catch (error) {
    logger.error("Error fetching calendar events with auth:", error);
    throw new Error(`Failed to fetch calendar events: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// Check if user has calendar access
export async function checkCalendarAccess(userId: string): Promise<boolean> {
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return false;
    }
    
    const userData = userDoc.data();
    return !!(userData?.googleCalendarToken?.access_token);
  } catch (error) {
    logger.error("Error checking calendar access:", error);
    return false;
  }
}

// Store Google Calendar tokens in Firestore
export async function storeCalendarTokens(
  userId: string,
  tokens: {
    access_token: string;
    refresh_token?: string;
    scope: string;
    token_type?: string;
    expiry_date?: number;
  }
): Promise<void> {
  try {
    const tokenData = {
      access_token: tokens.access_token,
      scope: tokens.scope,
      type: "oauth_token",
      lastUpdated: new Date().toISOString(),
      ...(tokens.refresh_token && { refresh_token: tokens.refresh_token }),
      ...(tokens.token_type && { token_type: tokens.token_type }),
      ...(tokens.expiry_date && { expiry_date: tokens.expiry_date }),
    };

    await db.collection("users").doc(userId).set({
      googleCalendarToken: tokenData
    }, { merge: true });

    logger.info(`Stored Google Calendar tokens for user ${userId}`);
  } catch (error) {
    logger.error("Error storing Google Calendar tokens:", error);
    throw error;
  }
}

// Clear Google Calendar tokens
export async function clearCalendarTokens(userId: string): Promise<void> {
  try {
    await db.collection("users").doc(userId).update({
      googleCalendarToken: null
    });

    logger.info(`Cleared OAuth token for user ${userId}`);
  } catch (error) {
    logger.error("Error clearing Google Calendar tokens:", error);
    throw error;
  }
}
