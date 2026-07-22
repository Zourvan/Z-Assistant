import { useState, useEffect } from "react";
import { ClockCalendar } from "./components/ClockCalendar";
import { Weather } from "./components/Weather";
import { TimerAlarm } from "./components/TimerAlarm";
import { Bookmarks } from "./components/Bookmarks";
import { BookmarkRemindersWidget } from "./components/bookmarks/reminders/BookmarkRemindersWidget";
import { Settings } from "./components/Settings";
import { TasksAndNotes } from "./components/TasksAndNotes";
import SocialLinks from "./components/SocialLinks";
import { Tools } from "./components/Tools";
import { AiPromptBar } from "./components/AiPromptBar";
import { LanguageProvider } from "./i18n/LanguageProvider";
import { useTheme } from "./components/ThemeProvider";
import "./i18n/i18n"; // Import i18n initialization

import { parseStoredBackground, resolveBackgroundUrl } from "./components/settings/backgroundUtils";
import { CorgiLayer } from "./features/corgi";
import { LoadingPage } from "./components/LoadingPage";
import "./App.css";

const MIN_BOOT_LOADING_MS = 1200;

// Helper function to get image from IndexedDB
const getImageFromIndexedDB = async (id: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("backgroundsDB", 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(["images"], "readonly");
      const store = transaction.objectStore("images");
      const getRequest = store.get(id);

      getRequest.onsuccess = () => resolve(getRequest.result?.data);
      getRequest.onerror = () => reject(getRequest.error);
    };
  });
};

function App() {
  const [background, setBackground] = useState("");
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isWeatherForecastOpen, setIsWeatherForecastOpen] = useState(false);

  const handleBackgroundChange = async (newBackground: string) => {
    try {
      // If it's a color
      if (newBackground.startsWith("#")) {
        setBackground("none");
        document.documentElement.style.backgroundColor = newBackground;
        document.documentElement.style.backgroundImage = "none";
      }
      // If it's a gradient
      else if (newBackground.startsWith("linear-gradient")) {
        setBackground("none");
        document.documentElement.style.backgroundImage = newBackground;
        document.documentElement.style.backgroundColor = "transparent";
      }
      // If it's an IndexedDB image ID (starts with 'bg-')
      else if (newBackground.startsWith("bg-")) {
        try {
          const imageUrl = await getImageFromIndexedDB(newBackground);
          setBackground(imageUrl);
          document.documentElement.style.backgroundImage = "none";
          document.documentElement.style.backgroundColor = "transparent";
        } catch (error) {
          console.error("Error loading background from IndexedDB:", error);
          // Fallback to default background
          // setBackground('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b');
        }
      }
      // If it's a regular image URL
      else {
        setBackground(resolveBackgroundUrl(newBackground));
        document.documentElement.style.backgroundImage = "none";
        document.documentElement.style.backgroundColor = "transparent";
      }
    } catch (error) {
      console.error("Error changing background:", error);
    }
  };

  // Boot: gear loading page, then reveal the dashboard
  useEffect(() => {
    const boot = async () => {
      const startedAt = Date.now();
      try {
        const savedBackground = localStorage.getItem("selectedBackground");
        if (savedBackground) {
          await handleBackgroundChange(parseStoredBackground(savedBackground));
        }
      } finally {
        const remaining = Math.max(0, MIN_BOOT_LOADING_MS - (Date.now() - startedAt));
        if (remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }
        setIsBootLoading(false);
      }
    };

    boot();
  }, []);

  // Get theme values
  const { textColor, backgroundColor } = useTheme();

  const hasImageBackground = Boolean(background) && background !== "none";

  return (
    <LanguageProvider>
      {isBootLoading && <LoadingPage />}

      {hasImageBackground && (
        <div
          className="app-bg"
          style={{ backgroundImage: `url(${background})` }}
          aria-hidden
        />
      )}

      {/* <MarketBoard /> */}
      <div
        className={`app-shell transition-opacity duration-700 ease-in-out ${isBootLoading ? "opacity-0" : "opacity-100"}`}
        aria-hidden={isBootLoading}
      >
        <div
          className="app-content p-3 sm:p-4 md:p-6 lg:p-8 transition-all duration-300 overflow-x-hidden"
          style={{
            backgroundColor: hasImageBackground ? "transparent" : backgroundColor,
            color: textColor,
          }}
        >
          <div className="dashboard">
            <div className="dashboard-grid">
              <div className="dashboard-col dashboard-col--time">
                <div className="dashboard-widget">
                  <ClockCalendar />
                </div>
                <div className="dashboard-widget">
                  <TimerAlarm />
                </div>
              </div>

              <div className="dashboard-col dashboard-col--tasks">
                <div className="dashboard-widget">
                  <Weather onForecastOpenChange={setIsWeatherForecastOpen} />
                </div>
                <div
                  className={`dashboard-widget dashboard-widget--tasks-panel${isWeatherForecastOpen ? " is-hidden" : ""}`}
                  aria-hidden={isWeatherForecastOpen}
                >
                  <div className="dashboard-widget__inner">
                    <TasksAndNotes />
                  </div>
                </div>
              </div>

              <div className="dashboard-col dashboard-col--bookmarks">
                <div className="dashboard-widget">
                  <BookmarkRemindersWidget />
                  <Bookmarks />
                </div>
              </div>
            </div>
          </div>

          <div className="app-actions-wrap" dir="ltr" style={{ direction: "ltr" }}>
            <div
              className="app-actions-panel backdrop-blur-md rounded-xl p-3 shadow-lg flex flex-col gap-3 pointer-events-auto"
              style={{ backgroundColor }}
            >
              <Settings onSelectBackground={handleBackgroundChange} storageKey="selectedBackground" />
              <Tools />
            </div>
          </div>

          <AiPromptBar />
          <SocialLinks />
        </div>
      </div>

      {/* Decorative pets: above widgets, below settings/tools/modals (z-index 100) */}
      {!isBootLoading && <CorgiLayer />}
    </LanguageProvider>
  );
}

export default App;
