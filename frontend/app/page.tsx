'use client';

import { useState, useEffect } from 'react';
import { AuthService, UserProfile } from '../src/services/auth';
import LoginForm from '../src/components/LoginForm';
import Dashboard from '../src/components/Dashboard';

export default function HomePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes (works in both dev and production)
    const unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser) => {
      console.log('🔥 Auth state changed in page:', firebaseUser ? 'User logged in' : 'User logged out');
      
      if (firebaseUser) {
        try {
          // Get user profile from Firestore
          const userProfile = await AuthService.getUserProfile(firebaseUser.uid);
          console.log('✅ User profile loaded:', userProfile);
          setUser(userProfile);
        } catch (error) {
          console.error('Error loading user profile:', error);
          setUser(null);
        }
      } else {
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
