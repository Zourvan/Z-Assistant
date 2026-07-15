import {
  format as formatGregorian,
  parse as parseGregorian,
  isValid as isValidGregorian,
  addYears,
  addMonths,
  addWeeks,
  addDays,
  addHours,
  addMinutes,
  addSeconds,
  differenceInYears,
  differenceInMonths,
  differenceInWeeks,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  getDayOfYear,
  getISOWeek,
  getISOWeekYear,
  getISODay,
  isLeapYear,
  eachDayOfInterval,
  startOfDay,
  endOfDay,
  isWeekend,
  isSaturday,
  isSunday,
  isThursday,
  isFriday,
} from "date-fns";
import { format as formatJalali, parse as parseJalali, isValid as isValidJalali } from "date-fns-jalali";
import { toGregorian, toHijri } from "hijri-converter";
import type { CalendarSystem, ParsedDateTime } from "../types";

export type { CalendarSystem };
export { getDayOfYear };

const JALALI_DATE = /^\d{4}\/\d{1,2}\/\d{1,2}$/;
const JALALI_DATETIME = /^\d{4}\/\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2}(:\d{2})?$/;
const GREGORIAN_DATE = /^\d{4}-\d{1,2}-\d{1,2}$/;
const GREGORIAN_DATETIME = /^\d{4}-\d{1,2}-\d{1,2}\s+\d{1,2}:\d{2}(:\d{2})?$/;
const HIJRI_DATE = /^\d{4}-\d{1,2}-\d{1,2}$/;

export const WEEKDAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

export function detectCalendarSystem(input: string): CalendarSystem | null {
  const trimmed = input.trim();
  if (JALALI_DATE.test(trimmed) || JALALI_DATETIME.test(trimmed)) return "jalali";
  if (HIJRI_DATE.test(trimmed) && !GREGORIAN_DATE.test(trimmed)) {
    const [y] = trimmed.split("-").map(Number);
    if (y >= 1300 && y <= 1500) return "hijri";
  }
  if (GREGORIAN_DATE.test(trimmed) || GREGORIAN_DATETIME.test(trimmed)) return "gregorian";
  if (HIJRI_DATE.test(trimmed)) return "hijri";
  return null;
}

export function parseDateTime(input: string, system?: CalendarSystem): ParsedDateTime | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const resolved = system ?? detectCalendarSystem(trimmed);
  if (!resolved) return null;

  try {
    if (resolved === "jalali") {
      const hasTime = JALALI_DATETIME.test(trimmed);
      const fmt = hasTime ? "yyyy/M/d HH:mm:ss" : "yyyy/M/d";
      const normalized = hasTime && trimmed.split(":").length === 2 ? `${trimmed}:00` : trimmed;
      const date = parseJalali(normalized, fmt, new Date());
      if (!isValidJalali(date)) return null;
      return { date, hasTime };
    }

    if (resolved === "hijri") {
      const [y, m, d] = trimmed.split("-").map(Number);
      const g = toGregorian(y, m, d);
      const date = new Date(g.gy, g.gm - 1, g.gd);
      if (date.getFullYear() !== g.gy || date.getMonth() !== g.gm - 1 || date.getDate() !== g.gd) return null;
      return { date, hasTime: false };
    }

    const hasTime = GREGORIAN_DATETIME.test(trimmed);
    if (hasTime) {
      const normalized = trimmed.split(":").length === 2 ? `${trimmed}:00` : trimmed;
      const date = parseGregorian(normalized, "yyyy-M-d HH:mm:ss", new Date());
      if (!isValidGregorian(date)) return null;
      return { date, hasTime: true };
    }

    const [y, m, d] = trimmed.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    return { date, hasTime: false };
  } catch {
    return null;
  }
}

export function formatJalaliDate(date: Date, withTime = false): string {
  return formatJalali(date, withTime ? "yyyy/MM/dd HH:mm:ss" : "yyyy/MM/dd");
}

export function formatGregorianDate(date: Date, withTime = false): string {
  return formatGregorian(date, withTime ? "yyyy-MM-dd HH:mm:ss" : "yyyy-MM-dd");
}

export function formatHijriDate(date: Date): string {
  const h = toHijri(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${h.hy}-${pad(h.hm)}-${pad(h.hd)}`;
}

export function formatAllCalendars(date: Date, withTime = false) {
  return {
    jalali: formatJalaliDate(date, withTime),
    gregorian: formatGregorianDate(date, withTime),
    hijri: formatHijriDate(date),
  };
}

export function formatDateBySystem(date: Date, system: CalendarSystem, withTime = false): string {
  if (system === "jalali") return formatJalaliDate(date, withTime);
  if (system === "hijri") {
    const base = formatHijriDate(date);
    if (!withTime) return base;
    return `${base} ${formatGregorian(date, "HH:mm:ss")}`;
  }
  return formatGregorianDate(date, withTime);
}

export function extractTimePart(value: string): string {
  const parts = value.trim().split(/\s+/);
  if (parts.length >= 2 && /^\d{1,2}:\d{2}/.test(parts[1])) {
    return parts[1].length === 5 ? `${parts[1]}:00` : parts[1];
  }
  return "00:00:00";
}

export function applyTimeToDate(date: Date, timeStr: string): Date {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  const result = new Date(date);
  if (!match) return result;
  result.setHours(Number(match[1]), Number(match[2]), Number(match[3] ?? 0), 0);
  return result;
}

export function toGregorianInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromGregorianInputValue(value: string): Date | null {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

export function isJalaliLeapYear(jalaliYear: number): boolean {
  const breaks = [1, 5, 9, 13, 17, 22, 26, 30];
  const cycle = jalaliYear % 33;
  return breaks.includes(cycle);
}

export function isHijriLeapYear(hijriYear: number): boolean {
  return (11 * hijriYear + 14) % 30 < 11;
}

export function addToDate(
  date: Date,
  amount: number,
  unit: "years" | "months" | "weeks" | "days" | "hours" | "minutes" | "seconds",
): Date {
  switch (unit) {
    case "years":
      return addYears(date, amount);
    case "months":
      return addMonths(date, amount);
    case "weeks":
      return addWeeks(date, amount);
    case "days":
      return addDays(date, amount);
    case "hours":
      return addHours(date, amount);
    case "minutes":
      return addMinutes(date, amount);
    case "seconds":
      return addSeconds(date, amount);
  }
}

export function diffDateParts(from: Date, to: Date) {
  return {
    years: differenceInYears(to, from),
    months: differenceInMonths(to, from),
    weeks: differenceInWeeks(to, from),
    days: differenceInDays(to, from),
    hours: differenceInHours(to, from),
    minutes: differenceInMinutes(to, from),
    seconds: differenceInSeconds(to, from),
  };
}

export function parseTime(input: string): { hours: number; minutes: number; seconds: number } | null {
  const match = input.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? 0);
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  return { hours, minutes, seconds };
}

export function formatTime(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? "-" : "";
  const abs = Math.abs(totalSeconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  return `${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function timeToSeconds(h: number, m: number, s: number) {
  return h * 3600 + m * 60 + s;
}

export function convertTimeUnits(value: number, from: string, to: string): number {
  const toSeconds: Record<string, number> = {
    ms: 0.001,
    seconds: 1,
    minutes: 60,
    hours: 3600,
    days: 86400,
    weeks: 604800,
    months: 2629800,
    years: 31557600,
  };
  const sec = value * (toSeconds[from] ?? 1);
  return sec / (toSeconds[to] ?? 1);
}

export function formatDurationBreakdown(totalSeconds: number) {
  const abs = Math.abs(Math.floor(totalSeconds));
  const days = Math.floor(abs / 86400);
  const hours = Math.floor((abs % 86400) / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  const seconds = abs % 60;
  return { days, hours, minutes, seconds, totalSeconds: abs };
}

export function countBusinessDays(
  from: Date,
  to: Date,
  mode: "weekdays" | "excludeThuFri" | "excludeSatSun",
): number {
  const start = startOfDay(from <= to ? from : to);
  const end = endOfDay(from <= to ? to : from);
  const days = eachDayOfInterval({ start, end });
  return days.filter((d) => {
    if (mode === "excludeThuFri") return !isThursday(d) && !isFriday(d);
    if (mode === "excludeSatSun") return !isSaturday(d) && !isSunday(d);
    return !isWeekend(d);
  }).length;
}

export function getWeekdayIndex(date: Date) {
  return date.getDay();
}

export function getIsoWeekInfo(date: Date) {
  return {
    week: getISOWeek(date),
    weekYear: getISOWeekYear(date),
    day: getISODay(date),
  };
}

export function checkLeapYear(year: number, system: CalendarSystem): boolean {
  if (system === "gregorian") return isLeapYear(new Date(year, 0, 1));
  if (system === "jalali") return isJalaliLeapYear(year);
  return isHijriLeapYear(year);
}

export function getZonedParts(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): Date {
  let utc = Date.UTC(year, month - 1, day, hour, minute, second);
  for (let i = 0; i < 5; i++) {
    const p = getZonedParts(new Date(utc), timeZone);
    const desired = Date.UTC(year, month - 1, day, hour, minute, second);
    const actual = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    utc += desired - actual;
  }
  return new Date(utc);
}

export function formatInTimezone(date: Date, timeZone: string, withDate = true): string {
  try {
    const opts: Intl.DateTimeFormatOptions = withDate
      ? { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }
      : { timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false };
    return new Intl.DateTimeFormat("en-GB", opts).format(date);
  } catch {
    return "";
  }
}

export const COMMON_TIMEZONES = [
  "UTC",
  "Asia/Tehran",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Australia/Sydney",
] as const;
