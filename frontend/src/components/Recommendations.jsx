import React from 'react';
import { format, parseISO } from 'date-fns';

const Recommendations = ({ recommendations }) => {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="recommendations">
        <h2>AI Recommendations</h2>
        <div className="no-recommendations">
          <p>No recommendations available</p>
          <p>Generate recommendations to get personalized weather advice for your events.</p>
        </div>
      </div>
    );
  }

  const formatEventTime = (startTime) => {
    const start = parseISO(startTime);
    return format(start, 'MMM d, h:mm a');
  };

  const getRecommendationIcon = (type) => {
    const icons = {
      'outdoor': '🌤️',
      'indoor': '🏠',
      'travel': '✈️',
      'safety': '⚠️',
      'clothing': '👕',
      'activity': '🏃',
      'general': '💡'
    };
    
    return icons[type] || '💡';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#10b981'; // green
    if (confidence >= 0.6) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className="recommendations">
      <h2>AI Recommendations</h2>
      <div className="recommendations-list">
        {recommendations.map((rec, index) => (
          <div key={index} className="recommendation-card">
            <h3>
              {getRecommendationIcon(rec.type)} {rec.title}
            </h3>
            <p>{rec.description}</p>
            {rec.event_title && (
              <div className="recommendation-event">
                <strong>For:</strong> {rec.event_title}
                <br />
                <strong>When:</strong> {formatEventTime(rec.event_start_time)}
              </div>
            )}
            {rec.reasoning && (
              <div className="recommendation-reasoning">
                <strong>Why:</strong> {rec.reasoning}
              </div>
            )}
            <div className="confidence">
              Confidence: {Math.round(rec.confidence * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommendations;
