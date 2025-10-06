'use client';

import { useState, useEffect } from 'react';
import { Calendar, CalendarCheck, CalendarX } from 'lucide-react';

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  description?: string;
}

export default function CalendarIntegration() {
  const [hasCalendarAccess, setHasCalendarAccess] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has calendar access via Firebase Functions
    const checkCalendarAccess = async () => {
      try {
        const { functions } = await import('@/lib/firebase');
        const { httpsCallable } = await import('firebase/functions');
        
        const calendarStatus = httpsCallable(functions, 'calendarStatus');
        const result = await calendarStatus();
        const data = result.data as { hasAccess: boolean };
        
        setHasCalendarAccess(data.hasAccess);
      } catch (error) {
        console.error('❌ Failed to check calendar access:', error);
        setHasCalendarAccess(false);
      }
    };
    
    checkCalendarAccess();
  }, []);

  const handleConnectCalendar = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the existing OAuth flow
      const { GoogleCalendarOAuthService } = await import('@/services/googleCalendarOAuth');
      await GoogleCalendarOAuthService.requestCalendarAccess();
      
      // The OAuth flow will redirect, so we don't need to update state here
      console.log('✅ Calendar OAuth flow initiated');
    } catch (error) {
      console.error('❌ Failed to connect calendar:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadCalendarEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the new Firebase Function with automatic token retrieval
      const { functions } = await import('@/lib/firebase');
      const { httpsCallable } = await import('firebase/functions');
      
      const getCalendarEventsWithAuth = httpsCallable(functions, 'getCalendarEventsWithAuthFunction');
      
      const result = await getCalendarEventsWithAuth({
        timeMin: new Date().toISOString(),
        timeMax: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
        maxResults: 10,
      });
      
      const data = result.data as { success: boolean; events: CalendarEvent[]; count: number };
      
      if (data.success) {
        setCalendarEvents(data.events);
        console.log('✅ Calendar events loaded via Firebase Functions:', data.count, 'events');
      } else {
        throw new Error('Failed to retrieve calendar events');
      }
    } catch (error) {
      console.error('❌ Failed to load calendar events:', error);
      setError(error instanceof Error ? error.message : 'Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          Google Calendar Integration
        </h3>
        <div className="flex items-center">
          {hasCalendarAccess ? (
            <CalendarCheck className="h-5 w-5 text-green-500" />
          ) : (
            <CalendarX className="h-5 w-5 text-red-500" />
          )}
        </div>
      </div>

      <div className="space-y-4">
        {!hasCalendarAccess ? (
          <div>
            <p className="text-gray-600 mb-4">
              Connect your Google Calendar to sync events and get weather-based recommendations.
            </p>
            <button
              onClick={handleConnectCalendar}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Connect Google Calendar
                </>
              )}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-green-600 mb-4">
              ✅ Google Calendar is connected! You can now load your events.
            </p>
            <button
              onClick={handleLoadCalendarEvents}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading Events...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Load Calendar Events
                </>
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {calendarEvents.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-2">Recent Events ({calendarEvents.length})</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {calendarEvents.map((event) => (
                <div key={event.id} className="bg-gray-50 rounded-md p-3">
                  <h5 className="font-medium text-gray-900">{event.summary || 'No title'}</h5>
                  <p className="text-sm text-gray-600">
                    {event.start?.dateTime 
                      ? new Date(event.start.dateTime).toLocaleString()
                      : event.start?.date
                      ? new Date(event.start.date).toLocaleDateString()
                      : 'No date'
                    }
                  </p>
                  {event.location && (
                    <p className="text-sm text-gray-500">📍 {event.location}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
