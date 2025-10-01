import httpx
import redis
import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import openai
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

from models import (
    User, UserProvider, Recommendation, Notification, 
    WeatherData, CalendarEvent, RecommendationType
)

# Environment variables
MONGODB_URI = os.getenv("MONGODB_URI")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
CALENDAR_SERVICE_URL = os.getenv("CALENDAR_SERVICE_URL", "http://calendar-service:8001")
WEATHER_SERVICE_URL = os.getenv("WEATHER_SERVICE_URL", "http://weather-service:8002")

# Initialize OpenAI
openai.api_key = OPENAI_API_KEY

# Redis connection
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# MongoDB connection
mongo_client = AsyncIOMotorClient(MONGODB_URI)
db = mongo_client.weather_service

class OAuthService:
    """Handle OAuth authentication and user management"""
    
    async def get_user_from_token(self, token: str) -> Dict[str, Any]:
        """Get user information from OAuth token"""
        # In a real implementation, you would validate the token with the OAuth provider
        # For now, we'll use a simple cache-based approach
        
        # Check Redis cache first
        cached_user = redis_client.get(f"oauth_token:{token}")
        if cached_user:
            return json.loads(cached_user)
        
        # If not in cache, validate with OAuth provider
        # This is a simplified version - in production you'd validate with Google/Microsoft
        user_data = await self._validate_token_with_provider(token)
        
        # Cache the result
        redis_client.setex(
            f"oauth_token:{token}", 
            3600,  # 1 hour
            json.dumps(user_data, default=str)
        )
        
        return user_data
    
    async def _validate_token_with_provider(self, token: str) -> Dict[str, Any]:
        """Validate token with OAuth provider (Google/Microsoft)"""
        # This is a placeholder - implement actual OAuth validation
        # For now, return a mock user
        return {
            "id": "user_123",
            "provider": "google",
            "email": "user@example.com",
            "name": "Test User",
            "picture": "https://example.com/avatar.jpg",
            "created_at": datetime.utcnow(),
            "preferences": {}
        }
    
    async def logout_user(self, token: str):
        """Logout user and invalidate token"""
        # Remove from cache
        redis_client.delete(f"oauth_token:{token}")
        return {"message": "Logged out successfully"}

class RecommendationEngine:
    """Generate weather-based recommendations using LLM"""
    
    async def get_user_recommendations(
        self, 
        user_id: str, 
        limit: int = 10, 
        offset: int = 0
    ) -> List[Recommendation]:
        """Get user's recommendations from database"""
        collection = db.recommendations
        cursor = collection.find(
            {"user_id": user_id}
        ).sort("created_at", -1).skip(offset).limit(limit)
        
        recommendations = []
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            recommendations.append(Recommendation(**doc))
        
        return recommendations
    
    async def generate_recommendations(
        self, 
        user_id: str, 
        force_refresh: bool = False
    ) -> List[Recommendation]:
        """Generate new recommendations for user"""
        
        # Get user's calendar events
        events = await self._get_user_events(user_id)
        if not events:
            return []
        
        recommendations = []
        
        for event in events:
            # Get weather data for event location and time
            weather = await self._get_weather_for_event(event)
            if not weather:
                continue
            
            # Generate recommendation using LLM
            recommendation = await self._generate_llm_recommendation(event, weather)
            if recommendation:
                # Save to database
                rec_id = await self._save_recommendation(user_id, event, weather, recommendation)
                recommendations.append(rec_id)
        
        return recommendations
    
    async def _get_user_events(self, user_id: str) -> List[CalendarEvent]:
        """Get user's calendar events from calendar service"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{CALENDAR_SERVICE_URL}/api/events",
                    params={"user_id": user_id}
                )
                response.raise_for_status()
                events_data = response.json()
                
                events = []
                for event_data in events_data:
                    events.append(CalendarEvent(**event_data))
                return events
            except Exception as e:
                print(f"Error fetching events: {e}")
                return []
    
    async def _get_weather_for_event(self, event: CalendarEvent) -> Optional[WeatherData]:
        """Get weather data for event location and time"""
        if not event.location:
            return None
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{WEATHER_SERVICE_URL}/api/weather/forecast",
                    params={
                        "location": event.location,
                        "datetime": event.start_time.isoformat()
                    }
                )
                response.raise_for_status()
                weather_data = response.json()
                
                return WeatherData(
                    location=event.location,
                    temperature=weather_data["temperature"],
                    conditions=weather_data["conditions"],
                    humidity=weather_data["humidity"],
                    wind_speed=weather_data["wind_speed"],
                    timestamp=datetime.utcnow()
                )
            except Exception as e:
                print(f"Error fetching weather: {e}")
                return None
    
    async def _generate_llm_recommendation(
        self, 
        event: CalendarEvent, 
        weather: WeatherData
    ) -> Optional[Dict[str, Any]]:
        """Generate recommendation using OpenAI"""
        
        prompt = f"""
        Analyze this calendar event and weather data to provide a helpful recommendation:
        
        Event: {event.title}
        Time: {event.start_time}
        Location: {event.location}
        Description: {event.description or 'No description'}
        
        Weather:
        - Temperature: {weather.temperature}°F
        - Conditions: {weather.conditions}
        - Humidity: {weather.humidity}%
        - Wind Speed: {weather.wind_speed} mph
        
        Provide a brief, helpful recommendation about this event considering the weather.
        Focus on practical advice like clothing suggestions, rescheduling recommendations, or activity modifications.
        Keep it concise and actionable.
        """
        
        try:
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful weather assistant that provides practical recommendations for calendar events based on weather conditions."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.7
            )
            
            recommendation_text = response.choices[0].message.content.strip()
            
            # Determine recommendation type based on content
            rec_type = self._classify_recommendation_type(recommendation_text)
            
            return {
                "title": f"Weather advice for {event.title}",
                "message": recommendation_text,
                "type": rec_type,
                "confidence": 0.8  # Could be calculated based on weather severity
            }
        except Exception as e:
            print(f"Error generating LLM recommendation: {e}")
            return None
    
    def _classify_recommendation_type(self, text: str) -> RecommendationType:
        """Classify recommendation type based on content"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ["rain", "storm", "severe", "warning"]):
            return RecommendationType.WEATHER_WARNING
        elif any(word in text_lower for word in ["reschedule", "postpone", "cancel"]):
            return RecommendationType.RESCHEDULE_ADVICE
        elif any(word in text_lower for word in ["jacket", "coat", "umbrella", "clothing"]):
            return RecommendationType.CLOTHING_ADVICE
        else:
            return RecommendationType.ACTIVITY_SUGGESTION
    
    async def _save_recommendation(
        self, 
        user_id: str, 
        event: CalendarEvent, 
        weather: WeatherData, 
        recommendation: Dict[str, Any]
    ) -> str:
        """Save recommendation to database"""
        collection = db.recommendations
        
        rec_doc = {
            "user_id": user_id,
            "event_id": event.id,
            "type": recommendation["type"],
            "title": recommendation["title"],
            "message": recommendation["message"],
            "confidence": recommendation["confidence"],
            "created_at": datetime.utcnow(),
            "is_read": False,
            "weather_data": weather.dict(),
            "event_data": event.dict()
        }
        
        result = await collection.insert_one(rec_doc)
        return str(result.inserted_id)
    
    async def mark_as_read(self, recommendation_id: str, user_id: str):
        """Mark recommendation as read"""
        collection = db.recommendations
        await collection.update_one(
            {"_id": ObjectId(recommendation_id), "user_id": user_id},
            {"$set": {"is_read": True}}
        )

class NotificationService:
    """Handle user notifications"""
    
    async def get_user_notifications(
        self, 
        user_id: str, 
        limit: int = 20, 
        offset: int = 0
    ) -> List[Notification]:
        """Get user's notifications from database"""
        collection = db.notifications
        cursor = collection.find(
            {"user_id": user_id}
        ).sort("created_at", -1).skip(offset).limit(limit)
        
        notifications = []
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            notifications.append(Notification(**doc))
        
        return notifications
    
    async def mark_as_read(self, notification_id: str, user_id: str):
        """Mark notification as read"""
        collection = db.notifications
        await collection.update_one(
            {"_id": ObjectId(notification_id), "user_id": user_id},
            {"$set": {"is_read": True}}
        )

# Service instances
oauth_service = OAuthService()
recommendation_engine = RecommendationEngine()
notification_service = NotificationService()
