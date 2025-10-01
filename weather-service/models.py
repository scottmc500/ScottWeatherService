from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class WeatherCondition(str, Enum):
    CLEAR = "clear"
    CLOUDS = "clouds"
    RAIN = "rain"
    SNOW = "snow"
    THUNDERSTORM = "thunderstorm"
    DRIZZLE = "drizzle"
    MIST = "mist"
    FOG = "fog"
    HAZE = "haze"
    DUST = "dust"
    SAND = "sand"
    ASH = "ash"
    SQUALL = "squall"
    TORNADO = "tornado"

class WeatherAlertType(str, Enum):
    SEVERE_THUNDERSTORM = "severe_thunderstorm"
    TORNADO = "tornado"
    HURRICANE = "hurricane"
    FLOOD = "flood"
    WINTER_STORM = "winter_storm"
    HEAT_WAVE = "heat_wave"
    COLD_WAVE = "cold_wave"
    WIND = "wind"
    FOG = "fog"
    DUST_STORM = "dust_storm"

class WeatherData(BaseModel):
    location: str
    latitude: float
    longitude: float
    temperature: float
    feels_like: float
    humidity: int
    pressure: int
    visibility: int
    wind_speed: float
    wind_direction: int
    conditions: WeatherCondition
    description: str
    icon: str
    timestamp: datetime
    timezone: str

class WeatherForecast(BaseModel):
    location: str
    latitude: float
    longitude: float
    forecast_data: List[WeatherData]
    generated_at: datetime
    timezone: str

class WeatherAlert(BaseModel):
    id: str
    location: str
    alert_type: WeatherAlertType
    severity: str  # minor, moderate, severe, extreme
    title: str
    description: str
    start_time: datetime
    end_time: datetime
    areas_affected: List[str]
    source: str
    created_at: datetime

class LocationData(BaseModel):
    name: str
    latitude: float
    longitude: float
    country: str
    state: Optional[str] = None
    timezone: str
    formatted_address: str

class WeatherRequest(BaseModel):
    location: str
    units: str = "imperial"  # imperial, metric, kelvin
    language: str = "en"

class ForecastRequest(BaseModel):
    location: str
    days: int = Field(5, ge=1, le=16)
    units: str = "imperial"
    language: str = "en"

class WeatherResponse(BaseModel):
    current: WeatherData
    forecast: Optional[WeatherForecast] = None
    alerts: List[WeatherAlert] = []
    location_info: LocationData

class AirQualityData(BaseModel):
    location: str
    aqi: int  # Air Quality Index
    pm2_5: float
    pm10: float
    o3: float
    no2: float
    so2: float
    co: float
    timestamp: datetime

class UVIndexData(BaseModel):
    location: str
    uv_index: int
    uv_category: str  # low, moderate, high, very_high, extreme
    safe_exposure_time: Optional[int] = None  # minutes
    timestamp: datetime

class WeatherHistory(BaseModel):
    location: str
    date: datetime
    temperature_high: float
    temperature_low: float
    conditions: WeatherCondition
    precipitation: float
    humidity: int
    wind_speed: float
