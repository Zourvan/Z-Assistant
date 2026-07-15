import type { TFunction } from "i18next";
import type {
  CurrentWeather,
  DailyForecast,
  GeocodingResult,
  WeatherData,
  WeatherLocation,
} from "./types";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const FETCH_TIMEOUT_MS = 12_000;
const MAX_RETRIES = 2;

const fetchWithTimeout = async (url: string, signal?: AbortSignal): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", onAbort);
  }
};

const fetchWithRetry = async (url: string, signal?: AbortSignal): Promise<Response> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(url, signal);
      if (response.status === 429) {
        const err = new Error("rate_limit");
        (err as Error & { code: string }).code = "rate_limit";
        throw err;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (signal?.aborted) throw error;
      if ((error as Error & { code?: string }).code === "rate_limit") throw error;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }
  }

  throw lastError;
};

export const getConditionFromCode = (code: number, t: TFunction): string => {
  if (code === 0) return t("weather.conditions.clear");
  if (code === 1) return t("weather.conditions.mainlyClear");
  if (code === 2) return t("weather.conditions.partlyCloudy");
  if (code === 3) return t("weather.conditions.cloudy");
  if (code === 45 || code === 48) return t("weather.conditions.fog");
  if (code >= 51 && code <= 55) return t("weather.conditions.drizzle");
  if (code >= 61 && code <= 65) return t("weather.conditions.rain");
  if (code >= 71 && code <= 77) return t("weather.conditions.snow");
  if (code >= 80 && code <= 82) return t("weather.conditions.showers");
  if (code >= 85 && code <= 86) return t("weather.conditions.snowShowers");
  if (code >= 95 && code <= 99) return t("weather.conditions.thunderstorm");
  return t("weather.conditions.unknown");
};

export const searchLocations = async (
  query: string,
  language: string,
  signal?: AbortSignal,
): Promise<GeocodingResult[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    name: trimmed,
    count: "10",
    language,
  });

  const response = await fetchWithRetry(`${GEOCODING_URL}?${params}`, signal);
  if (!response.ok) throw new Error("api_failed");

  const json = (await response.json()) as { results?: GeocodingResult[] };
  return json.results ?? [];
};

export const fetchWeatherData = async (
  location: WeatherLocation,
  t: TFunction,
  signal?: AbortSignal,
): Promise<WeatherData> => {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    timezone: location.timezone || "auto",
    forecast_days: "7",
    current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,wind_speed_10m_max",
  });

  const response = await fetchWithRetry(`${FORECAST_URL}?${params}`, signal);
  if (!response.ok) throw new Error("api_failed");

  const json = (await response.json()) as {
    current?: {
      temperature_2m: number;
      relative_humidity_2m: number;
      weather_code: number;
      wind_speed_10m: number;
    };
    daily?: {
      time: string[];
      weather_code: number[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      relative_humidity_2m_mean: number[];
      wind_speed_10m_max: number[];
    };
  };

  if (!json.current || !json.daily) throw new Error("api_failed");

  const current: CurrentWeather = {
    temperature: json.current.temperature_2m,
    humidity: json.current.relative_humidity_2m,
    wind_speed: json.current.wind_speed_10m,
    weather_code: json.current.weather_code,
    condition: getConditionFromCode(json.current.weather_code, t),
  };

  const forecast: DailyForecast[] = json.daily.time.map((date, index) => {
    const code = json.daily!.weather_code[index];
    return {
      date,
      min_temp: json.daily!.temperature_2m_min[index],
      max_temp: json.daily!.temperature_2m_max[index],
      humidity: json.daily!.relative_humidity_2m_mean[index],
      wind_speed: json.daily!.wind_speed_10m_max[index],
      weather_code: code,
      condition: getConditionFromCode(code, t),
    };
  });

  return { current, forecast };
};

export const geocodingToLocation = (result: GeocodingResult): WeatherLocation => ({
  city: result.name,
  country: result.country,
  region: result.admin1,
  latitude: result.latitude,
  longitude: result.longitude,
  timezone: result.timezone,
});

export const formatGeocodingLabel = (result: GeocodingResult): string => {
  const parts = [result.name];
  if (result.admin1 && result.admin1 !== result.name) parts.push(result.admin1);
  parts.push(result.country);
  return parts.join(", ");
};
