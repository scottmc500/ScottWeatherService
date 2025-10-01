from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer
from typing import List, Optional
from datetime import datetime, timedelta
import os

from models import (
    CalendarEvent, EventListResponse, SyncRequest, SyncResponse,
    CalendarInfo, WebhookEvent
)
from services import google_service, microsoft_service, event_processor

# Routers
events = APIRouter()
sync = APIRouter()
webhooks = APIRouter()

security = HTTPBearer()

# Environment variables
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
MICROSOFT_CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID")

# Event endpoints
@events.get("/events")
async def get_events(
    user_id: str = Query(..., description="User ID"),
    provider: Optional[str] = Query(None, description="Calendar provider (google/microsoft)"),
    start_date: Optional[datetime] = Query(None, description="Start date for events"),
    end_date: Optional[datetime] = Query(None, description="End date for events"),
    limit: int = Query(50, ge=1, le=100, description="Number of events to return"),
    offset: int = Query(0, ge=0, description="Number of events to skip"),
    token: str = Depends(security)
):
    """Get user's calendar events"""
    try:
        # Set default date range if not provided
        if not start_date:
            start_date = datetime.utcnow()
        if not end_date:
            end_date = start_date + timedelta(days=30)
        
        # Get events from appropriate provider
        if provider == "google":
            events_list = await google_service.get_user_events(
                user_id, start_date, end_date, limit, offset
            )
        elif provider == "microsoft":
            events_list = await microsoft_service.get_user_events(
                user_id, start_date, end_date, limit, offset
            )
        else:
            # Get events from all providers
            google_events = await google_service.get_user_events(
                user_id, start_date, end_date, limit, offset
            )
            microsoft_events = await microsoft_service.get_user_events(
                user_id, start_date, end_date, limit, offset
            )
            events_list = google_events + microsoft_events
        
        return EventListResponse(
            events=events_list,
            total_count=len(events_list),
            has_more=len(events_list) == limit,
            next_page_token=None  # Implement pagination if needed
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get events: {str(e)}")

@events.get("/events/{event_id}")
async def get_event(
    event_id: str,
    user_id: str = Query(..., description="User ID"),
    token: str = Depends(security)
):
    """Get specific calendar event"""
    try:
        # Try to find event in both providers
        event = await google_service.get_event(user_id, event_id)
        if not event:
            event = await microsoft_service.get_event(user_id, event_id)
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        return event
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get event: {str(e)}")

@events.get("/calendars")
async def get_calendars(
    user_id: str = Query(..., description="User ID"),
    provider: Optional[str] = Query(None, description="Calendar provider"),
    token: str = Depends(security)
):
    """Get user's calendars"""
    try:
        calendars = []
        
        if not provider or provider == "google":
            google_calendars = await google_service.get_user_calendars(user_id)
            calendars.extend(google_calendars)
        
        if not provider or provider == "microsoft":
            microsoft_calendars = await microsoft_service.get_user_calendars(user_id)
            calendars.extend(microsoft_calendars)
        
        return calendars
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get calendars: {str(e)}")

# Sync endpoints
@sync.post("/sync")
async def sync_calendar(request: SyncRequest, token: str = Depends(security)):
    """Sync user's calendar with external provider"""
    try:
        if request.provider == "google":
            result = await google_service.sync_user_calendar(
                request.user_id, request.force_full_sync
            )
        elif request.provider == "microsoft":
            result = await microsoft_service.sync_user_calendar(
                request.user_id, request.force_full_sync
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid provider")
        
        return SyncResponse(
            user_id=request.user_id,
            provider=request.provider,
            events_synced=result["events_synced"],
            sync_time=datetime.utcnow(),
            status="success"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

@sync.get("/status")
async def get_sync_status(
    user_id: str = Query(..., description="User ID"),
    provider: Optional[str] = Query(None, description="Calendar provider"),
    token: str = Depends(security)
):
    """Get sync status for user"""
    try:
        status_info = {}
        
        if not provider or provider == "google":
            google_status = await google_service.get_sync_status(user_id)
            status_info["google"] = google_status
        
        if not provider or provider == "microsoft":
            microsoft_status = await microsoft_service.get_sync_status(user_id)
            status_info["microsoft"] = microsoft_status
        
        return status_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sync status: {str(e)}")

# Webhook endpoints
@webhooks.post("/webhooks/google")
async def google_webhook(webhook_data: dict):
    """Handle Google Calendar webhook notifications"""
    try:
        # Process Google webhook
        await event_processor.process_google_webhook(webhook_data)
        return {"status": "processed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Webhook processing failed: {str(e)}")

@webhooks.post("/webhooks/microsoft")
async def microsoft_webhook(webhook_data: dict):
    """Handle Microsoft Graph webhook notifications"""
    try:
        # Process Microsoft webhook
        await event_processor.process_microsoft_webhook(webhook_data)
        return {"status": "processed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Webhook processing failed: {str(e)}")

@webhooks.get("/webhooks/verify")
async def verify_webhook(
    challenge: str = Query(..., description="Webhook verification challenge")
):
    """Verify webhook endpoint"""
    return {"challenge": challenge}
