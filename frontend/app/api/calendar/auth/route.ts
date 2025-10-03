import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin SDK (only if credentials are available)
if (!getApps().length && process.env.FIREBASE_PRIVATE_KEY) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.warn('Firebase Admin SDK initialization failed:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Calendar auth API called');
    
    // Check if Firebase Admin SDK is available
    if (!process.env.FIREBASE_PRIVATE_KEY) {
      console.log('❌ Firebase Admin SDK not configured - missing FIREBASE_PRIVATE_KEY');
      return NextResponse.json({ 
        success: false,
        error: 'Firebase Admin SDK not configured' 
      }, { status: 503 });
    }

    // Get the Firebase ID token from the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No Firebase token provided in Authorization header');
      return NextResponse.json({ error: 'No Firebase token provided' }, { status: 401 });
    }

    const idToken = authHeader.replace('Bearer ', '');
    console.log('🔑 Firebase token received, verifying...');
    
    // Verify the Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const userId = decodedToken.uid;
    console.log('✅ Firebase token verified for user:', userId);
    
    // Get the request body
    const body = await request.json();
    
    if (!body.googleToken) {
      return NextResponse.json({ 
        success: false, 
        error: "Google OAuth token required" 
      }, { status: 400 });
    }
    
    console.log(`Received Google token for user ${userId}:`, {
      hasAccessToken: !!body.googleToken.access_token,
      hasRefreshToken: !!body.googleToken.refresh_token,
      scope: body.googleToken.scope,
      tokenType: typeof body.googleToken
    });
    
    // Store Google Calendar token in Firestore
    const db = getFirestore();
    await db.collection("users").doc(userId).set({
      googleCalendarToken: {
        access_token: body.googleToken.access_token,
        refresh_token: body.googleToken.refresh_token,
        scope: body.googleToken.scope,
        type: "oauth_token",
        lastUpdated: new Date().toISOString()
      }
    }, { merge: true });
    
    console.log(`Stored OAuth token for user ${userId}`);
    
    return NextResponse.json({
      success: true,
      message: "Google Calendar OAuth token stored successfully"
    });
    
  } catch (error) {
    console.error("Calendar auth error:", error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get the Firebase ID token from the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No Firebase token provided' }, { status: 401 });
    }

    const idToken = authHeader.replace('Bearer ', '');
    
    // Verify the Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    // Remove Google Calendar token from Firestore
    const db = getFirestore();
    await db.collection("users").doc(userId).update({
      googleCalendarToken: null
    });
    
    console.log(`Cleared OAuth token for user ${userId}`);
    
    return NextResponse.json({
      success: true,
      message: "Google Calendar OAuth token cleared successfully"
    });
    
  } catch (error) {
    console.error("Calendar auth clear error:", error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
