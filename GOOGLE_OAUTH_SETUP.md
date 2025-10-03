# Google OAuth Setup Guide

## Step 1: Google Cloud Console Setup

### 1.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. **Project name:** `Scott Weather Service Calendar`
4. Click "Create"

### 1.2 Enable Google Calendar API
1. Go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click "Google Calendar API" → "Enable"

### 1.3 Create OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in:
   - **App name:** `Scott Weather Service`
   - **User support email:** Your email
   - **Developer contact information:** Your email
4. Click "Save and Continue"
5. **Add scopes:** `https://www.googleapis.com/auth/calendar.readonly`
6. **Add test users:** Your email address
7. Click "Save and Continue"

### 1.4 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. **Application type:** Web application
4. **Name:** `Scott Weather Service Web Client`
5. **Authorized JavaScript origins:**
   - `http://localhost:3000`
   - `https://scott-weather-service.web.app`
6. **Authorized redirect URIs:**
   - `http://localhost:3000`
   - `https://scott-weather-service.web.app`
7. Click "Create"
8. **Copy the Client ID** - you'll need this for the next step

## Step 2: Configure Your Application

### 2.1 Add Google Client ID to Environment Variables

Create or update your `.env.local` file in the `frontend` directory:

```bash
# Add this line to your existing .env.local file
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

Replace `your_google_client_id_here` with the Client ID you copied from Google Cloud Console.

### 2.2 Install Dependencies
The Google OAuth dependencies are already added to your package.json. Run:

```bash
cd frontend
npm install
```

## Step 3: Test the Integration

### 3.1 Start Development Server
```bash
make start
```

### 3.2 Test Google Calendar Authentication
1. Go to http://localhost:3000
2. Sign in with your Firebase account
3. Go to the Calendar tab
4. Click "Connect Google Calendar"
5. Complete the Google OAuth flow
6. Click "Sync Calendar" to test real Google Calendar data

## Step 4: Deploy to Production

### 4.1 Update Production Environment
Make sure your production environment has the Google Client ID:

```bash
# In your production deployment, add:
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 4.2 Deploy
```bash
make deploy
```

## Troubleshooting

### Common Issues:

1. **"Failed to initialize Google Auth"**
   - Check that `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set correctly
   - Verify the Client ID in Google Cloud Console

2. **"Origin not allowed"**
   - Make sure your domain is added to "Authorized JavaScript origins" in Google Cloud Console

3. **"Scope not authorized"**
   - Check that the Calendar API scope is added to your OAuth consent screen

4. **"User did not grant permission"**
   - Make sure the user completes the OAuth flow and grants calendar access

### Testing with Real Data:

Once OAuth is set up, your app will fetch real Google Calendar events instead of mock data. The events will be:
- Fetched from the user's primary Google Calendar
- Limited to the next 7 days
- Stored securely in Firestore
- Used for personalized weather recommendations

## Security Notes:

- Google OAuth tokens are stored securely in Firestore
- Only calendar read access is requested
- Tokens are automatically refreshed by Google
- User data is only used for weather recommendations
