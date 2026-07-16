import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from "react";
import { scheduleSyncPush } from "./settings/settingsSync";

export const DEFAULT_TEXT_COLOR = "#FFFFFF";
export const DEFAULT_BACKGROUND_COLOR = "rgba(0, 0, 0, 0.2)";
export const DEFAULT_TEXT_OUTLINE_COLOR = "#000000";
export const DEFAULT_FONT_SIZE_RATIO = 1;
export const MIN_FONT_SIZE_RATIO = 0.75;
export const MAX_FONT_SIZE_RATIO = 1.5;
export const FONT_SIZE_RATIO_STEP = 0.05;
export const CUSTOM_THEMES_KEY = "customThemes";
export const MAX_CUSTOM_THEMES = 20;

export interface CustomTheme {
  id: string;
  name: string;
  text: string;
  bg: string;
  outline: string;
}

const clampFontSizeRatio = (value: number) =>
  Math.min(MAX_FONT_SIZE_RATIO, Math.max(MIN_FONT_SIZE_RATIO, Math.round(value / FONT_SIZE_RATIO_STEP) * FONT_SIZE_RATIO_STEP));

const readCustomThemes = (): CustomTheme[] => {
  try {
    const raw = localStorage.getItem(CUSTOM_THEMES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is CustomTheme =>
          !!item &&
          typeof item === "object" &&
          typeof (item as CustomTheme).id === "string" &&
          typeof (item as CustomTheme).name === "string" &&
          typeof (item as CustomTheme).text === "string" &&
          typeof (item as CustomTheme).bg === "string" &&
          typeof (item as CustomTheme).outline === "string",
      )
      .slice(0, MAX_CUSTOM_THEMES);
  } catch {
    return [];
  }
};

interface ThemeSettings {
  textColor: string;
  backgroundColor: string;
  textOutlineColor: string;
  fontSizeRatio: number;
  customThemes: CustomTheme[];
}

interface ThemeContextType extends ThemeSettings {
  setTextColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  setTextOutlineColor: (color: string) => void;
  setFontSizeRatio: (ratio: number) => void;
  applyThemeColors: (text: string, bg: string, outline: string) => void;
  saveCustomTheme: (name: string) => boolean;
  deleteCustomTheme: (id: string) => void;
  setCustomThemes: (themes: CustomTheme[]) => void;
  resetTheme: () => void;
}

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeContext = createContext<ThemeContextType>({
  textColor: DEFAULT_TEXT_COLOR,
  backgroundColor: DEFAULT_BACKGROUND_COLOR,
  textOutlineColor: DEFAULT_TEXT_OUTLINE_COLOR,
  fontSizeRatio: DEFAULT_FONT_SIZE_RATIO,
  customThemes: [],
  setTextColor: () => {},
  setBackgroundColor: () => {},
  setTextOutlineColor: () => {},
  setFontSizeRatio: () => {},
  applyThemeColors: () => {},
  saveCustomTheme: () => false,
  deleteCustomTheme: () => {},
  setCustomThemes: () => {},
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

  const [textOutlineColor, setTextOutlineColorState] = useState<string>(() => {
    const saved = localStorage.getItem("textOutlineColor");
    return saved || DEFAULT_TEXT_OUTLINE_COLOR;
  });

  const [fontSizeRatio, setFontSizeRatioState] = useState<number>(() => {
    // One-time migration: base font size was rescaled from 16px to 13.6px
    // (the old 85% is the new 100%), so reset previously stored ratios once
    // to keep the rendered size identical.
    if (!localStorage.getItem("fontSizeBaseRescaled")) {
      localStorage.setItem("fontSizeBaseRescaled", "1");
      localStorage.setItem("fontSizeRatio", String(DEFAULT_FONT_SIZE_RATIO));
      return DEFAULT_FONT_SIZE_RATIO;
    }
    const saved = localStorage.getItem("fontSizeRatio");
    if (!saved) return DEFAULT_FONT_SIZE_RATIO;
    const parsed = Number.parseFloat(saved);
    return Number.isFinite(parsed) ? clampFontSizeRatio(parsed) : DEFAULT_FONT_SIZE_RATIO;
  });

  const [customThemes, setCustomThemesState] = useState<CustomTheme[]>(() => readCustomThemes());

  useEffect(() => {
    document.documentElement.style.setProperty("--font-size-ratio", String(fontSizeRatio));
  }, [fontSizeRatio]);

  useEffect(() => {
    document.documentElement.style.setProperty("--theme-text-outline", textOutlineColor);
  }, [textOutlineColor]);

  const persistCustomThemes = useCallback((themes: CustomTheme[]) => {
    setCustomThemesState(themes);
    localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
    scheduleSyncPush();
  }, []);

  const setTextColor = (color: string) => {
    setTextColorState(color);
    localStorage.setItem("textColor", color);
    scheduleSyncPush();
  };

  const setBackgroundColor = (color: string) => {
    setBackgroundColorState(color);
    localStorage.setItem("backgroundColor", color);
    scheduleSyncPush();
  };

  const setTextOutlineColor = (color: string) => {
    setTextOutlineColorState(color);
    localStorage.setItem("textOutlineColor", color);
    scheduleSyncPush();
  };

  const setFontSizeRatio = (ratio: number) => {
    const clamped = clampFontSizeRatio(ratio);
    setFontSizeRatioState(clamped);
    localStorage.setItem("fontSizeRatio", String(clamped));
    scheduleSyncPush();
  };

  const applyThemeColors = (text: string, bg: string, outline: string) => {
    setTextColorState(text);
    setBackgroundColorState(bg);
    setTextOutlineColorState(outline);
    localStorage.setItem("textColor", text);
    localStorage.setItem("backgroundColor", bg);
    localStorage.setItem("textOutlineColor", outline);
    scheduleSyncPush();
  };

  const saveCustomTheme = (name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed || customThemes.length >= MAX_CUSTOM_THEMES) return false;

    const theme: CustomTheme = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: trimmed.slice(0, 40),
      text: textColor,
      bg: backgroundColor,
      outline: textOutlineColor,
    };

    persistCustomThemes([theme, ...customThemes].slice(0, MAX_CUSTOM_THEMES));
    return true;
  };

  const deleteCustomTheme = (id: string) => {
    persistCustomThemes(customThemes.filter((theme) => theme.id !== id));
  };

  const setCustomThemes = (themes: CustomTheme[]) => {
    const valid = themes
      .filter(
        (item): item is CustomTheme =>
          !!item &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          typeof item.text === "string" &&
          typeof item.bg === "string" &&
          typeof item.outline === "string",
      )
      .slice(0, MAX_CUSTOM_THEMES);
    persistCustomThemes(valid);
  };

  const resetTheme = () => {
    applyThemeColors(DEFAULT_TEXT_COLOR, DEFAULT_BACKGROUND_COLOR, DEFAULT_TEXT_OUTLINE_COLOR);
    setFontSizeRatio(DEFAULT_FONT_SIZE_RATIO);
  };

  return (
    <ThemeContext.Provider
      value={{
        textColor,
        backgroundColor,
        textOutlineColor,
        fontSizeRatio,
        customThemes,
        setTextColor,
        setBackgroundColor,
        setTextOutlineColor,
        setFontSizeRatio,
        applyThemeColors,
        saveCustomTheme,
        deleteCustomTheme,
        setCustomThemes,
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
