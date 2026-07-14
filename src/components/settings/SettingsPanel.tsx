import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Select from "react-select";
import { ChromePicker, ColorResult } from "react-color";
import {
  SlidersHorizontal,
  Image,
  Upload,
  Link,
  X,
  Palette,
  Download,
  FileUp,
  RotateCcw,
  Globe,
  CalendarDays,
  Paintbrush,
  Database,
  Check,
} from "lucide-react";
import { useI18n } from "../../i18n/LanguageProvider";
import {
  useTheme,
  MIN_FONT_SIZE_RATIO,
  MAX_FONT_SIZE_RATIO,
  FONT_SIZE_RATIO_STEP,
} from "../ThemeProvider";
import { useCalendar, DayOfWeek } from "./CalendarContext";
import { DEFAULT_BACKGROUNDS, COLOR_OPTIONS } from "./defaultBackgrounds";
import { backgroundsDB, bookmarksDB, tasksDB } from "./settingsDb";
import { generateThumbnail, isDataUrl, processImageUrl, parseStoredBackground } from "./backgroundUtils";
import { buildThemeVars, buildThemeCssVars, withAlpha, applyThemeVarsToElement, SETTINGS_SELECT_PORTAL_ID } from "./themeUtils";
import { createSettingsSelectStyles } from "./selectTheme";
import { THEME_PRESETS } from "./themePresets";
import type { SettingsSection, StoredBackground } from "./types";
import "../Settings.css";

interface SettingsProps {
  onSelectBackground: (background: string) => void;
  storageKey?: string;
}

interface EmojiOption {
  value: string;
  label: string;
}

const ALL_DAYS: DayOfWeek[] = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const ColorPickerField: React.FC<{
  label: string;
  color: string;
  onChange: (color: string) => void;
}> = ({ label, color, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="settings-row">
      <label className="settings-label">
        {label}
      </label>
      <div className="settings-color-control">
        <button
          type="button"
          className="settings-color-swatch"
          style={{ backgroundColor: color }}
          onClick={() => setOpen((v) => !v)}
          aria-label={label}
        />
        {open && (
          <div className="settings-color-popover">
            <button type="button" className="settings-color-backdrop" onClick={() => setOpen(false)} />
            <ChromePicker
              color={color}
              onChange={(result: ColorResult) => {
                const rgba = `rgba(${result.rgb.r},${result.rgb.g},${result.rgb.b},${result.rgb.a ?? 1})`;
                onChange(rgba);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const BackgroundThumbnail: React.FC<{
  bg: StoredBackground;
  selected?: boolean;
  onSelect: () => void;
  onRemove?: () => void;
}> = ({ bg, selected, onSelect, onRemove }) => {
  const [isLoading, setIsLoading] = useState(bg.type === "image");
  const [error, setError] = useState(false);
  const displayUrl = bg.thumbnailUrl || bg.url;

  return (
    <div className={`settings-bg-thumb ${selected ? "settings-bg-thumb--selected" : ""}`}>
      <button
        type="button"
        onClick={onSelect}
        className="settings-bg-thumb-btn"
        style={bg.type === "color" ? { backgroundColor: bg.url } : undefined}
      >
        {bg.type === "image" && (
          <>
            {isLoading && (
              <div className="settings-bg-thumb-loading">
                <Image className="w-5 h-5" />
              </div>
            )}
            {error ? (
              <div className="settings-bg-thumb-error">
                <X className="w-5 h-5" />
              </div>
            ) : (
              <img
                src={displayUrl}
                alt=""
                className={`settings-bg-thumb-img ${isLoading ? "opacity-0" : "opacity-100"}`}
                loading="lazy"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setError(true);
                }}
              />
            )}
          </>
        )}
        {selected && (
          <span className="settings-bg-thumb-check">
            <Check className="w-4 h-4" />
          </span>
        )}
      </button>
      {bg.isBlob && onRemove && (
        <button type="button" onClick={onRemove} className="settings-bg-thumb-remove" aria-label="Remove">
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export const Settings: React.FC<SettingsProps> = ({ onSelectBackground, storageKey = "selectedBackground" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [section, setSection] = useState<SettingsSection>("general");
  const [bgTab, setBgTab] = useState<"images" | "colors">("images");
  const [urlInput, setUrlInput] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [savedBackgrounds, setSavedBackgrounds] = useState<StoredBackground[]>([]);
  const [selectedBgId, setSelectedBgId] = useState<string | null>(null);
  const [selectPortal, setSelectPortal] = useState<HTMLElement | null>(null);

  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const dataFileInputRef = useRef<HTMLInputElement>(null);

  const { t, language, setLanguage, dir } = useI18n();
  const { resetTheme } = useTheme();
  const {
    calendarType,
    setCalendarType,
    weekendDays,
    setWeekendDays,
    weekendColor,
    setWeekendColor,
    firstDayOfWeek,
    setFirstDayOfWeek,
    tileNumber,
    setTileNumber,
    textColor,
    setTextColor,
    backgroundColor,
    setBackgroundColor,
    fontSizeRatio,
    setFontSizeRatio,
  } = useCalendar();

  const themeVars = useMemo(() => buildThemeVars(textColor, backgroundColor), [textColor, backgroundColor]);
  const triggerThemeVars = useMemo(() => buildThemeCssVars(textColor, backgroundColor), [textColor, backgroundColor]);
  const selectStyles = useMemo(() => createSettingsSelectStyles(textColor, backgroundColor), [textColor, backgroundColor]);

  useEffect(() => {
    if (!isOpen || section !== "calendar") {
      document.getElementById(SETTINGS_SELECT_PORTAL_ID)?.remove();
      setSelectPortal(null);
      return;
    }

    let portal = document.getElementById(SETTINGS_SELECT_PORTAL_ID) as HTMLDivElement | null;
    if (!portal) {
      portal = document.createElement("div");
      portal.id = SETTINGS_SELECT_PORTAL_ID;
      portal.className = "settings-select-portal-root";
      document.body.appendChild(portal);
    }

    applyThemeVarsToElement(portal, textColor, backgroundColor);
    setSelectPortal(portal);

    return () => {
      portal?.remove();
      setSelectPortal(null);
    };
  }, [isOpen, section, textColor, backgroundColor]);

  const daysOptions: EmojiOption[] = useMemo(
    () => ALL_DAYS.map((day) => ({ value: day, label: t(`days.${day}`) })),
    [t]
  );

  const navItems: { id: SettingsSection; icon: React.ReactNode; label: string }[] = [
    { id: "general", icon: <Globe className="w-4 h-4" />, label: t("settings.sections.general") },
    { id: "calendar", icon: <CalendarDays className="w-4 h-4" />, label: t("settings.sections.calendar") },
    { id: "appearance", icon: <Paintbrush className="w-4 h-4" />, label: t("settings.sections.appearance") },
    { id: "backgrounds", icon: <Image className="w-4 h-4" />, label: t("settings.sections.backgrounds") },
    { id: "data", icon: <Database className="w-4 h-4" />, label: t("settings.sections.data") },
  ];

  const loadSavedBackgrounds = useCallback(async () => {
    try {
      const backgrounds = await backgroundsDB.getAllItems<StoredBackground>();
      const updated = await Promise.all(
        backgrounds.map(async (bg) => {
          if (bg.thumbnailUrl || bg.type === "color") return bg;
          try {
            bg.thumbnailUrl = await generateThumbnail(bg.url);
            await backgroundsDB.saveItem(bg);
          } catch {
            /* keep without thumbnail */
          }
          return bg;
        })
      );
      setSavedBackgrounds(updated);
    } catch {
      setSavedBackgrounds([]);
    }
  }, []);

  const handleSelectBackground = useCallback(
    (background: StoredBackground) => {
      const finalUrl = background.type === "image" && !isDataUrl(background.url) ? processImageUrl(background.url) : background.url;
      onSelectBackground(finalUrl);
      localStorage.setItem(storageKey, JSON.stringify({ ...background, url: finalUrl }));
      setSelectedBgId(background.id);
      setIsOpen(false);
    },
    [onSelectBackground, storageKey]
  );

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert(t("settings.errors.invalidImage"));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(t("settings.errors.fileTooLarge"));
        return;
      }

      setIsBusy(true);
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        let thumbnailUrl: string | undefined;
        try {
          thumbnailUrl = await generateThumbnail(dataUrl);
        } catch {
          /* optional */
        }

        const newBackground: StoredBackground = {
          id: `bg-${Date.now()}`,
          url: dataUrl,
          thumbnailUrl,
          isBlob: true,
          type: "image",
          createdAt: Date.now(),
        };

        await backgroundsDB.saveItem(newBackground);
        await loadSavedBackgrounds();
        handleSelectBackground(newBackground);
      } catch {
        alert(t("settings.errors.uploadFailed"));
      } finally {
        setIsBusy(false);
        if (imageFileInputRef.current) imageFileInputRef.current.value = "";
      }
    },
    [handleSelectBackground, loadSavedBackgrounds, t]
  );

  const handleUrlSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!urlInput.trim()) return;

      const validUrl = urlInput.startsWith("http://") || urlInput.startsWith("https://");
      if (!validUrl || !/\.(jpg|jpeg|png|gif|webp)$/i.test(urlInput)) {
        alert(t("settings.errors.invalidUrl"));
        return;
      }

      setIsBusy(true);
      try {
        let thumbnailUrl: string | undefined;
        try {
          thumbnailUrl = await generateThumbnail(urlInput);
        } catch {
          /* optional */
        }

        const newBackground: StoredBackground = {
          id: `bg-${Date.now()}`,
          url: urlInput,
          thumbnailUrl,
          isBlob: false,
          type: "image",
          createdAt: Date.now(),
        };

        await backgroundsDB.saveItem(newBackground);
        await loadSavedBackgrounds();
        handleSelectBackground(newBackground);
        setUrlInput("");
      } catch {
        alert(t("settings.errors.invalidUrl"));
      } finally {
        setIsBusy(false);
      }
    },
    [urlInput, handleSelectBackground, loadSavedBackgrounds, t]
  );

  const handleDeleteBackground = useCallback(
    async (background: StoredBackground) => {
      try {
        await backgroundsDB.deleteItem(background.id);
        if (selectedBgId === background.id) setSelectedBgId(null);
        await loadSavedBackgrounds();
      } catch {
        alert(t("settings.errors.deleteFailed"));
      }
    },
    [loadSavedBackgrounds, selectedBgId, t]
  );

  const handleWeekendDayToggle = (day: DayOfWeek) => {
    if (weekendDays.includes(day)) {
      setWeekendDays(weekendDays.filter((d) => d !== day));
      return;
    }
    if (weekendDays.length >= 3) {
      alert(t("settings.errors.maxWeekendDays"));
      return;
    }
    setWeekendDays([...weekendDays, day]);
  };

  const handleExportData = useCallback(async () => {
    setIsBusy(true);
    try {
      const exportObj = {
        version: "1.1",
        exportDate: new Date().toISOString(),
        settings: {
          calendarType,
          tileNumber,
          firstDayOfWeek,
          weekendDays,
          weekendColor,
          textColor,
          backgroundColor,
          fontSizeRatio,
          language,
          selectedBackground: localStorage.getItem(storageKey),
        },
        backgrounds: await backgroundsDB.getAllItems(),
        bookmarks: await bookmarksDB.getAllItems(),
        tasks: await tasksDB.getAllItems(),
      };

      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportObj, null, 2))}`;
      const link = document.createElement("a");
      link.href = dataUri;
      link.download = `nexx-tab-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
    } catch {
      alert(t("settings.errors.exportFailed"));
    } finally {
      setIsBusy(false);
    }
  }, [calendarType, tileNumber, firstDayOfWeek, weekendDays, weekendColor, textColor, backgroundColor, fontSizeRatio, language, storageKey, t]);

  const handleImportData = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsBusy(true);
      try {
        const text = await file.text();
        const importData = JSON.parse(text);
        const isLegacyFormat = importData.notes && importData.todos;
        const isNewFormat = importData.tasks;

        if (!importData.settings || !importData.backgrounds || !importData.bookmarks || (!isLegacyFormat && !isNewFormat)) {
          throw new Error("Invalid format");
        }

        if (!confirm(t("settings.importConfirm"))) return;

        const s = importData.settings;
        setCalendarType(s.calendarType || "gregorian");
        setTileNumber(s.tileNumber ?? 10);
        if (s.firstDayOfWeek) setFirstDayOfWeek(s.firstDayOfWeek);
        if (s.weekendDays) setWeekendDays(s.weekendDays);
        if (s.weekendColor) setWeekendColor(s.weekendColor);
        if (s.textColor) setTextColor(s.textColor);
        if (s.backgroundColor) setBackgroundColor(s.backgroundColor);
        if (typeof s.fontSizeRatio === "number") setFontSizeRatio(s.fontSizeRatio);
        if (s.language) setLanguage(s.language);
        if (s.selectedBackground) localStorage.setItem(storageKey, s.selectedBackground);

        const clearAndImport = async <T extends { id: string }>(db: typeof backgroundsDB, items: T[]) => {
          const existing = await db.getAllItems<T>();
          for (const item of existing) await db.deleteItem(item.id);
          for (const item of items) await db.saveItem(item);
        };

        await clearAndImport(backgroundsDB, importData.backgrounds);
        await clearAndImport(bookmarksDB, importData.bookmarks);

        const existingTasks = await tasksDB.getAllItems<{ id: string }>();
        for (const item of existingTasks) await tasksDB.deleteItem(item.id);

        if (isNewFormat) {
          for (const task of importData.tasks) await tasksDB.saveItem(task);
        } else if (isLegacyFormat) {
          for (const note of importData.notes) {
            await tasksDB.saveItem({
              id: note.id,
              text: note.text,
              taskType: "note",
              createdAt: note.createdAt,
              color: note.color,
              emoji: "📝",
            });
          }
          for (const todo of importData.todos) {
            await tasksDB.saveItem({
              id: todo.id,
              text: todo.text,
              taskType: "todo",
              createdAt: Date.now(),
              color: "rgba(255, 255, 255, 0.2)",
              emoji: todo.emoji || "🚀",
              completed: todo.completed,
            });
          }
        }

        await loadSavedBackgrounds();

        if (s.selectedBackground) {
          onSelectBackground(parseStoredBackground(s.selectedBackground));
        } else if (importData.backgrounds.length > 0) {
          onSelectBackground(importData.backgrounds[0].url);
        }

        alert(t("settings.importSuccess"));
        window.location.reload();
      } catch {
        alert(t("settings.errors.importFailed"));
      } finally {
        setIsBusy(false);
        if (dataFileInputRef.current) dataFileInputRef.current.value = "";
      }
    },
    [
      t,
      setCalendarType,
      setTileNumber,
      setFirstDayOfWeek,
      setWeekendDays,
      setWeekendColor,
      setTextColor,
      setBackgroundColor,
      setFontSizeRatio,
      setLanguage,
      storageKey,
      loadSavedBackgrounds,
      onSelectBackground,
    ]
  );

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    loadSavedBackgrounds();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, loadSavedBackgrounds]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as StoredBackground;
      setSelectedBgId(parsed.id || null);
      if (!parsed.isBlob || parsed.url.startsWith("data:")) {
        onSelectBackground(parsed.url);
      }
    } catch {
      onSelectBackground(saved);
    }
  }, [storageKey, onSelectBackground]);

  const renderGeneral = () => (
    <div className="settings-section-stack">
      <div className="settings-card">
        <h3 className="settings-card-title">{t("settings.language.title")}</h3>
        <div className="settings-toggle-group">
          <button
            type="button"
            className={`settings-toggle-btn ${language === "en" ? "settings-toggle-btn--active" : ""}`}
            onClick={() => setLanguage("en")}
          >
            {t("settings.language.english")}
          </button>
          <button
            type="button"
            className={`settings-toggle-btn ${language === "fa" ? "settings-toggle-btn--active" : ""}`}
            onClick={() => setLanguage("fa")}
          >
            {t("settings.language.persian")}
          </button>
        </div>
      </div>

      <div className="settings-card">
        <h3 className="settings-card-title">{t("settings.calendarType.title")}</h3>
        <p className="settings-card-desc">{t("settings.calendarType.description")}</p>
        <div className="settings-toggle-group">
          <button
            type="button"
            className={`settings-toggle-btn ${calendarType === "gregorian" ? "settings-toggle-btn--active" : ""}`}
            onClick={() => setCalendarType("gregorian")}
          >
            {t("settings.calendarType.gregorian")}
          </button>
          <button
            type="button"
            className={`settings-toggle-btn ${calendarType === "persian" ? "settings-toggle-btn--active" : ""}`}
            onClick={() => setCalendarType("persian")}
          >
            {t("settings.calendarType.persian")}
          </button>
        </div>
      </div>
    </div>
  );

  const renderCalendar = () => (
    <div className="settings-section-stack">
      <div className="settings-card">
        <h3 className="settings-card-title">{t("settings.firstDayOfWeek")}</h3>
        <Select
          unstyled
          classNamePrefix="settings-select"
          value={daysOptions.find((o) => o.value === firstDayOfWeek)}
          options={daysOptions}
          isSearchable={false}
          menuPortalTarget={selectPortal ?? document.body}
          menuPosition="fixed"
          menuPlacement="auto"
          menuShouldScrollIntoView
          styles={selectStyles}
          onChange={(opt) => opt && setFirstDayOfWeek(opt.value as DayOfWeek)}
        />
      </div>

      <div className="settings-card">
        <div className="settings-card-header">
          <h3 className="settings-card-title">{t("settings.weekendDays")}</h3>
          <button
            type="button"
            className="settings-mini-swatch"
            style={{ backgroundColor: weekendColor }}
            onClick={() => {
              const input = document.getElementById("weekend-color-input") as HTMLInputElement;
              input?.click();
            }}
            title={t("settings.weekendColor")}
          />
          <input
            id="weekend-color-input"
            type="color"
            className="sr-only"
            value={weekendColor.startsWith("#") ? weekendColor : "#1B4D3E"}
            onChange={(e) => setWeekendColor(e.target.value)}
          />
        </div>
        <div className="settings-weekdays">
          {ALL_DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => handleWeekendDayToggle(day)}
              className={`settings-weekday-btn ${weekendDays.includes(day) ? "settings-weekday-btn--active" : ""}`}
              style={weekendDays.includes(day) ? { backgroundColor: withAlpha(weekendColor, 0.65) } : undefined}
            >
              {t(`daysShort.${day}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-card">
        <h3 className="settings-card-title">{t("settings.tileNumber")}</h3>
        <div className="settings-range-row">
          <input
            type="range"
            min={10}
            max={100}
            step={1}
            value={tileNumber}
            onChange={(e) => setTileNumber(Number(e.target.value))}
            className="settings-range"
          />
          <span className="settings-range-value">{tileNumber}</span>
        </div>
      </div>
    </div>
  );

  const renderAppearance = () => (
    <div className="settings-section-stack">
      <div className="settings-card">
        <div className="settings-card-header">
          <h3 className="settings-card-title">{t("settings.appearance")}</h3>
          <button type="button" className="settings-reset-btn" onClick={resetTheme}>
            <RotateCcw className="w-3.5 h-3.5" />
            {t("settings.reset")}
          </button>
        </div>

        <p className="settings-card-desc">{t("settings.themePresets")}</p>
        <div className="settings-presets">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="settings-preset-btn"
              onClick={() => {
                setTextColor(preset.text);
                setBackgroundColor(preset.bg);
              }}
            >
              <span className="settings-preset-sample" style={{ backgroundColor: preset.bg, color: preset.text }}>
                Aa
              </span>
              <span>{t(`settings.presets.${preset.id}`)}</span>
            </button>
          ))}
        </div>

        <ColorPickerField label={t("settings.textColor")} color={textColor} onChange={setTextColor} />
        <ColorPickerField label={t("settings.backgroundColor")} color={backgroundColor} onChange={setBackgroundColor} />

        <div className="settings-range-block">
          <label className="settings-label">{t("settings.fontSizeRatio")}</label>
          <p className="settings-card-desc">{t("settings.fontSizeRatioDesc")}</p>
          <div className="settings-range-row">
            <input
              type="range"
              min={MIN_FONT_SIZE_RATIO}
              max={MAX_FONT_SIZE_RATIO}
              step={FONT_SIZE_RATIO_STEP}
              value={fontSizeRatio}
              onChange={(e) => setFontSizeRatio(Number(e.target.value))}
              className="settings-range"
            />
            <span className="settings-range-value">{Math.round(fontSizeRatio * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBackgrounds = () => (
    <div className="settings-section-stack settings-section-stack--fill">
      <div className="settings-subtabs">
        <button
          type="button"
          className={`settings-subtab ${bgTab === "images" ? "settings-subtab--active" : ""}`}
          onClick={() => setBgTab("images")}
        >
          <Image className="w-4 h-4" />
          {t("settings.images")}
        </button>
        <button
          type="button"
          className={`settings-subtab ${bgTab === "colors" ? "settings-subtab--active" : ""}`}
          onClick={() => setBgTab("colors")}
        >
          <Palette className="w-4 h-4" />
          {t("settings.colors")}
        </button>
      </div>

      {bgTab === "images" ? (
        <>
          <div className="settings-bg-grid custom-scrollbar">
            {[...DEFAULT_BACKGROUNDS, ...savedBackgrounds.filter((bg) => bg.type === "image")].map((bg) => (
              <BackgroundThumbnail
                key={bg.id}
                bg={bg}
                selected={selectedBgId === bg.id}
                onSelect={() => handleSelectBackground(bg)}
                onRemove={bg.isBlob ? () => handleDeleteBackground(bg) : undefined}
              />
            ))}
          </div>
          <div className="settings-upload-panel">
            <button type="button" className="settings-action-btn" onClick={() => imageFileInputRef.current?.click()} disabled={isBusy}>
              <Upload className="w-4 h-4" />
              {isBusy ? t("settings.uploading") : t("settings.uploadImage")}
            </button>
            <input ref={imageFileInputRef} type="file" accept="image/*,.gif" onChange={handleFileUpload} className="hidden" />
            <form onSubmit={handleUrlSubmit} className="settings-url-form">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={t("settings.pasteImageUrl")}
                className="settings-input"
              />
              <button type="submit" className="settings-icon-btn" disabled={isBusy}>
                <Link className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className="settings-bg-grid settings-bg-grid--colors custom-scrollbar">
          {COLOR_OPTIONS.map((color) => (
            <BackgroundThumbnail
              key={color.id}
              bg={color}
              selected={selectedBgId === color.id}
              onSelect={() => handleSelectBackground(color)}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderData = () => (
    <div className="settings-section-stack">
      <div className="settings-card">
        <h3 className="settings-card-title">{t("settings.dataManagement")}</h3>
        <p className="settings-card-desc">{t("settings.dataDescription")}</p>
        <div className="settings-data-actions">
          <button type="button" className="settings-data-btn settings-data-btn--export" onClick={handleExportData} disabled={isBusy}>
            <Download className="w-4 h-4" />
            {t("settings.exportData")}
          </button>
          <button type="button" className="settings-data-btn settings-data-btn--import" onClick={() => dataFileInputRef.current?.click()} disabled={isBusy}>
            <FileUp className="w-4 h-4" />
            {t("settings.importData")}
          </button>
          <input type="file" ref={dataFileInputRef} accept=".json" onChange={handleImportData} className="hidden" />
        </div>
      </div>
    </div>
  );

  const sectionContent = {
    general: renderGeneral,
    calendar: renderCalendar,
    appearance: renderAppearance,
    backgrounds: renderBackgrounds,
    data: renderData,
  }[section]();

  return (
    <div className="settings-trigger-wrap" dir="ltr" style={triggerThemeVars}>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="settings-trigger backdrop-blur-md"
        style={{ backgroundColor, color: textColor }}
        aria-label={t("settings.title")}
      >
        <SlidersHorizontal className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="settings-overlay" onClick={() => setIsOpen(false)}>
          <div
            className="settings-modal backdrop-blur-md"
            dir={dir}
            style={themeVars}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t("settings.title")}
          >
            <header className="settings-header">
              <h2 className="settings-title">{t("settings.title")}</h2>
              <button type="button" className="settings-close-btn" onClick={() => setIsOpen(false)} aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="settings-body">
              <nav className="settings-nav custom-scrollbar">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`settings-nav-btn ${section === item.id ? "settings-nav-btn--active" : ""}`}
                    onClick={() => setSection(item.id)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="settings-content custom-scrollbar">{sectionContent}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
