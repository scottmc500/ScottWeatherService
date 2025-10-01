import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import WeatherCard from './components/WeatherCard';
import CalendarView from './components/CalendarView';
import Recommendations from './components/Recommendations';
import Login from './components/Login';
import Header from './components/Header';
import { api } from './services/api';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [weather, setWeather] = useState(null);
  const [events, setEvents] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        setIsAuthenticating(true);
        
        const userData = await api.getUser();
        if (userData) {
          setUser(userData);
          await loadUserData(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setUser(null);
        // Clear any invalid tokens
        localStorage.removeItem('auth_token');
      } finally {
        setLoading(false);
        setIsAuthenticating(false);
      }
    };

    checkAuth();

    // Cleanup on unmount
    return () => {
      api.disconnect();
    };
  }, []);

  const loadUserData = async (userData) => {
    try {
      // Load initial data for authenticated user
      const [weatherData, eventsData, recommendationsData] = await Promise.all([
        api.getCurrentWeather(userData.location || 'New York'),
        api.getEvents(new Date().toISOString(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
        api.getRecommendations()
      ]);

      setWeather(weatherData);
      setEvents(eventsData);
      setRecommendations(recommendationsData);

      // Set up real-time updates
      setupWebSocketListeners();
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load data. Please try again.');
    }
  };

  const setupWebSocketListeners = () => {
    // Weather updates
    api.onWeatherUpdate((data) => {
      setWeather(data);
    });

    // Calendar updates
    api.onCalendarUpdate((data) => {
      setEvents(data);
    });

    // Recommendation updates
    api.onRecommendationUpdate((data) => {
      setRecommendations(data);
    });
  };

  const handleLogin = async (userData) => {
    setUser(userData);
    setError(null);
    await loadUserData(userData);
  };

  const handleGenerateRecommendations = async () => {
    try {
      setLoading(true);
      const response = await api.generateRecommendations();
      setRecommendations(response);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setError('Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setUser(null);
      setWeather(null);
      setEvents([]);
      setRecommendations([]);
    } catch (error) {
      console.error('Error logging out:', error);
      // Force logout even if API call fails
      setUser(null);
      setWeather(null);
      setEvents([]);
      setRecommendations([]);
    }
  };

  // Loading state during authentication check
  if (loading && isAuthenticating) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }

  // Error state
  if (error && !user) {
    return (
      <div className="error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // Dashboard component for authenticated users
  const Dashboard = () => (
    <div className="main-content">
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      <WeatherCard weather={weather} />
      <CalendarView events={events} />
      <Recommendations recommendations={recommendations} />
    </div>
  );

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Root route - redirect based on authentication */}
          <Route path="/" element={
            user ? (
              <>
                <Header 
                  user={user} 
                  onLogout={handleLogout}
                  onGenerateRecommendations={handleGenerateRecommendations}
                />
                <Dashboard />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          {/* Login route */}
          <Route path="/login" element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          } />
          
          {/* Protected routes - require authentication */}
          <Route path="/calendar" element={
            user ? (
              <>
                <Header 
                  user={user} 
                  onLogout={handleLogout}
                  onGenerateRecommendations={handleGenerateRecommendations}
                />
                <CalendarView events={events} />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          <Route path="/recommendations" element={
            user ? (
              <>
                <Header 
                  user={user} 
                  onLogout={handleLogout}
                  onGenerateRecommendations={handleGenerateRecommendations}
                />
                <Recommendations recommendations={recommendations} />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;
