from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class UserProvider(str, Enum):
    GOOGLE = "google"
    MICROSOFT = "microsoft"

class User(BaseModel):
    id: str
    provider: UserProvider
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    preferences: Dict[str, Any] = {}

class WeatherData(BaseModel):
    location: str
    temperature: float
    conditions: str
    humidity: int
    wind_speed: float
    timestamp: datetime

class CalendarEvent(BaseModel):
    id: str
    title: str
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    description: Optional[str] = None
    attendees: List[str] = []

class RecommendationType(str, Enum):
    WEATHER_WARNING = "weather_warning"
    ACTIVITY_SUGGESTION = "activity_suggestion"
    RESCHEDULE_ADVICE = "reschedule_advice"
    CLOTHING_ADVICE = "clothing_advice"

class Recommendation(BaseModel):
    id: str
    user_id: str
    event_id: Optional[str] = None
    type: RecommendationType
    title: str
    message: str
    confidence: float = Field(ge=0.0, le=1.0)
    created_at: datetime
    is_read: bool = False
    weather_data: Optional[WeatherData] = None
    event_data: Optional[CalendarEvent] = None

class Notification(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    created_at: datetime
    is_read: bool = False
    data: Dict[str, Any] = {}

class OAuthToken(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "Bearer"
    expires_in: int
    scope: str

class UserProfile(BaseModel):
    id: str
    provider: UserProvider
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
    preferences: Dict[str, Any] = {}
    created_at: datetime
    last_login: Optional[datetime] = None

class GenerateRecommendationsRequest(BaseModel):
    user_id: str
    force_refresh: bool = False

class GenerateRecommendationsResponse(BaseModel):
    recommendations: List[Recommendation]
    generated_at: datetime
    total_count: int
