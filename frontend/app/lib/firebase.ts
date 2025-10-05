import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.warn('⚠️ Missing Firebase environment variables:', missingEnvVars);
  console.warn('⚠️ Please create frontend/.env.local with your Firebase credentials');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Functions
export const functions = getFunctions(app);

// Connect to emulators in development
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
  // Only connect to Auth emulator if specifically enabled
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_AUTH_EMULATOR === 'true') {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099');
      console.log('🔥 Connected to Auth emulator');
    } catch (error) {
      console.log('🔥 Auth emulator already connected or unavailable:', error instanceof Error ? error.message : 'Unknown error');
    }
  } else {
    console.log('🔥 Using production Firebase Auth (emulator disabled)');
  }
  
  // Connect to Firestore emulator
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('🔥 Connected to Firestore emulator');
  } catch (error) {
    console.log('🔥 Firestore emulator already connected or unavailable:', error instanceof Error ? error.message : 'Unknown error');
  }
  
  // Connect to Functions emulator
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('🔥 Connected to Functions emulator');
  } catch (error) {
    console.log('🔥 Functions emulator already connected or unavailable:', error instanceof Error ? error.message : 'Unknown error');
  }
}

export default app;
