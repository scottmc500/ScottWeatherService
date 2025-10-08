'use client';

import { httpsCallable } from 'firebase/functions';
import { functions, auth } from '@/lib/firebase';
import { CalendarSyncResult } from './weatherApi';

export interface CalendarSyncOptions {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  calendarId?: string;
}

export class CalendarSyncService {
  /**
   * Check if user has calendar access via Firebase Functions
   */
  static async checkCalendarAccess(): Promise<boolean> {
    try {
      if (!auth.currentUser) {
        return false;
      }

      const calendarStatus = httpsCallable(functions, 'calendarStatus');
      const result = await calendarStatus();
      const data = result.data as { hasAccess: boolean };
      
      return data.hasAccess;
    } catch (error) {
      console.error('Error checking calendar access:', error);
      return false;
    }
  }

  /**
   * Sync calendar events using Firebase Functions
   */
  static async syncCalendarEvents(options: CalendarSyncOptions = {}): Promise<CalendarSyncResult> {
    try {
      if (!auth.currentUser) {
        throw new Error('User must be authenticated to sync calendar');
      }

      const {
        timeMin = new Date().toISOString(),
        timeMax = new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
        maxResults = 50,
        calendarId = 'primary'
      } = options;

      // Use Firebase Functions to get calendar events
      const getCalendarEventsWithAuth = httpsCallable(functions, 'getCalendarEventsWithAuthFunction');
      
      const result = await getCalendarEventsWithAuth({
        timeMin,
        timeMax,
        maxResults,
        calendarId,
      });
      
      const data = result.data as { success: boolean; events: any[]; count: number };
      
      if (!data.success) {
        throw new Error('Failed to retrieve calendar events from Firebase Functions');
      }

      // Transform events to our format
      const events = data.events.map(event => ({
        id: event.id,
        title: event.summary || 'No title',
        start: event.start?.dateTime || event.start?.date || '',
        end: event.end?.dateTime || event.end?.date || '',
        location: event.location || '',
        description: event.description || '',
        allDay: !event.start?.dateTime && !!event.start?.date,
      }));

      return {
        success: true,
        events,
        total: data.count,
        syncedAt: new Date().toISOString(),
        userId: auth.currentUser.uid,
        note: `Successfully synced ${data.count} events from Google Calendar`,
      };
    } catch (error) {
      console.error('Calendar sync error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during sync',
        syncedAt: new Date().toISOString(),
        userId: auth.currentUser?.uid,
      };
    }
  }

  /**
   * Get calendar events for a specific date range
   */
  static async getCalendarEvents(
    startDate: Date,
    endDate: Date,
    maxResults: number = 50
  ): Promise<CalendarSyncResult> {
    return this.syncCalendarEvents({
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      maxResults,
    });
  }

  /**
   * Get upcoming calendar events (next 7 days)
   */
  static async getUpcomingEvents(maxResults: number = 20): Promise<CalendarSyncResult> {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return this.syncCalendarEvents({
      timeMin: now.toISOString(),
      timeMax: nextWeek.toISOString(),
      maxResults,
    });
  }

  /**
   * Get calendar events for today
   */
  static async getTodayEvents(): Promise<CalendarSyncResult> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    
    return this.syncCalendarEvents({
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      maxResults: 50,
    });
  }
}
