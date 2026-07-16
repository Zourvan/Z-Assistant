export type DayOfWeek = "Saturday" | "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";

export type CalendarType = "gregorian" | "persian";

export interface StoredBackground {
  id: string;
  url: string;
  isBlob: boolean;
  type: "image" | "color" | "gif";
  createdAt: number;
  thumbnailUrl?: string;
}

export interface CalendarSettings {
  type: CalendarType;
  tileNumber: number;
  weekendDays: DayOfWeek[];
  weekendColor: string;
  firstDayOfWeek: DayOfWeek;
  textColor: string;
  backgroundColor: string;
  textOutlineColor?: string;
  language: "en" | "fa";
  fontSizeRatio?: number;
}

export type SettingsSection = "general" | "calendar" | "appearance" | "backgrounds" | "data";
