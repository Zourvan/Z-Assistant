import type { WeatherCache, WeatherLocation } from "./types";
import { scheduleSyncPush } from "../settings/settingsSync";

const LOCATION_KEY = "weather_location";
const CACHE_KEY = "weather_cache";

const storageGet = <T>(key: string): Promise<T | null> =>
  new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      resolve((result[key] as T | undefined) ?? null);
    });
  });

const storageSet = (items: Record<string, unknown>): Promise<void> =>
  new Promise((resolve) => {
    chrome.storage.local.set(items, () => resolve());
  });

const storageRemove = (keys: string | string[]): Promise<void> =>
  new Promise((resolve) => {
    chrome.storage.local.remove(keys, () => resolve());
  });

export const locationKey = (location: WeatherLocation): string =>
  `${location.city}|${location.region ?? ""}|${location.country}`;

export const getStoredLocation = (): Promise<WeatherLocation | null> =>
  storageGet<WeatherLocation>(LOCATION_KEY);

export const saveLocation = (location: WeatherLocation): Promise<void> =>
  storageSet({ [LOCATION_KEY]: location }).then(() => {
    scheduleSyncPush();
  });

export const clearLocation = (): Promise<void> => storageRemove(LOCATION_KEY);

export const getWeatherCache = (): Promise<WeatherCache | null> =>
  storageGet<WeatherCache>(CACHE_KEY);

export const saveWeatherCache = (cache: WeatherCache): Promise<void> =>
  storageSet({ [CACHE_KEY]: cache });

export const clearWeatherCache = (): Promise<void> => storageRemove(CACHE_KEY);
