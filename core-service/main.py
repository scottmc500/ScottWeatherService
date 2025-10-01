from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import os
from contextlib import asynccontextmanager

from api import auth, recommendations, notifications
from database import get_database
from services import oauth_service, recommendation_engine, notification_service

# Environment variables
MONGODB_URI = os.getenv("MONGODB_URI")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
CALENDAR_SERVICE_URL = os.getenv("CALENDAR_SERVICE_URL", "http://calendar-service:8001")
WEATHER_SERVICE_URL = os.getenv("WEATHER_SERVICE_URL", "http://weather-service:8002")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting Core Service...")
    await get_database()
    yield
    # Shutdown
    print("Shutting down Core Service...")

app = FastAPI(
    title="Weather Service Core API",
    description="Core service for weather recommendations and user management",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Include routers
app.include_router(auth, prefix="/api/auth", tags=["authentication"])
app.include_router(recommendations, prefix="/api/recommendations", tags=["recommendations"])
app.include_router(notifications, prefix="/api/notifications", tags=["notifications"])

@app.get("/")
async def root():
    return {"message": "Weather Service Core API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "core-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
