export interface ThemePreset {
  id: string;
  text: string;
  bg: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: "classic", text: "#FFFFFF", bg: "rgba(0, 0, 0, 0.2)" },
  { id: "dark", text: "#E2E8F0", bg: "rgba(0, 0, 0, 0.45)" },
  { id: "ocean", text: "#E0F2FE", bg: "rgba(15, 23, 42, 0.55)" },
  { id: "midnight", text: "#C7D2FE", bg: "rgba(30, 27, 75, 0.6)" },
  { id: "forest", text: "#DCFCE7", bg: "rgba(20, 83, 45, 0.5)" },
  { id: "sunset", text: "#FFEDD5", bg: "rgba(124, 45, 18, 0.5)" },
  { id: "lavender", text: "#F3E8FF", bg: "rgba(88, 28, 135, 0.45)" },
  { id: "rose", text: "#FFE4E6", bg: "rgba(136, 19, 55, 0.45)" },
  { id: "amber", text: "#FEF3C7", bg: "rgba(120, 53, 15, 0.5)" },
  { id: "slate", text: "#F1F5F9", bg: "rgba(51, 65, 85, 0.55)" },
  { id: "wine", text: "#FCE7F3", bg: "rgba(76, 5, 25, 0.55)" },
  { id: "nord", text: "#ECEFF4", bg: "rgba(46, 52, 64, 0.55)" },
  { id: "sky", text: "#0C4A6E", bg: "rgba(224, 242, 254, 0.5)" },
];
