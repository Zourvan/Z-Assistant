import React, { createContext, useState, useContext, useRef, useEffect, useCallback, useMemo, ReactNode } from "react";
import Select, { StylesConfig } from "react-select";
import { ChromePicker } from "react-color";
import { SlidersHorizontal, Image, Upload, Link, X, Palette, Download, FileUp, RotateCcw, Globe } from "lucide-react";
import createDatabase from "./IndexedDatabase/IndexedDatabase";
// Import i18n hooks and components
import { useI18n } from "../i18n/LanguageProvider";
import "../i18n/i18n"; // Import i18n initialization
// Import the changeLanguageAndDirection function
import { changeLanguageAndDirection } from "../i18n/i18n";
// Import the theme provider
import { useTheme } from "./ThemeProvider";

//
// ─── TYPE DEFINITIONS ─────────────────────────────────────────────────────────────
//

// For CalendarProvider children
interface CalendarProviderProps {
  children: ReactNode;
}

// Option type for react-select
interface EmojiOption {
  value: string;
  label: string;
}

// Days options and DayOfWeek type
export type DayOfWeek = "Saturday" | "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";

// Props for BackgroundSelector component
interface SettingsProps {
  onSelectBackground: (background: string) => void;
  onCalendarTypeChange?: (type: "gregorian" | "persian") => void;
  storageKey?: string;
  calendarType: "gregorian" | "persian";
}

// Interface for CalendarSettings
interface CalendarSettings {
  type: "gregorian" | "persian";
  tileNumber: number;
  weekendDays: DayOfWeek[];
  weekendColor: string;
  firstDayOfWeek: DayOfWeek;
  textColor: string;
  backgroundColor: string;
  language: "en" | "fa";
}

// Type for stored background data
export interface StoredBackground {
  id: string;
  url: string;
  isBlob: boolean;
  type: "image" | "color" | "gif";
  createdAt: number;
  thumbnailUrl?: string;
}

//
// ─── CONFIGURATIONS & DATABASE ─────────────────────────────────────────────────────
//

// IndexedDB instances for all data types
const backgroundsDB = createDatabase({
  dbName: "backgroundSelectorDB",
  storeName: "backgrounds",
  version: 1,
  keyPath: "id",
  indexes: [
    { name: "type", keyPath: "type", unique: false },
    { name: "createdAt", keyPath: "createdAt", unique: false },
  ],
});

// Database instances for bookmarks, notes, and todos
const bookmarksDB = createDatabase({
  dbName: "bookmarkManagerDB",
  storeName: "tiles",
  version: 1,
  keyPath: "id",
  indexes: [{ name: "createdAt", keyPath: "createdAt", unique: false }],
});

// Unified tasks database
const tasksDB = createDatabase({
  dbName: "unifiedTasksDB",
  storeName: "tasks",
  version: 1,
  keyPath: "id",
  indexes: [
    { name: "taskType", keyPath: "taskType", unique: false },
    { name: "completed", keyPath: "completed", unique: false },
    { name: "createdAt", keyPath: "createdAt", unique: false },
  ],
});

// Legacy databases - kept for backward compatibility with imports
const notesDB = createDatabase({
  dbName: "notesManagerDB",
  storeName: "notes",
  version: 1,
  keyPath: "id",
  indexes: [{ name: "createdAt", keyPath: "createdAt", unique: false }],
});

const todosDB = createDatabase({
  dbName: "todosManagerDB",
  storeName: "todos",
  version: 1,
  keyPath: "id",
  indexes: [{ name: "completed", keyPath: "completed", unique: false }],
});

// Custom styles for react-select
const customStyles: StylesConfig<EmojiOption, false> = {
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    backgroundColor: "rgba(0, 0, 0, 100)", // Black with transparency
    color: "black",
  }),
  option: (provided, state) => ({
    ...provided,
    color: "white",
    backgroundColor: state.isFocused ? "rgba(255, 255, 255, 0.2)" : "transparent",
  }),
  control: (provided) => ({
    ...provided,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.3)",
    color: "white",
    display: "flex",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "white",
  }),
};

//
// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────────
//

// Check if a URL is a data URL
const isDataUrl = (url: string) => url.startsWith("data:");

// Check if a string is a valid hex color
const isColor = (str: string) => /^#([0-9A-F]{3}){1,2}$/i.test(str);

// Process an image URL with given width and height parameters
const processImageUrl = (url: string, width = 1920, height = 1080) => {
  if (isDataUrl(url) || isColor(url)) {
    return url;
  }
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set("auto", "format");
    urlObj.searchParams.set("fit", "crop");
    urlObj.searchParams.set("w", width.toString());
    urlObj.searchParams.set("h", height.toString());
    return urlObj.toString();
  } catch {
    return url;
  }
};

// Generate thumbnail from image source (data URL, file or URL)
const generateThumbnail = (src: string, maxWidth = 200, maxHeight = 200): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (isColor(src)) {
      // For color backgrounds, just return the original color
      resolve(src);
      return;
    }

    // Create an HTMLImageElement instead of using the Image constructor
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height));
            height = maxHeight;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Generate thumbnail as data URL
        const thumbnailDataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(thumbnailDataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = src;
  });
};

//
// ─── SUB-COMPONENT: BackgroundThumbnail ──────────────────────────────────────────
//

const BackgroundThumbnail: React.FC<{
  bg: StoredBackground;
  onSelect: () => void;
  onRemove?: () => void;
}> = ({ bg, onSelect, onRemove }) => {
  const [isLoading, setIsLoading] = useState(bg.type === "image");
  const [error, setError] = useState(false);

  // Use thumbnailUrl from the background object if it exists, otherwise use url
  const displayUrl = bg.thumbnailUrl || bg.url;

  return (
    <div className="relative group aspect-square">
      <button
        onClick={onSelect}
        className="w-full h-full rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
        style={bg.type === "color" ? { backgroundColor: bg.url } : {}}
      >
        {bg.type === "image" && (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-200 animate-pulse">
                <Image className="w-6 h-6 text-slate-400" />
              </div>
            )}
            {error ? (
              <div className="absolute inset-0 flex items-center justify-center bg-red-100">
                <X className="w-6 h-6 text-red-400" />
              </div>
            ) : (
              <img
                src={displayUrl}
                alt="Background option"
                className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
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
      </button>
      {bg.isBlob && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      )}
    </div>
  );
};

//
// ─── CONTEXT & PROVIDER ──────────────────────────────────────────────────────────
//

// Create CalendarContext with default values
const CalendarContext = createContext({
  calendarType: "gregorian" as "gregorian" | "persian",
  setCalendarType: (_type: "gregorian" | "persian") => {},
  updateCalendarType: (_type: "gregorian" | "persian") => {}, // Add this function to context
  weekendDays: ["Friday"] as DayOfWeek[],
  setWeekendDays: (_days: DayOfWeek[]) => {},
  weekendColor: "#1B4D3E",
  setWeekendColor: (_color: string) => {},
  firstDayOfWeek: "Saturday" as DayOfWeek,
  setFirstDayOfWeek: (_day: DayOfWeek) => {},
  tileNumber: 10,
  setTileNumber: (_tiles: number) => {},
  textColor: "#FFFFFF",
  setTextColor: (_color: string) => {},
  backgroundColor: "rgba(0, 0, 0, 0.2)",
  setBackgroundColor: (_color: string) => {},
  language: "en" as "en" | "fa",
  setLanguage: (_lang: "en" | "fa") => {},
});

// CalendarProvider component which provides calendar settings via context
export function CalendarProvider({ children }: CalendarProviderProps) {
  const [calendarType, setCalendarType] = useState<"gregorian" | "persian">(() => {
    const saved = localStorage.getItem("calendarType");
    return saved === "persian" || saved === "gregorian" ? saved : "gregorian";
  });

  const [weekendDays, setWeekendDays] = useState<DayOfWeek[]>(() => {
    try {
      const saved = localStorage.getItem("weekendDays");
      return saved ? JSON.parse(saved) : ["Friday"];
    } catch {
      return ["Friday"];
    }
  });

  const [weekendColor, setWeekendColor] = useState<string>(() => {
    const saved = localStorage.getItem("weekendColor");
    return saved || "#1B4D3E";
  });

  const [firstDayOfWeek, setFirstDayOfWeek] = useState<DayOfWeek>(() => {
    try {
      const saved = localStorage.getItem("firstDayOfWeek");
      return (saved as DayOfWeek) || "Saturday";
    } catch {
      return "Saturday";
    }
  });

  const [tileNumber, setTileNumber] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("tileNumber");
      return saved ? JSON.parse(saved) : 10;
    } catch {
      return 10;
    }
  });

  // Use theme context for text and background colors
  const { textColor, backgroundColor, setTextColor, setBackgroundColor } = useTheme();

  const [language, setLanguage] = useState<"en" | "fa">(() => {
    const saved = localStorage.getItem("language");
    return saved === "en" || saved === "fa" ? (saved as "en" | "fa") : "en";
  });

  const updateCalendarType = (type: "gregorian" | "persian") => {
    setCalendarType(type);
    localStorage.setItem("calendarType", type);

    // Also update language to match calendar type
    const newLanguage = type === "persian" ? "fa" : "en";

    // Use the safe language change function instead
    changeLanguageAndDirection(newLanguage);

    // Still update local state
    setLanguage(newLanguage);
  };

  const updateWeekendDays = (days: DayOfWeek[]) => {
    setWeekendDays(days);
    localStorage.setItem("weekendDays", JSON.stringify(days));
  };

  const updateWeekendColor = (color: string) => {
    setWeekendColor(color);
    localStorage.setItem("weekendColor", color);
  };

  const updateFirstDayOfWeek = (day: DayOfWeek) => {
    setFirstDayOfWeek(day);
    localStorage.setItem("firstDayOfWeek", day);
  };

  const updateTileNumber = (tiles: number) => {
    setTileNumber(tiles);
    localStorage.setItem("tileNumber", JSON.stringify(tiles));
  };

  // Use setTextColor and setBackgroundColor directly from ThemeProvider

  const updateLanguage = (lang: "en" | "fa") => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  return (
    <CalendarContext.Provider
      value={{
        calendarType,
        setCalendarType: updateCalendarType, // Replace with updateCalendarType
        updateCalendarType, // Add this function to the provided context
        weekendDays,
        setWeekendDays: updateWeekendDays,
        weekendColor,
        setWeekendColor: updateWeekendColor,
        firstDayOfWeek,
        setFirstDayOfWeek: updateFirstDayOfWeek,
        tileNumber,
        setTileNumber: updateTileNumber,
        textColor,
        setTextColor,
        backgroundColor,
        setBackgroundColor,
        language,
        setLanguage: updateLanguage,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

// Custom hook to use CalendarContext
export function useCalendar() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error("useCalendar must be used within a CalendarProvider");
  }
  return context;
}

//
// ─── MAIN COMPONENT: Settings ──────────────────────────────────────────
//

export const Settings: React.FC<SettingsProps> = ({ onSelectBackground, storageKey = "selectedBackground" }) => {
  // ─── STATE & REFS ──────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"images" | "colors">("images");
  const [mainTab, setMainTab] = useState<"settings" | "backgrounds">("settings");
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [savedBackgrounds, setSavedBackgrounds] = useState<StoredBackground[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isTextPickerOpen, setIsTextPickerOpen] = useState(false);
  const [isWeekendPickerOpen, setIsWeekendPickerOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const dataFileInputRef = useRef<HTMLInputElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);

  // Access calendar context
  const {
    calendarType,
    setCalendarType,
    updateCalendarType,
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
    language,
    setLanguage,
  } = useCalendar();

  // Access i18n
  const { t } = useI18n();

  // Generate daysOptions from translations
  const daysOptions: EmojiOption[] = useMemo(
    () => [
      { value: "Saturday", label: t("days.Saturday") },
      { value: "Sunday", label: t("days.Sunday") },
      { value: "Monday", label: t("days.Monday") },
      { value: "Tuesday", label: t("days.Tuesday") },
      { value: "Wednesday", label: t("days.Wednesday") },
      { value: "Thursday", label: t("days.Thursday") },
      { value: "Friday", label: t("days.Friday") },
    ],
    [t]
  );

  // ─── DEFAULT DATA (Backgrounds & Colors) ───────────────────────
  const defaultBackgrounds = useMemo(
    () => [
      {
        id: "img-1",
        url: "/static/background/img-1.jpg",
        thumbnailUrl: "/static/background/img-1_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-2",
        url: "/static/background/img-10.jpg",
        thumbnailUrl: "/static/background/img-10_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-3",
        url: "/static/background/img-11.jpg",
        thumbnailUrl: "/static/background/img-11_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-4",
        url: "/static/background/img-12.jpg",
        thumbnailUrl: "/static/background/img-12_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-5",
        url: "/static/background/img-13.jpg",
        thumbnailUrl: "/static/background/img-13_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-6",
        url: "/static/background/img-14.jpg",
        thumbnailUrl: "/static/background/img-14_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-7",
        url: "/static/background/img-15.jpg",
        thumbnailUrl: "/static/background/img-15_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-8",
        url: "/static/background/img-16.jpg",
        thumbnailUrl: "/static/background/img-16_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-9",
        url: "/static/background/img-17.jpg",
        thumbnailUrl: "/static/background/img-17_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-10",
        url: "/static/background/img-18.jpg",
        thumbnailUrl: "/static/background/img-18_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-11",
        url: "/static/background/img-19.jpg",
        thumbnailUrl: "/static/background/img-19_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-12",
        url: "/static/background/img-2.jpg",
        thumbnailUrl: "/static/background/img-2_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-13",
        url: "/static/background/img-20.jpg",
        thumbnailUrl: "/static/background/img-20_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-14",
        url: "/static/background/img-21.jpg",
        thumbnailUrl: "/static/background/img-21_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-15",
        url: "/static/background/img-22.jpg",
        thumbnailUrl: "/static/background/img-22_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-16",
        url: "/static/background/img-23.jpg",
        thumbnailUrl: "/static/background/img-23_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-17",
        url: "/static/background/img-24.jpg",
        thumbnailUrl: "/static/background/img-24_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-18",
        url: "/static/background/img-25.jpg",
        thumbnailUrl: "/static/background/img-25_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-19",
        url: "/static/background/img-26.jpg",
        thumbnailUrl: "/static/background/img-26_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-20",
        url: "/static/background/img-27.jpg",
        thumbnailUrl: "/static/background/img-27_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-21",
        url: "/static/background/img-28.jpg",
        thumbnailUrl: "/static/background/img-28_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-22",
        url: "/static/background/img-29.jpg",
        thumbnailUrl: "/static/background/img-29_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-23",
        url: "/static/background/img-3.jpg",
        thumbnailUrl: "/static/background/img-3_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-24",
        url: "/static/background/img-30.jpg",
        thumbnailUrl: "/static/background/img-30_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-25",
        url: "/static/background/img-31.jpg",
        thumbnailUrl: "/static/background/img-31_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-26",
        url: "/static/background/img-32.jpg",
        thumbnailUrl: "/static/background/img-32_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-27",
        url: "/static/background/img-33.jpg",
        thumbnailUrl: "/static/background/img-33_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-28",
        url: "/static/background/img-34.jpg",
        thumbnailUrl: "/static/background/img-34_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-29",
        url: "/static/background/img-35.jpg",
        thumbnailUrl: "/static/background/img-35_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-30",
        url: "/static/background/img-36.jpg",
        thumbnailUrl: "/static/background/img-36_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-31",
        url: "/static/background/img-37.jpg",
        thumbnailUrl: "/static/background/img-37_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-32",
        url: "/static/background/img-38.jpg",
        thumbnailUrl: "/static/background/img-38_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-33",
        url: "/static/background/img-39.jpg",
        thumbnailUrl: "/static/background/img-39_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-34",
        url: "/static/background/img-4.jpg",
        thumbnailUrl: "/static/background/img-4_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-35",
        url: "/static/background/img-40.jpg",
        thumbnailUrl: "/static/background/img-40_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-36",
        url: "/static/background/img-41.jpg",
        thumbnailUrl: "/static/background/img-41_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-37",
        url: "/static/background/img-42.jpg",
        thumbnailUrl: "/static/background/img-42_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-38",
        url: "/static/background/img-43.jpg",
        thumbnailUrl: "/static/background/img-43_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-39",
        url: "/static/background/img-44.jpg",
        thumbnailUrl: "/static/background/img-44_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-40",
        url: "/static/background/img-45.jpg",
        thumbnailUrl: "/static/background/img-45_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-41",
        url: "/static/background/img-46.jpg",
        thumbnailUrl: "/static/background/img-46_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-42",
        url: "/static/background/img-47.jpg",
        thumbnailUrl: "/static/background/img-47_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-43",
        url: "/static/background/img-48.jpg",
        thumbnailUrl: "/static/background/img-48_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-44",
        url: "/static/background/img-49.jpg",
        thumbnailUrl: "/static/background/img-49_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-45",
        url: "/static/background/img-5.jpg",
        thumbnailUrl: "/static/background/img-5_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-46",
        url: "/static/background/img-50.jpg",
        thumbnailUrl: "/static/background/img-50_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-47",
        url: "/static/background/img-51.jpg",
        thumbnailUrl: "/static/background/img-51_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-48",
        url: "/static/background/img-52.jpg",
        thumbnailUrl: "/static/background/img-52_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-49",
        url: "/static/background/img-53.jpg",
        thumbnailUrl: "/static/background/img-53_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-50",
        url: "/static/background/img-54.jpg",
        thumbnailUrl: "/static/background/img-54_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-51",
        url: "/static/background/img-55.jpg",
        thumbnailUrl: "/static/background/img-55_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-52",
        url: "/static/background/img-56.jpg",
        thumbnailUrl: "/static/background/img-56_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-53",
        url: "/static/background/img-57.jpg",
        thumbnailUrl: "/static/background/img-57_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-54",
        url: "/static/background/img-58.jpg",
        thumbnailUrl: "/static/background/img-58_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-55",
        url: "/static/background/img-59.jpg",
        thumbnailUrl: "/static/background/img-59_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-56",
        url: "/static/background/img-6.jpg",
        thumbnailUrl: "/static/background/img-6_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-57",
        url: "/static/background/img-60.jpg",
        thumbnailUrl: "/static/background/img-60_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-58",
        url: "/static/background/img-61.jpg",
        thumbnailUrl: "/static/background/img-61_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-59",
        url: "/static/background/img-62.jpg",
        thumbnailUrl: "/static/background/img-62_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-60",
        url: "/static/background/img-63.jpg",
        thumbnailUrl: "/static/background/img-63_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-61",
        url: "/static/background/img-64.jpg",
        thumbnailUrl: "/static/background/img-64_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-62",
        url: "/static/background/img-65.jpg",
        thumbnailUrl: "/static/background/img-65_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-63",
        url: "/static/background/img-66.jpg",
        thumbnailUrl: "/static/background/img-66_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-64",
        url: "/static/background/img-67.jpg",
        thumbnailUrl: "/static/background/img-67_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-65",
        url: "/static/background/img-68.jpg",
        thumbnailUrl: "/static/background/img-68_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-66",
        url: "/static/background/img-69.jpg",
        thumbnailUrl: "/static/background/img-69_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-67",
        url: "/static/background/img-7.jpg",
        thumbnailUrl: "/static/background/img-7_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-68",
        url: "/static/background/img-70.jpg",
        thumbnailUrl: "/static/background/img-70_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-69",
        url: "/static/background/img-71.jpg",
        thumbnailUrl: "/static/background/img-71_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-70",
        url: "/static/background/img-72.jpg",
        thumbnailUrl: "/static/background/img-72_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-71",
        url: "/static/background/img-8.jpg",
        thumbnailUrl: "/static/background/img-8_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "img-72",
        url: "/static/background/img-9.jpg",
        thumbnailUrl: "/static/background/img-9_thumb.jpg",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-1",
        url: "/static/background/g-1.gif",
        thumbnailUrl: "/static/background/g-1_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-2",
        url: "/static/background/g-10.gif",
        thumbnailUrl: "/static/background/g-10_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-3",
        url: "/static/background/g-11.gif",
        thumbnailUrl: "/static/background/g-11_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-4",
        url: "/static/background/g-12.gif",
        thumbnailUrl: "/static/background/g-12_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-5",
        url: "/static/background/g-13.gif",
        thumbnailUrl: "/static/background/g-13_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-6",
        url: "/static/background/g-14.gif",
        thumbnailUrl: "/static/background/g-14_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-7",
        url: "/static/background/g-15.gif",
        thumbnailUrl: "/static/background/g-15_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-8",
        url: "/static/background/g-16.gif",
        thumbnailUrl: "/static/background/g-16_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-9",
        url: "/static/background/g-17.gif",
        thumbnailUrl: "/static/background/g-17_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-10",
        url: "/static/background/g-18.gif",
        thumbnailUrl: "/static/background/g-18_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-11",
        url: "/static/background/g-19.gif",
        thumbnailUrl: "/static/background/g-19_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-12",
        url: "/static/background/g-2.gif",
        thumbnailUrl: "/static/background/g-2_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-13",
        url: "/static/background/g-20.gif",
        thumbnailUrl: "/static/background/g-20_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-14",
        url: "/static/background/g-21.gif",
        thumbnailUrl: "/static/background/g-21_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-15",
        url: "/static/background/g-22.gif",
        thumbnailUrl: "/static/background/g-22_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-16",
        url: "/static/background/g-23.gif",
        thumbnailUrl: "/static/background/g-23_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-17",
        url: "/static/background/g-24.gif",
        thumbnailUrl: "/static/background/g-24_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-18",
        url: "/static/background/g-25.gif",
        thumbnailUrl: "/static/background/g-25_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-19",
        url: "/static/background/g-26.gif",
        thumbnailUrl: "/static/background/g-26_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-20",
        url: "/static/background/g-27.gif",
        thumbnailUrl: "/static/background/g-27_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-21",
        url: "/static/background/g-3.gif",
        thumbnailUrl: "/static/background/g-3_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-22",
        url: "/static/background/g-4.gif",
        thumbnailUrl: "/static/background/g-4_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-23",
        url: "/static/background/g-5.gif",
        thumbnailUrl: "/static/background/g-5_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-24",
        url: "/static/background/g-6.gif",
        thumbnailUrl: "/static/background/g-6_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-25",
        url: "/static/background/g-7.gif",
        thumbnailUrl: "/static/background/g-7_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-26",
        url: "/static/background/g-8.gif",
        thumbnailUrl: "/static/background/g-8_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
      {
        id: "gif-27",
        url: "/static/background/g-9.gif",
        thumbnailUrl: "/static/background/g-9_thumb.gif",
        type: "image" as const,
        isBlob: false,
        createdAt: Date.now(),
      },
    ],
    []
  );

  const colorOptions = useMemo(
    () =>
      ["#222222", "#eeeeee", "#1E40AF", "#047857", "#B45309", "#9F1239", "#4C1D95", "#831843", "#3730A3", "#064E3B", "#701A75", "#7C2D12"].map(
        (color) => ({
          id: color,
          url: color,
          isBlob: false,
          type: "color" as const,
          createdAt: Date.now(),
        })
      ),
    []
  );

  // ─── CALENDAR SETTINGS: SAVE & LOAD ───────────────────────────
  const saveCalendarSettings = useCallback(
    (
      type: "gregorian" | "persian",
      tiles: number,
      weekend: DayOfWeek[],
      color: string,
      firstDay: DayOfWeek,
      txtColor: string,
      bgColor: string,
      lang: "en" | "fa"
    ) => {
      const settings: CalendarSettings = {
        type,
        tileNumber: tiles,
        weekendDays: weekend,
        weekendColor: color,
        firstDayOfWeek: firstDay,
        textColor: txtColor,
        backgroundColor: bgColor,
        language: lang,
      };
      localStorage.setItem("calendarSettings", JSON.stringify(settings));
      localStorage.setItem("calendarType", type);
      localStorage.setItem("tileNumber", JSON.stringify(tiles));
      localStorage.setItem("weekendDays", JSON.stringify(weekend));
      localStorage.setItem("weekendColor", color);
      localStorage.setItem("firstDayOfWeek", firstDay);
      localStorage.setItem("textColor", txtColor);
      localStorage.setItem("backgroundColor", bgColor);
      localStorage.setItem("language", lang);
    },
    []
  );

  useEffect(() => {
    saveCalendarSettings(calendarType, tileNumber, weekendDays, weekendColor, firstDayOfWeek, textColor, backgroundColor, language);
  }, [tileNumber, calendarType, weekendDays, weekendColor, firstDayOfWeek, textColor, backgroundColor, language, saveCalendarSettings]);

  useEffect(() => {
    const loadCalendarSettings = async () => {
      try {
        const savedSettings = localStorage.getItem("calendarSettings");
        if (savedSettings) {
          const settings = JSON.parse(savedSettings) as CalendarSettings;
          setCalendarType(settings.type);
          setTileNumber(settings.tileNumber);
          if (settings.weekendDays) setWeekendDays(settings.weekendDays);
          if (settings.weekendColor) setWeekendColor(settings.weekendColor);
          if (settings.firstDayOfWeek) setFirstDayOfWeek(settings.firstDayOfWeek);
          if (settings.textColor) setTextColor(settings.textColor);
          if (settings.backgroundColor) setBackgroundColor(settings.backgroundColor);
          if (settings.language) setLanguage(settings.language);
        } else {
          // Set defaults
          setCalendarType("gregorian");
          setTileNumber(10);
          setWeekendDays(["Friday"]);
          setWeekendColor("#1B4D3E");
          setFirstDayOfWeek("Saturday");
          setTextColor("#FFFFFF");
          setBackgroundColor("rgba(0, 0, 0, 0.2)");
          setLanguage("en");
          saveCalendarSettings("gregorian", 10, ["Friday"], "#1B4D3E", "Saturday", "#FFFFFF", "rgba(0, 0, 0, 0.2)", "en");
        }
      } catch (error) {
        console.error("Error loading calendar settings:", error);
        // Set defaults
        setCalendarType("gregorian");
        setTileNumber(10);
        setWeekendDays(["Friday"]);
        setWeekendColor("#1B4D3E");
        setFirstDayOfWeek("Saturday");
        setTextColor("#FFFFFF");
        setBackgroundColor("rgba(0, 0, 0, 0.5)");
        setLanguage("en");
        saveCalendarSettings("gregorian", 10, ["Friday"], "#1B4D3E", "Saturday", "#FFFFFF", "rgba(0, 0, 0, 0.2)", "en");
      }
    };

    loadCalendarSettings();
  }, []);

  // ─── EVENT HANDLERS & CALLBACKS ───────────────────────────────
  const loadSavedBackgrounds = useCallback(async () => {
    try {
      const backgrounds = await backgroundsDB.getAllItems<StoredBackground>();

      // Ensure all backgrounds have thumbnails
      const updatedBackgrounds = await Promise.all(
        backgrounds.map(async (bg) => {
          // Skip if already has thumbnail or is a color
          if (bg.thumbnailUrl || bg.type === "color") {
            return bg;
          }

          try {
            // Generate thumbnail for images without thumbnails
            bg.thumbnailUrl = await generateThumbnail(bg.url);
            await backgroundsDB.saveItem(bg); // Update in database
          } catch (error) {
            console.error("Failed to generate thumbnail:", error);
          }

          return bg;
        })
      );

      setSavedBackgrounds(updatedBackgrounds);
    } catch (error) {
      console.error("Error loading backgrounds:", error);
      setSavedBackgrounds([]);
    }
  }, []);

  const handleSelectBackground = useCallback(
    (background: StoredBackground) => {
      // Always use the original full-size image for the actual background
      const finalUrl = background.type === "image" && !isDataUrl(background.url) ? processImageUrl(background.url) : background.url;

      onSelectBackground(finalUrl);

      // Save both the original URL and thumbnail URL to localStorage
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          ...background,
          url: finalUrl,
        })
      );
      setIsOpen(false);
    },
    [onSelectBackground, storageKey]
  );

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      try {
        setIsUploading(true);

        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = e.target?.result as string;
          if (dataUrl) {
            try {
              // Generate thumbnail for the image
              const thumbnailUrl = await generateThumbnail(dataUrl);

              const newBackground: StoredBackground = {
                id: `bg-${Date.now()}`,
                url: dataUrl,
                thumbnailUrl: thumbnailUrl,
                isBlob: true,
                type: "image",
                createdAt: Date.now(),
              };

              await backgroundsDB.saveItem(newBackground);
              await loadSavedBackgrounds();
              handleSelectBackground(newBackground);
            } catch (error) {
              console.error("Failed to generate thumbnail:", error);
              // Fallback without thumbnail
              const newBackground: StoredBackground = {
                id: `bg-${Date.now()}`,
                url: dataUrl,
                isBlob: true,
                type: "image",
                createdAt: Date.now(),
              };

              await backgroundsDB.saveItem(newBackground);
              await loadSavedBackgrounds();
              handleSelectBackground(newBackground);
            }
          }
        };
        reader.readAsDataURL(file);

        if (imageFileInputRef.current) imageFileInputRef.current.value = "";
      } catch (e) {
        alert("Error uploading image");
      } finally {
        setIsUploading(false);
      }
    },
    [handleSelectBackground, loadSavedBackgrounds]
  );

  const handleUrlSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!urlInput.trim()) return;

      try {
        // Check URL validity without using constructor
        const validUrl = urlInput.startsWith("http://") || urlInput.startsWith("https://");
        if (!validUrl || !/\.(jpg|jpeg|png|gif|webp)$/i.test(urlInput)) {
          alert("Please enter a valid image URL");
          return;
        }

        setIsUploading(true);

        try {
          // Generate thumbnail from URL
          const thumbnailUrl = await generateThumbnail(urlInput);

          const newBackground: StoredBackground = {
            id: `bg-${Date.now()}`,
            url: urlInput,
            thumbnailUrl: thumbnailUrl,
            isBlob: false,
            type: "image",
            createdAt: Date.now(),
          };

          await backgroundsDB.saveItem(newBackground);
          await loadSavedBackgrounds();
          handleSelectBackground(newBackground);
          setUrlInput("");
        } catch (error) {
          console.error("Failed to generate thumbnail:", error);
          // Fallback without thumbnail
          const newBackground: StoredBackground = {
            id: `bg-${Date.now()}`,
            url: urlInput,
            isBlob: false,
            type: "image",
            createdAt: Date.now(),
          };

          await backgroundsDB.saveItem(newBackground);
          await loadSavedBackgrounds();
          handleSelectBackground(newBackground);
          setUrlInput("");
        }
      } catch (error) {
        alert("Please enter a valid URL");
      } finally {
        setIsUploading(false);
      }
    },
    [urlInput, handleSelectBackground, loadSavedBackgrounds]
  );

  const handleDeleteBackground = useCallback(
    async (backgroundToDelete: StoredBackground) => {
      try {
        await backgroundsDB.deleteItem(backgroundToDelete.id);
        await loadSavedBackgrounds();
      } catch (error) {
        console.error("Failed to delete background:", error);
        alert("Failed to delete the background. Please try again.");
      }
    },
    [loadSavedBackgrounds]
  );

  const handleTileNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value);
      if (value >= 10 && value <= 100) {
        setTileNumber(value);
        saveCalendarSettings(calendarType, value, weekendDays, weekendColor, firstDayOfWeek, textColor, backgroundColor, language); // Save settings immediately when tile number changes
      }
    },
    [calendarType, saveCalendarSettings, weekendDays, weekendColor, firstDayOfWeek, textColor, backgroundColor, language, setTileNumber]
  );

  const handleExportData = useCallback(async () => {
    try {
      setIsExporting(true);

      // Get all data
      const backgrounds = await backgroundsDB.getAllItems();
      const bookmarks = await bookmarksDB.getAllItems();
      const tasks = await tasksDB.getAllItems();

      // Create export object
      const exportObj = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        settings: {
          calendarType,
          tileNumber,
          firstDayOfWeek,
          weekendDays,
          weekendColor,
          textColor,
          backgroundColor,
          selectedBackground: localStorage.getItem(storageKey),
        },
        backgrounds,
        bookmarks,
        tasks,
      };

      // Create and download export file
      const dataStr = JSON.stringify(exportObj, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

      const exportFileDefaultName = `z-assistant-backup-${new Date().toISOString().slice(0, 10)}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error("Export error:", error);
      alert("Error exporting data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [storageKey, calendarType, tileNumber, firstDayOfWeek, weekendDays, weekendColor, textColor, backgroundColor, language]);

  const handleImportData = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        setIsUploading(true);

        const reader = new FileReader();
        reader.onload = async (e) => {
          const text = e.target?.result as string;
          if (text) {
            try {
              const importData = JSON.parse(text);

              // Check if this is a legacy format (with notes and todos) or new format (with tasks)
              const isLegacyFormat = importData.notes && importData.todos;
              const isNewFormat = importData.tasks;

              // Validate data structure
              if (!importData.settings || !importData.backgrounds || !importData.bookmarks || (!isLegacyFormat && !isNewFormat)) {
                throw new Error("Invalid import file format");
              }

              // Confirm with user
              if (!confirm("This will override your current settings and data. Continue?")) {
                return;
              }

              // Apply settings
              setCalendarType(importData.settings.calendarType);
              setTileNumber(importData.settings.tileNumber);
              if (importData.settings.selectedBackground) {
                localStorage.setItem(storageKey, importData.settings.selectedBackground);
              }

              // Import all data types
              // First clear existing data
              const backgroundItems = await backgroundsDB.getAllItems<StoredBackground>();
              for (const item of backgroundItems) {
                await backgroundsDB.deleteItem(item.id);
              }

              // Then import new data
              for (const bg of importData.backgrounds) {
                await backgroundsDB.saveItem(bg);
              }

              // Import bookmarks
              const bookmarkItems = await bookmarksDB.getAllItems();
              for (const item of bookmarkItems) {
                await bookmarksDB.deleteItem((item as { id: string }).id);
              }
              for (const bookmark of importData.bookmarks) {
                await bookmarksDB.saveItem(bookmark);
              }

              // Import tasks (new format) or convert legacy notes and todos
              const tasksItems = await tasksDB.getAllItems();
              for (const item of tasksItems) {
                await tasksDB.deleteItem((item as { id: string }).id);
              }

              if (isNewFormat) {
                // Import tasks directly
                for (const task of importData.tasks) {
                  await tasksDB.saveItem(task);
                }
              } else if (isLegacyFormat) {
                // Convert legacy notes to tasks
                for (const note of importData.notes) {
                  const noteTask = {
                    id: note.id,
                    text: note.text,
                    taskType: "note",
                    createdAt: note.createdAt,
                    color: note.color,
                    emoji: "📝", // Default emoji for converted notes
                  };
                  await tasksDB.saveItem(noteTask);
                }

                // Convert legacy todos to tasks
                for (const todo of importData.todos) {
                  const todoTask = {
                    id: todo.id,
                    text: todo.text,
                    taskType: "todo",
                    createdAt: Date.now(), // Legacy todos might not have createdAt
                    color: "rgba(255, 255, 255, 0.2)", // Default color
                    emoji: todo.emoji || "🚀", // Use existing emoji or default
                    completed: todo.completed,
                  };
                  await tasksDB.saveItem(todoTask);
                }
              }

              // Reload backgrounds
              await loadSavedBackgrounds();

              // Apply selected background if available
              if (importData.backgrounds.length > 0) {
                onSelectBackground(importData.backgrounds[0].url);
              }

              alert("Data successfully imported!");

              // Reload the page to apply all changes
              window.location.reload();
            } catch (error) {
              console.error("Import parsing error:", error);
              alert("Invalid import file. Please try again with a valid export file.");
            }
          }
        };
        reader.readAsText(file);

        if (dataFileInputRef.current) dataFileInputRef.current.value = "";
      } catch (error) {
        console.error("Import error:", error);
        alert("Error importing data. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [storageKey, calendarType, setCalendarType, tileNumber, onSelectBackground, loadSavedBackgrounds]
  );

  const handleWeekendDayToggle = (day: DayOfWeek) => {
    const newWeekendDays = weekendDays.includes(day)
      ? weekendDays.filter((d: DayOfWeek) => d !== day) // Remove day if already selected
      : weekendDays.length >= 3
        ? weekendDays // If already at 3 days, don't add more
        : [...weekendDays, day]; // Otherwise add the day

    if (weekendDays.length >= 3 && !weekendDays.includes(day)) {
      alert("You can select a maximum of 3 weekend days");
      return;
    }

    setWeekendDays(newWeekendDays);
  };

  const handleWeekendColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWeekendColor(e.target.value);
  };

  // ─── OTHER EFFECTS ──────────────────────────────────────────────
  // Handle click outside of the selector to close the modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Load saved background from localStorage on mount
  useEffect(() => {
    const lastSelected = localStorage.getItem(storageKey);
    if (lastSelected) {
      try {
        const parsed = JSON.parse(lastSelected);
        if (!parsed.isBlob || parsed.url.startsWith("data:")) {
          onSelectBackground(parsed.url);
        }
      } catch {
        onSelectBackground(lastSelected);
      }
    }
  }, [storageKey, onSelectBackground]);

  // ─── RENDER ─────────────────────────────────────────────────────
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end" id="background-container" dir="ltr" style={{ right: "1rem", left: "auto" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black/20 backdrop-blur-md p-2 rounded-full hover:bg-white/30 transition-colors shadow-lg"
        style={{ backgroundColor, color: textColor }}
      >
        <SlidersHorizontal className="w-5 h-5" style={{ color: textColor }} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onClick={() => setIsOpen(false)}
        >
          <div
            ref={selectorRef}
            className="rounded-xl p-4 shadow-lg flex flex-col overflow-hidden"
            style={{
              width: "50vw",
              maxWidth: "800px",
              height: "80vh",
              maxHeight: "800px",
              minWidth: "280px",
              minHeight: "400px",
              backgroundColor: "#000000", // Solid background color (slate-800)
              color: textColor,
            }}
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
          >
            {/* ─── MAIN TABS ─── */}
            <div className="flex gap-2 mb-4 flex-shrink-0">
              <button
                onClick={() => setMainTab("settings")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm md:text-base flex items-center justify-center gap-2 ${
                  mainTab === "settings" ? "bg-white/30 shadow-inner" : "hover:bg-white/20"
                } transition-colors`}
                style={{ color: textColor }}
              >
                <SlidersHorizontal className="w-4 h-4" style={{ color: textColor }} />
                {t("settings.title")}
              </button>
              <button
                onClick={() => setMainTab("backgrounds")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm md:text-base flex items-center justify-center gap-2 ${
                  mainTab === "backgrounds" ? "bg-white/30 shadow-inner" : "hover:bg-white/20"
                } transition-colors`}
                style={{ color: textColor }}
              >
                <Image className="w-4 h-4" style={{ color: textColor }} />
                {t("settings.backgrounds")}
              </button>
            </div>

            {/* Close button - added for centered modal */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/30 hover:bg-black/40 transition-colors"
            >
              <X className="w-5 h-5" style={{ color: textColor }} />
            </button>

            {mainTab === "backgrounds" ? (
              <>
                {/* ─── BACKGROUND SUB-TABS ─── */}
                <div className="flex gap-2 mb-4 flex-shrink-0">
                  <button
                    onClick={() => setActiveTab("images")}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm md:text-base flex items-center justify-center gap-2 ${
                      activeTab === "images" ? "bg-white/30 shadow-inner" : "hover:bg-white/20"
                    } transition-colors`}
                    style={{ color: textColor }}
                  >
                    <Image className="w-4 h-4" style={{ color: textColor }} />
                    {t("settings.images")}
                  </button>
                  <button
                    onClick={() => setActiveTab("colors")}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm md:text-base flex items-center justify-center gap-2 ${
                      activeTab === "colors" ? "bg-white/30 shadow-inner" : "hover:bg-white/20"
                    } transition-colors`}
                    style={{ color: textColor }}
                  >
                    <Palette className="w-4 h-4" style={{ color: textColor }} />
                    {t("settings.colors")}
                  </button>
                </div>

                {/* ─── BACKGROUND TAB CONTENT ─── */}
                {activeTab === "images" ? (
                  <div className="flex flex-col flex-grow overflow-hidden">
                    {/* Image Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4 overflow-auto flex-grow custom-scrollbar p-1">
                      {[...defaultBackgrounds, ...savedBackgrounds.filter((bg) => bg.type === "image")].map((bg) => (
                        <BackgroundThumbnail
                          key={bg.id}
                          bg={bg}
                          onSelect={() => handleSelectBackground(bg)}
                          onRemove={bg.isBlob ? () => handleDeleteBackground(bg) : undefined}
                        />
                      ))}
                    </div>

                    {/* Upload & URL form */}
                    <div className="space-y-3 flex-shrink-0 bg-white/10 p-3 rounded-lg">
                      {/* Upload File */}
                      <button
                        onClick={() => imageFileInputRef.current?.click()}
                        className="w-full bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 shadow-sm"
                        disabled={isUploading}
                      >
                        <Upload className="w-4 h-4" />
                        {isUploading ? t("settings.uploading") : t("settings.uploadImage")}
                      </button>
                      <input ref={imageFileInputRef} type="file" accept="image/*,.gif" onChange={handleFileUpload} className="hidden" />

                      {/* URL Submission Form */}
                      <form onSubmit={handleUrlSubmit} className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          placeholder={t("settings.pasteImageUrl")}
                          className="flex-1 bg-white/20 hover:bg-white/30 focus:bg-white/30 transition-colors px-4 py-2 rounded-lg text-sm text-white placeholder-white/60 outline-none shadow-sm"
                        />
                        <button
                          type="submit"
                          className="bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-lg text-white flex items-center justify-center shadow-sm"
                        >
                          <Link className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  // Colors Tab Content
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 overflow-auto flex-grow p-1">
                    {colorOptions.map((color) => (
                      <BackgroundThumbnail key={color.id} bg={color} onSelect={() => handleSelectBackground(color)} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              // ─── SETTINGS TAB CONTENT ───
              <div className="flex flex-col gap-5 overflow-auto flex-grow custom-scrollbar p-1">
                {/* Group 1: Calendar Type & Language */}
                <div className="bg-white/10 p-3 rounded-lg shadow-sm">
                  <h3 className="text-sm font-medium mb-3 border-b border-white/20 pb-1">{t("settings.calendarType.title")}</h3>
                  <div className="flex w-full gap-2">
                    <button
                      className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                        calendarType === "gregorian" ? "bg-white/50 hover:bg-white/60 shadow-inner" : "bg-white/20 hover:bg-white/30"
                      }`}
                      onClick={() => updateCalendarType("gregorian")}
                      style={{ color: textColor }}
                    >
                      <Globe className="w-4 h-4 inline-block mr-2" /> {t("settings.language.english")} ({t("settings.calendarType.gregorian")})
                    </button>
                    <button
                      className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                        calendarType === "persian" ? "bg-white/50 hover:bg-white/60 shadow-inner" : "bg-white/20 hover:bg-white/30"
                      }`}
                      onClick={() => updateCalendarType("persian")}
                      style={{ color: textColor }}
                    >
                      <Globe className="w-4 h-4 inline-block ml-2" /> {t("settings.language.persian")} ({t("settings.calendarType.persian")})
                    </button>
                  </div>
                </div>

                {/* Group 2: Calendar Configuration */}
                <div className="bg-white/10 p-3 rounded-lg shadow-sm">
                  <h3 className="text-sm font-medium mb-3 border-b border-white/20 pb-1">{t("settings.calendarConfig")}</h3>

                  {/* First Day of the Week selector */}
                  <div className="flex flex-col w-full mb-4">
                    <label className="text-sm mb-1.5" style={{ color: textColor }}>
                      {t("settings.firstDayOfWeek")}
                    </label>
                    <Select
                      className="basic-single"
                      classNamePrefix="select"
                      defaultValue={daysOptions.find((option) => option.value === firstDayOfWeek)}
                      isDisabled={false}
                      isLoading={false}
                      isClearable={false}
                      isRtl={false}
                      isSearchable={false}
                      name="emoji"
                      options={daysOptions}
                      menuPortalTarget={document.body}
                      menuPosition="absolute"
                      menuShouldScrollIntoView={false}
                      styles={customStyles}
                      onChange={(selectedOption) => {
                        if (selectedOption) {
                          setFirstDayOfWeek(selectedOption.value as DayOfWeek);
                        }
                      }}
                    />
                  </div>

                  {/* Weekend Days Selector & Color */}
                  <div className="flex flex-col w-full mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm" style={{ color: textColor }}>
                        {t("settings.weekendDays")}
                      </label>

                      <div className="relative" title="Weekend Color">
                        <div
                          className="w-8 h-8 rounded border border-white/30 cursor-pointer flex-shrink-0"
                          style={{ backgroundColor: weekendColor }}
                          onClick={() => setIsWeekendPickerOpen(!isWeekendPickerOpen)}
                        ></div>

                        {isWeekendPickerOpen && (
                          <div className="absolute right-0 mt-2 z-10">
                            <div className="fixed inset-0" onClick={() => setIsWeekendPickerOpen(false)} style={{ zIndex: -1 }}></div>
                            <ChromePicker
                              color={weekendColor}
                              onChange={(color: any) => {
                                const rgbaColor = `rgba(${color.rgb.r},${color.rgb.g},${color.rgb.b},${color.rgb.a})`;
                                setWeekendColor(rgbaColor);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                        <button
                          key={day}
                          onClick={() => handleWeekendDayToggle(day as DayOfWeek)}
                          className={`h-10 flex items-center justify-center rounded-md text-sm ${
                            weekendDays.includes(day as DayOfWeek) ? "bg-green-500/80 shadow-inner" : "bg-white/20 hover:bg-white/30"
                          } transition-colors`}
                          style={{ color: textColor }}
                        >
                          {t(`daysShort.${day}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tile Number Input */}
                  <div className="flex flex-col w-full">
                    <label className="text-sm mb-1.5" style={{ color: textColor }}>
                      {t("settings.tileNumber")}
                    </label>
                    <input
                      type="number"
                      value={tileNumber}
                      onChange={handleTileNumberChange}
                      min="10"
                      max="100"
                      className="w-full bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-lg text-sm outline-none shadow-inner"
                      style={{ color: textColor }}
                    />
                  </div>
                </div>

                {/* Group 3: Appearance */}
                <div className="bg-white/10 p-3 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium border-b border-white/20 pb-1">{t("settings.appearance")}</h3>

                    <button
                      className="px-3 py-1 rounded-lg text-xs bg-black/40 hover:bg-black/50 transition-colors flex items-center gap-1"
                      style={{ color: textColor }}
                      onClick={() => {
                        // Reset to defaults
                        setTextColor("#FFFFFF");
                        setBackgroundColor("rgba(0, 0, 0, 0.2)");
                      }}
                    >
                      <RotateCcw className="w-3 h-3" /> {t("settings.reset")}
                    </button>
                  </div>

                  {/* Text Color */}
                  <div className="flex items-center gap-3 mb-4">
                    <label className="text-sm whitespace-nowrap" style={{ color: textColor }}>
                      {t("settings.textColor")}
                    </label>

                    <div className="flex ml-auto items-center gap-2">
                      <div className="relative" title="Text Color">
                        <div
                          className="w-9 h-9 rounded border border-white/30 cursor-pointer shadow-sm"
                          style={{ backgroundColor: textColor }}
                          onClick={() => setIsTextPickerOpen(!isTextPickerOpen)}
                        ></div>

                        {isTextPickerOpen && (
                          <div className="absolute right-0 mt-2 z-10">
                            <div className="fixed inset-0" onClick={() => setIsTextPickerOpen(false)} style={{ zIndex: -1 }}></div>
                            <ChromePicker
                              color={textColor}
                              onChange={(color: any) => {
                                const rgbaColor = `rgba(${color.rgb.r},${color.rgb.g},${color.rgb.b},${color.rgb.a})`;
                                setTextColor(rgbaColor);
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div
                        className="w-7 h-7 rounded flex items-center justify-center"
                        style={{ backgroundColor: "rgba(0,0,0,0.4)", color: textColor }}
                      >
                        T
                      </div>
                    </div>
                  </div>

                  {/* Background Color */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm whitespace-nowrap" style={{ color: textColor }}>
                      {t("settings.backgroundColor")}
                    </label>

                    <div className="flex ml-auto items-center gap-2">
                      <div className="relative" title="Background Color">
                        <div
                          className="w-9 h-9 rounded border border-white/30 cursor-pointer shadow-sm"
                          style={{ backgroundColor }}
                          onClick={() => setIsPickerOpen(!isPickerOpen)}
                        ></div>

                        {isPickerOpen && (
                          <div className="absolute right-0 mt-2 z-10">
                            <div className="fixed inset-0" onClick={() => setIsPickerOpen(false)} style={{ zIndex: -1 }}></div>
                            <ChromePicker
                              color={backgroundColor}
                              onChange={(color: any) => {
                                const rgbaColor = `rgba(${color.rgb.r},${color.rgb.g},${color.rgb.b},${color.rgb.a})`;
                                setBackgroundColor(rgbaColor);
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div
                        className="w-7 h-7 rounded flex items-center justify-center"
                        style={{ backgroundColor, border: "1px solid rgba(255,255,255,0.3)" }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Group 4: Data Management */}
                <div className="bg-white/10 p-3 rounded-lg shadow-sm">
                  <h3 className="text-sm font-medium mb-3 border-b border-white/20 pb-1">{t("settings.dataManagement")}</h3>
                  <div className="flex flex-col sm:flex-row w-full gap-2">
                    <button
                      className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-green-600/50 hover:bg-green-600/60 transition-colors flex items-center justify-center gap-2 shadow-sm"
                      onClick={handleExportData}
                      style={{ color: textColor }}
                    >
                      <Download className="w-4 h-4" style={{ color: textColor }} />
                      {t("settings.exportData")}
                    </button>
                    <button
                      className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-blue-600/50 hover:bg-blue-600/60 transition-colors flex items-center justify-center gap-2 shadow-sm"
                      onClick={() => dataFileInputRef.current?.click()}
                      style={{ color: textColor }}
                    >
                      <FileUp className="w-4 h-4" style={{ color: textColor }} />
                      {t("settings.importData")}
                    </button>
                    <input type="file" ref={dataFileInputRef} accept=".json" onChange={handleImportData} className="hidden" id="import-data-input" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
