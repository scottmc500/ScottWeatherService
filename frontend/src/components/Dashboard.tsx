'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { UserProfile, AuthService } from '../services/auth';
import { ApiService, WeatherData, CalendarEvent, Recommendation } from '../services/weatherApi';
import { LogOut, User, Calendar, Cloud, Settings, Bell, MapPin, Sun, CloudRain, Wind, Droplets, Eye, CheckCircle, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'weather' | 'recommendations' | 'profile'>('overview');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState({
    weather: false,
    calendar: false,
    recommendations: false
  });

  // Load data when component mounts
  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    setLoading(prev => ({ ...prev, weather: true }));
    try {
      const weather = await ApiService.weather.getCurrentWeather();
      setWeatherData(weather);
    } catch (error) {
      console.error('Error loading weather:', error);
    } finally {
      setLoading(prev => ({ ...prev, weather: false }));
    }
  };

  const loadCalendarData = async () => {
    setLoading(prev => ({ ...prev, calendar: true }));
    try {
      const calendar = await ApiService.calendar.getCalendarEvents();
      setCalendarEvents(calendar.events);
    } catch (error) {
      console.error('Error loading calendar:', error);
    } finally {
      setLoading(prev => ({ ...prev, calendar: false }));
    }
  };

  const loadRecommendations = async () => {
    setLoading(prev => ({ ...prev, recommendations: true }));
    try {
      const recs = await ApiService.recommendations.getRecommendations();
      setRecommendations(recs.recommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(prev => ({ ...prev, recommendations: false }));
    }
  };

  // Load data when switching tabs
  const handleTabChange = (tabId: 'overview' | 'calendar' | 'weather' | 'recommendations') => {
    setActiveTab(tabId);
    
    if (tabId === 'calendar' && calendarEvents.length === 0) {
      loadCalendarData();
    } else if (tabId === 'recommendations' && recommendations.length === 0) {
      loadRecommendations();
    }
  };

  const handleLogout = async () => {
    try {
      await import('../services/auth').then(({ AuthService }) => 
        AuthService.signOut()
      );
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };


  const isProviderLinked = (provider: string) => {
    return AuthService.isProviderLinked(provider);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Cloud },
    { id: 'calendar', name: 'Calendar', icon: Calendar },
    { id: 'weather', name: 'Weather', icon: Sun },
    { id: 'recommendations', name: 'Recommendations', icon: Bell },
    { id: 'profile', name: 'Profile', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                <Cloud className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">Weather Service</h1>
                <p className="text-sm text-gray-500">Smart weather for your schedule</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Settings className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                {user.photoURL ? (
                  <Image
                    className="h-8 w-8 rounded-full ring-2 ring-white shadow-sm"
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    width={32}
                    height={32}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-500" />
                  </div>
                )}
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user.displayName || user.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user.provider}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as 'overview' | 'calendar' | 'weather' | 'recommendations')}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Welcome Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user.displayName?.split(' ')[0] || 'there'}! 👋
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Here&apos;s what&apos;s happening with your weather and schedule today.
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-1" />
                    San Francisco, CA
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">3</p>
                    <p className="text-sm text-gray-600">Events Today</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Sun className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {loading.weather ? '...' : weatherData ? `${weatherData.temperature}°F` : '--°F'}
                    </p>
                    <p className="text-sm text-gray-600">Current Temp</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CloudRain className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">10%</p>
                    <p className="text-sm text-gray-600">Rain Chance</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Bell className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">2</p>
                    <p className="text-sm text-gray-600">New Alerts</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Weather */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Weather</h3>
              {loading.weather ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading weather...</span>
                </div>
              ) : weatherData ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-6xl" role="img" aria-label={`${weatherData.condition} weather`}>
                      {weatherData.condition.toLowerCase().includes('sunny') ? '☀️' : 
                       weatherData.condition.toLowerCase().includes('cloudy') ? '☁️' :
                       weatherData.condition.toLowerCase().includes('rain') ? '🌧️' : '🌤️'}
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-900">{weatherData.temperature}°F</p>
                      <p className="text-gray-600">{weatherData.condition}</p>
                      <p className="text-sm text-gray-500">Feels like {weatherData.feelsLike}°F</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <Wind className="h-4 w-4 mr-1" />
                      {weatherData.windSpeed} mph {weatherData.windDirection}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <Droplets className="h-4 w-4 mr-1" />
                      Humidity: {weatherData.humidity}%
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Eye className="h-4 w-4 mr-1" />
                      UV Index: {weatherData.uvIndex}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Unable to load weather data
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <Calendar className="h-6 w-6 text-blue-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Sync Calendar</h4>
                  <p className="text-sm text-gray-600">Connect your calendar for weather alerts</p>
                </button>
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <Bell className="h-6 w-6 text-green-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Get Recommendations</h4>
                  <p className="text-sm text-gray-600">AI-powered weather suggestions</p>
                </button>
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <Settings className="h-6 w-6 text-purple-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Preferences</h4>
                  <p className="text-sm text-gray-600">Customize your weather experience</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Calendar Events</h3>
            {loading.calendar ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading calendar events...</span>
              </div>
            ) : calendarEvents.length > 0 ? (
              <div className="space-y-4">
                {calendarEvents.map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        {event.location && (
                          <p className="text-sm text-gray-500 mt-1 flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {event.location}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>{new Date(event.start).toLocaleDateString()}</p>
                        <p>{new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Calendar Connected</h4>
                <p className="text-gray-600 mb-4">Connect your calendar to see weather recommendations for your events.</p>
                <button 
                  onClick={loadCalendarData}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Load Calendar Events
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'weather' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weather Forecast</h3>
            <div className="text-center py-12">
              <Sun className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Weather Service Coming Soon</h4>
              <p className="text-gray-600">Detailed weather information and forecasts will be available here.</p>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h3>
            {loading.recommendations ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading recommendations...</span>
              </div>
            ) : recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div key={rec.id} className={`border-l-4 rounded-lg p-4 ${
                    rec.priority === 'high' ? 'border-red-500 bg-red-50' :
                    rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {rec.priority === 'high' ? (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        ) : rec.priority === 'medium' ? (
                          <Bell className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <h4 className="font-medium text-gray-900">{rec.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          <strong>Action:</strong> {rec.action}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {rec.type.charAt(0).toUpperCase() + rec.type.slice(1)} • {rec.priority} priority
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Smart Recommendations</h4>
                <p className="text-gray-600 mb-4">AI-powered weather suggestions for your calendar events will appear here.</p>
                <button 
                  onClick={loadRecommendations}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Recommendations
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  {user.photoURL ? (
                    <Image src={user.photoURL} alt="Profile" className="h-16 w-16 rounded-full" width={64} height={64} />
                  ) : (
                    <User className="h-8 w-8 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {user.displayName || 'User'}
                  </h2>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500">
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Authentication Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication</h3>
              
              <div className="space-y-4">
                {/* Current Provider */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Current Sign-in Method</p>
                      <p className="text-sm text-gray-600">
                        {user.provider === 'google' ? 'Google Account' : 'Microsoft Account'}
                      </p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Active
                  </div>
                </div>

                {/* Available Providers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Cloud className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Google</p>
                        <p className="text-sm text-gray-600">
                          {isProviderLinked('google.com') ? 'Connected' : 'Available'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <User className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Microsoft</p>
                        <p className="text-sm text-gray-600">
                          {isProviderLinked('microsoft.com') ? 'Connected' : 'Available'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <Cloud className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Sign-in Options</h4>
                    <p className="text-sm text-blue-700">
                      You can sign out and sign in with either Google or Microsoft. However, 
                      Firebase doesn&apos;t allow linking accounts that use the same email address with different providers.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* User Preferences */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <p className="text-sm text-gray-600">
                    {user.preferences?.timezone || 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature Units
                  </label>
                  <p className="text-sm text-gray-600">
                    {user.preferences?.units === 'metric' ? 'Celsius (°C)' : 'Fahrenheit (°F)'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notifications
                  </label>
                  <p className="text-sm text-gray-600">
                    {user.preferences?.notifications ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
