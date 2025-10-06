import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  User,
  getAdditionalUserInfo,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Simplified - using Firebase Functions for calendar access instead of direct gapi

// Initialize Google provider (Firebase Auth only - no calendar scopes)
const googleProvider = new GoogleAuthProvider();
// Note: Calendar scopes are handled separately via Google OAuth flow

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: string;
  createdAt: Date;
  lastLogin: Date;
  preferences: {
    timezone?: string;
    units?: 'metric' | 'imperial';
    notifications?: boolean;
  };
}

export class AuthService {
  // Simplified AuthService - using Firebase Functions for calendar access

  // Sign in with Google (Firebase best practice)
  static async signInWithGoogle(): Promise<UserProfile> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const additionalInfo = getAdditionalUserInfo(result);
      
      console.log('✅ Firebase Google sign-in successful:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      });
      
      // Check if this is a new user or existing user
      let userProfile: UserProfile;
      if (additionalInfo?.isNewUser) {
        // New user - save profile
        userProfile = await this.saveUserProfile(user, 'google');
        console.log('👤 New user profile created');
      } else {
        // Existing user - get existing profile
        userProfile = await this.getUserProfile(user.uid) || await this.saveUserProfile(user, 'google');
        console.log('👤 Existing user profile loaded');
      }
      
      return userProfile;
    } catch (error: unknown) {
      console.error('Google sign-in error:', error);
      
      // Handle account exists with different credential error
      if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('This email is already associated with a different account. Please try a different email address or contact support.');
      }
      
      throw error;
    }
  }

  // Connect Google Calendar access (separate from Firebase Auth)
  static async connectGoogleCalendar(): Promise<void> {
    try {
      // Get current Firebase user
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error('Must be signed in to connect Google Calendar');
      }

      // Use the existing OAuth flow from GoogleCalendarOAuthService
      const { GoogleCalendarOAuthService } = await import('./googleCalendarOAuth');
      await GoogleCalendarOAuthService.requestCalendarAccess();
      
    } catch (error) {
      console.error('❌ Error connecting Google Calendar:', error);
      throw error;
    }
  }



  // Sign out
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
      console.log('✅ User signed out');
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  }

  // Get current user
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, (user) => {
      console.log('🔥 Auth state changed:', user ? 'User logged in' : 'User logged out');
      callback(user);
    });
  }

  // Save user profile to Firestore
  static async saveUserProfile(user: User, provider: string): Promise<UserProfile> {
    const userRef = doc(db, 'users', user.uid);
    
    // Check if user already exists
    const userSnap = await getDoc(userRef);
    const now = new Date();
    
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      provider,
      createdAt: userSnap.exists() && userSnap.data().createdAt ? userSnap.data().createdAt.toDate() : now,
      lastLogin: now,
      preferences: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        units: 'imperial', // Default to imperial for US users
        notifications: true,
      },
    };
    
    console.log('💾 Saving user profile:', {
      uid: userProfile.uid,
      email: userProfile.email,
      displayName: userProfile.displayName,
      photoURL: userProfile.photoURL,
      provider: userProfile.provider
    });

    // Save to Firestore
    await setDoc(userRef, {
      ...userProfile,
      createdAt: userProfile.createdAt,
      lastLogin: userProfile.lastLogin,
    });

    return userProfile;
  }

  // Create user profile from Firebase user data (fallback method)
  static async createUserProfileFromFirebaseUser(firebaseUser: User): Promise<UserProfile | null> {
    try {
      console.log('🔧 Creating user profile from Firebase user data...');
      const userProfile = await this.saveUserProfile(firebaseUser, 'google');
      console.log('✅ User profile created successfully:', userProfile);
      return userProfile;
    } catch (error) {
      console.error('❌ Error creating user profile from Firebase user:', error);
      return null;
    }
  }


  // Get user profile from Firestore
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        console.log('📋 Retrieved user profile data:', {
          uid: data.uid,
          email: data.email,
          displayName: data.displayName,
          photoURL: data.photoURL,
          provider: data.provider
        });
        console.log('📋 Raw Firestore data:', data);
        
        const userProfile = {
          ...data,
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
          lastLogin: data.lastLogin ? data.lastLogin.toDate() : new Date(),
        } as UserProfile;
        
        console.log('📋 Processed user profile:', userProfile);
        return userProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Get linked providers for current user
  static getLinkedProviders(): string[] {
    const user = auth.currentUser;
    if (!user) return [];
    
    return user.providerData.map(provider => provider.providerId);
  }

  // Check if a specific provider is linked
  static isProviderLinked(providerId: string): boolean {
    const linkedProviders = this.getLinkedProviders();
    return linkedProviders.includes(providerId);
  }

  // Store Google Calendar OAuth tokens in Firestore
  static async storeGoogleCalendarTokens(userId: string, tokens: {
    access_token: string;
    id_token?: string;
    refresh_token?: string;
    scope: string;
  }): Promise<void> {
    try {
      // Prepare token data, excluding undefined values
      const tokenData: {
        access_token: string;
        scope: string;
        type: string;
        lastUpdated: string;
        id_token?: string;
        refresh_token?: string;
      } = {
        access_token: tokens.access_token,
        scope: tokens.scope,
        type: 'oauth_token',
        lastUpdated: new Date().toISOString()
      };

      // Only add optional fields if they exist
      if (tokens.id_token) {
        tokenData.id_token = tokens.id_token;
      }
      if (tokens.refresh_token) {
        tokenData.refresh_token = tokens.refresh_token;
      }

      await setDoc(doc(db, 'users', userId), {
        googleCalendarToken: tokenData
      }, { merge: true });
      
      console.log(`✅ Stored Google Calendar tokens for user ${userId}`);
    } catch (error) {
      console.error('Error storing Google Calendar tokens:', error);
      throw error;
    }
  }

}
