from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer
from typing import List, Optional
import httpx
import os
from datetime import datetime

from models import (
    UserProfile, 
    Recommendation, 
    Notification, 
    GenerateRecommendationsRequest,
    GenerateRecommendationsResponse
)
from services import oauth_service, recommendation_engine, notification_service

# Routers
auth = APIRouter()
recommendations = APIRouter()
notifications = APIRouter()

security = HTTPBearer()

# Environment variables
CALENDAR_SERVICE_URL = os.getenv("CALENDAR_SERVICE_URL", "http://calendar-service:8001")
WEATHER_SERVICE_URL = os.getenv("WEATHER_SERVICE_URL", "http://weather-service:8002")

# Authentication endpoints
@auth.get("/profile")
async def get_user_profile(token: str = Depends(security)):
    """Get user profile from OAuth token"""
    try:
        user = await oauth_service.get_user_from_token(token.credentials)
        return UserProfile(
            id=user["id"],
            provider=user["provider"],
            email=user["email"],
            name=user.get("name"),
            picture=user.get("picture"),
            preferences=user.get("preferences", {}),
            created_at=user["created_at"],
            last_login=user.get("last_login")
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

@auth.post("/logout")
async def logout(token: str = Depends(security)):
    """Logout user and invalidate token"""
    try:
        await oauth_service.logout_user(token.credentials)
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Logout failed")

# Recommendation endpoints
@recommendations.get("/")
async def get_recommendations(
    user_id: str,
    limit: int = 10,
    offset: int = 0,
    token: str = Depends(security)
):
    """Get user recommendations"""
    try:
        # Verify user access
        user = await oauth_service.get_user_from_token(token.credentials)
        if user["id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        recs = await recommendation_engine.get_user_recommendations(
            user_id, limit, offset
        )
        return recs
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get recommendations")

@recommendations.post("/generate")
async def generate_recommendations(
    request: GenerateRecommendationsRequest,
    token: str = Depends(security)
):
    """Generate new recommendations for user"""
    try:
        # Verify user access
        user = await oauth_service.get_user_from_token(token.credentials)
        if user["id"] != request.user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Generate recommendations
        new_recs = await recommendation_engine.generate_recommendations(
            request.user_id, request.force_refresh
        )
        
        return GenerateRecommendationsResponse(
            recommendations=new_recs,
            generated_at=datetime.utcnow(),
            total_count=len(new_recs)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate recommendations")

@recommendations.put("/{recommendation_id}/read")
async def mark_recommendation_read(
    recommendation_id: str,
    user_id: str,
    token: str = Depends(security)
):
    """Mark recommendation as read"""
    try:
        # Verify user access
        user = await oauth_service.get_user_from_token(token.credentials)
        if user["id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        await recommendation_engine.mark_as_read(recommendation_id, user_id)
        return {"message": "Recommendation marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update recommendation")

# Notification endpoints
@notifications.get("/")
async def get_notifications(
    user_id: str,
    limit: int = 20,
    offset: int = 0,
    token: str = Depends(security)
):
    """Get user notifications"""
    try:
        # Verify user access
        user = await oauth_service.get_user_from_token(token.credentials)
        if user["id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        notifs = await notification_service.get_user_notifications(
            user_id, limit, offset
        )
        return notifs
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get notifications")

@notifications.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user_id: str,
    token: str = Depends(security)
):
    """Mark notification as read"""
    try:
        # Verify user access
        user = await oauth_service.get_user_from_token(token.credentials)
        if user["id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        await notification_service.mark_as_read(notification_id, user_id)
        return {"message": "Notification marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update notification")
