import httpx
import redis
import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import asyncio
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError

from models import (
    WeatherData, WeatherForecast, WeatherAlert, LocationData,
    AirQualityData, UVIndexData, WeatherCondition, WeatherAlertType
)

# Environment variables
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
OPENWEATHERMAP_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")
OPENWEATHERMAP_BASE_URL = "https://api.openweathermap.org/data/2.5"

# Redis connection
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# Geocoder
geolocator = Nominatim(user_agent="weather_service")

class OpenWeatherService:
    """OpenWeatherMap API integration service"""
    
    def __init__(self):
        self.api_key = OPENWEATHERMAP_API_KEY
        self.base_url = OPENWEATHERMAP_BASE_URL
        if not self.api_key:
            raise ValueError("OPENWEATHERMAP_API_KEY environment variable is required")
    
    async def get_current_weather(
        self, 
        latitude: float, 
        longitude: float, 
        units: str = "imperial",
        language: str = "en"
    ) -> WeatherData:
        """Get current weather data from OpenWeatherMap"""
        try:
            url = f"{self.base_url}/weather"
            params = {
                'lat': latitude,
                'lon': longitude,
                'appid': self.api_key,
                'units': units,
                'lang': language
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
            
            return self._convert_current_weather(data)
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                raise Exception("Invalid OpenWeatherMap API key")
            elif e.response.status_code == 404:
                raise Exception("Location not found")
            else:
                raise Exception(f"OpenWeatherMap API error: {e.response.status_code}")
        except Exception as e:
            raise Exception(f"Failed to get current weather: {str(e)}")
    
    async def get_weather_forecast(
        self, 
        latitude: float, 
        longitude: float, 
        days: int = 5,
        units: str = "imperial",
        language: str = "en"
    ) -> WeatherForecast:
        """Get weather forecast from OpenWeatherMap"""
        try:
            url = f"{self.base_url}/forecast"
            params = {
                'lat': latitude,
                'lon': longitude,
                'appid': self.api_key,
                'units': units,
                'lang': language,
                'cnt': days * 8  # 8 forecasts per day (3-hour intervals)
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
            
            forecast_data = []
            for item in data['list']:
                weather_data = self._convert_forecast_item(item)
                forecast_data.append(weather_data)
            
            return WeatherForecast(
                location=data['city']['name'],
                latitude=data['city']['coord']['lat'],
                longitude=data['city']['coord']['lon'],
                forecast_data=forecast_data,
                generated_at=datetime.utcnow(),
                timezone=data['city'].get('timezone', 'UTC')
            )
            
        except Exception as e:
            raise Exception(f"Failed to get weather forecast: {str(e)}")
    
    async def get_hourly_forecast(
        self, 
        latitude: float, 
        longitude: float, 
        hours: int = 24,
        units: str = "imperial",
        language: str = "en"
    ) -> List[WeatherData]:
        """Get hourly weather forecast from OpenWeatherMap"""
        try:
            url = f"{self.base_url}/forecast"
            params = {
                'lat': latitude,
                'lon': longitude,
                'appid': self.api_key,
                'units': units,
                'lang': language,
                'cnt': min(hours, 40)  # OpenWeatherMap free tier limit
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
            
            hourly_data = []
            for item in data['list']:
                weather_data = self._convert_forecast_item(item)
                hourly_data.append(weather_data)
            
            return hourly_data
            
        except Exception as e:
            raise Exception(f"Failed to get hourly forecast: {str(e)}")
    
    async def get_weather_alerts(
        self, 
        latitude: float, 
        longitude: float
    ) -> List[WeatherAlert]:
        """Get weather alerts from OpenWeatherMap"""
        try:
            url = f"{self.base_url}/onecall"
            params = {
                'lat': latitude,
                'lon': longitude,
                'appid': self.api_key,
                'exclude': 'current,minutely,hourly,daily'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
            
            alerts = []
            for alert_data in data.get('alerts', []):
                alert = self._convert_weather_alert(alert_data)
                alerts.append(alert)
            
            return alerts
            
        except Exception as e:
            # Alerts are not available in all regions, so this is not critical
            print(f"Warning: Could not get weather alerts: {e}")
            return []
    
    async def get_air_quality(
        self, 
        latitude: float, 
        longitude: float
    ) -> AirQualityData:
        """Get air quality data from OpenWeatherMap"""
        try:
            url = f"{self.base_url}/air_pollution"
            params = {
                'lat': latitude,
                'lon': longitude,
                'appid': self.api_key
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
            
            return self._convert_air_quality(data)
            
        except Exception as e:
            raise Exception(f"Failed to get air quality: {str(e)}")
    
    async def get_uv_index(
        self, 
        latitude: float, 
        longitude: float
    ) -> UVIndexData:
        """Get UV index from OpenWeatherMap"""
        try:
            url = f"{self.base_url}/uvi"
            params = {
                'lat': latitude,
                'lon': longitude,
                'appid': self.api_key
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
            
            return self._convert_uv_index(data, latitude, longitude)
            
        except Exception as e:
            raise Exception(f"Failed to get UV index: {str(e)}")
    
    def _convert_current_weather(self, data: Dict[str, Any]) -> WeatherData:
        """Convert OpenWeatherMap current weather data to our format"""
        weather_info = data['weather'][0]
        
        return WeatherData(
            location=data['name'],
            latitude=data['coord']['lat'],
            longitude=data['coord']['lon'],
            temperature=data['main']['temp'],
            feels_like=data['main']['feels_like'],
            humidity=data['main']['humidity'],
            pressure=data['main']['pressure'],
            visibility=data.get('visibility', 0) / 1000,  # Convert to km
            wind_speed=data['wind']['speed'],
            wind_direction=data['wind'].get('deg', 0),
            conditions=self._map_weather_condition(weather_info['main']),
            description=weather_info['description'],
            icon=weather_info['icon'],
            timestamp=datetime.utcnow(),
            timezone=data.get('timezone', 'UTC')
        )
    
    def _convert_forecast_item(self, item: Dict[str, Any]) -> WeatherData:
        """Convert OpenWeatherMap forecast item to our format"""
        weather_info = item['weather'][0]
        
        return WeatherData(
            location="",  # Will be set by the forecast
            latitude=0,    # Will be set by the forecast
            longitude=0,  # Will be set by the forecast
            temperature=item['main']['temp'],
            feels_like=item['main']['feels_like'],
            humidity=item['main']['humidity'],
            pressure=item['main']['pressure'],
            visibility=item.get('visibility', 0) / 1000,
            wind_speed=item['wind']['speed'],
            wind_direction=item['wind'].get('deg', 0),
            conditions=self._map_weather_condition(weather_info['main']),
            description=weather_info['description'],
            icon=weather_info['icon'],
            timestamp=datetime.fromtimestamp(item['dt']),
            timezone="UTC"
        )
    
    def _convert_weather_alert(self, alert_data: Dict[str, Any]) -> WeatherAlert:
        """Convert OpenWeatherMap alert to our format"""
        return WeatherAlert(
            id=alert_data.get('id', ''),
            location=alert_data.get('areas', ['Unknown'])[0],
            alert_type=self._map_alert_type(alert_data.get('event', '')),
            severity=alert_data.get('severity', 'moderate'),
            title=alert_data.get('event', 'Weather Alert'),
            description=alert_data.get('description', ''),
            start_time=datetime.fromtimestamp(alert_data.get('start', 0)),
            end_time=datetime.fromtimestamp(alert_data.get('end', 0)),
            areas_affected=alert_data.get('areas', []),
            source=alert_data.get('sender_name', 'OpenWeatherMap'),
            created_at=datetime.utcnow()
        )
    
    def _convert_air_quality(self, data: Dict[str, Any]) -> AirQualityData:
        """Convert OpenWeatherMap air quality data to our format"""
        components = data['list'][0]['components']
        
        return AirQualityData(
            location="",  # Will be set by caller
            aqi=data['list'][0]['main']['aqi'],
            pm2_5=components.get('pm2_5', 0),
            pm10=components.get('pm10', 0),
            o3=components.get('o3', 0),
            no2=components.get('no2', 0),
            so2=components.get('so2', 0),
            co=components.get('co', 0),
            timestamp=datetime.utcnow()
        )
    
    def _convert_uv_index(self, data: Dict[str, Any], latitude: float, longitude: float) -> UVIndexData:
        """Convert OpenWeatherMap UV index data to our format"""
        uv_value = data['value']
        
        return UVIndexData(
            location="",  # Will be set by caller
            uv_index=int(uv_value),
            uv_category=self._get_uv_category(uv_value),
            safe_exposure_time=self._get_safe_exposure_time(uv_value),
            timestamp=datetime.utcnow()
        )
    
    def _map_weather_condition(self, condition: str) -> WeatherCondition:
        """Map OpenWeatherMap condition to our enum"""
        condition_map = {
            'Clear': WeatherCondition.CLEAR,
            'Clouds': WeatherCondition.CLOUDS,
            'Rain': WeatherCondition.RAIN,
            'Snow': WeatherCondition.SNOW,
            'Thunderstorm': WeatherCondition.THUNDERSTORM,
            'Drizzle': WeatherCondition.DRIZZLE,
            'Mist': WeatherCondition.MIST,
            'Fog': WeatherCondition.FOG,
            'Haze': WeatherCondition.HAZE,
            'Dust': WeatherCondition.DUST,
            'Sand': WeatherCondition.SAND,
            'Ash': WeatherCondition.ASH,
            'Squall': WeatherCondition.SQUALL,
            'Tornado': WeatherCondition.TORNADO
        }
        return condition_map.get(condition, WeatherCondition.CLEAR)
    
    def _map_alert_type(self, event: str) -> WeatherAlertType:
        """Map OpenWeatherMap event to our alert type"""
        event_lower = event.lower()
        
        if 'thunderstorm' in event_lower:
            return WeatherAlertType.SEVERE_THUNDERSTORM
        elif 'tornado' in event_lower:
            return WeatherAlertType.TORNADO
        elif 'hurricane' in event_lower:
            return WeatherAlertType.HURRICANE
        elif 'flood' in event_lower:
            return WeatherAlertType.FLOOD
        elif 'winter' in event_lower or 'snow' in event_lower:
            return WeatherAlertType.WINTER_STORM
        elif 'heat' in event_lower:
            return WeatherAlertType.HEAT_WAVE
        elif 'cold' in event_lower:
            return WeatherAlertType.COLD_WAVE
        elif 'wind' in event_lower:
            return WeatherAlertType.WIND
        elif 'fog' in event_lower:
            return WeatherAlertType.FOG
        elif 'dust' in event_lower:
            return WeatherAlertType.DUST_STORM
        else:
            return WeatherAlertType.SEVERE_THUNDERSTORM
    
    def _get_uv_category(self, uv_value: float) -> str:
        """Get UV category based on UV index value"""
        if uv_value <= 2:
            return "low"
        elif uv_value <= 5:
            return "moderate"
        elif uv_value <= 7:
            return "high"
        elif uv_value <= 10:
            return "very_high"
        else:
            return "extreme"
    
    def _get_safe_exposure_time(self, uv_value: float) -> Optional[int]:
        """Get safe exposure time in minutes based on UV index"""
        if uv_value <= 2:
            return 60  # 1 hour
        elif uv_value <= 5:
            return 30  # 30 minutes
        elif uv_value <= 7:
            return 20  # 20 minutes
        elif uv_value <= 10:
            return 10  # 10 minutes
        else:
            return 5   # 5 minutes

class LocationService:
    """Location and geocoding service"""
    
    async def get_location_info(self, location_query: str) -> Optional[LocationData]:
        """Get location information from a query"""
        try:
            # Try to parse as coordinates first
            if ',' in location_query:
                try:
                    lat, lon = map(float, location_query.split(','))
                    return await self.reverse_geocode(lat, lon)
                except ValueError:
                    pass
            
            # Geocode the location
            location = await self._geocode_with_retry(location_query)
            if not location:
                return None
            
            return LocationData(
                name=location.address.split(',')[0],
                latitude=location.latitude,
                longitude=location.longitude,
                country=location.raw.get('address', {}).get('country', ''),
                state=location.raw.get('address', {}).get('state', ''),
                timezone=location.raw.get('timezone', 'UTC'),
                formatted_address=location.address
            )
            
        except Exception as e:
            print(f"Error getting location info: {e}")
            return None
    
    async def geocode_query(self, query: str, limit: int = 5) -> List[LocationData]:
        """Geocode a query and return multiple results"""
        try:
            locations = await self._geocode_multiple_with_retry(query, limit)
            
            results = []
            for location in locations:
                results.append(LocationData(
                    name=location.address.split(',')[0],
                    latitude=location.latitude,
                    longitude=location.longitude,
                    country=location.raw.get('address', {}).get('country', ''),
                    state=location.raw.get('address', {}).get('state', ''),
                    timezone=location.raw.get('timezone', 'UTC'),
                    formatted_address=location.address
                ))
            
            return results
            
        except Exception as e:
            print(f"Error geocoding query: {e}")
            return []
    
    async def reverse_geocode(self, latitude: float, longitude: float) -> LocationData:
        """Reverse geocode coordinates to location"""
        try:
            location = await self._reverse_geocode_with_retry(latitude, longitude)
            if not location:
                raise Exception("Location not found")
            
            return LocationData(
                name=location.address.split(',')[0],
                latitude=location.latitude,
                longitude=location.longitude,
                country=location.raw.get('address', {}).get('country', ''),
                state=location.raw.get('address', {}).get('state', ''),
                timezone=location.raw.get('timezone', 'UTC'),
                formatted_address=location.address
            )
            
        except Exception as e:
            print(f"Error reverse geocoding: {e}")
            raise
    
    async def _geocode_with_retry(self, query: str, max_retries: int = 3) -> Optional[Any]:
        """Geocode with retry logic"""
        for attempt in range(max_retries):
            try:
                return geolocator.geocode(query, timeout=10)
            except (GeocoderTimedOut, GeocoderServiceError) as e:
                if attempt == max_retries - 1:
                    print(f"Geocoding failed after {max_retries} attempts: {e}")
                    return None
                await asyncio.sleep(1)
        return None
    
    async def _geocode_multiple_with_retry(self, query: str, limit: int, max_retries: int = 3) -> List[Any]:
        """Geocode multiple results with retry logic"""
        for attempt in range(max_retries):
            try:
                return geolocator.geocode(query, exactly_one=False, limit=limit, timeout=10)
            except (GeocoderTimedOut, GeocoderServiceError) as e:
                if attempt == max_retries - 1:
                    print(f"Geocoding failed after {max_retries} attempts: {e}")
                    return []
                await asyncio.sleep(1)
        return []
    
    async def _reverse_geocode_with_retry(self, latitude: float, longitude: float, max_retries: int = 3) -> Optional[Any]:
        """Reverse geocode with retry logic"""
        for attempt in range(max_retries):
            try:
                return geolocator.reverse(f"{latitude}, {longitude}", timeout=10)
            except (GeocoderTimedOut, GeocoderServiceError) as e:
                if attempt == max_retries - 1:
                    print(f"Reverse geocoding failed after {max_retries} attempts: {e}")
                    return None
                await asyncio.sleep(1)
        return None

class CacheService:
    """Weather data caching service"""
    
    async def get_weather_data(self, cache_key: str) -> Optional[Any]:
        """Get weather data from cache"""
        try:
            cached_data = redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
            return None
        except Exception as e:
            print(f"Error getting cached weather data: {e}")
            return None
    
    async def set_weather_data(self, cache_key: str, data: Any, ttl: int = 3600):
        """Set weather data in cache"""
        try:
            redis_client.setex(cache_key, ttl, json.dumps(data, default=str))
        except Exception as e:
            print(f"Error setting cached weather data: {e}")
    
    async def get_active_alerts(self) -> List[WeatherAlert]:
        """Get all active weather alerts from cache"""
        try:
            # This would typically query a database or cache for active alerts
            # For now, return empty list
            return []
        except Exception as e:
            print(f"Error getting active alerts: {e}")
            return []

# Service instances
openweather_service = OpenWeatherService()
location_service = LocationService()
cache_service = CacheService()
