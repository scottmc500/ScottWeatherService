from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class CalendarProvider(str, Enum):
    GOOGLE = "google"
    MICROSOFT = "microsoft"

class EventStatus(str, Enum):
    CONFIRMED = "confirmed"
    TENTATIVE = "tentative"
    CANCELLED = "cancelled"

class CalendarEvent(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    attendees: List[str] = []
    status: EventStatus = EventStatus.CONFIRMED
    provider: CalendarProvider
    provider_event_id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    recurrence: Optional[Dict[str, Any]] = None
    is_all_day: bool = False

class CalendarSync(BaseModel):
    id: str
    user_id: str
    provider: CalendarProvider
    provider_calendar_id: str
    last_sync: datetime
    sync_token: Optional[str] = None
    status: str = "active"
    created_at: datetime

class WebhookEvent(BaseModel):
    id: str
    provider: CalendarProvider
    resource_id: str
    user_id: str
    event_type: str  # created, updated, deleted
    event_data: Dict[str, Any]
    processed: bool = False
    created_at: datetime

class OAuthToken(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "Bearer"
    expires_in: int
    scope: str
    provider: CalendarProvider

class SyncRequest(BaseModel):
    user_id: str
    provider: CalendarProvider
    force_full_sync: bool = False

class SyncResponse(BaseModel):
    user_id: str
    provider: CalendarProvider
    events_synced: int
    sync_time: datetime
    status: str

class EventListResponse(BaseModel):
    events: List[CalendarEvent]
    total_count: int
    has_more: bool
    next_page_token: Optional[str] = None

class CalendarInfo(BaseModel):
    id: str
    name: str
    provider: CalendarProvider
    primary: bool = False
    access_role: str
    description: Optional[str] = None
