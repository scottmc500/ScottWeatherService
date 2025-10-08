# Scott Weather Service - Complete Project Overview

> **🎯 Quick Context**: This project was migrated from Firebase to a containerized Go backend. The **backend is complete and ready**, the **frontend needs to be updated** to use the new API.

---

## 📋 Table of Contents
- [Current Status](#current-status)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [What Was Built](#what-was-built)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Development Workflow](#development-workflow)
- [Deployment](#deployment)
- [Next Steps](#next-steps)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Current Status

### ✅ **Backend (COMPLETE)**
- Production-ready Go API with Gin framework
- PostgreSQL database with GORM ORM
- Redis caching layer
- JWT authentication + Google OAuth
- Google Calendar API integration
- Weather API (OpenWeatherMap) integration
- Docker containerization ready
- Kubernetes manifests ready
- Comprehensive health checks

### ⏳ **Frontend (NEEDS UPDATE)**
- Next.js app exists but still has Firebase code
- Needs to be updated to call new Go API endpoints
- Firebase components need to be replaced
- Auth flow needs JWT integration

### 📦 **Infrastructure (READY)**
- Docker Compose for local development
- Kubernetes manifests for production
- PostgreSQL + Redis configuration
- Complete documentation

---

## 🏗️ Architecture Overview

### Technology Stack

**Backend:**
- **Language**: Go 1.21
- **Framework**: Gin (HTTP router)
- **Database**: PostgreSQL 16 + GORM ORM
- **Cache**: Redis 7
- **Auth**: JWT + Google OAuth 2.0
- **APIs**: OpenWeatherMap, Google Calendar

**Infrastructure:**
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **Local Dev**: Docker Compose

**Frontend (To Be Updated):**
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js Frontend (Port 3000)                    │
│  - React Components                                          │
│  - API Client (needs update to use Go backend)              │
│  - Authentication UI                                         │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Go Backend API (Port 8080)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Handler Layer (HTTP Controllers)                     │   │
│  │  - Health, Auth, Weather, Calendar                   │   │
│  └────────────────┬────────────────────────────────────┘   │
│                   │                                          │
│  ┌────────────────▼────────────────────────────────────┐   │
│  │ Service Layer (Business Logic)                       │   │
│  │  - AuthService, WeatherService, CalendarService      │   │
│  └────────────────┬────────────────────────────────────┘   │
│                   │                                          │
│  ┌────────────────▼────────────────────────────────────┐   │
│  │ Repository Layer (Data Access)                       │   │
│  │  - UserRepo, CalendarRepo, CacheRepo                 │   │
│  └────────────────┬────────────────────────────────────┘   │
└───────────────────┼──────────────────────────────────────┘
                    │
        ┌───────────┴──────────┐
        ▼                      ▼
┌──────────────┐      ┌──────────────┐
│  PostgreSQL  │      │    Redis     │
│   (Port 5432)│      │  (Port 6379) │
│              │      │              │
│  - Users     │      │  - Weather   │
│  - Tokens    │      │    Cache     │
└──────────────┘      └──────────────┘

External APIs:
  ├── OpenWeatherMap API (weather data)
  ├── Google OAuth 2.0 (authentication)
  └── Google Calendar API (calendar events)
```

---

## 📁 Project Structure

```
ScottWeatherService/
├── backend/                          # ✅ COMPLETE - Go API Backend
│   ├── cmd/
│   │   └── api/
│   │       └── main.go              # Application entry point
│   ├── internal/
│   │   ├── config/                  # Configuration management
│   │   │   └── config.go            # Env var loading, validation
│   │   ├── database/                # Database connections
│   │   │   ├── postgres.go          # PostgreSQL + GORM setup
│   │   │   └── redis.go             # Redis client setup
│   │   ├── handler/                 # HTTP handlers (controllers)
│   │   │   ├── health.go            # Health check endpoints
│   │   │   ├── auth.go              # Auth endpoints
│   │   │   ├── weather.go           # Weather endpoints
│   │   │   └── calendar.go          # Calendar endpoints
│   │   ├── middleware/              # HTTP middleware
│   │   │   ├── auth.go              # JWT authentication
│   │   │   ├── cors.go              # CORS configuration
│   │   │   └── ratelimit.go         # Rate limiting
│   │   ├── model/                   # Data models
│   │   │   ├── user.go              # User, CalendarToken models
│   │   │   ├── weather.go           # Weather data models
│   │   │   └── calendar.go          # Calendar event models
│   │   ├── repository/              # Data access layer
│   │   │   ├── user.go              # User CRUD
│   │   │   ├── calendar.go          # Calendar token management
│   │   │   └── cache.go             # Redis cache operations
│   │   └── service/                 # Business logic
│   │       ├── auth.go              # Authentication & user mgmt
│   │       ├── weather.go           # Weather API integration
│   │       └── calendar.go          # Google Calendar integration
│   ├── Dockerfile                    # Multi-stage Docker build
│   ├── Makefile                      # Build automation commands
│   ├── go.mod                        # Go dependencies
│   ├── .env.example                  # Environment template
│   └── README.md                     # Backend docs
│
├── frontend/                         # ⏳ NEEDS UPDATE - Next.js App
│   ├── app/
│   │   ├── components/              # React components
│   │   │   ├── Dashboard.tsx        # Main dashboard
│   │   │   ├── CalendarIntegration.tsx
│   │   │   ├── CalendarSync.tsx
│   │   │   ├── CalendarTest.tsx
│   │   │   ├── FirebaseDebug.tsx    # ❌ Remove (Firebase)
│   │   │   └── LoginForm.tsx
│   │   ├── services/                # API clients
│   │   │   ├── auth.ts              # ❌ Update (Firebase Auth)
│   │   │   ├── weatherApi.ts        # ❌ Update (Firebase Functions)
│   │   │   ├── googleCalendarOAuth.ts
│   │   │   └── calendarSync.ts
│   │   ├── lib/
│   │   │   └── firebase.ts          # ❌ Replace with API client
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── page.tsx         # OAuth callback handler
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── public/                      # Static assets
│   ├── package.json
│   └── tsconfig.json
│
├── k8s/                              # ✅ COMPLETE - Kubernetes Config
│   ├── namespace.yaml               # Isolated namespace
│   ├── configmap.yaml               # App configuration
│   ├── secret.yaml                  # Secrets template
│   ├── postgres.yaml                # PostgreSQL deployment
│   ├── redis.yaml                   # Redis deployment
│   ├── backend.yaml                 # Backend + HPA
│   ├── ingress.yaml                 # NGINX ingress + TLS
│   └── README.md                    # Deployment guide
│
├── docker-compose.yml               # ✅ Local development setup
├── .gitignore                       # ✅ Comprehensive ignore rules
├── README.md                        # ✅ This file
├── GETTING_STARTED.md               # Quick start guide
└── MIGRATION_SUMMARY.md             # Migration details
```

---

## 🔨 What Was Built

### Backend API (Go)

#### Clean Architecture Layers

**1. Handler Layer** (`internal/handler/`)
- HTTP request/response handling
- Input validation and sanitization
- Response formatting (JSON)
- Error handling

**2. Service Layer** (`internal/service/`)
- Business logic implementation
- External API integration (Weather, Calendar)
- Data transformation
- Caching logic

**3. Repository Layer** (`internal/repository/`)
- Database operations (CRUD)
- Cache operations
- Transaction management
- Query optimization

**4. Model Layer** (`internal/model/`)
- Data structures
- Domain models
- Database schemas (GORM)

**5. Middleware** (`internal/middleware/`)
- JWT authentication
- CORS configuration
- Rate limiting (in-memory)
- Request logging

#### Key Features Implemented

✅ **Authentication System**
- JWT token generation and validation
- Google OAuth 2.0 integration
- Token refresh mechanism
- User session management
- Secure password-less auth

✅ **Database Layer**
- PostgreSQL with GORM ORM
- Auto-migrations on startup
- Connection pooling
- User table with preferences
- Calendar token storage

✅ **Caching Layer**
- Redis for weather data caching
- Configurable TTL per data type
- Cache invalidation
- Graceful fallback if Redis unavailable

✅ **Weather Integration**
- OpenWeatherMap API client
- Current weather endpoint
- 5-day forecast endpoint
- Caching for performance
- Unit conversion (metric/imperial)

✅ **Google Calendar Integration**
- OAuth 2.0 flow
- Calendar event retrieval
- Token storage in database
- Automatic token refresh
- Calendar sync endpoint

✅ **Health Monitoring**
- `/health` - Basic health check
- `/health/ready` - Readiness probe (checks DB & Redis)
- `/health/live` - Liveness probe
- Kubernetes-compatible

✅ **Security**
- JWT authentication on protected routes
- Rate limiting (100 req/min per IP)
- CORS configuration
- SQL injection prevention (GORM parameterized queries)
- Environment-based secrets

### Infrastructure

✅ **Docker Setup**
- Multi-stage Dockerfile for Go app
- docker-compose.yml with PostgreSQL, Redis, and API
- Health checks on all containers
- Volume persistence for data
- Optimized image size

✅ **Kubernetes Manifests**
- Complete K8s deployment configuration
- Horizontal Pod Autoscaling (HPA)
- Persistent volumes for PostgreSQL
- ConfigMaps for configuration
- Secrets management
- NGINX Ingress with TLS
- Service discovery

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

**Required:**
- Go 1.21+ ([Download](https://go.dev/dl/))
- Docker Desktop ([Download](https://www.docker.com/products/docker-desktop))
- Docker Compose (included with Docker Desktop)

**For API Keys:**
- OpenWeatherMap account ([Sign up](https://openweathermap.org/api))
- Google Cloud project ([Console](https://console.cloud.google.com/))

**Optional (for production):**
- Kubernetes cluster (GKE, EKS, AKS, or local Minikube)
- kubectl CLI tool

### Step 1: Get API Keys

#### OpenWeatherMap API Key
1. Go to https://openweathermap.org/api
2. Sign up for a free account
3. Navigate to API Keys section
4. Copy your API key

#### Google OAuth Credentials
1. Go to https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Enable APIs:
   - Google Calendar API
   - Google OAuth 2.0
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: Web application
6. Add authorized redirect URI: `http://localhost:3000/auth/callback`
7. Save Client ID and Client Secret

### Step 2: Configure Environment

```bash
# Navigate to backend
cd backend

# Copy environment template
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

**Required environment variables:**
```env
# Your API keys (REQUIRED)
WEATHER_API_KEY=your_openweathermap_key_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Generate a secure JWT secret (REQUIRED)
JWT_SECRET=your-very-secure-random-string-change-this

# Database (defaults are fine for local dev)
DB_PASSWORD=postgres

# Everything else can use defaults
```

### Step 3: Start the Backend

**Option A: Using Docker Compose (Recommended)**

```bash
# From project root
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

**Option B: Manual Setup (for development)**

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Install Go dependencies
cd backend
go mod download

# Run the application
make run

# Or with hot reload (install air first: go install github.com/cosmtrek/air@latest)
make dev
```

### Step 4: Verify Backend is Running

```bash
# Check health
curl http://localhost:8080/health

# Expected: {"status":"healthy","service":"scott-weather-service"}

# Check readiness (verifies DB & Redis connections)
curl http://localhost:8080/health/ready

# Expected: {"status":"ready","database":"connected","redis":true}
```

### Step 5: Test the API

#### Test Weather Endpoint (after getting JWT token)

```bash
# Test San Francisco weather
curl "http://localhost:8080/api/v1/weather/current?lat=37.7749&lon=-122.4194&units=imperial"

# Note: You'll get a 401 error - that's expected! Protected endpoints need JWT token.
```

#### Get JWT Token (Google OAuth Flow)

```bash
# 1. Get OAuth URL
curl -X POST http://localhost:8080/api/v1/auth/google

# 2. Open the returned URL in browser, complete Google login
# 3. You'll be redirected to callback and receive a JWT token

# 4. Use the token
TOKEN="your-jwt-token-here"
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/user/me
```

---

## 📡 API Documentation

### Base URL
- **Local Development**: `http://localhost:8080/api/v1`
- **Production**: `https://api.your-domain.com/api/v1`

### Authentication

All protected endpoints require a JWT token in the Authorization header:
```bash
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### ❤️ Health Checks (Public)

```
GET /health              # Basic health check
GET /health/ready        # Readiness probe (checks dependencies)
GET /health/live         # Liveness probe
```

#### 🔐 Authentication (Public)

```
POST /api/v1/auth/google              # Get Google OAuth URL
GET  /api/v1/auth/google/callback     # OAuth callback (handles code exchange)
POST /api/v1/auth/refresh             # Refresh JWT token
POST /api/v1/auth/logout              # Logout (client-side token removal)
```

**Example - Initiate Google OAuth:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/google
```

Response:
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

#### 👤 User Management (Protected)

```
GET  /api/v1/user/me    # Get current user profile
PUT  /api/v1/user/me    # Update user profile
```

**Example - Get Current User:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/user/me
```

#### 🌤️ Weather (Protected)

```
GET /api/v1/weather/current?lat={lat}&lon={lon}&units={units}
GET /api/v1/weather/forecast?lat={lat}&lon={lon}&units={units}
```

Query parameters:
- `lat` (required): Latitude
- `lon` (required): Longitude
- `units` (optional): "metric" or "imperial" (default: "metric")

**Example - Current Weather:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/weather/current?lat=37.7749&lon=-122.4194&units=imperial"
```

#### 📅 Calendar (Protected)

```
POST   /api/v1/calendar/connect       # Connect Google Calendar
GET    /api/v1/calendar/status        # Check connection status
GET    /api/v1/calendar/events        # Get calendar events
POST   /api/v1/calendar/sync          # Sync calendar
DELETE /api/v1/calendar/disconnect    # Disconnect calendar
```

**Example - Connect Calendar:**
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"google-oauth-code-from-callback"}' \
  http://localhost:8080/api/v1/calendar/connect
```

**Example - Get Calendar Events:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/calendar/events?time_min=2025-01-01T00:00:00Z&time_max=2025-01-31T23:59:59Z&max_results=50"
```

#### 💡 Recommendations (Protected)

```
GET /api/v1/recommendations    # Get personalized recommendations
```

---

## 💻 Development Workflow

### Backend Development

```bash
cd backend

# Install dependencies
make deps

# Run application
make run

# Run with hot reload (requires air)
make dev

# Run tests
make test

# Run tests with coverage
make test-coverage

# Build binary
make build

# Run linter
make lint

# Clean build artifacts
make clean
```

### Useful Commands

```bash
# View all running containers
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis

# Restart a service
docker-compose restart backend

# Stop all services
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v

# Rebuild backend image
docker-compose up -d --build backend
```

### Database Access

```bash
# Connect to PostgreSQL
docker exec -it weather-postgres psql -U postgres -d weather_service

# Useful SQL commands:
\dt                           # List tables
SELECT * FROM users;          # Query users
SELECT * FROM calendar_tokens;  # Query tokens
\q                            # Quit
```

### Redis Access

```bash
# Connect to Redis
docker exec -it weather-redis redis-cli

# Useful Redis commands:
KEYS *                        # List all keys
GET weather:current:*         # Get cached weather
FLUSHALL                      # Clear all cache
exit                          # Quit
```

---

## 🚢 Deployment

### Local Development (Docker Compose)

Already covered in [Getting Started](#getting-started).

### Production (Kubernetes)

**Prerequisites:**
- Kubernetes cluster
- kubectl configured
- Docker registry access

**Step 1: Build and Push Image**
```bash
cd backend
docker build -t your-registry/scott-weather-service:v1.0.0 .
docker push your-registry/scott-weather-service:v1.0.0
```

**Step 2: Create Kubernetes Resources**
```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create configmap
kubectl apply -f k8s/configmap.yaml

# Create secrets (DO NOT use the template file!)
kubectl create secret generic weather-service-secrets \
  --namespace=weather-service \
  --from-literal=DB_USER=postgres \
  --from-literal=DB_PASSWORD=your-secure-password \
  --from-literal=JWT_SECRET=your-jwt-secret \
  --from-literal=GOOGLE_CLIENT_ID=your-client-id \
  --from-literal=GOOGLE_CLIENT_SECRET=your-client-secret \
  --from-literal=WEATHER_API_KEY=your-weather-key
```

**Step 3: Deploy Services**
```bash
# Deploy PostgreSQL
kubectl apply -f k8s/postgres.yaml

# Deploy Redis
kubectl apply -f k8s/redis.yaml

# Deploy Backend (update image in backend.yaml first)
kubectl apply -f k8s/backend.yaml

# Deploy Ingress (update domain first)
kubectl apply -f k8s/ingress.yaml
```

**Step 4: Verify Deployment**
```bash
# Check all resources
kubectl get all -n weather-service

# Check pods
kubectl get pods -n weather-service

# View logs
kubectl logs -f deployment/weather-backend -n weather-service

# Port forward to test
kubectl port-forward svc/weather-backend-service 8080:80 -n weather-service
curl http://localhost:8080/health
```

See `k8s/README.md` for detailed deployment documentation.

---

## 📝 Next Steps

### Immediate (Frontend Integration)

The frontend needs to be updated to use the new Go backend. Here's what needs to change:

#### 1. Remove Firebase Dependencies
- [ ] Remove Firebase SDK from `package.json`
- [ ] Delete `frontend/app/lib/firebase.ts`
- [ ] Remove Firebase Debug component
- [ ] Clean up Firebase imports

#### 2. Create New API Client
Create `frontend/app/lib/api.ts`:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const api = {
  // Auth endpoints
  auth: {
    getGoogleOAuthUrl: () => fetch(`${API_BASE_URL}/auth/google`, { method: 'POST' }),
    // ... etc
  },
  // Weather endpoints
  weather: {
    getCurrent: (lat: number, lon: number, units: string, token: string) =>
      fetch(`${API_BASE_URL}/weather/current?lat=${lat}&lon=${lon}&units=${units}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
    // ... etc
  },
  // Calendar endpoints
  calendar: {
    // ... etc
  }
};
```

#### 3. Update Auth Service
Replace `frontend/app/services/auth.ts` to use JWT instead of Firebase Auth:
- Store JWT token in localStorage
- Parse JWT to get user info
- Implement token refresh logic
- Update all components using Firebase Auth

#### 4. Update API Calls
Update these files:
- `frontend/app/services/weatherApi.ts` - Use new Go API
- `frontend/app/services/calendarSync.ts` - Update endpoints
- `frontend/app/components/Dashboard.tsx` - Update API calls
- All components using Firebase Functions

#### 5. Update Environment Variables
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id
```

### Short Term

- [ ] Add comprehensive tests (Go backend)
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Add frontend tests
- [ ] End-to-end testing
- [ ] API documentation (Swagger/OpenAPI)

### Medium Term

- [ ] Set up monitoring (Prometheus + Grafana)
- [ ] Set up logging (ELK Stack or similar)
- [ ] Configure alerting
- [ ] Database backups
- [ ] Production deployment

### Long Term

- [ ] WebSocket support for real-time updates
- [ ] Mobile app (React Native)
- [ ] Additional weather providers
- [ ] Enhanced recommendation engine
- [ ] Analytics dashboard
- [ ] Admin panel

---

## 🐛 Troubleshooting

### Backend Won't Start

**Symptom:** `docker-compose up` fails or backend exits immediately

**Solutions:**
```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Port 8080 already in use
lsof -i :8080  # Find process
kill -9 <PID>  # Kill it

# 2. Database connection error
docker-compose logs postgres
docker-compose restart postgres

# 3. Missing environment variables
cat backend/.env  # Verify all required vars are set

# 4. Build errors
cd backend
go mod tidy
docker-compose up -d --build backend
```

### Database Connection Errors

**Symptom:** "failed to connect to database"

**Solutions:**
```bash
# Ensure PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs weather-postgres

# Test connection manually
docker exec -it weather-postgres psql -U postgres -d weather_service

# Reset database
docker-compose down -v
docker-compose up -d
```

### Redis Connection Errors

**Symptom:** "failed to connect to redis" (warning only, app should still work)

**Solutions:**
```bash
# Ensure Redis is running
docker ps | grep redis

# Test connection
docker exec -it weather-redis redis-cli ping
# Should return: PONG

# Restart Redis
docker-compose restart redis
```

### API Returns 401 Unauthorized

**Symptom:** Protected endpoints return 401

**Cause:** Missing or invalid JWT token

**Solution:**
```bash
# You need to authenticate first
curl -X POST http://localhost:8080/api/v1/auth/google
# Open the URL, login with Google, get JWT token
# Then use: curl -H "Authorization: Bearer YOUR_TOKEN" ...
```

### API Returns 500 Internal Server Error

**Symptom:** API endpoints return 500 errors

**Solutions:**
```bash
# Check backend logs for stack trace
docker-compose logs -f backend

# Check health endpoint
curl http://localhost:8080/health/ready
# If not ready, check database and Redis

# Common causes:
# - Database not ready yet (wait 10 seconds after startup)
# - Invalid API keys in .env
# - Network issues with external APIs
```

### Port Already in Use

**Symptom:** "port 8080 is already allocated"

**Solutions:**
```bash
# Find what's using the port
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml
# Change: "8080:8080" to "8081:8080"
```

### Go Module Issues

**Symptom:** "package not found" or dependency errors

**Solutions:**
```bash
cd backend

# Clean module cache
go clean -modcache

# Re-download dependencies
go mod download

# Tidy modules
go mod tidy

# Rebuild
docker-compose up -d --build backend
```

### Docker Issues

**Symptom:** General Docker problems

**Solutions:**
```bash
# Clean up Docker
docker system prune -a

# Remove volumes
docker volume prune

# Restart Docker Desktop

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## 📚 Additional Documentation

- **Backend API Details**: `backend/README.md`
- **Kubernetes Deployment**: `k8s/README.md`
- **Quick Start Guide**: `GETTING_STARTED.md`
- **Migration Details**: `MIGRATION_SUMMARY.md`

---

## 🔑 Important Notes

### Security

⚠️ **Never commit these files:**
- `.env` files (use `.env.example` as template)
- API keys or secrets
- Database passwords
- Private keys or certificates
- JWT secrets

✅ **Best Practices:**
- Use strong JWT secret in production (generate with `openssl rand -base64 32`)
- Enable HTTPS/TLS in production
- Use secret management tools (Vault, AWS Secrets Manager, etc.)
- Rotate credentials regularly
- Use different credentials per environment

### Environment Variables

Backend requires these variables:
- `WEATHER_API_KEY` - OpenWeatherMap API key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `JWT_SECRET` - Secret key for signing JWT tokens

Frontend will need:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID

---

## 📞 Support

If you encounter issues:
1. Check this README thoroughly
2. Review the troubleshooting section
3. Check backend logs: `docker-compose logs backend`
4. Check database logs: `docker-compose logs postgres`
5. Verify environment variables are set correctly
6. Create an issue in the repository

---

## 📄 License

Proprietary - All Rights Reserved

---

**Last Updated:** 2025-10-08  
**Status:** Backend Complete ✅ | Frontend Pending ⏳  
**Ready For:** Backend testing and local development
