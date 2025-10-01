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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load user profile
        const userData = await api.getUser();
        setUser(userData);

        if (userData) {
          // Load initial data
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
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Cleanup on unmount
    return () => {
      api.disconnect();
    };
  }, []);

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
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <Router>
      <div className="app">
        <Header 
          user={user} 
          onLogout={handleLogout}
          onGenerateRecommendations={handleGenerateRecommendations}
        />
        
        <Routes>
          <Route path="/" element={
            <div className="main-content">
              <WeatherCard weather={weather} />
              <CalendarView events={events} />
              <Recommendations recommendations={recommendations} />
            </div>
          } />
          <Route path="/calendar" element={<CalendarView events={events} />} />
          <Route path="/recommendations" element={<Recommendations recommendations={recommendations} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;
