'use client';

import { useState } from 'react';
import { CalendarSyncService } from '@/services/calendarSync';
import { Calendar, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function CalendarTest() {
  const [testResults, setTestResults] = useState<{
    accessCheck: boolean | null;
    syncTest: boolean | null;
    events: any[] | null;
    error: string | null;
  }>({
    accessCheck: null,
    syncTest: null,
    events: null,
    error: null,
  });
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setTestResults({
      accessCheck: null,
      syncTest: null,
      events: null,
      error: null,
    });

    try {
      // Test 1: Check calendar access
      console.log('🧪 Testing calendar access...');
      const hasAccess = await CalendarSyncService.checkCalendarAccess();
      setTestResults(prev => ({ ...prev, accessCheck: hasAccess }));
      console.log('✅ Calendar access test:', hasAccess);

      if (!hasAccess) {
        setTestResults(prev => ({ 
          ...prev, 
          error: 'No calendar access - please connect Google Calendar first' 
        }));
        return;
      }

      // Test 2: Sync calendar events
      console.log('🧪 Testing calendar sync...');
      const syncResult = await CalendarSyncService.syncCalendarEvents({
        timeMin: new Date().toISOString(),
        timeMax: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
        maxResults: 5,
      });

      setTestResults(prev => ({ 
        ...prev, 
        syncTest: syncResult.success,
        events: syncResult.events || null,
        error: syncResult.error || null
      }));

      console.log('✅ Calendar sync test:', syncResult.success);
      if (syncResult.events) {
        console.log('📅 Events found:', syncResult.events.length);
      }

    } catch (error) {
      console.error('❌ Test error:', error);
      setTestResults(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          Calendar Integration Test
        </h3>
        <button
          onClick={runTests}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md flex items-center"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Calendar className="mr-2 h-4 w-4" />
              Run Tests
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        {/* Test Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-md p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Calendar Access</span>
              {testResults.accessCheck === null ? (
                <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
              ) : testResults.accessCheck ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {testResults.accessCheck === null 
                ? 'Not tested' 
                : testResults.accessCheck 
                ? 'Connected to Google Calendar' 
                : 'No calendar access'
              }
            </p>
          </div>

          <div className="bg-gray-50 rounded-md p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Calendar Sync</span>
              {testResults.syncTest === null ? (
                <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
              ) : testResults.syncTest ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {testResults.syncTest === null 
                ? 'Not tested' 
                : testResults.syncTest 
                ? 'Sync successful' 
                : 'Sync failed'
              }
            </p>
          </div>
        </div>

        {/* Error Display */}
        {testResults.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{testResults.error}</p>
          </div>
        )}

        {/* Events Display */}
        {testResults.events && testResults.events.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <h4 className="font-medium text-green-800 mb-2">
              Found {testResults.events.length} events:
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {testResults.events.map((event, index) => (
                <div key={event.id || index} className="bg-white rounded p-2">
                  <h5 className="font-medium text-sm">{event.title}</h5>
                  <p className="text-xs text-gray-600">
                    {event.start ? new Date(event.start).toLocaleString() : 'No date'}
                  </p>
                  {event.location && (
                    <p className="text-xs text-gray-500">📍 {event.location}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <h4 className="font-medium text-blue-800 mb-2">Test Instructions:</h4>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Make sure you're signed in to the app</li>
            <li>2. Connect your Google Calendar using the Calendar Integration component</li>
            <li>3. Click "Run Tests" to verify the integration is working</li>
            <li>4. Check the results above to see if everything is working correctly</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
