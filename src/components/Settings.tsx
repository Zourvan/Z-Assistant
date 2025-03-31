import React, { createContext, useState, useContext, useRef, useEffect, useCallback, useMemo, ReactNode } from "react";
import Select, { StylesConfig } from "react-select";
import { ChromePicker } from "react-color";
import { SlidersHorizontal, Image, Upload, Link, X, Palette, Download, FileUp } from "lucide-react";
import createDatabase from "./IndexedDatabase/IndexedDatabase";

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

const daysOptions: EmojiOption[] = [
  { value: "Saturday", label: "Saturday" },
  { value: "Sunday", label: "Sunday" },
  { value: "Monday", label: "Monday" },
  { value: "Tuesday", label: "Tuesday" },
  { value: "Wednesday", label: "Wednesday" },
  { value: "Thursday", label: "Thursday" },
  { value: "Friday", label: "Friday" },
];

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
}

// Type for stored background data
export interface StoredBackground {
  id: string;
  url: string;
  isBlob: boolean;
  type: "image" | "color";
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
    const img = document.createElement('img');
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
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Generate thumbnail as data URL
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(thumbnailDataUrl);
      } catch (err) {
        reject(err);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
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
  setBackgroundColor: (_color: string) => {}
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
      return saved as DayOfWeek || "Saturday";
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
  
  const [textColor, setTextColor] = useState<string>(() => {
    const saved = localStorage.getItem("textColor");
    return saved || "#FFFFFF";
  });
  
  const [backgroundColor, setBackgroundColor] = useState<string>(() => {
    const saved = localStorage.getItem("backgroundColor");
    return saved || "rgba(0, 0, 0, 0.2)";
  });

  const updateCalendarType = (type: "gregorian" | "persian") => {
    setCalendarType(type);
    localStorage.setItem("calendarType", type);
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
  
  const updateTextColor = (color: string) => {
    setTextColor(color);
    localStorage.setItem("textColor", color);
  };
  
  const updateBackgroundColor = (color: string) => {
    setBackgroundColor(color);
    localStorage.setItem("backgroundColor", color);
  };

  return (
    <CalendarContext.Provider 
      value={{ 
        calendarType, 
        setCalendarType: updateCalendarType,
        weekendDays,
        setWeekendDays: updateWeekendDays,
        weekendColor,
        setWeekendColor: updateWeekendColor,
        firstDayOfWeek,
        setFirstDayOfWeek: updateFirstDayOfWeek,
        tileNumber,
        setTileNumber: updateTileNumber,
        textColor,
        setTextColor: updateTextColor,
        backgroundColor,
        setBackgroundColor: updateBackgroundColor
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

  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const dataFileInputRef = useRef<HTMLInputElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);

  // Access calendar context
  const { calendarType, setCalendarType, weekendDays, setWeekendDays, weekendColor, setWeekendColor, firstDayOfWeek, setFirstDayOfWeek, tileNumber, setTileNumber, textColor, setTextColor, backgroundColor, setBackgroundColor } = useCalendar();

  // ─── DEFAULT DATA (Backgrounds & Colors) ───────────────────────
  const defaultBackgrounds = useMemo(
    () =>
      [
        "/static/background/img-1.jpg",
        "/static/background/img-2.jpg",
        "/static/background/img-3.jpg",
        "/static/background/img-4.jpg",
        "/static/background/img-5.jpg",
        "/static/background/img-6.jpg",
        "/static/background/img-7.jpg",
        "/static/background/img-8.jpg",
        "/static/background/img-9.jpg",
        "/static/background/img-10.jpg",
        "/static/background/img-11.jpg",
        "/static/background/img-12.jpg",
        "/static/background/g-1.gif",
        "/static/background/g-2.gif",
        "/static/background/g-3.gif",
        "/static/background/g-4.gif",
        "/static/background/g-5.gif",
        "/static/background/g-6.gif",
        "/static/background/g-7.gif",
        "/static/background/g-8.gif",
        "/static/background/g-9.gif",
        "/static/background/g-10.gif",
        "/static/background/g-11.gif",
        "/static/background/g-12.gif",
        "/static/background/g-13.gif",
        "/static/background/g-14.gif",
        "/static/background/g-15.gif",
        "/static/background/g-16.gif",
        "/static/background/g-17.gif",
        "/static/background/g-18.gif",
        "/static/background/g-19.gif",
        "/static/background/g-20.gif",
      ].map((url) => ({
        id: url,
        url,
        thumbnailUrl: processImageUrl(url, 200, 200), // Generate thumbnail URL with smaller dimensions
        isBlob: false,
        type: "image" as const,
        createdAt: Date.now(),
      })),
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
  const saveCalendarSettings = useCallback((type: "gregorian" | "persian", tiles: number, weekend: DayOfWeek[], color: string, firstDay: DayOfWeek, txtColor: string, bgColor: string) => {
    const settings: CalendarSettings = {
      type,
      tileNumber: tiles,
      weekendDays: weekend,
      weekendColor: color,
      firstDayOfWeek: firstDay,
      textColor: txtColor,
      backgroundColor: bgColor
    };
    localStorage.setItem("calendarSettings", JSON.stringify(settings));
    localStorage.setItem("calendarType", type);
    localStorage.setItem("tileNumber", JSON.stringify(tiles));
    localStorage.setItem("weekendDays", JSON.stringify(weekend));
    localStorage.setItem("weekendColor", color);
    localStorage.setItem("firstDayOfWeek", firstDay);
    localStorage.setItem("textColor", txtColor);
    localStorage.setItem("backgroundColor", bgColor);
  }, []);

  useEffect(() => {
    saveCalendarSettings(calendarType, tileNumber, weekendDays, weekendColor, firstDayOfWeek, textColor, backgroundColor);
  }, [tileNumber, calendarType, weekendDays, weekendColor, firstDayOfWeek, textColor, backgroundColor, saveCalendarSettings]);

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
        } else {
          // Set defaults
          setCalendarType("gregorian");
          setTileNumber(10);
          setWeekendDays(["Friday"]);
          setWeekendColor("#1B4D3E");
          setFirstDayOfWeek("Saturday");
          setTextColor("#FFFFFF");
          setBackgroundColor("rgba(0, 0, 0, 0.2)");
          saveCalendarSettings("gregorian", 10, ["Friday"], "#1B4D3E", "Saturday", "#FFFFFF", "rgba(0, 0, 0, 0.2)");
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
        setBackgroundColor("rgba(0, 0, 0, 0.2)");
        saveCalendarSettings("gregorian", 10, ["Friday"], "#1B4D3E", "Saturday", "#FFFFFF", "rgba(0, 0, 0, 0.2)");
      }
    };

    loadCalendarSettings();
  }, []);

  // ─── EVENT HANDLERS & CALLBACKS ───────────────────────────────
  const loadSavedBackgrounds = useCallback(async () => {
    try {
      const backgrounds = await backgroundsDB.getAllItems<StoredBackground>();
      
      // Ensure all backgrounds have thumbnails
      const updatedBackgrounds = await Promise.all(backgrounds.map(async (bg) => {
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
      }));
      
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
        const validUrl = urlInput.startsWith('http://') || urlInput.startsWith('https://');
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
        saveCalendarSettings(calendarType, value, weekendDays, weekendColor, firstDayOfWeek, textColor, backgroundColor); // Save settings immediately when tile number changes
      }
    },
    [calendarType, saveCalendarSettings, weekendDays, weekendColor, firstDayOfWeek, textColor, backgroundColor, setTileNumber]
  );

  const handleExportData = useCallback(async () => {
    try {
      // Gather data from all databases
      const backgroundData = await backgroundsDB.getAllItems();
      const bookmarkData = await bookmarksDB.getAllItems();
      const noteData = await notesDB.getAllItems();
      const todoData = await todosDB.getAllItems();
      
      // Create combined data object including settings
      const exportData = {
        timestamp: Date.now(),
        settings: {
          calendarType,
          tileNumber,
          selectedBackground: localStorage.getItem(storageKey) || null,
        },
        backgrounds: backgroundData,
        bookmarks: bookmarkData,
        notes: noteData,
        todos: todoData
      };
      
      // Create and download the file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `z-assistant-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error exporting data:", e);
      alert("Error exporting data. Please try again.");
    }
  }, [storageKey, calendarType, tileNumber, weekendDays, weekendColor, firstDayOfWeek, textColor, backgroundColor]);

  const handleImportData = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        setIsUploading(true);

        const reader = new FileReader();
        reader.onload = async (e) => {
          const text = e.target?.result as string;
          if (text) {
            try {
              const importData = JSON.parse(text);
              
              // Validate data structure
              if (!importData.settings || !importData.backgrounds || 
                  !importData.bookmarks || !importData.notes || !importData.todos) {
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
                await bookmarksDB.deleteItem((item as {id: string}).id);
              }
              for (const bookmark of importData.bookmarks) {
                await bookmarksDB.saveItem(bookmark);
              }
              
              // Import notes
              const noteItems = await notesDB.getAllItems();
              for (const item of noteItems) {
                await notesDB.deleteItem((item as {id: string}).id);
              }
              for (const note of importData.notes) {
                await notesDB.saveItem(note);
              }
              
              // Import todos
              const todoItems = await todosDB.getAllItems();
              for (const item of todoItems) {
                await todosDB.deleteItem((item as {id: string}).id);
              }
              for (const todo of importData.todos) {
                await todosDB.saveItem(todo);
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
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end" id="background-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black/20 backdrop-blur-md p-2 rounded-full hover:bg-white/30 transition-colors shadow-lg"
        style={{ backgroundColor, color: textColor }}
      >
        <SlidersHorizontal className="w-5 h-5" style={{ color: textColor }} />
      </button>

      {isOpen && (
        <div
          ref={selectorRef}
          className="mt-2 backdrop-blur-md rounded-xl p-4 shadow-lg w-full h-full flex flex-col overflow-hidden"
          style={{
            width: "50vw",
            height: "80vh",
            minWidth: "250px",
            minHeight: "500px",
            backgroundColor,
            color: textColor
          }}
        >
          {/* ─── MAIN TABS ─── */}
          <div className="flex gap-2 mb-4 flex-shrink-0">
            <button
              onClick={() => setMainTab("settings")}
              className={`flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 ${
                mainTab === "settings" ? "bg-white/30" : "hover:bg-white/20"
              } transition-colors`}
              style={{ color: textColor }}
            >
              <SlidersHorizontal className="w-4 h-4" style={{ color: textColor }} />
              Settings
            </button>
            <button
              onClick={() => setMainTab("backgrounds")}
              className={`flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 ${
                mainTab === "backgrounds" ? "bg-white/30" : "hover:bg-white/20"
              } transition-colors`}
              style={{ color: textColor }}
            >
              <Image className="w-4 h-4" style={{ color: textColor }} />
              Backgrounds
            </button>
          </div>

          {mainTab === "backgrounds" ? (
            <>
              {/* ─── BACKGROUND SUB-TABS ─── */}
              <div className="flex gap-2 mb-4 flex-shrink-0">
                <button
                  onClick={() => setActiveTab("images")}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 ${
                    activeTab === "images" ? "bg-white/30" : "hover:bg-white/20"
                  } transition-colors`}
                  style={{ color: textColor }}
                >
                  <Image className="w-4 h-4" style={{ color: textColor }} />
                  Images
                </button>
                <button
                  onClick={() => setActiveTab("colors")}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 ${
                    activeTab === "colors" ? "bg-white/30" : "hover:bg-white/20"
                  } transition-colors`}
                  style={{ color: textColor }}
                >
                  <Palette className="w-4 h-4" style={{ color: textColor }} />
                  Colors
                </button>
              </div>

              {/* ─── BACKGROUND TAB CONTENT ─── */}
              {activeTab === "images" ? (
                <div className="flex flex-col flex-grow overflow-hidden">
                  {/* Image List */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-4 overflow-auto flex-grow custom-scrollbar">
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
                  <div className="space-y-4 flex-shrink-0">
                    {/* Upload File */}
                    <button
                      onClick={() => imageFileInputRef.current?.click()}
                      className="w-full bg-white/30 hover:bg-white/40 transition-colors px-4 py-2 rounded-lg text-sm text-white flex items-center justify-center gap-2"
                      disabled={isUploading}
                    >
                      <Upload className="w-4 h-4" />
                      {isUploading ? "Uploading..." : "Upload Image"}
                    </button>
                    <input ref={imageFileInputRef} type="file" accept="image/*,.gif" onChange={handleFileUpload} className="hidden" />

                    {/* URL Submission Form */}
                    <form onSubmit={handleUrlSubmit} className="flex flex-col gap-3 sm:flex-row sm:gap-2">
                      <input
                        type="text"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="Paste image URL"
                        className="flex-1 bg-white/30 hover:bg-white/40 focus:bg-white/40 transition-colors px-4 py-2 rounded-lg text-sm text-white placeholder-white/50 outline-none"
                      />
                      <button
                        type="submit"
                        className="bg-white/30 hover:bg-white/40 transition-colors px-4 py-2 rounded-lg text-white flex items-center justify-center"
                      >
                        <Link className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                // Colors Tab Content
                <div className="grid grid-cols-4 gap-4 overflow-auto flex-grow">
                  {colorOptions.map((color) => (
                    <BackgroundThumbnail key={color.id} bg={color} onSelect={() => handleSelectBackground(color)} />
                  ))}
                </div>
              )}
            </>
          ) : (
            // ─── SETTINGS TAB CONTENT ─── 
            <div className="flex flex-col gap-4 overflow-auto flex-grow custom-scrollbar">
              {/* ─── SETTINGS SECTION ─── */}
              <div className="flex flex-col gap-4 w-full">
                {/* Weekend Days Selector & Color */}
                <div className="flex flex-col w-full gap-2">
                  <label className="text-sm mb-0.5" style={{ color: textColor }}>Weekend Days (select up to 3)</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex justify-between gap-1">
                      {["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                        <button
                          key={day}
                          onClick={() => handleWeekendDayToggle(day as DayOfWeek)}
                          className={`w-10 h-10 flex items-center justify-center rounded-full text-sm ${
                            weekendDays.includes(day as DayOfWeek) ? "bg-green-500" : "bg-white/30"
                          } hover:bg-white/40 transition-colors`}
                          style={{ color: textColor }}
                        >
                          {day.slice(0, 2)}
                        </button>
                      ))}
                    </div>
                    
                    <div className="relative" title="Weekend Color">
                      <div 
                        className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
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
                              console.log("Saving weekend color:", rgbaColor);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Text & Background Color Pickers */}
                <div className="flex flex-col w-full gap-4">
                  {/* Text & Background Colors & Reset in one row */}
                  <div className="flex items-center gap-3">
                    {/* Text Color */}
                    <div className="flex items-center gap-2 flex-1">
                      <label className="text-sm whitespace-nowrap" style={{ color: textColor }}>Text Color</label>
                      <div className="flex ml-auto items-center gap-2">
                        <div className="relative" title="Text Color">
                          <div 
                            className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
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
                                  console.log("Saving text color:", rgbaColor);
                                }}
                              />
                            </div>
                          )}
                        </div>
                        <div 
                          className="w-8 h-8 rounded flex items-center justify-center" 
                          style={{ backgroundColor: "rgba(0,0,0,0.4)", color: textColor }}
                        >
                          T
                        </div>
                      </div>
                    </div>
                    
                    {/* Background Color */}
                    <div className="flex items-center gap-2 flex-1">
                      <label className="text-sm whitespace-nowrap" style={{ color: textColor }}>Background Color</label>
                      <div className="flex ml-auto items-center gap-2">
                        <div className="relative" title="Background Color">
                          <div 
                            className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
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
                                  console.log("Saving background color:", rgbaColor);
                                }}
                              />
                            </div>
                          )}
                        </div>
                        <div 
                          className="w-8 h-8 rounded flex items-center justify-center" 
                          style={{ backgroundColor: "rgba(0,0,0,0.4)", color: textColor }}
                        >
                          Bg
                        </div>
                      </div>
                    </div>
                                      {/* Reset Colors Button */}
                  <button 
                    className="px-4 py-2 rounded-lg text-sm bg-blue-500/50 hover:bg-blue-500/60 transition-colors whitespace-nowrap"
                    style={{ color: textColor }}
                    onClick={() => {
                      // Reset to default values
                      const defaultTextColor = "#FFFFFF";
                      const defaultBgColor = "rgba(0, 0, 0, 0.2)";
                      
                      // Update states
                      setTextColor(defaultTextColor);
                      setBackgroundColor(defaultBgColor);
                      
                      // Save to localStorage
                      localStorage.setItem("textColor", defaultTextColor);
                      localStorage.setItem("backgroundColor", defaultBgColor);
                      
                      console.log("Reset colors to defaults");
                    }}
                  >
                    Reset Colors
                  </button>
                  </div>


                </div>

                {/* First Day of the Week selector */}
                <div className="flex flex-col w-full">
                  <label className="text-sm mb-0.5" style={{ color: textColor }}>First Day of the Week</label>
                  <Select
                    className="basic-single"
                    classNamePrefix="select"
                    defaultValue={daysOptions.find(option => option.value === firstDayOfWeek)}
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

                {/* Calendar Type Buttons */}
                <div className="flex w-full gap-2">
                  <button
                    className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                      calendarType === "gregorian" ? "bg-white/50 hover:bg-white/60" : "bg-white/30 hover:bg-white/40"
                    }`}
                    onClick={() => setCalendarType("gregorian")}
                    style={{ color: textColor }}
                  >
                    Gregorian
                  </button>
                  <button
                    className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                      calendarType === "persian" ? "bg-white/50 hover:bg-white/60" : "bg-white/30 hover:bg-white/40"
                    }`}
                    onClick={() => setCalendarType("persian")}
                    style={{ color: textColor }}
                  >
                    Persian
                  </button>
                </div>

                {/* Tile Number Input */}
                <div className="flex flex-col w-full">
                  <label className="text-sm mb-2" style={{ color: textColor }}>Tile Number</label>
                  <input
                    type="number"
                    value={tileNumber}
                    onChange={handleTileNumberChange}
                    min="10"
                    max="100"
                    className="w-full bg-white/30 hover:bg-white/40 transition-colors px-4 py-2 rounded-lg text-sm outline-none"
                    style={{ color: textColor }}
                  />
                </div>
                
                {/* Export/Import Buttons */}
                <div className="flex flex-col w-full gap-1 mt-1">
                  <label className="text-sm mb-0.5" style={{ color: textColor }}>Data Management</label>
                  <div className="flex w-full gap-2">
                    <button
                      className="flex-1 px-4 py-2 rounded-lg text-sm bg-green-500/50 hover:bg-green-500/60 transition-colors flex items-center justify-center gap-2"
                      onClick={handleExportData}
                      style={{ color: textColor }}
                    >
                      <Download className="w-4 h-4" style={{ color: textColor }} /> 
                      Export Data
                    </button>
                    <button
                      className="flex-1 px-4 py-2 rounded-lg text-sm bg-blue-500/50 hover:bg-blue-500/60 transition-colors flex items-center justify-center gap-2"
                      onClick={() => dataFileInputRef.current?.click()}
                      style={{ color: textColor }}
                    >
                      <FileUp className="w-4 h-4" style={{ color: textColor }} />
                      Import Data
                    </button>
                    <input 
                      type="file" 
                      ref={dataFileInputRef} 
                      accept=".json" 
                      onChange={handleImportData} 
                      className="hidden"
                      id="import-data-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
