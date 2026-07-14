import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from "react";
import { useTheme } from "../ThemeProvider";
import type { CalendarSettings, CalendarType, DayOfWeek } from "./types";

interface CalendarProviderProps {
  children: ReactNode;
}

interface CalendarContextType {
  calendarType: CalendarType;
  setCalendarType: (type: CalendarType) => void;
  weekendDays: DayOfWeek[];
  setWeekendDays: (days: DayOfWeek[]) => void;
  weekendColor: string;
  setWeekendColor: (color: string) => void;
  firstDayOfWeek: DayOfWeek;
  setFirstDayOfWeek: (day: DayOfWeek) => void;
  tileNumber: number;
  setTileNumber: (tiles: number) => void;
  textColor: string;
  setTextColor: (color: string) => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  fontSizeRatio: number;
  setFontSizeRatio: (ratio: number) => void;
}

const DEFAULT_WEEKEND_DAYS: DayOfWeek[] = ["Friday"];
const DEFAULT_WEEKEND_COLOR = "#1B4D3E";
const DEFAULT_FIRST_DAY: DayOfWeek = "Saturday";
const DEFAULT_TILE_NUMBER = 10;

const CalendarContext = createContext<CalendarContextType | null>(null);

const readDayOfWeek = (value: string | null, fallback: DayOfWeek): DayOfWeek => {
  const days: DayOfWeek[] = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  return days.includes(value as DayOfWeek) ? (value as DayOfWeek) : fallback;
};

const persistSettings = (
  type: CalendarType,
  tiles: number,
  weekend: DayOfWeek[],
  color: string,
  firstDay: DayOfWeek,
  txtColor: string,
  bgColor: string,
  fontRatio: number
) => {
  const settings: CalendarSettings = {
    type,
    tileNumber: tiles,
    weekendDays: weekend,
    weekendColor: color,
    firstDayOfWeek: firstDay,
    textColor: txtColor,
    backgroundColor: bgColor,
    language: localStorage.getItem("language") === "fa" ? "fa" : "en",
    fontSizeRatio: fontRatio,
  };

  localStorage.setItem("calendarSettings", JSON.stringify(settings));
  localStorage.setItem("calendarType", type);
  localStorage.setItem("tileNumber", JSON.stringify(tiles));
  localStorage.setItem("weekendDays", JSON.stringify(weekend));
  localStorage.setItem("weekendColor", color);
  localStorage.setItem("firstDayOfWeek", firstDay);
};

export function CalendarProvider({ children }: CalendarProviderProps) {
  const { textColor, backgroundColor, setTextColor, setBackgroundColor, fontSizeRatio, setFontSizeRatio } = useTheme();

  const [calendarType, setCalendarTypeState] = useState<CalendarType>(() => {
    const saved = localStorage.getItem("calendarType");
    return saved === "persian" || saved === "gregorian" ? saved : "gregorian";
  });

  const [weekendDays, setWeekendDaysState] = useState<DayOfWeek[]>(() => {
    try {
      const saved = localStorage.getItem("weekendDays");
      return saved ? JSON.parse(saved) : DEFAULT_WEEKEND_DAYS;
    } catch {
      return DEFAULT_WEEKEND_DAYS;
    }
  });

  const [weekendColor, setWeekendColorState] = useState(() => localStorage.getItem("weekendColor") || DEFAULT_WEEKEND_COLOR);

  const [firstDayOfWeek, setFirstDayOfWeekState] = useState<DayOfWeek>(() =>
    readDayOfWeek(localStorage.getItem("firstDayOfWeek"), DEFAULT_FIRST_DAY)
  );

  const [tileNumber, setTileNumberState] = useState(() => {
    try {
      const saved = localStorage.getItem("tileNumber");
      return saved ? JSON.parse(saved) : DEFAULT_TILE_NUMBER;
    } catch {
      return DEFAULT_TILE_NUMBER;
    }
  });

  const setCalendarType = useCallback((type: CalendarType) => {
    setCalendarTypeState(type);
    localStorage.setItem("calendarType", type);
  }, []);

  const setWeekendDays = useCallback((days: DayOfWeek[]) => {
    setWeekendDaysState(days);
    localStorage.setItem("weekendDays", JSON.stringify(days));
  }, []);

  const setWeekendColor = useCallback((color: string) => {
    setWeekendColorState(color);
    localStorage.setItem("weekendColor", color);
  }, []);

  const setFirstDayOfWeek = useCallback((day: DayOfWeek) => {
    setFirstDayOfWeekState(day);
    localStorage.setItem("firstDayOfWeek", day);
  }, []);

  const setTileNumber = useCallback((tiles: number) => {
    setTileNumberState(tiles);
    localStorage.setItem("tileNumber", JSON.stringify(tiles));
  }, []);

  useEffect(() => {
    persistSettings(calendarType, tileNumber, weekendDays, weekendColor, firstDayOfWeek, textColor, backgroundColor, fontSizeRatio);
  }, [calendarType, tileNumber, weekendDays, weekendColor, firstDayOfWeek, textColor, backgroundColor, fontSizeRatio]);

  return (
    <CalendarContext.Provider
      value={{
        calendarType,
        setCalendarType,
        weekendDays,
        setWeekendDays,
        weekendColor,
        setWeekendColor,
        firstDayOfWeek,
        setFirstDayOfWeek,
        tileNumber,
        setTileNumber,
        textColor,
        setTextColor,
        backgroundColor,
        setBackgroundColor,
        fontSizeRatio,
        setFontSizeRatio,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error("useCalendar must be used within a CalendarProvider");
  }
  return context;
}

export type { DayOfWeek, CalendarType };
