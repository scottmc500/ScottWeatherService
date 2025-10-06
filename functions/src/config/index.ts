// Configuration and secrets management

import {defineSecret} from "firebase-functions/params";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";

// Define secrets
export const weatherApiKey = defineSecret("weather_api_key");
export const googleClientId = defineSecret("google_client_id");
export const googleClientSecret = defineSecret("google_client_secret");

// Initialize Firebase Admin
initializeApp();
export const db = getFirestore();
export const auth = getAuth();

// Cache configuration
export const CACHE_TTL = {
  CURRENT_WEATHER: 1 * 60 * 1000, // 1 minute (temporarily reduced)
  FORECAST: 1 * 60 * 1000, // 1 minute (temporarily reduced)
  LOCATION: 60 * 60 * 1000, // 1 hour (location rarely changes)
  FIRESTORE_CACHE: 30 * 60 * 1000, // 30 minutes
};
