// MongoDB initialization script for Docker Compose
// This script sets up the initial database and user for the weather service

// Switch to the weather-service database
db = db.getSiblingDB('weather-service');

// Create a user for the application
db.createUser({
  user: 'weather-service-user',
  pwd: 'weather-service-password',
  roles: [
    {
      role: 'readWrite',
      db: 'weather-service'
    }
  ]
});

// Create initial collections with indexes
db.createCollection('users');
db.createCollection('events');
db.createCollection('recommendations');
db.createCollection('notifications');
db.createCollection('weather_data');
db.createCollection('calendar_sync_status');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "google_id": 1 });
db.users.createIndex({ "microsoft_id": 1 });

db.events.createIndex({ "user_id": 1 });
db.events.createIndex({ "start_time": 1 });
db.events.createIndex({ "end_time": 1 });
db.events.createIndex({ "location": "2dsphere" });

db.recommendations.createIndex({ "user_id": 1 });
db.recommendations.createIndex({ "event_id": 1 });
db.recommendations.createIndex({ "created_at": 1 });

db.notifications.createIndex({ "user_id": 1 });
db.notifications.createIndex({ "created_at": 1 });
db.notifications.createIndex({ "read": 1 });

db.weather_data.createIndex({ "location": "2dsphere" });
db.weather_data.createIndex({ "timestamp": 1 });
db.weather_data.createIndex({ "expires_at": 1 }, { expireAfterSeconds: 0 });

db.calendar_sync_status.createIndex({ "user_id": 1 });
db.calendar_sync_status.createIndex({ "provider": 1 });
db.calendar_sync_status.createIndex({ "last_sync": 1 });

// Insert some sample data for development
db.users.insertOne({
  _id: ObjectId(),
  email: "test@weatherservice.com",
  name: "Test User",
  google_id: "test-google-id",
  microsoft_id: "test-microsoft-id",
  location: {
    type: "Point",
    coordinates: [-74.006, 40.7128] // New York City
  },
  preferences: {
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    pressure_unit: "hPa",
    notifications_enabled: true,
    email_notifications: false,
    push_notifications: true
  },
  created_at: new Date(),
  updated_at: new Date()
});

db.events.insertOne({
  _id: ObjectId(),
  user_id: ObjectId(),
  title: "Morning Run",
  description: "Daily morning run in Central Park",
  start_time: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  end_time: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Tomorrow + 1 hour
  location: {
    type: "Point",
    coordinates: [-73.9654, 40.7829]
  },
  provider: "google",
  provider_id: "test-event-id",
  weather_data: {
    temperature: 72,
    condition: "clear",
    humidity: 65,
    wind_speed: 5,
    uv_index: 6
  },
  created_at: new Date(),
  updated_at: new Date()
});

db.recommendations.insertOne({
  _id: ObjectId(),
  user_id: ObjectId(),
  event_id: ObjectId(),
  title: "Perfect Running Weather",
  description: "Great conditions for your morning run! Clear skies and comfortable temperature.",
  type: "outdoor",
  confidence: 0.95,
  reasoning: "Current weather conditions are ideal for outdoor exercise with clear skies and moderate temperature.",
  actions: [
    "Wear light, breathable clothing",
    "Apply sunscreen (UV index is 6)",
    "Bring water for hydration"
  ],
  created_at: new Date(),
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
});

print("Weather Service database initialized successfully!");
print("Collections created: users, events, recommendations, notifications, weather_data, calendar_sync_status");
print("Indexes created for optimal performance");
print("Sample data inserted for development");
