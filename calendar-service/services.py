import httpx
import redis
import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import asyncio

# Google Calendar imports
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Microsoft Graph imports
import msal
import requests

from models import (
    CalendarEvent, CalendarProvider, EventStatus, CalendarSync,
    WebhookEvent, CalendarInfo, OAuthToken
)

# Environment variables
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
MICROSOFT_CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID")
MICROSOFT_CLIENT_SECRET = os.getenv("MICROSOFT_CLIENT_SECRET")

# Redis connection
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

class GoogleCalendarService:
    """Google Calendar integration service"""
    
    def __init__(self):
        self.client_id = GOOGLE_CLIENT_ID
        self.client_secret = GOOGLE_CLIENT_SECRET
        self.scopes = [
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events.readonly'
        ]
    
    async def get_user_events(
        self, 
        user_id: str, 
        start_date: datetime, 
        end_date: datetime,
        limit: int = 50,
        offset: int = 0
    ) -> List[CalendarEvent]:
        """Get user's Google Calendar events"""
        try:
            # Get user's credentials from cache
            credentials = await self._get_user_credentials(user_id)
            if not credentials:
                return []
            
            # Build Google Calendar service
            service = build('calendar', 'v3', credentials=credentials)
            
            # Format dates for Google Calendar API
            time_min = start_date.isoformat() + 'Z'
            time_max = end_date.isoformat() + 'Z'
            
            # Get events
            events_result = service.events().list(
                calendarId='primary',
                timeMin=time_min,
                timeMax=time_max,
                maxResults=limit,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            
            # Convert to our format
            calendar_events = []
            for event in events:
                calendar_events.append(self._convert_google_event(event, user_id))
            
            return calendar_events
            
        except HttpError as e:
            print(f"Google Calendar API error: {e}")
            return []
        except Exception as e:
            print(f"Error getting Google Calendar events: {e}")
            return []
    
    async def get_user_calendars(self, user_id: str) -> List[CalendarInfo]:
        """Get user's Google Calendar calendars"""
        try:
            credentials = await self._get_user_credentials(user_id)
            if not credentials:
                return []
            
            service = build('calendar', 'v3', credentials=credentials)
            calendar_list = service.calendarList().list().execute()
            
            calendars = []
            for calendar in calendar_list.get('items', []):
                calendars.append(CalendarInfo(
                    id=calendar['id'],
                    name=calendar['summary'],
                    provider=CalendarProvider.GOOGLE,
                    primary=calendar.get('primary', False),
                    access_role=calendar.get('accessRole', 'reader'),
                    description=calendar.get('description')
                ))
            
            return calendars
            
        except Exception as e:
            print(f"Error getting Google Calendar calendars: {e}")
            return []
    
    async def sync_user_calendar(self, user_id: str, force_full_sync: bool = False) -> Dict[str, Any]:
        """Sync user's Google Calendar"""
        try:
            # Get existing sync status
            sync_status = await self._get_sync_status(user_id)
            
            if not force_full_sync and sync_status:
                # Incremental sync
                events = await self._get_events_since(user_id, sync_status['last_sync'])
            else:
                # Full sync
                start_date = datetime.utcnow() - timedelta(days=30)
                end_date = datetime.utcnow() + timedelta(days=30)
                events = await self.get_user_events(user_id, start_date, end_date)
            
            # Update sync status
            await self._update_sync_status(user_id, datetime.utcnow())
            
            return {
                "events_synced": len(events),
                "sync_time": datetime.utcnow(),
                "status": "success"
            }
            
        except Exception as e:
            print(f"Error syncing Google Calendar: {e}")
            return {"events_synced": 0, "status": "error"}
    
    async def get_sync_status(self, user_id: str) -> Dict[str, Any]:
        """Get sync status for user"""
        return await self._get_sync_status(user_id)
    
    def _convert_google_event(self, event: Dict[str, Any], user_id: str) -> CalendarEvent:
        """Convert Google Calendar event to our format"""
        start = event.get('start', {})
        end = event.get('end', {})
        
        # Parse start time
        if 'dateTime' in start:
            start_time = datetime.fromisoformat(start['dateTime'].replace('Z', '+00:00'))
        else:
            start_time = datetime.fromisoformat(start['date'] + 'T00:00:00+00:00')
        
        # Parse end time
        if 'dateTime' in end:
            end_time = datetime.fromisoformat(end['dateTime'].replace('Z', '+00:00'))
        else:
            end_time = datetime.fromisoformat(end['date'] + 'T23:59:59+00:00')
        
        # Get attendees
        attendees = []
        for attendee in event.get('attendees', []):
            attendees.append(attendee.get('email', ''))
        
        return CalendarEvent(
            id=event['id'],
            title=event.get('summary', 'No Title'),
            description=event.get('description'),
            start_time=start_time,
            end_time=end_time,
            location=event.get('location'),
            attendees=attendees,
            status=EventStatus.CONFIRMED if event.get('status') == 'confirmed' else EventStatus.TENTATIVE,
            provider=CalendarProvider.GOOGLE,
            provider_event_id=event['id'],
            user_id=user_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            is_all_day='date' in start
        )
    
    async def _get_user_credentials(self, user_id: str) -> Optional[Credentials]:
        """Get user's OAuth credentials from cache"""
        try:
            creds_data = redis_client.get(f"google_creds:{user_id}")
            if not creds_data:
                return None
            
            creds_dict = json.loads(creds_data)
            creds = Credentials.from_authorized_user_info(creds_dict, self.scopes)
            
            # Refresh if needed
            if creds.expired and creds.refresh_token:
                creds.refresh(Request())
                await self._store_user_credentials(user_id, creds)
            
            return creds
        except Exception as e:
            print(f"Error getting user credentials: {e}")
            return None
    
    async def _store_user_credentials(self, user_id: str, credentials: Credentials):
        """Store user's OAuth credentials in cache"""
        creds_dict = {
            'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': credentials.scopes
        }
        redis_client.setex(f"google_creds:{user_id}", 3600, json.dumps(creds_dict))
    
    async def _get_sync_status(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get sync status from cache"""
        status_data = redis_client.get(f"google_sync:{user_id}")
        if status_data:
            return json.loads(status_data)
        return None
    
    async def _update_sync_status(self, user_id: str, sync_time: datetime):
        """Update sync status in cache"""
        status = {
            "last_sync": sync_time.isoformat(),
            "status": "active"
        }
        redis_client.setex(f"google_sync:{user_id}", 86400, json.dumps(status, default=str))

class MicrosoftCalendarService:
    """Microsoft Graph Calendar integration service"""
    
    def __init__(self):
        self.client_id = MICROSOFT_CLIENT_ID
        self.client_secret = MICROSOFT_CLIENT_SECRET
        self.authority = "https://login.microsoftonline.com/common"
        self.scope = ["https://graph.microsoft.com/Calendars.Read"]
    
    async def get_user_events(
        self, 
        user_id: str, 
        start_date: datetime, 
        end_date: datetime,
        limit: int = 50,
        offset: int = 0
    ) -> List[CalendarEvent]:
        """Get user's Microsoft Calendar events"""
        try:
            # Get access token
            access_token = await self._get_access_token(user_id)
            if not access_token:
                return []
            
            # Format dates for Microsoft Graph
            start_time = start_date.isoformat() + 'Z'
            end_time = end_date.isoformat() + 'Z'
            
            # Get events from Microsoft Graph
            url = f"https://graph.microsoft.com/v1.0/me/events"
            params = {
                'startDateTime': start_time,
                'endDateTime': end_time,
                '$top': limit,
                '$skip': offset,
                '$orderby': 'start/dateTime'
            }
            
            headers = {'Authorization': f'Bearer {access_token}'}
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, headers=headers)
                response.raise_for_status()
                data = response.json()
            
            events = data.get('value', [])
            
            # Convert to our format
            calendar_events = []
            for event in events:
                calendar_events.append(self._convert_microsoft_event(event, user_id))
            
            return calendar_events
            
        except Exception as e:
            print(f"Error getting Microsoft Calendar events: {e}")
            return []
    
    async def get_user_calendars(self, user_id: str) -> List[CalendarInfo]:
        """Get user's Microsoft Calendar calendars"""
        try:
            access_token = await self._get_access_token(user_id)
            if not access_token:
                return []
            
            url = "https://graph.microsoft.com/v1.0/me/calendars"
            headers = {'Authorization': f'Bearer {access_token}'}
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                data = response.json()
            
            calendars = []
            for calendar in data.get('value', []):
                calendars.append(CalendarInfo(
                    id=calendar['id'],
                    name=calendar['name'],
                    provider=CalendarProvider.MICROSOFT,
                    primary=calendar.get('isDefaultCalendar', False),
                    access_role=calendar.get('permissions', {}).get('role', 'reader'),
                    description=calendar.get('description')
                ))
            
            return calendars
            
        except Exception as e:
            print(f"Error getting Microsoft Calendar calendars: {e}")
            return []
    
    async def sync_user_calendar(self, user_id: str, force_full_sync: bool = False) -> Dict[str, Any]:
        """Sync user's Microsoft Calendar"""
        try:
            # Similar to Google sync implementation
            start_date = datetime.utcnow() - timedelta(days=30)
            end_date = datetime.utcnow() + timedelta(days=30)
            events = await self.get_user_events(user_id, start_date, end_date)
            
            return {
                "events_synced": len(events),
                "sync_time": datetime.utcnow(),
                "status": "success"
            }
            
        except Exception as e:
            print(f"Error syncing Microsoft Calendar: {e}")
            return {"events_synced": 0, "status": "error"}
    
    async def get_sync_status(self, user_id: str) -> Dict[str, Any]:
        """Get sync status for user"""
        status_data = redis_client.get(f"microsoft_sync:{user_id}")
        if status_data:
            return json.loads(status_data)
        return {"status": "not_synced"}
    
    def _convert_microsoft_event(self, event: Dict[str, Any], user_id: str) -> CalendarEvent:
        """Convert Microsoft Graph event to our format"""
        start = event.get('start', {})
        end = event.get('end', {})
        
        # Parse start time
        start_time = datetime.fromisoformat(start['dateTime'].replace('Z', '+00:00'))
        
        # Parse end time
        end_time = datetime.fromisoformat(end['dateTime'].replace('Z', '+00:00'))
        
        # Get attendees
        attendees = []
        for attendee in event.get('attendees', []):
            attendees.append(attendee.get('emailAddress', {}).get('address', ''))
        
        return CalendarEvent(
            id=event['id'],
            title=event.get('subject', 'No Title'),
            description=event.get('body', {}).get('content'),
            start_time=start_time,
            end_time=end_time,
            location=event.get('location', {}).get('displayName'),
            attendees=attendees,
            status=EventStatus.CONFIRMED,
            provider=CalendarProvider.MICROSOFT,
            provider_event_id=event['id'],
            user_id=user_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            is_all_day=start.get('dateTime') is None
        )
    
    async def _get_access_token(self, user_id: str) -> Optional[str]:
        """Get access token for user"""
        try:
            token_data = redis_client.get(f"microsoft_token:{user_id}")
            if not token_data:
                return None
            
            token_info = json.loads(token_data)
            return token_info.get('access_token')
        except Exception as e:
            print(f"Error getting access token: {e}")
            return None

class EventProcessor:
    """Process calendar events and webhooks"""
    
    async def process_google_webhook(self, webhook_data: Dict[str, Any]):
        """Process Google Calendar webhook"""
        try:
            # Extract event information from webhook
            resource_id = webhook_data.get('resourceId')
            user_id = webhook_data.get('userId')
            event_type = webhook_data.get('eventType')
            
            # Store webhook event for processing
            webhook_event = WebhookEvent(
                id=f"google_{resource_id}_{int(datetime.utcnow().timestamp())}",
                provider=CalendarProvider.GOOGLE,
                resource_id=resource_id,
                user_id=user_id,
                event_type=event_type,
                event_data=webhook_data,
                created_at=datetime.utcnow()
            )
            
            # Store in cache for processing
            redis_client.setex(
                f"webhook:{webhook_event.id}",
                3600,
                json.dumps(webhook_event.dict(), default=str)
            )
            
        except Exception as e:
            print(f"Error processing Google webhook: {e}")
    
    async def process_microsoft_webhook(self, webhook_data: Dict[str, Any]):
        """Process Microsoft Graph webhook"""
        try:
            # Similar to Google webhook processing
            resource_id = webhook_data.get('resource')
            user_id = webhook_data.get('clientState')
            event_type = webhook_data.get('changeType')
            
            webhook_event = WebhookEvent(
                id=f"microsoft_{resource_id}_{int(datetime.utcnow().timestamp())}",
                provider=CalendarProvider.MICROSOFT,
                resource_id=resource_id,
                user_id=user_id,
                event_type=event_type,
                event_data=webhook_data,
                created_at=datetime.utcnow()
            )
            
            redis_client.setex(
                f"webhook:{webhook_event.id}",
                3600,
                json.dumps(webhook_event.dict(), default=str)
            )
            
        except Exception as e:
            print(f"Error processing Microsoft webhook: {e}")

# Service instances
google_service = GoogleCalendarService()
microsoft_service = MicrosoftCalendarService()
event_processor = EventProcessor()
