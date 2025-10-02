# Scott Weather Service - Firebase + Next.js
# Development and deployment commands

.PHONY: help start start-emulators stop logs status build deploy clean install

# Default target
help: ## Show this help message
	@echo "Scott Weather Service - Available Commands:"
	@echo ""
	@echo "🚀 DEVELOPMENT:"
	@echo "  make start           - Start development mode with real Firebase"
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
	@echo "  make setup-firebase  - Setup Firebase configuration"
	@echo ""

# START DEVELOPMENT MODE
start: ## Start development mode - Next.js dev server with real Firebase (background)
	@echo "🚀 Starting development mode with real Firebase..."
	@echo "⚡ Starting Next.js development server..."
	@nohup npm run dev --prefix frontend > nextjs-dev.log 2>&1 &
	@echo "🌐 Your app will be available at: http://localhost:3000"
	@echo "📝 Next.js logs: nextjs-dev.log"
	@echo "💡 Use 'make stop' to stop everything"
	@echo ""
	@echo "✅ Development mode started! Using real Firebase services."

# START WITH EMULATORS
start-emulators: ## Start development mode with Firebase emulators (background)
	@echo "🚀 Starting development mode with Firebase emulators..."
	@echo "🔥 Starting Firebase emulators..."
	@nohup firebase emulators:start --only firestore,functions > firebase-emulators.log 2>&1 &
	@echo "⚡ Starting Next.js development server..."
	@nohup npm run dev --prefix frontend > nextjs-dev.log 2>&1 &
	@echo "🌐 Your app will be available at: http://localhost:3000"
	@echo "🔥 Firebase UI will be available at: http://localhost:4000"
	@echo "📝 Emulator logs: firebase-emulators.log"
	@echo "📝 Next.js logs: nextjs-dev.log"
	@echo "💡 Use 'make stop' to stop everything"
	@echo ""
	@echo "✅ Development mode with emulators started!"

stop: ## Stop all services (emulators + Next.js dev server) and clean up
	@echo "🛑 Stopping all services..."
	@pkill -f "firebase emulators:start" || echo "No Firebase emulators running"
	@pkill -f "next dev" || echo "No Next.js dev server running"
	@pkill -f "npm run dev" || echo "No npm dev processes running"
	@echo "🧹 Cleaning up build artifacts..."
	@rm -rf frontend/.next frontend/out frontend/dist
	@echo "🗑️  Cleaning Firebase emulator data..."
	@rm -rf .firebase
	@echo "📝 Cleaning up log files..."
	@find . -name "*.log" -type f -delete 2>/dev/null || true
	@echo "✅ Cleanup complete!"

logs: ## View all logs (both Firebase and Next.js)
	@echo "📝 All service logs (Ctrl+C to exit):"
	@tail -f firebase-emulators.log nextjs-dev.log 2>/dev/null || echo "No log files found"

status: ## Show what services are currently running
	@echo "📊 Service Status:"
	@echo "Firebase Emulators: $$(if pgrep -f 'firebase emulators:start' > /dev/null; then echo '✅ Running (port 4000)'; else echo '❌ Not running'; fi)"
	@echo "Next.js Dev Server: $$(if pgrep -f 'next dev' > /dev/null; then echo '✅ Running (port 3000)'; else echo '❌ Not running'; fi)"
	@echo ""
	@echo "🌐 Available URLs:"
	@echo "  Development: http://localhost:3000 (if Next.js dev server is running)"
	@echo "  Firebase UI: http://localhost:4000 (if Firebase emulators are running)"

# Installation Commands
install: ## Install all dependencies
	@echo "📦 Installing dependencies..."
	@npm install --prefix frontend

# Build Commands
build: ## Build frontend for production
	@echo "🔨 Building frontend..."
	@npm run build --prefix frontend

# Deployment Commands
deploy: ## Deploy everything to Firebase
	@echo "🚀 Deploying to Firebase..."
	@firebase deploy

deploy-apphosting: ## Deploy frontend to App Hosting
	@echo "🚀 Deploying frontend to App Hosting..."
	@firebase deploy --only apphosting

# Utility Commands
clean: ## Clean build artifacts and node_modules
	@echo "🧹 Cleaning up..."
	@rm -rf frontend/.next frontend/out frontend/dist
	@rm -rf functions/venv functions/__pycache__ functions/*.pyc
	@rm -rf .firebase

clean-all: clean ## Clean everything including dependencies
	@echo "🧹 Cleaning all dependencies..."
	@rm -rf frontend/node_modules

# Setup Commands
setup-firebase: ## Setup Firebase configuration
	@echo "🔥 Setting up Firebase configuration..."
	@./setup-firebase-config.sh

# Project Status
project-status: ## Show project configuration status
	@echo "📊 Project Configuration:"
	@echo "Frontend: $$(if [ -d frontend/node_modules ]; then echo "✅ Dependencies installed"; else echo "❌ Dependencies missing"; fi)"
	@echo "Firebase Config: $$(if [ -f firebase.json ]; then echo "✅ Configured"; else echo "❌ Missing"; fi)"
	@echo "Environment: $$(if [ -f frontend/.env.local ]; then echo "✅ Configured"; else echo "❌ Missing (copy from env.local.template)"; fi)"