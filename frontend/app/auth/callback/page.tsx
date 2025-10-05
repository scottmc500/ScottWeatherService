'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleCalendarOAuthService } from '@/services/googleCalendarOAuth';

export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        router.push('/?error=oauth_error');
        return;
      }

      if (!code) {
        console.error('No authorization code received');
        router.push('/?error=no_code');
        return;
      }

      try {
        console.log('🔄 Exchanging authorization code for tokens...');
        
        // Exchange code for tokens using Firebase Functions
        const tokens = await GoogleCalendarOAuthService.exchangeCodeForTokens(code);
        
        console.log('✅ Calendar access tokens received');
        
        // Store tokens in localStorage
        GoogleCalendarOAuthService.storeTokens(tokens);
        console.log('✅ Tokens stored in localStorage');
        
        // Redirect back to main app
        router.push('/?calendar_connected=true');

      } catch (error) {
        console.error('❌ Error exchanging code for tokens:', error);
        router.push('/?error=exchange_error');
      }
    };

    handleOAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Connecting to Google Calendar...
        </h2>
        <p className="text-gray-600">
          Please wait while we set up your calendar access.
        </p>
      </div>
    </div>
  );
}
