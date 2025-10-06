// Weather-specific types and interfaces

export interface WeatherRequest {
  latitude: number;
  longitude: number;
  units?: "metric" | "imperial";
}

export interface ForecastRequest {
  latitude: number;
  longitude: number;
  units?: "metric" | "imperial";
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
  location: string;
  timestamp: string;
}

export interface ForecastDay {
  date: string;
  dayName: string;
  highTemp: number;
  lowTemp: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
  precipitation: number;
}

export interface ForecastData {
  location: string;
  days: ForecastDay[];
}

export interface WeatherResponse {
  success: boolean;
  data: WeatherData;
  cached: boolean;
  error?: string;
}

export interface ForecastResponse {
  success: boolean;
  data: ForecastData;
  cached: boolean;
  error?: string;
}

// OpenWeatherMap API response types
export interface OpenWeatherMain {
  temp: number;
  temp_min: number;
  temp_max: number;
  humidity: number;
  pressure: number;
}

export interface OpenWeatherWeather {
  description: string;
  icon: string;
}

export interface OpenWeatherWind {
  speed: number;
  deg: number;
}

export interface OpenWeatherCurrentResponse {
  main: OpenWeatherMain;
  weather: OpenWeatherWeather[];
  wind: OpenWeatherWind;
  name: string;
  sys: {
    country: string;
  };
}

export interface OpenWeatherForecastItem {
  dt: number;
  main: OpenWeatherMain;
  weather: OpenWeatherWeather[];
  wind: OpenWeatherWind;
  pop: number;
}

export interface OpenWeatherForecastResponse {
  city: {
    name: string;
    country: string;
    timezone: number;
  };
  list: OpenWeatherForecastItem[];
}
