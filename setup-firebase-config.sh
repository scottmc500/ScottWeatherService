#!/bin/bash

echo "🔥 Setting up Firebase configuration..."
echo ""

# Create .env.local for frontend if it doesn't exist
if [ ! -f frontend/.env.local ]; then
  echo "Creating frontend/.env.local with placeholder Firebase configuration..."
  cat <<EOF > frontend/.env.local
# Firebase Configuration - Replace with your actual values from Firebase Console → Project Settings → General → Your apps
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Set to 'true' to use Firebase Emulators for local development, 'false' to use real Firebase services
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true

# Development mode
NODE_ENV=development
EOF
  echo "✅ frontend/.env.local created with placeholder values."
else
  echo "frontend/.env.local already exists."
fi

echo ""
echo "📋 Next steps to get your Firebase credentials:"
echo ""
echo "1. Go to Firebase Console: https://console.firebase.google.com/"
echo "2. Select your project: scott-weather-service"
echo "3. Go to Project Settings (gear icon) → General tab"
echo "4. Scroll down to 'Your apps' section"
echo "5. If you don't have a web app, click 'Add app' → Web (</>) → Register app"
echo "6. Copy the config values and replace the placeholders in frontend/.env.local"
echo ""
echo "🔧 The config object will look like this:"
echo "const firebaseConfig = {"
echo "  apiKey: \"AIza...\","
echo "  authDomain: \"scott-weather-service.firebaseapp.com\","
echo "  projectId: \"scott-weather-service\","
echo "  storageBucket: \"scott-weather-service.appspot.com\","
echo "  messagingSenderId: \"123456789\","
echo "  appId: \"1:123456789:web:abcdef\""
echo "};"
echo ""
echo "💡 After updating the file, restart your development server with 'make stop && make start-emulators'"