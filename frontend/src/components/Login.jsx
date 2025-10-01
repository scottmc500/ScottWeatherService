import React from 'react';
import { Calendar, Mail } from 'lucide-react';
import { api } from '../services/api';

const Login = ({ onLogin }) => {
  const handleGoogleLogin = async () => {
    try {
      const response = await api.loginWithGoogle();
      if (response.success) {
        onLogin(response.user);
      }
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      const response = await api.loginWithMicrosoft();
      if (response.success) {
        onLogin(response.user);
      }
    } catch (error) {
      console.error('Microsoft login failed:', error);
    }
  };

  return (
    <div className="login">
      <h1>Welcome to Weather Service</h1>
      <p>
        Get personalized weather recommendations for your calendar events. 
        Connect your calendar to start receiving intelligent weather advice.
      </p>
      <div className="login-buttons">
        <button className="google-btn" onClick={handleGoogleLogin}>
          <Calendar size={20} />
          Connect Google Calendar
        </button>
        <button className="microsoft-btn" onClick={handleMicrosoftLogin}>
          <Mail size={20} />
          Connect Outlook Calendar
        </button>
      </div>
    </div>
  );
};

export default Login;
