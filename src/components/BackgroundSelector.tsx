import React, { createContext, useState, useContext, useRef, useEffect, useCallback, useMemo, ReactNode } from "react";
import Select, { StylesConfig } from "react-select";
import { SlidersHorizontal, Image, Upload, Link, X, Palette } from "lucide-react";
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
interface BackgroundSelectorProps {
  onSelectBackground: (background: string) => void;
  onCalendarTypeChange?: (type: "gregorian" | "persian") => void;
  storageKey?: string;
  calendarType: "gregorian" | "persian";
}

// Calendar settings type used for saving in localStorage
interface CalendarSettings {
  type: "gregorian" | "persian";
  tileNumber: number;
}

// Type for stored background data
export interface StoredBackground {
  id: string;
  url: string;
  isBlob: boolean;
  type: "image" | "color";
  createdAt: number;
}

//
// ─── CONFIGURATIONS & DATABASE ─────────────────────────────────────────────────────
//

// IndexedDB instance for backgrounds
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
                src={bg.url}
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
});

// CalendarProvider component which provides calendar settings via context
export function CalendarProvider({ children }: CalendarProviderProps) {
  const [calendarType, setCalendarType] = useState<"gregorian" | "persian">(() => {
    const saved = localStorage.getItem("calendarType");
    return saved === "persian" || saved === "gregorian" ? saved : "gregorian";
  });

  const updateCalendarType = (type: "gregorian" | "persian") => {
    setCalendarType(type);
    localStorage.setItem("calendarType", type);
  };

  return <CalendarContext.Provider value={{ calendarType, setCalendarType: updateCalendarType }}>{children}</CalendarContext.Provider>;
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
// ─── MAIN COMPONENT: BackgroundSelector ──────────────────────────────────────────
//

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({ onSelectBackground, storageKey = "selectedBackground" }) => {
  // ─── STATE & REFS ──────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"images" | "colors">("images");
  const [urlInput, setUrlInput] = useState("");
  const [tileNumber, setTileNumber] = useState(10);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<DayOfWeek>("Saturday");
  const [savedBackgrounds, setSavedBackgrounds] = useState<StoredBackground[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);

  // Access calendar context
  const { calendarType, setCalendarType } = useCalendar();

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
  const saveCalendarSettings = useCallback((type: "gregorian" | "persian", tiles: number) => {
    const settings: CalendarSettings = {
      type,
      tileNumber: tiles,
    };
    localStorage.setItem("calendarSettings", JSON.stringify(settings));
    localStorage.setItem("calendarType", type);
    localStorage.setItem("tileNumber", JSON.stringify(tiles));
  }, []);

  useEffect(() => {
    saveCalendarSettings(calendarType, tileNumber);
  }, [tileNumber, calendarType, saveCalendarSettings]);

  useEffect(() => {
    const loadCalendarSettings = async () => {
      try {
        const savedSettings = localStorage.getItem("calendarSettings");
        if (savedSettings) {
          const settings = JSON.parse(savedSettings) as CalendarSettings;
          setCalendarType(settings.type);
          setTileNumber(settings.tileNumber);
        }
      } catch (error) {
        console.error("Error loading calendar settings:", error);
      }
    };

    loadCalendarSettings();
  }, []);

  useEffect(() => {
    const loadCalendarSettings = () => {
      try {
        const savedSettings = localStorage.getItem("calendarSettings");
        if (savedSettings) {
          const settings = JSON.parse(savedSettings) as CalendarSettings;
          setCalendarType(settings.type);
          setTileNumber(settings.tileNumber);
        } else {
          setCalendarType("gregorian");
          setTileNumber(10);
          saveCalendarSettings("gregorian", 10);
        }
      } catch (error) {
        console.error("Error loading calendar settings:", error);
        setCalendarType("gregorian");
        setTileNumber(10);
        saveCalendarSettings("gregorian", 10);
      }
    };

    loadCalendarSettings();
  }, [saveCalendarSettings]);

  // ─── EVENT HANDLERS & CALLBACKS ───────────────────────────────
  const loadSavedBackgrounds = useCallback(async () => {
    try {
      const backgrounds = await backgroundsDB.getAllItems<StoredBackground>();
      setSavedBackgrounds(backgrounds);
    } catch (error) {
      console.error("Error loading backgrounds:", error);
      setSavedBackgrounds([]);
    }
  }, []);

  const handleSelectBackground = useCallback(
    (background: StoredBackground) => {
      const finalUrl = background.type === "image" && !isDataUrl(background.url) ? processImageUrl(background.url) : background.url;

      onSelectBackground(finalUrl);
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
        };
        reader.readAsDataURL(file);

        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (error) {
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
        new URL(urlInput);
        if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(urlInput)) {
          alert("Please enter a valid image URL");
          return;
        }

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
      } catch {
        alert("Please enter a valid URL");
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
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);
      if (value >= 10 && value <= 100) {
        setTileNumber(value);
        saveCalendarSettings(calendarType, value); // Save settings immediately when tile number changes
      }
    },
    [calendarType, saveCalendarSettings]
  );

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
      >
        <SlidersHorizontal className="w-5 h-5 text-white" />
      </button>

      {isOpen && (
        <div
          ref={selectorRef}
          className="mt-2 bg-black backdrop-blur-md rounded-xl p-4 shadow-lg w-full h-full flex flex-col overflow-hidden"
          style={{
            width: "50vw",
            height: "80vh",
            minWidth: "250px",
            minHeight: "500px",
          }}
        >
          {/* ─── TABS ─── */}
          <div className="flex gap-2 mb-4 flex-shrink-0">
            <button
              onClick={() => setActiveTab("images")}
              className={`flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 ${
                activeTab === "images" ? "bg-white/30" : "hover:bg-white/20"
              } transition-colors text-white`}
            >
              <Image className="w-4 h-4" />
              Images
            </button>
            <button
              onClick={() => setActiveTab("colors")}
              className={`flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 ${
                activeTab === "colors" ? "bg-white/30" : "hover:bg-white/20"
              } transition-colors text-white`}
            >
              <Palette className="w-4 h-4" />
              Colors
            </button>
          </div>

          {/* ─── TAB CONTENT ─── */}
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
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-white/30 hover:bg-white/40 transition-colors px-4 py-2 rounded-lg text-sm text-white flex items-center justify-center gap-2"
                  disabled={isUploading}
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? "Uploading..." : "Upload Image"}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*,.gif" onChange={handleFileUpload} className="hidden" />

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

          {/* ─── SETTINGS SECTION ─── */}
          <div className="mt-4 flex flex-col gap-4 w-full flex-shrink-0">
            {/* Day selector */}
            <div className="flex justify-between items-center gap-2">
              {["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full text-sm ${
                    selectedDay === day ? "bg-green-500 text-white" : "bg-white/30 text-white"
                  } hover:bg-white/40 transition-colors`}
                >
                  {day.slice(0, 2)}
                </button>
              ))}
            </div>

            {/* First Day of the Week selector */}
            <div className="flex flex-col w-full">
              <label className="text-white text-sm mb-0.5">First Day of the Week</label>
              <Select
                className="basic-single"
                classNamePrefix="select"
                defaultValue={daysOptions[0]}
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
              <div
                style={{
                  color: "hsl(0, 100%, 40%)",
                  display: "inline-block",
                  fontSize: 12,
                  fontStyle: "italic",
                  marginTop: "1em",
                }}
              ></div>
            </div>
          </div>

          {/* Bottom Settings */}
          <div className="mt-4 flex flex-col gap-4 w-full flex-shrink-0">
            {/* Calendar Type Buttons */}
            <div className="flex w-full gap-2">
              <button
                className={`flex-1 px-4 py-2 rounded-lg text-sm text-white ${
                  calendarType === "gregorian" ? "bg-white/50 hover:bg-white/60" : "bg-white/30 hover:bg-white/40"
                }`}
                onClick={() => setCalendarType("gregorian")}
              >
                Gregorian
              </button>
              <button
                className={`flex-1 px-4 py-2 rounded-lg text-sm text-white ${
                  calendarType === "persian" ? "bg-white/50 hover:bg-white/60" : "bg-white/30 hover:bg-white/40"
                }`}
                onClick={() => setCalendarType("persian")}
              >
                Persian
              </button>
            </div>

            {/* Tile Number Input */}
            <div className="flex flex-col w-full">
              <label className="text-white text-sm mb-2">Tile Number</label>
              <input
                type="number"
                value={tileNumber}
                onChange={handleTileNumberChange}
                min="10"
                max="100"
                className="w-full bg-white/30 hover:bg-white/40 transition-colors px-4 py-2 rounded-lg text-sm text-white outline-none placeholder-white/50"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
