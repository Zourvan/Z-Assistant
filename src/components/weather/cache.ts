import type { TFunction } from "i18next";
import { fetchWeatherData } from "./api";
import {
  getStoredLocation,
  getWeatherCache,
  locationKey,
  saveWeatherCache,
} from "./storage";
import type { WeatherCache, WeatherData, WeatherFetchResult, WeatherLocation } from "./types";

export const CURRENT_CACHE_TTL_MS = 30 * 60 * 1000;
export const FORECAST_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const isFresh = (isoDate: string, ttlMs: number): boolean =>
  Date.now() - new Date(isoDate).getTime() < ttlMs;

export const isCurrentCacheValid = (cache: WeatherCache): boolean =>
  isFresh(cache.currentLastFetch, CURRENT_CACHE_TTL_MS);

export const isForecastCacheValid = (cache: WeatherCache): boolean =>
  isFresh(cache.forecastLastFetch, FORECAST_CACHE_TTL_MS);

export const isCacheValidForLocation = (cache: WeatherCache, location: WeatherLocation): boolean =>
  cache.locationKey === locationKey(location);

const buildCache = (location: WeatherLocation, data: WeatherData, now: string): WeatherCache => ({
  locationKey: locationKey(location),
  data,
  currentLastFetch: now,
  forecastLastFetch: now,
});

const mergeCache = (
  existing: WeatherCache,
  fresh: WeatherData,
  updateCurrent: boolean,
  updateForecast: boolean,
  now: string,
): WeatherCache => ({
  ...existing,
  data: {
    current: updateCurrent ? fresh.current : existing.data.current,
    forecast: updateForecast ? fresh.forecast : existing.data.forecast,
  },
  currentLastFetch: updateCurrent ? now : existing.currentLastFetch,
  forecastLastFetch: updateForecast ? now : existing.forecastLastFetch,
});

export const loadWeather = async (
  t: TFunction,
  signal?: AbortSignal,
  forcedLocation?: WeatherLocation,
): Promise<WeatherFetchResult> => {
  const location = forcedLocation ?? (await getStoredLocation());
  if (!location) {
    return { data: null, fromCache: false, staleCache: false, error: null };
  }

  const cache = await getWeatherCache();
  const cacheMatches = cache && isCacheValidForLocation(cache, location);
  const currentValid = cacheMatches && isCurrentCacheValid(cache);
  const forecastValid = cacheMatches && isForecastCacheValid(cache);

  if (currentValid && forecastValid) {
    return { data: cache.data, fromCache: true, staleCache: false, error: null };
  }

  try {
    const fresh = await fetchWeatherData(location, t, signal);
    const now = new Date().toISOString();
    const nextCache = cacheMatches
      ? mergeCache(cache, fresh, !currentValid, !forecastValid, now)
      : buildCache(location, fresh, now);

    await saveWeatherCache(nextCache);
    return { data: nextCache.data, fromCache: false, staleCache: false, error: null };
  } catch (error) {
    const code = (error as Error & { code?: string }).code;
    if (code === "rate_limit" && cacheMatches) {
      return { data: cache.data, fromCache: true, staleCache: true, error: "rate_limit" };
    }

    if (cacheMatches) {
      return { data: cache.data, fromCache: true, staleCache: true, error: "api_failed" };
    }

    return {
      data: null,
      fromCache: false,
      staleCache: false,
      error: code === "rate_limit" ? "rate_limit" : "api_failed",
    };
  }
};
