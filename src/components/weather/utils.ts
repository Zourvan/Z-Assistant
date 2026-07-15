import type { WeatherLocation } from "./types";

export const formatLocationLabel = (location: WeatherLocation): string => {
  const parts = [location.city];
  if (location.region && location.region !== location.city) {
    parts.push(location.region);
  }
  parts.push(location.country);
  return parts.join(", ");
};

export const formatShortLocation = (location: WeatherLocation): string =>
  `${location.city}, ${location.country}`;

export const formatRelativeTime = (
  isoDate: string,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string => {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMin = Math.max(0, Math.floor(diffMs / 60_000));

  if (diffMin < 1) return t("weather.updatedJustNow");
  if (diffMin < 60) return t("weather.updatedMinutesAgo", { count: diffMin });
  const diffHours = Math.floor(diffMin / 60);
  return t("weather.updatedHoursAgo", { count: diffHours });
};

export const formatDayLabel = (
  dateStr: string,
  locale: string,
  t: (key: string) => string,
): string => {
  const date = new Date(`${dateStr}T12:00:00`);
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  if (dateStr === todayKey) return t("weather.today");

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (dateStr === tomorrow.toISOString().slice(0, 10)) return t("weather.tomorrow");

  return date.toLocaleDateString(locale, { weekday: "short" });
};

export const formatDateLabel = (dateStr: string, locale: string): string => {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
};

export const roundTemp = (value: number): number => Math.round(value);

export const roundWind = (value: number): number => Math.round(value);
