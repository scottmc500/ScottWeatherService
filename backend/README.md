# Scott Weather Service - Backend API

A production-ready Go API for weather and calendar integration services.

## Architecture

```
backend/
├── cmd/
│   └── api/
│       └── main.go              # Application entry point
├── internal/
│   ├── config/                  # Configuration management
│   ├── database/                # Database connections (PostgreSQL, Redis)
│   ├── handler/                 # HTTP handlers (controllers)
│   ├── middleware/              # HTTP middleware (auth, CORS, rate limiting)
│   ├── model/                   # Data models
│   ├── repository/              # Data access layer
│   └── service/                 # Business logic
├── Dockerfile                   # Container image definition
├── Makefile                     # Build automation
└── go.mod                       # Go module definition
```

## Features

- ✅ RESTful API with Gin framework
- ✅ PostgreSQL database with GORM ORM
- ✅ Redis caching layer
- ✅ JWT authentication
- ✅ Google OAuth integration
- ✅ Google Calendar API integration
- ✅ Weather API integration (OpenWeatherMap)
- ✅ Rate limiting
- ✅ CORS support
- ✅ Health check endpoints
- ✅ Docker support
- ✅ Kubernetes ready

## Prerequisites

- Go 1.21 or higher
- PostgreSQL 12+
- Redis 7+
- Docker (optional)
- Kubernetes cluster (for deployment)

## Getting Started

### 1. Clone and Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

### 2. Install Dependencies

```bash
make deps
```

### 3. Start Database Services

Using Docker Compose (recommended):
```bash
cd ..
docker-compose up -d postgres redis
```

Or manually start PostgreSQL and Redis.

### 4. Run the Application

```bash
# Development mode
make run

# Or with hot reload (requires air)
make dev

# Or build and run
make build
./bin/weather-service
```

The API will be available at `http://localhost:8080`

## API Endpoints

### Health Checks
- `GET /health` - Basic health check
- `GET /health/ready` - Readiness probe (checks dependencies)
- `GET /health/live` - Liveness probe

### Authentication
- `POST /api/v1/auth/google` - Initiate Google OAuth
- `GET /api/v1/auth/google/callback` - OAuth callback
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/logout` - Logout

### User (Protected)
- `GET /api/v1/user/me` - Get current user
- `PUT /api/v1/user/me` - Update user profile

### Weather (Protected)
- `GET /api/v1/weather/current?lat={lat}&lon={lon}&units={units}` - Get current weather
- `GET /api/v1/weather/forecast?lat={lat}&lon={lon}&units={units}` - Get 5-day forecast

### Calendar (Protected)
- `POST /api/v1/calendar/connect` - Connect Google Calendar
- `GET /api/v1/calendar/status` - Check calendar connection status
- `GET /api/v1/calendar/events` - Get calendar events
- `POST /api/v1/calendar/sync` - Sync calendar
- `DELETE /api/v1/calendar/disconnect` - Disconnect calendar

### Recommendations (Protected)
- `GET /api/v1/recommendations` - Get personalized recommendations

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/api/v1/user/me
```

## Configuration

Environment variables (see `.env.example`):

### Server
- `PORT` - Server port (default: 8080)
- `ENV` - Environment (development/production)

### Database
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `DB_SSL_MODE` - SSL mode (disable/require)

### Redis
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port
- `REDIS_PASSWORD` - Redis password (optional)

### JWT
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_EXPIRATION` - Token expiration (e.g., 24h)

### Google OAuth
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_REDIRECT_URL` - OAuth redirect URL

### Weather API
- `WEATHER_API_KEY` - OpenWeatherMap API key
- `WEATHER_API_BASE_URL` - Weather API base URL

## Development

### Run Tests
```bash
make test
```

### Run Tests with Coverage
```bash
make test-coverage
```

### Lint Code
```bash
make lint
```

### Build Binary
```bash
make build
```

## Docker

### Build Image
```bash
make docker-build
```

### Run Container
```bash
make docker-run
```

### Using Docker Compose
```bash
cd ..
docker-compose up
```

## Kubernetes Deployment

See `../k8s/README.md` for detailed Kubernetes deployment instructions.

Quick start:
```bash
# Apply all Kubernetes manifests
kubectl apply -f ../k8s/namespace.yaml
kubectl apply -f ../k8s/configmap.yaml
kubectl create secret generic weather-service-secrets --from-env-file=.env
kubectl apply -f ../k8s/postgres.yaml
kubectl apply -f ../k8s/redis.yaml
kubectl apply -f ../k8s/backend.yaml
kubectl apply -f ../k8s/ingress.yaml
```

## Project Structure

### Clean Architecture Layers

1. **Handler Layer** (`internal/handler`)
   - HTTP request/response handling
   - Input validation
   - Response formatting

2. **Service Layer** (`internal/service`)
   - Business logic
   - External API integration
   - Data transformation

3. **Repository Layer** (`internal/repository`)
   - Data access
   - Database operations
   - Cache management

4. **Model Layer** (`internal/model`)
   - Data structures
   - Domain models

5. **Middleware** (`internal/middleware`)
   - Authentication
   - CORS
   - Rate limiting
   - Logging

## Security Considerations

- JWT tokens for stateless authentication
- HTTPS only in production
- Rate limiting to prevent abuse
- CORS configuration
- Input validation
- SQL injection prevention (GORM parameterized queries)
- Secret management (use environment variables or secret managers)

## Performance

- Redis caching for weather data
- Connection pooling for database
- Horizontal pod autoscaling in Kubernetes
- Rate limiting to protect resources

## Monitoring

Health check endpoints for:
- Kubernetes liveness probes
- Kubernetes readiness probes
- Load balancer health checks

## Troubleshooting

### Database Connection Issues
```bash
# Check database connection
psql -h localhost -U postgres -d weather_service

# View logs
docker logs weather-postgres
```

### Redis Connection Issues
```bash
# Check Redis connection
redis-cli ping

# View logs
docker logs weather-redis
```

### API Issues
```bash
# View application logs
tail -f logs/app.log

# Or in Docker
docker logs weather-backend
```

## Contributing

1. Follow Go best practices
2. Write tests for new features
3. Update documentation
4. Run linter before committing

## License

Proprietary - All Rights Reserved

