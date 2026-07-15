import { useState, useEffect } from "react";
import { ClockCalendar } from "./components/ClockCalendar";
import { Weather } from "./components/Weather";
import { TimerAlarm } from "./components/TimerAlarm";
import { Bookmarks } from "./components/Bookmarks";
import { Settings } from "./components/Settings";
import { TasksAndNotes } from "./components/TasksAndNotes";
import SocialLinks from "./components/SocialLinks";
import { Tools } from "./components/Tools";
import { LanguageProvider } from "./i18n/LanguageProvider";
import { useTheme } from "./components/ThemeProvider";
import "./i18n/i18n"; // Import i18n initialization

import { parseStoredBackground } from "./components/settings/backgroundUtils";
import "./App.css";

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
  const [isLoading, setIsLoading] = useState(false);

  const handleBackgroundChange = async (newBackground: string) => {
    try {
      setIsLoading(true);

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
        setBackground(newBackground);
        document.documentElement.style.backgroundImage = "none";
        document.documentElement.style.backgroundColor = "transparent";
      }
    } catch (error) {
      console.error("Error changing background:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load saved background on initial render
  useEffect(() => {
    const loadSavedBackground = async () => {
      const savedBackground = localStorage.getItem("selectedBackground");
      if (savedBackground) {
        await handleBackgroundChange(parseStoredBackground(savedBackground));
      }
    };

    loadSavedBackground();
  }, []);

  // Get theme values
  const { textColor, backgroundColor } = useTheme();

  return (
    <LanguageProvider>
      {/* <MarketBoard /> */}
      <div
        className={`min-h-screen bg-cover bg-center transition-all duration-700 ease-in-out relative ${isLoading ? "opacity-40" : "opacity-100"}`}
        style={{
          backgroundImage: background !== "none" ? `url(${background})` : "none",
          // Remove all filters to display the image clearly
          filter: isLoading ? "opacity(0.4)" : "none",
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        )}

        <div
          className="app-content p-3 sm:p-4 md:p-6 lg:p-8 transition-all duration-300 overflow-x-hidden"
          style={{
            backgroundColor: background !== "none" ? "transparent" : backgroundColor,
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
                  <Weather />
                </div>
                <div className="dashboard-widget">
                  <TasksAndNotes />
                </div>
              </div>

              <div className="dashboard-col dashboard-col--bookmarks">
                <div className="dashboard-widget">
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

          <SocialLinks />
        </div>
      </div>
    </LanguageProvider>
  );
}

export default App;
