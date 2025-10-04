'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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
        
        // Exchange code for tokens using our API
        const response = await fetch('/api/oauth/exchange', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          throw new Error(`Token exchange failed: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success) {
          console.log('✅ Calendar access tokens received');
          
          // Store tokens in localStorage (simple approach that was working)
          localStorage.setItem('googleCalendarTokens', JSON.stringify(result.tokens));
          console.log('✅ Tokens stored in localStorage');
          
          // Redirect back to main app
          router.push('/?calendar_connected=true');
        } else {
          console.error('❌ Token exchange failed:', result.error);
          router.push('/?error=token_exchange_failed');
        }

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
