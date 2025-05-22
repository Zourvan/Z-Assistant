import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";

// Interface for theme settings
interface ThemeSettings {
  textColor: string;
  backgroundColor: string;
}

// Context interface with state and setters
interface ThemeContextType extends ThemeSettings {
  setTextColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  resetTheme: () => void;
}

// Props for ThemeProvider
interface ThemeProviderProps {
  children: ReactNode;
}

// Default theme values
const DEFAULT_TEXT_COLOR = "#FFFFFF";
const DEFAULT_BACKGROUND_COLOR = "rgba(0, 0, 0, 0.2)";

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  textColor: DEFAULT_TEXT_COLOR,
  backgroundColor: DEFAULT_BACKGROUND_COLOR,
  setTextColor: () => {},
  setBackgroundColor: () => {},
  resetTheme: () => {},
});

// ThemeProvider component
export function ThemeProvider({ children }: ThemeProviderProps) {
  // State for theme settings
  const [textColor, setTextColorState] = useState<string>(() => {
    const saved = localStorage.getItem("textColor");
    return saved || DEFAULT_TEXT_COLOR;
  });

  const [backgroundColor, setBackgroundColorState] = useState<string>(() => {
    const saved = localStorage.getItem("backgroundColor");
    return saved || DEFAULT_BACKGROUND_COLOR;
  });

  // Functions to update theme settings
  const setTextColor = (color: string) => {
    setTextColorState(color);
    localStorage.setItem("textColor", color);
  };

  const setBackgroundColor = (color: string) => {
    setBackgroundColorState(color);
    localStorage.setItem("backgroundColor", color);
  };

  // Reset theme to defaults
  const resetTheme = () => {
    setTextColor(DEFAULT_TEXT_COLOR);
    setBackgroundColor(DEFAULT_BACKGROUND_COLOR);
  };

  return (
    <ThemeContext.Provider
      value={{
        textColor,
        backgroundColor,
        setTextColor,
        setBackgroundColor,
        resetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
