'use client';

import { useState, useEffect } from 'react';
import { CalendarSyncResult } from '@/services/weatherApi';
import { GoogleCalendarOAuthService } from '@/services/googleCalendarOAuth';
import { CalendarSyncService } from '@/services/calendarSync';
import { CheckCircle, Loader2, Calendar } from 'lucide-react';

interface CalendarSyncProps {
  onSyncComplete?: (result: CalendarSyncResult) => void;
}

export default function CalendarSync({ onSyncComplete }: CalendarSyncProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<CalendarSyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasCalendarAccess, setHasCalendarAccess] = useState<boolean>(false);

  // Check if user has Google Calendar access
  useEffect(() => {
    const checkCalendarAccess = async () => {
      try {
        const hasAccess = await CalendarSyncService.checkCalendarAccess();
        setHasCalendarAccess(hasAccess);
        console.log('Google Calendar access (via Firebase):', hasAccess);
      } catch (error) {
        console.error('Error checking calendar access:', error);
        setHasCalendarAccess(false);
      }
    };
    
    checkCalendarAccess();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    setSyncResult(null);

    try {
      // Check if user has Google Calendar access
      if (!hasCalendarAccess) {
        throw new Error('Please connect your Google Calendar first');
      }

      // Use the new CalendarSyncService to sync events
      const result = await CalendarSyncService.syncCalendarEvents({
        timeMin: new Date().toISOString(),
        timeMax: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
        maxResults: 50,
      });
      
      setSyncResult(result);
      
      if (result.success) {
        console.log('Calendar sync successful:', result);
        onSyncComplete?.(result);
      } else {
        console.error('Calendar sync failed:', result.error);
        setError(result.error || 'Failed to sync calendar');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync calendar';
      setError(errorMessage);
      console.error('Calendar sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Google Calendar Sync</h3>
        </div>
        {hasCalendarAccess && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Connected</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {!hasCalendarAccess ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Connect Your Calendar</h4>
            <p className="text-gray-600 mb-4">
              Connect your Google Calendar to sync your events and get personalized recommendations.
            </p>
            <button
              onClick={() => {
                try {
                  GoogleCalendarOAuthService.requestCalendarAccess();
                } catch (error) {
                  console.error('Error requesting calendar access:', error);
                  setError('Failed to connect to Google Calendar');
                }
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Connect Google Calendar
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Calendar Access</h4>
                <p className="text-sm text-gray-600">
                  Your Google Calendar is connected and ready to sync.
                </p>
              </div>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Sync Calendar
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Sync Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {syncResult && (
              <div className={`border rounded-md p-4 ${
                syncResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex">
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${
                      syncResult.success ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      {syncResult.success ? 'Sync Completed' : 'Sync Completed with Issues'}
                    </h3>
                    <div className={`mt-2 text-sm ${
                      syncResult.success ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      <p>
                        {syncResult.success 
                          ? `Retrieved ${syncResult.total} events from your calendar`
                          : `Sync completed but with issues: ${syncResult.error}`
                        }
                      </p>
                      {syncResult.note && (
                        <p className="mt-1 text-xs opacity-75">{syncResult.note}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}