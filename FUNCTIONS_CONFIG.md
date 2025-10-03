# Firebase Functions Configuration

## Environment Variables Required

You'll need to set up the following environment variables for your Firebase Functions:

### 1. Weather API Key
```bash
WEATHER_API_KEY=your_openweathermap_api_key_here
```

**How to get it:**
1. Go to https://openweathermap.org/api
2. Sign up for a free account
3. Generate an API key
4. Set it in Firebase Functions environment variables

### 2. Setting Environment Variables in Firebase

#### Option 1: Using Firebase CLI
```bash
# Set the weather API key
firebase functions:config:set weather.api_key="your_api_key_here"

# Set Google OAuth credentials (if needed)
firebase functions:config:set google.client_id="your_client_id"
firebase functions:config:set google.client_secret="your_client_secret"
```

#### Option 2: Using Firebase Console
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click on "Functions" tab
3. Add environment variables there

## Functions Created

### 1. `getCalendarEvents`
- **Purpose**: Retrieves events from Google Calendar
- **Input**: 
  - `accessToken`: Google OAuth access token
  - `calendarId` (optional): Calendar ID (defaults to "primary")
  - `timeMin` (optional): Start time filter
  - `timeMax` (optional): End time filter
  - `maxResults` (optional): Maximum number of events (default: 10)
- **Output**: Array of calendar events with formatted data

### 2. `getWeatherData`
- **Purpose**: Retrieves weather data based on location
- **Input**:
  - `latitude`: Latitude coordinate
  - `longitude`: Longitude coordinate
  - `units` (optional): "metric" or "imperial" (default: "metric")
- **Output**: Weather data including temperature, condition, humidity, wind speed

### 3. `healthCheck`
- **Purpose**: Health check endpoint for monitoring
- **Output**: Status and available functions list

## Testing Locally

```bash
# Install dependencies
cd functions
npm install

# Start local emulator
npm run serve

# Test functions
curl http://localhost:5001/scott-weather-service/us-central1/healthCheck
```

## Deployment

```bash
# Deploy functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:getCalendarEvents
firebase deploy --only functions:getWeatherData
```

## Usage Examples

### Frontend Integration

```javascript
// Call calendar function
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const getCalendarEvents = httpsCallable(functions, 'getCalendarEvents');

const result = await getCalendarEvents({
  accessToken: userAccessToken,
  maxResults: 20
});

// Call weather function
const getWeatherData = httpsCallable(functions, 'getWeatherData');

const weatherResult = await getWeatherData({
  latitude: 37.7749,
  longitude: -122.4194,
  units: 'metric'
});
```
