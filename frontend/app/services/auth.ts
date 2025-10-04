import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  User,
  getAdditionalUserInfo,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Initialize providers (Firebase Auth only - no calendar scopes)
const googleProvider = new GoogleAuthProvider();
// Note: Calendar scopes are handled separately via Google OAuth flow

const microsoftProvider = new OAuthProvider('microsoft.com');

// Configure Microsoft provider
microsoftProvider.addScope('https://graph.microsoft.com/Calendars.Read');
microsoftProvider.addScope('https://graph.microsoft.com/User.Read');

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
      
      // Firebase Auth is for authentication only - calendar tokens handled separately
      console.log('✅ Firebase Auth completed - user authenticated');
      
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

      // Profile data comes from Firebase Auth - no additional API calls needed
      console.log('👤 User profile ready with Firebase Auth data');
      
      return userProfile;
    } catch (error: unknown) {
      console.error('Google sign-in error:', error);
      
      // Handle account exists with different credential error
      if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('This email is already associated with a Microsoft account. Please sign in with Microsoft instead. Account linking with the same email address is not supported by Firebase.');
      }
      
      throw error;
    }
  }

  // Sign in with Microsoft
  static async signInWithMicrosoft(): Promise<UserProfile> {
    try {
      const result = await signInWithPopup(auth, microsoftProvider);
      const user = result.user;
      const additionalInfo = getAdditionalUserInfo(result);
      
      // Check if this is a new user or existing user
      if (additionalInfo?.isNewUser) {
        // New user - save profile
        const userProfile = await this.saveUserProfile(user, 'microsoft');
        return userProfile;
      } else {
        // Existing user - get existing profile
        const userProfile = await this.getUserProfile(user.uid);
        return userProfile || await this.saveUserProfile(user, 'microsoft');
      }
    } catch (error: unknown) {
      console.error('Microsoft sign-in error:', error);
      
      // Handle account exists with different credential error
      if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('This email is already associated with a Google account. Please sign in with Google instead. Account linking with the same email address is not supported by Firebase.');
      }
      
      throw error;
    }
  }


  // Sign out
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
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
      
      console.log(`Stored Google Calendar tokens for user ${userId}`);
    } catch (error) {
      console.error('Error storing Google Calendar tokens:', error);
    }
  }

}
