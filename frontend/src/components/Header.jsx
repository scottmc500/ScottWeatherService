import React from 'react';
import { User } from 'lucide-react';

const Header = ({ user, onLogout, onGenerateRecommendations }) => {
  return (
    <header className="header">
      <h1>Weather Service</h1>
      <div className="header-actions">
        <div className="user-info">
          <div className="user-avatar">
            <User size={16} />
          </div>
          <span className="user-name">{user?.name || 'User'}</span>
        </div>
        <button 
          className="btn btn-primary"
          onClick={onGenerateRecommendations}
        >
          Generate Recommendations
        </button>
        <button 
          className="btn btn-secondary"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
