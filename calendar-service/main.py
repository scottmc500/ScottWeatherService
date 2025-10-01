from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import os
from contextlib import asynccontextmanager

from api import events, sync, webhooks
from services import google_service, microsoft_service, event_processor

# Environment variables
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
MICROSOFT_CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID")
MICROSOFT_CLIENT_SECRET = os.getenv("MICROSOFT_CLIENT_SECRET")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting Calendar Service...")
    yield
    # Shutdown
    print("Shutting down Calendar Service...")

app = FastAPI(
    title="Weather Service Calendar API",
    description="Calendar service for Google Calendar and Microsoft Graph integration",
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
app.include_router(events, prefix="/api/calendars", tags=["events"])
app.include_router(sync, prefix="/api/calendars", tags=["sync"])
app.include_router(webhooks, prefix="/api/calendars", tags=["webhooks"])

@app.get("/")
async def root():
    return {"message": "Weather Service Calendar API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "calendar-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
