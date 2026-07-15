import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { useI18n } from "../../i18n/LanguageProvider";
import { formatGeocodingLabel, geocodingToLocation, searchLocations } from "./api";
import { clearWeatherCache, saveLocation } from "./storage";
import type { GeocodingResult, WeatherLocation } from "./types";
import "./LocationSearch.css";

interface LocationSearchProps {
  textColor: string;
  backgroundColor: string;
  onLocationSelected: (location: WeatherLocation) => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export function LocationSearch({
  textColor,
  backgroundColor,
  onLocationSelected,
  onCancel,
  showCancel = false,
}: LocationSearchProps) {
  const { t, language } = useI18n();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<"not_found" | "api_failed" | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const borderColor = `color-mix(in srgb, ${textColor} 20%, transparent)`;
  const hoverBg = `color-mix(in srgb, ${textColor} 8%, transparent)`;

  const runSearch = useCallback(
    async (value: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const trimmed = value.trim();
      if (trimmed.length < 2) {
        setResults([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const items = await searchLocations(trimmed, language, controller.signal);
        if (controller.signal.aborted) return;
        setResults(items);
        setError(items.length === 0 ? "not_found" : null);
      } catch {
        if (controller.signal.aborted) return;
        setResults([]);
        setError("api_failed");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [language],
  );

  useEffect(() => {
    const timer = setTimeout(() => runSearch(query), 350);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const handleSelect = async (result: GeocodingResult) => {
    const location = geocodingToLocation(result);
    await saveLocation(location);
    await clearWeatherCache();
    onLocationSelected(location);
  };

  const handleCancel = () => {
    onCancel?.();
  };

  return (
    <div className="weather-location-search">
      <div className="weather-location-search__header">
        <MapPin size={18} aria-hidden />
        <h3 className="weather-location-search__title">{t("weather.setupTitle")}</h3>
      </div>
      <p className="weather-location-search__hint">{t("weather.setupHint")}</p>

      <div
        className="weather-location-search__input-wrap"
        style={{ borderColor, backgroundColor: `color-mix(in srgb, ${backgroundColor} 85%, transparent)` }}
      >
        <Search size={16} className="weather-location-search__input-icon" aria-hidden />
        <input
          type="search"
          className="weather-location-search__input"
          placeholder={t("weather.searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          aria-label={t("weather.searchPlaceholder")}
        />
        {loading && <Loader2 size={16} className="weather-location-search__spinner" aria-hidden />}
      </div>

      {error === "not_found" && query.trim().length >= 2 && (
        <p className="weather-location-search__error" role="alert">
          {t("weather.errors.cityNotFound")}
        </p>
      )}
      {error === "api_failed" && (
        <p className="weather-location-search__error" role="alert">
          {t("weather.errors.unavailable")}
        </p>
      )}

      {results.length > 0 && (
        <ul className="weather-location-search__results" role="listbox" aria-label={t("weather.searchResults")}>
          {results.map((result) => (
            <li key={result.id}>
              <button
                type="button"
                className="weather-location-search__result"
                style={{ borderColor }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = hoverBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                onClick={() => handleSelect(result)}
                role="option"
              >
                <span className="weather-location-search__result-name">{formatGeocodingLabel(result)}</span>
                {result.admin1 && (
                  <span className="weather-location-search__result-meta">
                    {t("weather.region")}: {result.admin1}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {showCancel && (
        <button type="button" className="weather-location-search__cancel" onClick={handleCancel}>
          {t("weather.cancelSetup")}
        </button>
      )}
    </div>
  );
}
