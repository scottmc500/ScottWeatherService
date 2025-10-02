'use client';

import { useState } from 'react';
import { AuthService, UserProfile } from '../services/auth';
import { Cloud, Mail } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading('google');
    setError(null);
    
    try {
      const user = await AuthService.signInWithGoogle();
      onLoginSuccess(user);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to sign in with Google');
    } finally {
      setLoading(null);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setLoading('microsoft');
    setError(null);
    
    try {
      const user = await AuthService.signInWithMicrosoft();
      onLoginSuccess(user);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to sign in with Microsoft');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
            <Cloud className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Welcome to Weather Service
          </h2>
          <p className="mt-2 text-center text-gray-600">
            Smart weather recommendations for your schedule
          </p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="space-y-6">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}
            
            <div className="space-y-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading !== null}
                className="group relative w-full flex justify-center items-center py-4 px-6 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-6">
                  {loading === 'google' ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                </span>
                <span className="font-medium">
                  {loading === 'google' ? 'Signing in...' : 'Continue with Google'}
                </span>
              </button>

              <button
                onClick={handleMicrosoftSignIn}
                disabled={loading !== null}
                className="group relative w-full flex justify-center items-center py-4 px-6 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-6">
                  {loading === 'microsoft' ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#0078d4" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                    </svg>
                  )}
                </span>
                <span className="font-medium">
                  {loading === 'microsoft' ? 'Signing in...' : 'Continue with Microsoft'}
                </span>
              </button>
            </div>
            
            <div className="text-center pt-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                By signing in, you agree to our{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 gap-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <Cloud className="h-4 w-4 text-blue-500" />
            <span>Real-time weather data</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <Mail className="h-4 w-4 text-green-500" />
            <span>Calendar integration</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <Cloud className="h-4 w-4 text-purple-500" />
            <span>AI-powered recommendations</span>
          </div>
        </div>
      </div>
    </div>
  );
}
