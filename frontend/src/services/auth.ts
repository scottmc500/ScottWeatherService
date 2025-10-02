import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  User,
  getAdditionalUserInfo,
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Initialize providers
const googleProvider = new GoogleAuthProvider();
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

  // Sign in with Google
  static async signInWithGoogle(): Promise<UserProfile> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const additionalInfo = getAdditionalUserInfo(result);
      
      // Check if this is a new user or existing user
      if (additionalInfo?.isNewUser) {
        // New user - save profile
        const userProfile = await this.saveUserProfile(user, 'google');
        return userProfile;
      } else {
        // Existing user - get existing profile
        const userProfile = await this.getUserProfile(user.uid);
        return userProfile || await this.saveUserProfile(user, 'google');
      }
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
  private static async saveUserProfile(user: User, provider: string): Promise<UserProfile> {
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
      createdAt: userSnap.exists() ? userSnap.data().createdAt.toDate() : now,
      lastLogin: now,
      preferences: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        units: 'imperial', // Default to imperial for US users
        notifications: true,
      },
    };

    // Save to Firestore
    await setDoc(userRef, {
      ...userProfile,
      createdAt: userProfile.createdAt,
      lastLogin: userProfile.lastLogin,
    });

    return userProfile;
  }

  // Get user profile from Firestore
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          ...data,
          createdAt: data.createdAt.toDate(),
          lastLogin: data.lastLogin.toDate(),
        } as UserProfile;
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

}
