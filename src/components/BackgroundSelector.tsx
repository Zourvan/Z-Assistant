import React, { createContext, useState, useContext, useRef, useEffect, useCallback, useMemo } from "react";
import { SlidersHorizontal, Image, Upload, Link, X, Palette } from "lucide-react";
import "./BackgroundSelector.css";

interface BackgroundSelectorProps {
  onSelectBackground: (background: string) => void;
  onCalendarTypeChange?: (type: "gregorian" | "persian") => void;
  storageKey?: string;
  calendarType: "gregorian" | "persian";
}

interface CalendarSettings {
  type: "gregorian" | "persian";
  tileNumber: number;
}

interface StoredBackground {
  id: string;
  url: string;
  isBlob: boolean;
  type: "image" | "color";
  createdAt: number;
}

const DB_NAME = "backgroundSelectorDB";
const STORE_NAME = "backgrounds";
const DB_VERSION = 1;

const isDataUrl = (url: string) => url.startsWith("data:");
const isColor = (str: string) => /^#([0-9A-F]{3}){1,2}$/i.test(str);

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

// Database initialization function
const initializeDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("Failed to open database:", request.error);
      reject(request.error);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME);
      }

      const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
      store.createIndex("type", "type", { unique: false });
      store.createIndex("createdAt", "createdAt", { unique: false });
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
  });
};

// Database operations wrapper
const createDatabaseOperations = () => {
  let db: IDBDatabase | null = null;

  const getDB = async (): Promise<IDBDatabase> => {
    if (!db) {
      db = await initializeDB();
    }
    return db;
  };

  const saveBackground = async (background: StoredBackground): Promise<void> => {
    const database = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(background);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  };

  const getAllBackgrounds = async (): Promise<StoredBackground[]> => {
    const database = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      transaction.oncomplete = () => resolve(request.result || []);
      transaction.onerror = () => reject(transaction.error);
    });
  };

  const deleteBackground = async (id: string): Promise<void> => {
    const database = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  };

  return {
    saveBackground,
    getAllBackgrounds,
    deleteBackground
  };
};

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

const CalendarContext = createContext({
  calendarType: "gregorian" as "gregorian" | "persian",
  setCalendarType: (type: "gregorian" | "persian") => {}
});

// Create provider component
export function CalendarProvider({ children }) {
  const [calendarType, setCalendarType] = useState<"gregorian" | "persian">(() => {
    // Try to get saved preference from localStorage
    const saved = localStorage.getItem("calendarType");
    return saved === "persian" || saved === "gregorian" ? saved : "gregorian";
  });

  const updateCalendarType = (type: "gregorian" | "persian") => {
    setCalendarType(type);
    localStorage.setItem("calendarType", type);
  };

  return <CalendarContext.Provider value={{ calendarType, setCalendarType: updateCalendarType }}>{children}</CalendarContext.Provider>;
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error("useCalendar must be used within a CalendarProvider");
  }
  return context;
}

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({ onSelectBackground, storageKey = "selectedBackground" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"images" | "colors">("images");
  const [urlInput, setUrlInput] = useState("");
  const [tileNumber, setTileNumber] = useState(10);
  const [isUploading, setIsUploading] = useState(false);
  const { calendarType, setCalendarType } = useCalendar();
  const [selectedDay, setSelectedDay] = React.useState(null);
  const [firstDayOfWeek, setFirstDayOfWeek] = React.useState("Saturday");
  const [savedBackgrounds, setSavedBackgrounds] = useState<StoredBackground[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dbOps = createDatabaseOperations();

  const selectorRef = useRef<HTMLDivElement>(null);

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
  }, [isOpen, setIsOpen]);

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
        "/static/background/g-20.gif"
      ].map((url) => ({
        id: url,
        url,
        isBlob: false,
        type: "image" as const,
        createdAt: Date.now()
      })),
    []
  );

  const colorOptions = useMemo(
    () =>
      ["#000000", "#eeeeee", "#1E40AF", "#047857", "#B45309", "#9F1239", "#4C1D95", "#831843", "#3730A3", "#064E3B", "#701A75", "#7C2D12"].map(
        (color) => ({
          id: color,
          url: color,
          isBlob: false,
          type: "color" as const,
          createdAt: Date.now()
        })
      ),
    []
  );

  const loadSavedBackgrounds = useCallback(async () => {
    try {
      const backgrounds = await dbOps.getAllBackgrounds();
      setSavedBackgrounds(backgrounds);
    } catch (error) {
      console.error("Error loading backgrounds:", error);
      setSavedBackgrounds([]);
    }
  }, []);

  useEffect(() => {
    loadSavedBackgrounds();
  }, [loadSavedBackgrounds]);

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

  const saveCalendarSettings = useCallback((type: "gregorian" | "persian", tiles: number) => {
    const settings: CalendarSettings = {
      type,
      tileNumber: tiles
    };
    console.log();
    localStorage.setItem("calendarSettings", JSON.stringify(settings));
    localStorage.setItem("calendarType", type);
    localStorage.setItem("tileNumber", JSON.stringify(tiles));
  }, []);

  useEffect(() => {
    saveCalendarSettings(calendarType, tileNumber);
  }, [tileNumber, calendarType, saveCalendarSettings]);

  useEffect(() => {
    const loadCalendarSettings = () => {
      try {
        const savedSettings = localStorage.getItem("calendarSettings");
        if (savedSettings) {
          const settings = JSON.parse(savedSettings) as CalendarSettings;
          setCalendarType(settings.type);
          setTileNumber(settings.tileNumber);
        } else {
          // Set default values if no settings exist
          setCalendarType("gregorian");
          setTileNumber(10);
          saveCalendarSettings("gregorian", 10);
        }
      } catch (error) {
        console.error("Error loading calendar settings:", error);
        // Set default values on error
        setCalendarType("gregorian");
        setTileNumber(10);
        saveCalendarSettings("gregorian", 10);
      }
    };

    loadCalendarSettings();
  }, [saveCalendarSettings]);

  const handleSelectBackground = useCallback(
    (background: StoredBackground) => {
      const finalUrl = background.type === "image" && !isDataUrl(background.url) ? processImageUrl(background.url) : background.url;

      onSelectBackground(finalUrl);
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          ...background,
          url: finalUrl
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
              createdAt: Date.now()
            };

            await dbOps.saveBackground(newBackground);
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
          createdAt: Date.now()
        };

        await dbOps.saveBackground(newBackground);
        await loadSavedBackgrounds();
        handleSelectBackground(newBackground);
        setUrlInput("");
      } catch {
        alert("Please enter a valid URL");
      }
    },
    [urlInput, handleSelectBackground, loadSavedBackgrounds]
  );

  const handleRemoveBackground = useCallback(
    async (backgroundToRemove: StoredBackground) => {
      try {
        await dbOps.deleteBackground(backgroundToRemove.id);
        await loadSavedBackgrounds();

        const currentBackground = localStorage.getItem(storageKey);
        if (currentBackground === backgroundToRemove.url) {
          handleSelectBackground(defaultBackgrounds[0]);
        }
      } catch (error) {
        console.error("Error removing background:", error);
      }
    },
    [defaultBackgrounds, storageKey, handleSelectBackground, loadSavedBackgrounds]
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

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end" id="background-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/30 transition-colors shadow-lg"
      >
        <SlidersHorizontal className="w-5 h-5 text-white" />
      </button>

      {isOpen ? (
        <div
          ref={selectorRef}
          className="mt-2 bg-white/20 backdrop-blur-md rounded-xl p-4 shadow-lg w-full h-full flex flex-col overflow-hidden"
          style={{
            width: "35vw", // افزایش عرض کادر
            height: "80vh", // افزایش ارتفاع کادر
            minWidth: "250px",
            minHeight: "500px" // افزایش حداقل اندازه
            // overflow: "hidden",
          }}
        >
          {/* تب‌ها */}
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

          {/* محتوای تب‌ها */}
          {activeTab === "images" ? (
            <div className="flex flex-col flex-grow overflow-hidden">
              {/* لیست تصاویر */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-4 overflow-auto flex-grow custom-scrollbar">
                {[...defaultBackgrounds, ...savedBackgrounds.filter((bg) => bg.type === "image")].map((bg) => (
                  <BackgroundThumbnail
                    key={bg.id}
                    bg={bg}
                    onSelect={() => handleSelectBackground(bg)}
                    onRemove={bg.isBlob ? () => handleRemoveBackground(bg) : undefined}
                  />
                ))}
              </div>

              {/* آپلود فایل و دریافت URL */}
              <div className="space-y-4 flex-shrink-0">
                {/* آپلود فایل */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-white/30 hover:bg-white/40 transition-colors px-4 py-2 rounded-lg text-sm text-white flex items-center justify-center gap-2"
                  disabled={isUploading}
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? "Uploading..." : "Upload Image"}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*,.gif" onChange={handleFileUpload} className="hidden" />

                {/* فرم دریافت URL */}
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
            // تب رنگ‌ها
            <div className="grid grid-cols-4 gap-4 overflow-auto flex-grow">
              {colorOptions.map((color) => (
                <BackgroundThumbnail key={color.id} bg={color} onSelect={() => handleSelectBackground(color)} />
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-4 w-full flex-shrink-0">
            {/* سطر انتخاب روزهای هفته */}
            <div className="flex justify-between items-center gap-2">
              {["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)} // تغییر روز انتخاب شده
                  className={`w-10 h-10 flex items-center justify-center rounded-full text-sm ${
                    selectedDay === day ? "bg-green-500 text-white" : "bg-white/30 text-white"
                  } hover:bg-white/40 transition-colors`}
                >
                  {day.slice(0, 2)} {/* نمایش دو حرف اول روز */}
                </button>
              ))}
            </div>

            {/* سطر انتخاب روز اول هفته */}
            <div className="flex flex-col w-full">
              <label className="text-white text-sm mb-2">First Day of the Week</label>
              <select
                value={firstDayOfWeek}
                onChange={(e) => setFirstDayOfWeek(e.target.value)}
                className="w-full bg-white/30 hover:bg-white/40 focus:bg-white/40 transition-colors px-4 py-2 rounded-full text-sm text-white outline-none cursor-pointer backdrop-blur-sm"
              >
                {["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                  <option key={day} value={day} className="bg-transparent text-white cursor-pointer">
                    {day}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* تنظیمات پایین */}
          <div className="mt-4 flex flex-col gap-4 w-full flex-shrink-0">
            {/* دکمه‌ها */}
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

            {/* ورودی Tile Number */}
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
      ) : null}
    </div>
  );
};

export default BackgroundSelector;
