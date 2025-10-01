# ScottWeatherService

A weather service application that runs in Kubernetes, syncs with calendar SaaS tools, and provides recommendations based on your calendar events and weather forecasts.

## Architecture Overview

### 3-Service Architecture
- **Core Service**: OAuth management, recommendations, notifications
- **Calendar Service**: Google Calendar & Microsoft Graph integration  
- **Weather Service**: OpenWeatherMap integration

### Technology Stack
- **Backend**: Python/FastAPI
- **Frontend**: React.js
- **Database**: MongoDB Atlas + Redis
- **Authentication**: OAuth with Google/Microsoft (no separate user accounts)
- **LLM**: OpenAI GPT-3.5-turbo
- **Orchestration**: Kubernetes (Linode)
- **Infrastructure**: Terraform
- **External APIs**: Google Calendar, Microsoft Graph, OpenWeatherMap

## Project Structure

```
ScottWeatherService/
├── README.md
├── Makefile
├── docker-compose.yml
├── docker-compose.env.example
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── secrets.tfvars.example
├── k8s/
│   ├── namespace-configmaps.yaml
│   ├── core-service.yaml
│   ├── calendar-service.yaml
│   ├── weather-service.yaml
│   └── frontend.yaml
├── core-service/
│   ├── main.py
│   ├── models.py
│   ├── api.py
│   ├── services.py
│   ├── database.py
│   ├── requirements.txt
│   └── Dockerfile
├── calendar-service/
│   ├── main.py
│   ├── models.py
│   ├── api.py
│   ├── services.py
│   ├── requirements.txt
│   └── Dockerfile
├── weather-service/
│   ├── main.py
│   ├── models.py
│   ├── api.py
│   ├── services.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.js
│   │   ├── components/
│   │   │   ├── WeatherCard.jsx
│   │   │   ├── CalendarView.jsx
│   │   │   ├── Recommendations.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Header.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   └── index.css
│   ├── package.json
│   └── Dockerfile
└── docs/
    ├── api.md
    ├── deployment.md
    └── development.md
```

## Service Communication

### Development (Docker Compose)
```
Frontend (React) → Core Service (port 8000)
                     ↓
                ├── Calendar Service (port 8002)
                ├── Weather Service (port 8003)
                └── Redis (port 6379)
                     ↓
                └── OpenAI API (GPT-3.5)
```

### Production (Kubernetes)
```
Frontend → Ingress Controller → Core Service
                                    ↓
                               ├── Calendar Service
                               ├── Weather Service
                               └── MongoDB Atlas
                                    ↓
                               └── OpenAI API
```

## Data Flow

1. **User Authentication**: OAuth with Google/Microsoft (no separate user accounts)
2. **Calendar Sync**: Calendar Service fetches events from user's calendar
3. **Weather Data**: Weather Service gets forecasts for event locations
4. **Caching**: Redis stores OAuth tokens, weather data, and calendar events
5. **Recommendations**: Core Service correlates events with weather
6. **LLM Enhancement**: OpenAI provides natural language recommendations
7. **Notifications**: Users receive alerts via email/push/web

## Development Setup

### Local Development
- **Direct Service Communication**: Services use container names (e.g., `calendar-service:8002`)
- **Port Access**: Each service accessible on localhost ports
- **Hot Reload**: Code changes reflect immediately
- **Simple Networking**: No reverse proxy needed

### Production Deployment
- **Kubernetes Services**: Handle load balancing and service discovery
- **Ingress Controller**: Routes external traffic to services
- **Service Mesh**: Advanced networking and security
- **Auto-scaling**: Horizontal pod autoscaling based on load

## Quick Start

### Development Environment

```bash
# Clone repository
git clone <repo-url>
cd ScottWeatherService

# Setup environment
make env-setup

# Start development environment
make quick-start

# Access the application
open http://localhost:3000
```

### Production Deployment

```bash
# Setup secrets (first time only)
cp terraform/secrets.tfvars.example terraform/secrets.tfvars
# Edit terraform/secrets.tfvars with your API keys

# Deploy infrastructure and application
make deploy-full

# Check status
make k8s-status
```

## Development Commands

### Development Workflow
```bash
# Start development environment
make dev

# View logs
make dev-logs

# Run tests
make test

# Access service shell
make shell-core

# Check health
make health

# Stop and cleanup
make quick-stop
```

### Available Commands
```bash
# Show all available commands
make help

# Development
make dev              # Start development environment
make dev-build        # Start with rebuild
make dev-stop         # Stop development environment
make dev-logs         # Show all logs
make dev-logs-core    # Show core service logs

# Building
make build            # Build all services
make build-core       # Build core service
make build-frontend   # Build frontend

# Testing
make test             # Run all tests
make test-core        # Run core service tests
make test-frontend    # Run frontend tests

# Shell Access
make shell-core       # Access core service shell
make shell-calendar   # Access calendar service shell
make shell-weather    # Access weather service shell
make shell-frontend   # Access frontend shell

# Database
make db-reset         # Reset Redis data
make db-backup        # Backup Redis data

# Deployment
make deploy-dev       # Deploy to development Kubernetes
make deploy-prod      # Deploy to production Kubernetes
make deploy-terraform # Deploy infrastructure with Terraform
make deploy-core      # Deploy core service only
make deploy-calendar  # Deploy calendar service only
make deploy-weather  # Deploy weather service only
make deploy-frontend  # Deploy frontend only
make deploy-all       # Deploy all services

# Secrets management
make secrets-setup    # Setup secrets from Terraform outputs
make secrets-update   # Update secrets from Terraform outputs
make deploy-full      # Deploy infrastructure and application

# Kubernetes
make k8s-status       # Check Kubernetes deployment status
make k8s-logs         # Show Kubernetes logs
make k8s-shell        # Access Kubernetes pod shell

# Cleanup
make clean            # Clean up development environment
make clean-all        # Clean up everything (including images)

# Health & Monitoring
make health           # Check service health
make monitor          # Monitor all services
make backup           # Backup all data
```

## Infrastructure

### Development Environment
- **Docker Compose**: Local development with hot reload
- **Services**: Core, Calendar, Weather, Redis, Frontend
- **Networking**: Direct service-to-service communication
- **Database**: Redis with persistent data (local)
- **Secrets**: Environment variables in docker-compose.env

### Production Environment
- **Kubernetes**: Linode LKE cluster (3 nodes)
- **Database**: MongoDB Atlas (M0 free tier) - managed by Terraform
- **Infrastructure**: Terraform-managed (Linode + MongoDB Atlas)
- **Application**: Kubernetes-managed (Core, Calendar, Weather, Frontend services)
- **Ingress**: External access to frontend via Ingress controller
- **Secrets**: Terraform outputs → Kubernetes secrets
- **Monitoring**: Built-in health checks and logging

### Secrets Management
- **Terraform**: Manages infrastructure secrets (API keys, database credentials)
- **Kubernetes**: Application secrets created via command line from Terraform outputs
- **No YAML Files**: Secrets created dynamically, no static secret files
- **No Hard-coded Secrets**: All secrets injected at deployment time
- **Secure Workflow**: Secrets never stored in version control

### Cost Breakdown
- **Development**: Free (local Docker)
- **Production**: ~$20-35/month
  - Linode: $15/month (3x g6-nanode-1)
  - MongoDB Atlas: $0/month (M0 free tier)
  - OpenAI: ~$5-15/month (usage-based)

## API Endpoints

### Core Service
- `GET /api/auth/profile` - User profile (from OAuth)
- `POST /api/recommendations/generate` - Generate recommendations
- `GET /api/notifications` - User notifications

### Calendar Service  
- `GET /api/calendars/events` - List calendar events
- `POST /api/calendars/sync` - Sync calendar data
- `GET /api/calendars/webhooks` - Handle webhook events

### Weather Service
- `GET /api/weather/current` - Current weather
- `GET /api/weather/forecast` - Weather forecast
- `GET /api/weather/alerts` - Weather alerts

### Redis
- **Session Storage**: OAuth tokens and user sessions
- **API Caching**: Weather data and calendar events
- **Rate Limiting**: API call throttling
- **Real-time Data**: WebSocket connections and live updates

## Features

### Weather Integration
- **Current Weather**: Real-time weather data
- **Forecasts**: 5-day weather predictions
- **Alerts**: Weather warnings and advisories
- **Location-based**: Weather for specific event locations

### Calendar Integration
- **Google Calendar**: OAuth integration and sync
- **Microsoft Outlook**: Microsoft Graph integration
- **Real-time Sync**: Webhook-based updates
- **Event Processing**: Location extraction and analysis

### AI-Powered Recommendations
- **LLM Integration**: OpenAI GPT-3.5-turbo
- **Smart Suggestions**: Weather-based event recommendations
- **Natural Language**: Conversational recommendations
- **Personalization**: User-specific suggestions

### Real-time Features
- **WebSocket**: Live weather and calendar updates
- **Notifications**: Push notifications for weather alerts
- **Auto-sync**: Automatic calendar synchronization
- **Live Updates**: Real-time recommendation updates