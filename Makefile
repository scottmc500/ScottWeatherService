# Scott Weather Service - Firebase + Next.js
# Development and deployment commands

.PHONY: help start start-emulators stop logs status build deploy clean install

# Default target
help: ## Show this help message
	@echo "Scott Weather Service - Available Commands:"
	@echo ""
	@echo "🚀 DEVELOPMENT:"
	@echo "  make start           - Build development static content and start emulators"
	@echo "  make start-prod      - Build production static content (no emulators)"
	@echo "  make start-emulators - Start development mode with Firebase emulators"
	@echo "  make stop            - Stop all services and clean up"
	@echo ""
	@echo "🏭 PRODUCTION:"
	@echo "  make build           - Build frontend for production"
	@echo "  make deploy          - Deploy everything to Firebase"
	@echo "  make deploy-apphosting - Deploy frontend to App Hosting only"
	@echo ""
	@echo "🔧 UTILITIES:"
	@echo "  make logs            - View all logs"
	@echo "  make status          - Show service status"
	@echo "  make clean           - Clean build artifacts"
	@echo "  make install         - Install dependencies"
	@echo ""

# START DEVELOPMENT MODE
start: ## Start development mode with Next.js dev server and emulators
	@echo "🚀 Starting development mode..."
	@echo "🔥 Starting Firebase emulators in background..."
	@nohup firebase emulators:start --only firestore > firebase-emulators.log 2>&1 &
	@sleep 3
	@echo "⚡ Starting Next.js development server..."
	@nohup npm run dev --prefix frontend > nextjs-dev.log 2>&1 &
	@echo "🌐 Your app will be available at: http://localhost:3000"
	@echo "🔥 Firebase UI will be available at: http://localhost:4000"
	@echo "📝 Emulator logs: firebase-emulators.log"
	@echo "📝 Next.js logs: nextjs-dev.log"
	@echo "💡 Use 'make stop' to stop everything"
	@echo ""
	@echo "✅ Development mode started!"

stop: ## Stop all services (emulators + Next.js dev server) and clean up
	@echo "🛑 Stopping all services..."
	@pkill -f "firebase emulators:start" && echo "Firebase emulators stopped" || echo "No Firebase emulators running"
	@pkill -f "next dev" && echo "Next.js dev server stopped" || echo "No Next.js dev server running"
	@echo "🧹 Cleaning up build artifacts..."
	@rm -rf frontend/.next frontend/out frontend/dist
	@echo "🗑️  Cleaning Firebase emulator data..."
	@rm -rf .firebase
	@echo "📝 Cleaning up log files..."
	@find . -name "*.log" -type f -delete 2>/dev/null || true
	@echo "🗂️  Cleaning up temporary files..."
	@find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true
	@find . -name "*.cache" -type f -delete 2>/dev/null || true
	@find . -name ".DS_Store" -type f -delete 2>/dev/null || true
	@find . -name "*.swp" -type f -delete 2>/dev/null || true
	@find . -name "*.swo" -type f -delete 2>/dev/null || true
	@find . -name "*.pid" -type f -delete 2>/dev/null || true
	@find . -name "*.lock" -type f -delete 2>/dev/null || true
	@echo "✅ Cleanup complete!"

logs: ## View all logs (both Firebase and Next.js)
	@echo "📝 All service logs (Ctrl+C to exit):"
	@if [ -f firebase-emulators.log ]; then echo "🔥 Firebase Emulator logs:"; tail -f firebase-emulators.log & fi
	@if [ -f nextjs-dev.log ]; then echo "⚡ Next.js logs:"; tail -f nextjs-dev.log & fi
	@wait

status: ## Show what services are currently running
	@echo "📊 Service Status:"
	@echo "Firebase Emulators: $$(if pgrep -f 'firebase emulators:start' > /dev/null; then echo '✅ Running (port 4000)'; else echo '❌ Not running'; fi)"
	@echo "Next.js Dev Server: $$(if pgrep -f 'next dev' > /dev/null; then echo '✅ Running (port 3000)'; else echo '❌ Not running'; fi)"
	@echo "Static Server: $$(if pgrep -f 'serve frontend/out' > /dev/null; then echo '✅ Running (port 3000)'; else echo '❌ Not running'; fi)"
	@echo ""
	@echo "🌐 Available URLs:"
	@echo "  Application UI: http://localhost:3000"
	@echo "  Firebase UI: http://localhost:4000"

# Installation Commands
install: ## Install all dependencies
	@echo "📦 Installing dependencies..."
	@npm install --prefix frontend

# Build Commands
build: ## Build frontend for production
	@echo "🔨 Building frontend for production..."
	@NODE_ENV=production npm run build --prefix frontend

# Deployment Commands
deploy: ## Deploy everything to Firebase
	@echo "🚀 Deploying to Firebase..."
	@echo "🔍 Checking Node.js version..."
	@node --version
	@echo "🔨 Building frontend for production..."
	@npm run build --prefix frontend
	@echo "✅ Frontend built successfully"
	@echo "🔨 Deploying frontend to Firebase..."    
	@firebase deploy
	@echo "✅ Firebase deployment complete"

# Project Status
project-status: ## Show project configuration status
	@echo "📊 Project Configuration:"
	@echo "Frontend: $$(if [ -d frontend/node_modules ]; then echo "✅ Dependencies installed"; else echo "❌ Dependencies missing"; fi)"
	@echo "Firebase Config: $$(if [ -f firebase.json ]; then echo "✅ Configured"; else echo "❌ Missing"; fi)"
	@echo "Environment: $$(if [ -f frontend/.env.local ]; then echo "✅ Configured"; else echo "❌ Missing (copy from env.local.template)"; fi)"