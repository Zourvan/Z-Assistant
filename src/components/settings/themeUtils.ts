import type { CSSProperties } from "react";

const HEX_SHORT = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
const HEX_FULL = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
const RGB = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i;

export const colorToRgb = (color: string): { r: number; g: number; b: number } | null => {
  const value = color.trim();

  const rgbMatch = value.match(RGB);
  if (rgbMatch) {
    return { r: Number(rgbMatch[1]), g: Number(rgbMatch[2]), b: Number(rgbMatch[3]) };
  }

  const shortHex = value.match(HEX_SHORT);
  if (shortHex) {
    return {
      r: parseInt(shortHex[1] + shortHex[1], 16),
      g: parseInt(shortHex[2] + shortHex[2], 16),
      b: parseInt(shortHex[3] + shortHex[3], 16),
    };
  }

  const fullHex = value.match(HEX_FULL);
  if (fullHex) {
    return {
      r: parseInt(fullHex[1], 16),
      g: parseInt(fullHex[2], 16),
      b: parseInt(fullHex[3], 16),
    };
  }

  return null;
};

export const withAlpha = (color: string, alpha: number): string => {
  const rgb = colorToRgb(color);
  if (!rgb) return color;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

export const buildThemeCssVars = (textColor: string, backgroundColor: string): CSSProperties =>
  ({
    "--theme-bg": backgroundColor,
    "--theme-text": textColor,
    "--theme-border": withAlpha(textColor, 0.18),
    "--theme-surface": withAlpha(textColor, 0.08),
    "--theme-surface-hover": withAlpha(textColor, 0.14),
    "--theme-surface-active": withAlpha(textColor, 0.24),
    "--theme-muted": withAlpha(textColor, 0.6),
    "--theme-accent": withAlpha(textColor, 0.85),
    /* Near-opaque menu panel (First Day of Week / react-select style) */
    "--theme-menu-bg": withAlpha(backgroundColor, 0.95),
  }) as CSSProperties;

export const buildThemeVars = (textColor: string, backgroundColor: string): CSSProperties =>
  ({
    ...buildThemeCssVars(textColor, backgroundColor),
    color: textColor,
    backgroundColor,
  }) as CSSProperties;

export const applyThemeVarsToElement = (element: HTMLElement, textColor: string, backgroundColor: string) => {
  const vars = buildThemeVars(textColor, backgroundColor);
  for (const [key, value] of Object.entries(vars)) {
    if (value == null || !key.startsWith("--")) continue;
    element.style.setProperty(key, String(value));
  }
  element.style.setProperty("--theme-menu-bg", withAlpha(backgroundColor, 0.95));
};

export const SETTINGS_SELECT_PORTAL_ID = "settings-select-portal";
