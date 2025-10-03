import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Dynamic redirect URI based on environment
const getRedirectUri = (request?: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    // In development, use the origin from the request to handle dynamic ports
    if (request) {
      const origin = request.headers.get('origin') || request.headers.get('host');
      if (origin) {
        return `http://${origin}/auth/callback/`;
      }
    }
    return 'http://localhost:3000/auth/callback/';
  }
  // For production, use the deployed URL
  return 'https://scott-weather-service.web.app/auth/callback/';
};

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json({ success: false, error: 'Authorization code required' }, { status: 400 });
    }

    // Create OAuth client with request-specific redirect URI
    const redirectUri = getRedirectUri(request);
    console.log('🔍 OAuth exchange using redirect URI:', redirectUri);
    console.log('🔍 Request origin:', request.headers.get('origin'));
    console.log('🔍 Request host:', request.headers.get('host'));
    
    const oAuth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    // Exchange code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    
    if (!tokens.access_token) {
      return NextResponse.json({ success: false, error: 'No access token received' }, { status: 400 });
    }

    // Return the tokens - frontend will store them
    return NextResponse.json({ 
      success: true, 
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date
      }
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
