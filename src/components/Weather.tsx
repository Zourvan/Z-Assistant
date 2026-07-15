import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, CloudSun, Loader2, MapPin, RefreshCw } from "lucide-react";
import { useCalendar } from "./Settings";
import { useI18n } from "../i18n/LanguageProvider";
import { getStoredLocation, getWeatherCache } from "./weather/storage";
import { loadWeather } from "./weather/cache";
import { LocationSearch } from "./weather/LocationSearch";
import { WeatherIcon } from "./weather/icons";
import {
  formatDayLabel,
  formatRelativeTime,
  formatShortLocation,
  roundTemp,
  roundWind,
} from "./weather/utils";
import type { WeatherData, WeatherErrorCode, WeatherLocation } from "./weather/types";
import "./Weather.css";

interface WeatherProps {
  onForecastOpenChange?: (open: boolean) => void;
}

export function Weather({ onForecastOpenChange }: WeatherProps) {
  const { textColor, backgroundColor, calendarType } = useCalendar();
  const { t, dir, language } = useI18n();

  const [location, setLocation] = useState<WeatherLocation | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [error, setError] = useState<WeatherErrorCode | null>(null);
  const [staleCache, setStaleCache] = useState(false);
  const [lastFetch, setLastFetch] = useState<string | null>(null);
  const [showWeekly, setShowWeekly] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleToggleWeekly = () => {
    setShowWeekly((open) => {
      const next = !open;
      onForecastOpenChange?.(next);
      return next;
    });
  };

  const locale = language === "fa" ? "fa-IR" : "en-US";
  const borderColor = `color-mix(in srgb, ${textColor} 18%, transparent)`;
  const mutedColor = `color-mix(in srgb, ${textColor} 70%, transparent)`;

  const refreshWeather = useCallback(
    async (loc: WeatherLocation, isManual = false) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (isManual) setRefreshing(true);
      else setLoading(true);

      setError(null);

      try {
        const result = await loadWeather(t, controller.signal, loc);
        if (controller.signal.aborted) return;

        setWeather(result.data);
        setStaleCache(result.staleCache);
        setError(result.error);

        const cache = await getWeatherCache();
        if (cache) setLastFetch(cache.currentLastFetch);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [t],
  );

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const stored = await getStoredLocation();
      if (!mounted) return;

      setLocation(stored);
      if (!stored) {
        setShowSetup(true);
        setLoading(false);
        return;
      }

      await refreshWeather(stored);
    };

    init();
    return () => {
      mounted = false;
      abortRef.current?.abort();
    };
  }, [refreshWeather]);

  const handleLocationSelected = async (loc: WeatherLocation) => {
    setLocation(loc);
    setShowSetup(false);
    await refreshWeather(loc);
  };

  const handleChangeLocation = () => {
    setShowSetup(true);
  };

  const forecastRows = useMemo(() => weather?.forecast ?? [], [weather]);

  if (showSetup || !location) {
    return (
      <div
        className="weather-widget backdrop-blur-md rounded-xl shadow-lg"
        style={{
          backgroundColor,
          color: textColor,
          fontFamily: calendarType === "persian" ? "Vazirmatn, sans-serif" : "inherit",
        }}
        dir={dir}
      >
        <LocationSearch
          textColor={textColor}
          backgroundColor={backgroundColor}
          onLocationSelected={handleLocationSelected}
          onCancel={() => setShowSetup(false)}
          showCancel={!!location}
        />
      </div>
    );
  }

  return (
    <div
      className="weather-widget backdrop-blur-md rounded-xl shadow-lg"
      style={{
        backgroundColor,
        color: textColor,
        fontFamily: calendarType === "persian" ? "Vazirmatn, sans-serif" : "inherit",
      }}
      dir={dir}
    >
      <div className="weather-widget__header">
        <div className="weather-widget__title-row">
          <CloudSun size={18} aria-hidden />
          <h2 className="weather-widget__title">{t("weather.title")}</h2>
        </div>
        <div className="weather-widget__actions">
          <button
            type="button"
            className="weather-widget__icon-btn"
            onClick={() => refreshWeather(location, true)}
            disabled={refreshing}
            aria-label={t("weather.refresh")}
            title={t("weather.refresh")}
          >
            <RefreshCw size={15} className={refreshing ? "weather-widget__spin" : undefined} />
          </button>
          <button
            type="button"
            className="weather-widget__icon-btn"
            onClick={handleChangeLocation}
            aria-label={t("weather.changeLocation")}
            title={t("weather.changeLocation")}
          >
            <MapPin size={15} />
          </button>
        </div>
      </div>

      {loading && !weather && (
        <div className="weather-widget__loading" aria-live="polite">
          <Loader2 size={28} className="weather-widget__spin" aria-hidden />
          <span>{t("weather.loading")}</span>
        </div>
      )}

      {error && !weather && (
        <div className="weather-widget__error" role="alert">
          <p>{t("weather.errors.unavailable")}</p>
          <p className="weather-widget__error-sub">{t("weather.errors.tryAgain")}</p>
        </div>
      )}

      {weather && (
        <>
          {error && staleCache && (
            <p className="weather-widget__stale-notice" role="status">
              {error === "rate_limit"
                ? t("weather.errors.usingCachedRateLimit")
                : t("weather.errors.usingCached")}
            </p>
          )}

          <section
            className={`weather-widget__current${showWeekly ? " weather-widget__current--expanded" : ""}`}
            style={{ borderColor: showWeekly ? borderColor : "transparent" }}
          >
            <div className="weather-widget__daily">
              <div className="weather-widget__daily-main">
                <WeatherIcon code={weather.current.weather_code} size={56} className="weather-widget__icon" />
                <div className="weather-widget__temp-block">
                  <span className="weather-widget__city">{formatShortLocation(location)}</span>
                  <span className="weather-widget__temp">{roundTemp(weather.current.temperature)}°C</span>
                  <span className="weather-widget__condition">{weather.current.condition}</span>
                </div>
              </div>

              <div className="weather-widget__daily-meta">
                <div className="weather-widget__stats">
                  <span>{t("weather.humidity")}: {weather.current.humidity}%</span>
                  <span>{t("weather.wind")}: {roundWind(weather.current.wind_speed)} {t("weather.windUnit")}</span>
                </div>
                {lastFetch && (
                  <p className="weather-widget__updated" style={{ color: mutedColor }}>
                    {t("weather.updated")}: {formatRelativeTime(lastFetch, t)}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              className="weather-widget__toggle"
              style={{ borderColor }}
              onClick={handleToggleWeekly}
              aria-expanded={showWeekly}
              aria-controls="weather-weekly-forecast"
            >
              {showWeekly ? (
                <>
                  <ChevronUp size={16} aria-hidden />
                  <span>{t("weather.hideForecast")}</span>
                </>
              ) : (
                <>
                  <ChevronDown size={16} aria-hidden />
                  <span>{t("weather.showForecast")}</span>
                </>
              )}
            </button>
          </section>

          <section
            className={`weather-widget__forecast${showWeekly ? " weather-widget__forecast--open" : ""}`}
            id="weather-weekly-forecast"
            aria-hidden={!showWeekly}
          >
            <div className="weather-widget__forecast-inner">
              <h3 className="weather-widget__forecast-title">{t("weather.forecastTitle")}</h3>
              <div className="weather-widget__table-wrap">
                <table className="weather-widget__table">
                  <thead>
                    <tr>
                      <th scope="col">{t("weather.table.date")}</th>
                      <th scope="col">{t("weather.table.weather")}</th>
                      <th scope="col">{t("weather.table.min")}</th>
                      <th scope="col">{t("weather.table.max")}</th>
                      <th scope="col">{t("weather.table.humidity")}</th>
                      <th scope="col">{t("weather.table.wind")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecastRows.map((day) => (
                      <tr key={day.date}>
                        <td>
                          <span className="weather-widget__day">{formatDayLabel(day.date, locale, t)}</span>
                        </td>
                        <td>
                          <span className="weather-widget__forecast-cell">
                            <WeatherIcon code={day.weather_code} size={18} />
                            <span className="weather-widget__forecast-condition">{day.condition}</span>
                          </span>
                        </td>
                        <td>{roundTemp(day.min_temp)}°</td>
                        <td>{roundTemp(day.max_temp)}°</td>
                        <td>{Math.round(day.humidity)}%</td>
                        <td>{roundWind(day.wind_speed)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
