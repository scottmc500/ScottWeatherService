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

export async function GET(request: NextRequest) {
  try {
    // Check if Firebase Admin SDK is available
    if (!process.env.FIREBASE_PRIVATE_KEY) {
      return NextResponse.json({ hasAccess: false }, { status: 503 });
    }

    // Get the Firebase ID token from the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ hasAccess: false }, { status: 401 });
    }

    const idToken = authHeader.replace('Bearer ', '');
    
    // Verify the Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    // Check Firestore for stored tokens
    const db = getFirestore();
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ hasAccess: false });
    }
    
    const userData = userDoc.data();
    const hasAccess = !!(userData?.googleCalendarToken?.access_token);
    
    return NextResponse.json({ hasAccess });
    
  } catch (error) {
    console.error("Calendar status check error:", error);
    return NextResponse.json({ hasAccess: false }, { status: 500 });
  }
}
