from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import os
from contextlib import asynccontextmanager

from api import weather, alerts, location
from services import openweather_service, location_service, cache_service

# Environment variables
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
OPENWEATHERMAP_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting Weather Service...")
    yield
    # Shutdown
    print("Shutting down Weather Service...")

app = FastAPI(
    title="Weather Service API",
    description="Weather service for OpenWeatherMap integration and weather data processing",
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
app.include_router(weather, prefix="/api/weather", tags=["weather"])
app.include_router(alerts, prefix="/api/weather", tags=["alerts"])
app.include_router(location, prefix="/api/weather", tags=["location"])

@app.get("/")
async def root():
    return {"message": "Weather Service API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "weather-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
