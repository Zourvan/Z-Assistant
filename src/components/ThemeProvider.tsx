import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";

export const DEFAULT_TEXT_COLOR = "#FFFFFF";
export const DEFAULT_BACKGROUND_COLOR = "rgba(0, 0, 0, 0.2)";
export const DEFAULT_FONT_SIZE_RATIO = 1;
export const MIN_FONT_SIZE_RATIO = 0.75;
export const MAX_FONT_SIZE_RATIO = 1.5;
export const FONT_SIZE_RATIO_STEP = 0.05;

const clampFontSizeRatio = (value: number) =>
  Math.min(MAX_FONT_SIZE_RATIO, Math.max(MIN_FONT_SIZE_RATIO, Math.round(value / FONT_SIZE_RATIO_STEP) * FONT_SIZE_RATIO_STEP));

interface ThemeSettings {
  textColor: string;
  backgroundColor: string;
  fontSizeRatio: number;
}

interface ThemeContextType extends ThemeSettings {
  setTextColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  setFontSizeRatio: (ratio: number) => void;
  resetTheme: () => void;
}

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeContext = createContext<ThemeContextType>({
  textColor: DEFAULT_TEXT_COLOR,
  backgroundColor: DEFAULT_BACKGROUND_COLOR,
  fontSizeRatio: DEFAULT_FONT_SIZE_RATIO,
  setTextColor: () => {},
  setBackgroundColor: () => {},
  setFontSizeRatio: () => {},
  resetTheme: () => {},
});

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [textColor, setTextColorState] = useState<string>(() => {
    const saved = localStorage.getItem("textColor");
    return saved || DEFAULT_TEXT_COLOR;
  });

  const [backgroundColor, setBackgroundColorState] = useState<string>(() => {
    const saved = localStorage.getItem("backgroundColor");
    return saved || DEFAULT_BACKGROUND_COLOR;
  });

  const [fontSizeRatio, setFontSizeRatioState] = useState<number>(() => {
    const saved = localStorage.getItem("fontSizeRatio");
    if (!saved) return DEFAULT_FONT_SIZE_RATIO;
    const parsed = Number.parseFloat(saved);
    return Number.isFinite(parsed) ? clampFontSizeRatio(parsed) : DEFAULT_FONT_SIZE_RATIO;
  });

  useEffect(() => {
    document.documentElement.style.setProperty("--font-size-ratio", String(fontSizeRatio));
  }, [fontSizeRatio]);

  const setTextColor = (color: string) => {
    setTextColorState(color);
    localStorage.setItem("textColor", color);
  };

  const setBackgroundColor = (color: string) => {
    setBackgroundColorState(color);
    localStorage.setItem("backgroundColor", color);
  };

  const setFontSizeRatio = (ratio: number) => {
    const clamped = clampFontSizeRatio(ratio);
    setFontSizeRatioState(clamped);
    localStorage.setItem("fontSizeRatio", String(clamped));
  };

  const resetTheme = () => {
    setTextColor(DEFAULT_TEXT_COLOR);
    setBackgroundColor(DEFAULT_BACKGROUND_COLOR);
    setFontSizeRatio(DEFAULT_FONT_SIZE_RATIO);
  };

  return (
    <ThemeContext.Provider
      value={{
        textColor,
        backgroundColor,
        fontSizeRatio,
        setTextColor,
        setBackgroundColor,
        setFontSizeRatio,
        resetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
