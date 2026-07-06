// Data model of the processed JSON files produced by backend/fetch_weather_data.py

export interface LocationInfo {
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  timezone: string;
}

export interface CurrentWeather {
  time: string | null;
  temperature: number | null;
  feels_like: number | null;
  humidity: number | null;
  precipitation: number | null;
  weather_code: number | null;
  cloud_cover: number | null;
  pressure: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
  wind_gusts: number | null;
  is_day: number | null;
}

export interface HourlyEntry {
  time: string;
  temperature: number | null;
  feels_like: number | null;
  humidity: number | null;
  precipitation_probability: number | null;
  precipitation: number | null;
  weather_code: number | null;
  cloud_cover: number | null;
  visibility: number | null;
  uv_index: number | null;
  pressure?: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
  wind_gusts: number | null;
  is_day: number | null;
}

export interface DailyEntry {
  time: string; // YYYY-MM-DD
  weather_code: number | null;
  temperature_max: number | null;
  temperature_min: number | null;
  feels_like_max: number | null;
  feels_like_min: number | null;
  sunrise: string | null;
  sunset: string | null;
  daylight_duration: number | null;
  sunshine_duration: number | null;
  uv_index_max: number | null;
  precipitation_sum: number | null;
  precipitation_probability_max: number | null;
  wind_speed_max: number | null;
  wind_gusts_max: number | null;
  wind_direction_dominant: number | null;
}

export interface WeatherData {
  location: LocationInfo;
  source: string;
  last_updated: string;
  units: Record<string, string>;
  current: CurrentWeather;
  hourly: HourlyEntry[];
  daily: DailyEntry[];
}

export interface NowcastEntry {
  time: string; // ISO instant with offset (UTC)
  temperature: number | null;
  precipitation: number | null;
  dew_point: number | null;
  wind_direction: number | null;
  wind_speed: number | null;
  wind_gusts: number | null;
}

export interface GeosphereData {
  location: LocationInfo;
  source: string;
  forecast_type: string;
  resolution_minutes: number;
  last_updated: string;
  units: Record<string, string>;
  forecast_data: NowcastEntry[];
}

export interface WeatherAnalysis {
  timestamp: string;
  model?: string;
  english?: string;
  german?: string;
  analysis?: string; // legacy single-language field
}

export type Language = 'en' | 'de';
