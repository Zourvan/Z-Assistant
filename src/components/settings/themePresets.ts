import { colorToRgb } from "./themeUtils";

export interface ThemePreset {
  id: string;
  text: string;
  bg: string;
  outline: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: "classic", text: "#FFFFFF", bg: "rgba(0, 0, 0, 0.2)", outline: "#000000" },
  { id: "dark", text: "#E2E8F0", bg: "rgba(0, 0, 0, 0.45)", outline: "#000000" },
  { id: "ocean", text: "#E0F2FE", bg: "rgba(15, 23, 42, 0.55)", outline: "#0F172A" },
  { id: "midnight", text: "#C7D2FE", bg: "rgba(30, 27, 75, 0.6)", outline: "#1E1B4B" },
  { id: "forest", text: "#DCFCE7", bg: "rgba(20, 83, 45, 0.5)", outline: "#14532D" },
  { id: "sunset", text: "#FFEDD5", bg: "rgba(124, 45, 18, 0.5)", outline: "#7C2D12" },
  { id: "lavender", text: "#F3E8FF", bg: "rgba(88, 28, 135, 0.45)", outline: "#581C87" },
  { id: "rose", text: "#FFE4E6", bg: "rgba(136, 19, 55, 0.45)", outline: "#881337" },
  { id: "amber", text: "#FEF3C7", bg: "rgba(120, 53, 15, 0.5)", outline: "#78350F" },
  { id: "slate", text: "#F1F5F9", bg: "rgba(51, 65, 85, 0.55)", outline: "#334155" },
  { id: "wine", text: "#FCE7F3", bg: "rgba(76, 5, 25, 0.55)", outline: "#4C0519" },
  { id: "nord", text: "#ECEFF4", bg: "rgba(46, 52, 64, 0.55)", outline: "#2E3440" },
  { id: "sky", text: "#0C4A6E", bg: "rgba(224, 242, 254, 0.5)", outline: "#FFFFFF" },
];

const ALPHA = /,\s*([0-9]*\.?[0-9]+)\s*\)$/;

const readAlpha = (color: string): number => {
  const match = color.trim().match(ALPHA);
  if (!match) return 1;
  const value = Number.parseFloat(match[1]);
  return Number.isFinite(value) ? value : 1;
};

export const colorsMatch = (a: string, b: string) => {
  if (a.trim().toLowerCase() === b.trim().toLowerCase()) return true;
  const rgbA = colorToRgb(a);
  const rgbB = colorToRgb(b);
  if (!rgbA || !rgbB) return false;
  return (
    rgbA.r === rgbB.r &&
    rgbA.g === rgbB.g &&
    rgbA.b === rgbB.b &&
    Math.abs(readAlpha(a) - readAlpha(b)) < 0.02
  );
};
