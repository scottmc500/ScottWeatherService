'use client';

import { useState } from 'react';
import { functions, auth } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

export default function FirebaseDebug() {
  const [testResults, setTestResults] = useState<{
    functionsConnection: boolean | null;
    authStatus: boolean | null;
    healthCheck: boolean | null;
    calendarStatus: boolean | null;
    error: string | null;
  }>({
    functionsConnection: null,
    authStatus: null,
    healthCheck: null,
    calendarStatus: null,
    error: null,
  });
  const [loading, setLoading] = useState(false);

  const runDebugTests = async () => {
    setLoading(true);
    setTestResults({
      functionsConnection: null,
      authStatus: null,
      healthCheck: null,
      calendarStatus: null,
      error: null,
    });

    try {
      // Test 1: Check Functions connection
      console.log('🧪 Testing Functions connection...');
      try {
        // Try to call a simple function to test connection
        const healthCheck = httpsCallable(functions, 'healthCheck');
        await healthCheck();
        setTestResults(prev => ({ ...prev, functionsConnection: true }));
        console.log('✅ Functions connection: OK');
      } catch (error) {
        console.error('❌ Functions connection failed:', error);
        setTestResults(prev => ({ 
          ...prev, 
          functionsConnection: false,
          error: `Functions connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }));
        return; // Stop here if functions don't work
      }

      // Test 2: Check Auth status
      console.log('🧪 Testing Auth status...');
      const currentUser = auth.currentUser;
      setTestResults(prev => ({ ...prev, authStatus: !!currentUser }));
      console.log('✅ Auth status:', currentUser ? 'Authenticated' : 'Not authenticated');

      if (!currentUser) {
        setTestResults(prev => ({ 
          ...prev, 
          error: 'User not authenticated - please sign in first'
        }));
        return;
      }

      // Test 3: Health check function
      console.log('🧪 Testing health check function...');
      try {
        const healthCheck = httpsCallable(functions, 'healthCheck');
        const result = await healthCheck();
        console.log('✅ Health check result:', result.data);
        setTestResults(prev => ({ ...prev, healthCheck: true }));
      } catch (error) {
        console.error('❌ Health check failed:', error);
        setTestResults(prev => ({ 
          ...prev, 
          healthCheck: false,
          error: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }));
      }

      // Test 4: Calendar status function
      console.log('🧪 Testing calendar status function...');
      try {
        const calendarStatus = httpsCallable(functions, 'calendarStatus');
        const result = await calendarStatus();
        console.log('✅ Calendar status result:', result.data);
        setTestResults(prev => ({ ...prev, calendarStatus: true }));
      } catch (error) {
        console.error('❌ Calendar status failed:', error);
        setTestResults(prev => ({ 
          ...prev, 
          calendarStatus: false,
          error: `Calendar status failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }));
      }

    } catch (error) {
      console.error('❌ Debug test error:', error);
      setTestResults(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <div className="w-5 h-5 bg-gray-300 rounded-full"></div>;
    return status ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusText = (status: boolean | null, label: string) => {
    if (status === null) return `${label}: Not tested`;
    return status ? `${label}: OK` : `${label}: Failed`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
          Firebase Debug Tests
        </h3>
        <button
          onClick={runDebugTests}
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-4 py-2 rounded-md flex items-center"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Run Debug Tests
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        {/* Test Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-md p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Functions Connection</span>
              {getStatusIcon(testResults.functionsConnection)}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {getStatusText(testResults.functionsConnection, 'Functions connection')}
            </p>
          </div>

          <div className="bg-gray-50 rounded-md p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Authentication</span>
              {getStatusIcon(testResults.authStatus)}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {getStatusText(testResults.authStatus, 'Auth status')}
            </p>
          </div>

          <div className="bg-gray-50 rounded-md p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Health Check</span>
              {getStatusIcon(testResults.healthCheck)}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {getStatusText(testResults.healthCheck, 'Health check')}
            </p>
          </div>

          <div className="bg-gray-50 rounded-md p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Calendar Status</span>
              {getStatusIcon(testResults.calendarStatus)}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {getStatusText(testResults.calendarStatus, 'Calendar status')}
            </p>
          </div>
        </div>

        {/* Error Display */}
        {testResults.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <h4 className="font-medium text-red-800 mb-2">Error Details:</h4>
            <p className="text-red-600 text-sm">{testResults.error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <h4 className="font-medium text-blue-800 mb-2">Debug Instructions:</h4>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Make sure Firebase emulators are running: <code>firebase emulators:start</code></li>
            <li>2. Make sure Functions are built: <code>cd functions && npm run build</code></li>
            <li>3. Make sure you're signed in to the app</li>
            <li>4. Check browser console for detailed error messages</li>
            <li>5. Check Firebase emulator UI at <code>http://localhost:4000</code></li>
          </ol>
        </div>

        {/* Environment Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <h4 className="font-medium text-gray-800 mb-2">Environment Info:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Use Emulators: {process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS || 'Not set'}</p>
            <p>• Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not set'}</p>
            <p>• Functions URL: {typeof window !== 'undefined' ? window.location.origin : 'Server-side'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

