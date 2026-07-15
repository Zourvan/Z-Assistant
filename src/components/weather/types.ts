export interface WeatherLocation {
  country: string;
  city: string;
  region?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface CurrentWeather {
  temperature: number;
  humidity: number;
  wind_speed: number;
  condition: string;
  weather_code: number;
}

export interface DailyForecast {
  date: string;
  min_temp: number;
  max_temp: number;
  condition: string;
  weather_code: number;
  humidity: number;
  wind_speed: number;
}

export interface WeatherData {
  current: CurrentWeather;
  forecast: DailyForecast[];
}

export interface WeatherCache {
  locationKey: string;
  data: WeatherData;
  currentLastFetch: string;
  forecastLastFetch: string;
}

export interface GeocodingResult {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export type WeatherErrorCode = "api_failed" | "invalid_location" | "rate_limit" | "network";

export interface WeatherFetchResult {
  data: WeatherData | null;
  fromCache: boolean;
  staleCache: boolean;
  error: WeatherErrorCode | null;
}
