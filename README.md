# 🌤️ Scott Weather Service

A smart weather application that provides personalized recommendations based on your calendar events and weather conditions.

## 🚀 Features

- **Real-time Weather Data** - Current conditions and forecasts
- **Calendar Integration** - Google Calendar and Microsoft Outlook
- **AI Recommendations** - Smart suggestions for your schedule
- **Authentication** - Secure login with Google and Microsoft
- **Responsive Design** - Modern UI with Tailwind CSS

## 🏗️ Architecture

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Firebase Functions with Node.js 22
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth with Google/Microsoft OAuth
- **Hosting**: Firebase App Hosting
- **Deployment**: Automated with Firebase CLI

## 🛠️ Development Setup

### Prerequisites
- Node.js 20+ 
- Firebase CLI
- Git

### Installation

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd ScottWeatherService
   make install
   ```

2. **Setup Firebase Configuration**
   ```bash
   make setup-firebase
   # Edit frontend/.env.local with your Firebase credentials
   ```

3. **Start Development Environment**
   ```bash
   # Option 1: Real Firebase (requires API keys)
   make start
   
   # Option 2: Firebase Emulators (for testing)
   make start-emulators
   ```

### Available URLs
- **App**: http://localhost:3000
- **Firebase UI**: http://localhost:4000 (emulators only)

## 📋 Available Commands

### Development
```bash
make start              # Start with real Firebase
make start-emulators    # Start with Firebase emulators
make stop               # Stop all services
make status             # Check running services
```

### Building & Deployment
```bash
make build              # Build frontend
make build-all          # Build everything
make deploy             # Deploy to Firebase
make deploy-apphosting  # Deploy frontend only
```

### Utilities
```bash
make clean              # Clean build artifacts
make logs               # View all logs
make project-status     # Check configuration
```

## 🔧 Configuration

### Environment Variables
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
```

### Firebase Setup
1. Create Firebase project
2. Enable Authentication (Google, Microsoft)
3. Create Firestore database
4. Enable App Hosting
5. Get API keys from Project Settings

## 🌐 Live URLs

- **Frontend**: https://scott-weather-service-frontend--scott-weather-service.us-central1.hosted.app
- **Weather API**: https://weatherapi-ghn73zr3gq-uc.a.run.app
- **Calendar API**: https://calendarapi-ghn73zr3gq-uc.a.run.app
- **Recommendations API**: https://recommendationsapi-ghn73zr3gq-uc.a.run.app

## 📁 Project Structure

```
ScottWeatherService/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # Next.js app router
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   └── lib/            # Utilities
│   └── package.json
├── functions/               # Firebase Functions
│   ├── src/
│   │   └── index.ts        # API endpoints
│   └── package.json
├── firebase.json           # Firebase configuration
├── firestore.rules         # Database security rules
└── Makefile               # Development commands
```

## 🔐 API Endpoints

### Weather API
- `GET /current?location=city` - Current weather
- `GET /forecast?location=city&date=YYYY-MM-DD` - Weather forecast

### Calendar API  
- `GET /events` - User's calendar events (requires auth)

### Recommendations API
- `GET /` - AI-powered recommendations (requires auth)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
