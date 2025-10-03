'use client';

import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function FunctionsTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testHealthCheck = async () => {
    setLoading(true);
    setTestResult('');
    
    try {
      const functions = getFunctions();
      const healthCheck = httpsCallable(functions, 'healthCheck');
      
      const result = await healthCheck();
      setTestResult(`✅ Health Check Success: ${JSON.stringify(result.data, null, 2)}`);
    } catch (error) {
      setTestResult(`❌ Health Check Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testWeatherFunction = async () => {
    setLoading(true);
    setTestResult('');
    
    try {
      const functions = getFunctions();
      const getWeatherData = httpsCallable(functions, 'getWeatherData');
      
      // Test with San Francisco coordinates
      const result = await getWeatherData({
        latitude: 37.7749,
        longitude: -122.4194,
        units: 'metric'
      });
      
      setTestResult(`✅ Weather Function Success: ${JSON.stringify(result.data, null, 2)}`);
    } catch (error) {
      setTestResult(`❌ Weather Function Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Firebase Functions Test</h3>
      
      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={testHealthCheck}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Test Health Check
          </button>
          
          <button
            onClick={testWeatherFunction}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            Test Weather Function
          </button>
        </div>
        
        {loading && (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Testing function...</span>
          </div>
        )}
        
        {testResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
