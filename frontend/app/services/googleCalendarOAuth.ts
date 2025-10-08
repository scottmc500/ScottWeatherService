'use client';

export class GoogleCalendarOAuthService {
  private static readonly CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  
  private static getRedirectUri(): string {
    if (typeof window === 'undefined') {
      return 'http://localhost:3000/auth/callback/'; // fallback for SSR
    }
    return `${window.location.origin}/auth/callback/`;
  }

  // Removed direct HTTP calls - using Firebase Functions SDK instead

  /**
   * Simple OAuth flow - just redirect to Google
   */
  static requestCalendarAccess(): void {
    if (typeof window === 'undefined') {
      console.error('Cannot request calendar access on server side');
      return;
    }

    console.log('🚀 Starting simple Google OAuth flow...');
    
    const redirectUri = this.getRedirectUri();
    console.log('📍 Redirect URI:', redirectUri);
    console.log('📍 Current origin:', window.location.origin);
    console.log('📍 Client ID:', this.CLIENT_ID ? `${this.CLIENT_ID.substring(0, 20)}...` : 'NOT SET');
    
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      redirect_uri: redirectUri,
      scope: 'https://www.googleapis.com/auth/calendar.readonly',
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    
    console.log('🔗 Full OAuth URL:', authUrl);
    window.location.href = authUrl;
  }

  /**
   * Check if user has calendar access
   */
  static hasCalendarAccess(): boolean {
    if (typeof window === 'undefined') {
      return false; // No access on server side
    }

    // Check localStorage for stored tokens
    const storedTokens = localStorage.getItem('googleCalendarTokens');
    if (!storedTokens) {
      return false;
    }
    
    try {
      const tokens = JSON.parse(storedTokens);
      return !!(tokens.access_token);
    } catch (error) {
      console.error('Error checking calendar access:', error);
      return false;
    }
  }

  /**
   * Get stored tokens
   */
  static getStoredTokens(): { access_token: string; refresh_token?: string } | null {
    if (typeof window === 'undefined') {
      return null; // No access on server side
    }

    const storedTokens = localStorage.getItem('googleCalendarTokens');
    if (!storedTokens) {
      return null;
    }
    
    try {
      return JSON.parse(storedTokens);
    } catch (error) {
      console.error('Error parsing stored tokens:', error);
      return null;
    }
  }

  /**
   * Store tokens
   */
  static storeTokens(tokens: { access_token: string; refresh_token?: string }): void {
    if (typeof window === 'undefined') {
      console.error('Cannot store tokens on server side');
      return;
    }

    localStorage.setItem('googleCalendarTokens', JSON.stringify(tokens));
    console.log('✅ Calendar tokens stored');
  }

  /**
   * Clear stored tokens
   */
  static clearTokens(): void {
    if (typeof window === 'undefined') {
      console.error('Cannot clear tokens on server side');
      return;
    }

    localStorage.removeItem('googleCalendarTokens');
    console.log('🗑️ Calendar tokens cleared');
  }

  /**
   * Exchange OAuth code for tokens using Firebase Functions
   */
  static async exchangeCodeForTokens(code: string): Promise<{ access_token: string; refresh_token?: string }> {
    try {
      // Use Firebase Functions SDK instead of direct HTTP calls
      const { functions } = await import('@/lib/firebase');
      const { httpsCallable } = await import('firebase/functions');
      
      const oauthExchange = httpsCallable(functions, 'oauthExchange');
      const result = await oauthExchange({ code });
      
      const data = result.data as { 
        success: boolean; 
        tokens: { 
          access_token: string; 
          refresh_token?: string; 
          scope?: string; 
          token_type?: string; 
          expiry_date?: number; 
        }; 
        error?: string; 
      };
      
      if (!data.success) {
        throw new Error(data.error || 'Token exchange failed');
      }

      // Store tokens in both localStorage and Firestore
      const tokens = data.tokens;
      this.storeTokens(tokens);
      
      // Also store in Firestore if user is authenticated
      const { auth } = await import('@/lib/firebase');
      const { AuthService } = await import('./auth');
      
      if (auth.currentUser) {
        try {
          await AuthService.storeGoogleCalendarTokens(auth.currentUser.uid, {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            scope: tokens.scope || 'https://www.googleapis.com/auth/calendar.readonly',
          });
          console.log('✅ Tokens synced to Firestore');
        } catch (error) {
          console.warn('⚠️ Failed to sync tokens to Firestore:', error);
          // Don't throw - localStorage storage is sufficient for now
        }
      }

      return tokens;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  }
}

