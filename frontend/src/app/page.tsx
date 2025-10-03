'use client';

import { useState, useEffect } from 'react';
import { AuthService, UserProfile } from '../services/auth';
import LoginForm from '../components/LoginForm';
import Dashboard from '../components/Dashboard';

export default function HomePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for OAuth callback success
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('calendar_connected') === 'true') {
      console.log('✅ Calendar connected successfully!');
      // Remove the query parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check current auth state immediately
    console.log('🔍 Checking current auth state...');
    const currentUser = AuthService.getCurrentUser();
    console.log('🔍 Current user:', currentUser);
    
    // Listen for authentication state changes (works in both dev and production)
    const unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser) => {
      console.log('🔥 Auth state changed in page:', firebaseUser ? 'User logged in' : 'User logged out');
      console.log('🔥 Firebase user object:', firebaseUser);
      
      if (firebaseUser) {
        console.log('🔥 Firebase user data:', {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        });
        
        try {
          // Get user profile from Firestore
          const userProfile = await AuthService.getUserProfile(firebaseUser.uid);
          console.log('✅ User profile loaded from Firestore:', userProfile);
          
          if (userProfile) {
            console.log('🔍 Checking profile data completeness:', {
              hasDisplayName: !!userProfile.displayName,
              displayName: userProfile.displayName,
              hasPhotoURL: !!userProfile.photoURL,
              photoURL: userProfile.photoURL,
              isDisplayNameUser: userProfile.displayName === 'User'
            });
            
            // Use the existing profile data
            console.log('✅ User profile loaded from Firestore');
            setUser(userProfile);
          } else {
            console.log('⚠️ No user profile found in Firestore, creating one now...');
            // Create user profile from Firebase user data
            const newUserProfile = await AuthService.createUserProfileFromFirebaseUser(firebaseUser);
            if (newUserProfile) {
              console.log('✅ Created new user profile');
              setUser(newUserProfile);
            } else {
              console.log('❌ Failed to create user profile');
              setUser(null);
            }
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          setUser(null);
        }
      } else {
        console.log('🔥 No Firebase user, setting user to null');
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (userProfile: UserProfile) => {
    setUser(userProfile);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Weather Service...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}
