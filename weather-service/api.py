from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer
from typing import List, Optional
from datetime import datetime, timedelta

from models import (
    WeatherData, WeatherForecast, WeatherAlert, LocationData,
    WeatherResponse, AirQualityData, UVIndexData, WeatherHistory,
    WeatherRequest, ForecastRequest
)
from services import openweather_service, location_service, cache_service

# Routers
weather = APIRouter()
alerts = APIRouter()
location = APIRouter()

security = HTTPBearer()

# Weather endpoints
@weather.get("/current")
async def get_current_weather(
    location: str = Query(..., description="Location (city, coordinates, or address)"),
    units: str = Query("imperial", description="Temperature units (imperial/metric/kelvin)"),
    language: str = Query("en", description="Language for weather descriptions"),
    token: str = Depends(security)
):
    """Get current weather for a location"""
    try:
        # Get location data
        location_data = await location_service.get_location_info(location)
        if not location_data:
            raise HTTPException(status_code=404, detail="Location not found")
        
        # Check cache first
        cache_key = f"current_weather:{location_data.latitude}:{location_data.longitude}:{units}"
        cached_weather = await cache_service.get_weather_data(cache_key)
        if cached_weather:
            return cached_weather
        
        # Get current weather from OpenWeatherMap
        weather_data = await openweather_service.get_current_weather(
            location_data.latitude, 
            location_data.longitude, 
            units, 
            language
        )
        
        # Get weather alerts
        weather_alerts = await openweather_service.get_weather_alerts(
            location_data.latitude, 
            location_data.longitude
        )
        
        response = WeatherResponse(
            current=weather_data,
            alerts=weather_alerts,
            location_info=location_data
        )
        
        # Cache the response
        await cache_service.set_weather_data(cache_key, response, ttl=600)  # 10 minutes
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get current weather: {str(e)}")

@weather.get("/forecast")
async def get_weather_forecast(
    location: str = Query(..., description="Location (city, coordinates, or address)"),
    days: int = Query(5, ge=1, le=16, description="Number of forecast days"),
    units: str = Query("imperial", description="Temperature units"),
    language: str = Query("en", description="Language for weather descriptions"),
    token: str = Depends(security)
):
    """Get weather forecast for a location"""
    try:
        # Get location data
        location_data = await location_service.get_location_info(location)
        if not location_data:
            raise HTTPException(status_code=404, detail="Location not found")
        
        # Check cache first
        cache_key = f"forecast:{location_data.latitude}:{location_data.longitude}:{days}:{units}"
        cached_forecast = await cache_service.get_weather_data(cache_key)
        if cached_forecast:
            return cached_forecast
        
        # Get forecast from OpenWeatherMap
        forecast_data = await openweather_service.get_weather_forecast(
            location_data.latitude,
            location_data.longitude,
            days,
            units,
            language
        )
        
        # Cache the response
        await cache_service.set_weather_data(cache_key, forecast_data, ttl=1800)  # 30 minutes
        
        return forecast_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get weather forecast: {str(e)}")

@weather.get("/hourly")
async def get_hourly_forecast(
    location: str = Query(..., description="Location (city, coordinates, or address)"),
    hours: int = Query(24, ge=1, le=48, description="Number of hours to forecast"),
    units: str = Query("imperial", description="Temperature units"),
    language: str = Query("en", description="Language for weather descriptions"),
    token: str = Depends(security)
):
    """Get hourly weather forecast for a location"""
    try:
        # Get location data
        location_data = await location_service.get_location_info(location)
        if not location_data:
            raise HTTPException(status_code=404, detail="Location not found")
        
        # Check cache first
        cache_key = f"hourly:{location_data.latitude}:{location_data.longitude}:{hours}:{units}"
        cached_forecast = await cache_service.get_weather_data(cache_key)
        if cached_forecast:
            return cached_forecast
        
        # Get hourly forecast from OpenWeatherMap
        hourly_data = await openweather_service.get_hourly_forecast(
            location_data.latitude,
            location_data.longitude,
            hours,
            units,
            language
        )
        
        # Cache the response
        await cache_service.set_weather_data(cache_key, hourly_data, ttl=1800)  # 30 minutes
        
        return hourly_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get hourly forecast: {str(e)}")

@weather.get("/air-quality")
async def get_air_quality(
    location: str = Query(..., description="Location (city, coordinates, or address)"),
    token: str = Depends(security)
):
    """Get air quality data for a location"""
    try:
        # Get location data
        location_data = await location_service.get_location_info(location)
        if not location_data:
            raise HTTPException(status_code=404, detail="Location not found")
        
        # Check cache first
        cache_key = f"air_quality:{location_data.latitude}:{location_data.longitude}"
        cached_air_quality = await cache_service.get_weather_data(cache_key)
        if cached_air_quality:
            return cached_air_quality
        
        # Get air quality from OpenWeatherMap
        air_quality = await openweather_service.get_air_quality(
            location_data.latitude,
            location_data.longitude
        )
        
        # Cache the response
        await cache_service.set_weather_data(cache_key, air_quality, ttl=3600)  # 1 hour
        
        return air_quality
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get air quality: {str(e)}")

@weather.get("/uv-index")
async def get_uv_index(
    location: str = Query(..., description="Location (city, coordinates, or address)"),
    token: str = Depends(security)
):
    """Get UV index for a location"""
    try:
        # Get location data
        location_data = await location_service.get_location_info(location)
        if not location_data:
            raise HTTPException(status_code=404, detail="Location not found")
        
        # Check cache first
        cache_key = f"uv_index:{location_data.latitude}:{location_data.longitude}"
        cached_uv = await cache_service.get_weather_data(cache_key)
        if cached_uv:
            return cached_uv
        
        # Get UV index from OpenWeatherMap
        uv_data = await openweather_service.get_uv_index(
            location_data.latitude,
            location_data.longitude
        )
        
        # Cache the response
        await cache_service.set_weather_data(cache_key, uv_data, ttl=1800)  # 30 minutes
        
        return uv_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get UV index: {str(e)}")

# Alert endpoints
@alerts.get("/alerts")
async def get_weather_alerts(
    location: str = Query(..., description="Location (city, coordinates, or address)"),
    token: str = Depends(security)
):
    """Get weather alerts for a location"""
    try:
        # Get location data
        location_data = await location_service.get_location_info(location)
        if not location_data:
            raise HTTPException(status_code=404, detail="Location not found")
        
        # Get weather alerts from OpenWeatherMap
        alerts_data = await openweather_service.get_weather_alerts(
            location_data.latitude,
            location_data.longitude
        )
        
        return alerts_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get weather alerts: {str(e)}")

@alerts.get("/alerts/active")
async def get_active_alerts(
    token: str = Depends(security)
):
    """Get all active weather alerts"""
    try:
        # Get all active alerts from cache or database
        active_alerts = await cache_service.get_active_alerts()
        return active_alerts
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get active alerts: {str(e)}")

# Location endpoints
@location.get("/geocode")
async def geocode_location(
    query: str = Query(..., description="Location query (address, city, etc.)"),
    limit: int = Query(5, ge=1, le=10, description="Maximum number of results"),
    token: str = Depends(security)
):
    """Geocode a location query to coordinates"""
    try:
        locations = await location_service.geocode_query(query, limit)
        return locations
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to geocode location: {str(e)}")

@location.get("/reverse")
async def reverse_geocode(
    latitude: float = Query(..., description="Latitude"),
    longitude: float = Query(..., description="Longitude"),
    token: str = Depends(security)
):
    """Reverse geocode coordinates to location"""
    try:
        location_data = await location_service.reverse_geocode(latitude, longitude)
        return location_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reverse geocode: {str(e)}")
