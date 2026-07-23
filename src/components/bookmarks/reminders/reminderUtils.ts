import {
  addDays,
  addMonths,
  addWeeks,
  endOfDay,
  endOfWeek,
  format as formatGregorian,
  isAfter,
  isBefore,
  isSameDay,
  isToday,
  setHours,
  setMinutes,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { format as formatJalali } from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale/fa-IR";
import type {
  BookmarkReminder,
  QuickPreset,
  ReminderFilter,
  ReminderSort,
  ReminderStatus,
  RepeatRule,
  SnoozePreset,
} from "./types";
import { getReminderSettings } from "./reminderSettings";

export const REMINDERS_CACHE_KEY = "nexx_reminders_cache";

export const getEffectiveReminderAt = (reminder: BookmarkReminder): number => {
  if (reminder.snoozeUntil && reminder.snoozeUntil > Date.now()) {
    return reminder.snoozeUntil;
  }
  return reminder.reminderAt;
};

export const computeReminderStatus = (reminder: BookmarkReminder, now = new Date()): ReminderStatus => {
  if (reminder.completedAt) return "completed";
  if (reminder.dismissedAt) return "dismissed";
  if (!reminder.enabled) return "dismissed";

  const effectiveAt = getEffectiveReminderAt(reminder);
  const effectiveDate = new Date(effectiveAt);

  if (reminder.snoozeUntil && reminder.snoozeUntil > now.getTime()) {
    return "snoozed";
  }

  if (isToday(effectiveDate)) return "today";

  const todayStart = startOfDay(now);
  if (isBefore(effectiveDate, todayStart)) return "overdue";

  const tomorrowEnd = endOfDay(addDays(todayStart, 1));
  if (isAfter(effectiveDate, tomorrowEnd)) return "upcoming";

  return "pending";
};

export const getTimelineBucket = (
  reminder: BookmarkReminder,
  now = new Date(),
): "overdue" | "today" | "tomorrow" | "this_week" | "next_week" | "later" => {
  const status = computeReminderStatus(reminder, now);
  if (status === "overdue") return "overdue";

  const effectiveAt = getEffectiveReminderAt(reminder);
  const effectiveDate = new Date(effectiveAt);
  const todayStart = startOfDay(now);

  if (isToday(effectiveDate)) return "today";

  const tomorrow = addDays(todayStart, 1);
  if (isSameDay(effectiveDate, tomorrow)) return "tomorrow";

  const weekEnd = endOfWeek(todayStart, { weekStartsOn: 1 });
  if (!isAfter(effectiveDate, weekEnd)) return "this_week";

  const nextWeekEnd = endOfWeek(addWeeks(todayStart, 1), { weekStartsOn: 1 });
  if (!isAfter(effectiveDate, nextWeekEnd)) return "next_week";

  return "later";
};

export const applyQuickPreset = (preset: QuickPreset, base = new Date()): number => {
  const settings = getReminderSettings();
  const withDefaultTime = (date: Date) =>
    setMinutes(setHours(date, settings.defaultReminderHour), settings.defaultReminderMinute);

  switch (preset) {
    case "later_today": {
      const later = addDays(base, 0);
      later.setHours(base.getHours() + 3);
      return later.getTime();
    }
    case "tomorrow":
      return withDefaultTime(addDays(startOfDay(base), 1)).getTime();
    case "this_weekend": {
      const saturday = addDays(startOfWeek(base, { weekStartsOn: 1 }), 5);
      return withDefaultTime(saturday).getTime();
    }
    case "next_week":
      return withDefaultTime(addWeeks(startOfDay(base), 1)).getTime();
    case "next_month":
      return withDefaultTime(addMonths(startOfDay(base), 1)).getTime();
    case "custom":
    default:
      return withDefaultTime(addDays(startOfDay(base), 1)).getTime();
  }
};

export const applySnoozePreset = (preset: SnoozePreset, customAt?: number): number => {
  const now = new Date();
  const settings = getReminderSettings();

  switch (preset) {
    case "10m":
      return now.getTime() + 10 * 60_000;
    case "30m":
      return now.getTime() + 30 * 60_000;
    case "1h":
      return now.getTime() + 60 * 60_000;
    case "tomorrow_morning":
      return setMinutes(
        setHours(addDays(startOfDay(now), 1), settings.defaultReminderHour),
        settings.defaultReminderMinute,
      ).getTime();
    case "next_week":
      return setMinutes(
        setHours(addWeeks(startOfDay(now), 1), settings.defaultReminderHour),
        settings.defaultReminderMinute,
      ).getTime();
    case "custom":
      return customAt ?? now.getTime() + settings.defaultSnoozeMinutes * 60_000;
    default: {
      const _exhaustive: never = preset;
      return _exhaustive;
    }
  }
};

export const computeNextRepeatAt = (reminder: BookmarkReminder): number | null => {
  const { repeat } = reminder;
  const base = new Date(reminder.reminderAt);

  switch (repeat.type) {
    case "none":
      return null;
    case "daily":
      return addDays(base, 1).getTime();
    case "weekly":
      return addWeeks(base, 1).getTime();
    case "monthly":
      return addMonths(base, 1).getTime();
    case "every_x_days":
      return addDays(base, repeat.days ?? 1).getTime();
    case "custom": {
      const weekdays = repeat.weekdays ?? [];
      if (!weekdays.length) return null;
      for (let i = 1; i <= 7; i++) {
        const candidate = addDays(base, i);
        if (weekdays.includes(candidate.getDay())) {
          return candidate.getTime();
        }
      }
      return null;
    }
    default: {
      const _exhaustive: never = repeat.type;
      return _exhaustive;
    }
  }
};

export const shouldReminderFire = (reminder: BookmarkReminder, now = new Date()): boolean => {
  if (!reminder.enabled || reminder.completedAt || reminder.dismissedAt) return false;

  const effectiveAt = getEffectiveReminderAt(reminder);
  if (now.getTime() < effectiveAt) return false;

  if (reminder.dateOnly) {
    if (!isToday(new Date(effectiveAt))) return false;
  }

  if (reminder.lastTriggeredAt) {
    const settings = getReminderSettings();
    const reNotifyMs = settings.overdueReNotifyMinutes * 60_000;
    if (now.getTime() - reminder.lastTriggeredAt < reNotifyMs) return false;
  }

  return true;
};

export const getHostname = (url?: string): string => {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

export const formatReminderDate = (
  timestamp: number,
  dateOnly: boolean,
  use12h: boolean,
  locale: string,
): string => {
  const date = new Date(timestamp);
  const usePersian = locale === "fa";
  const dateStr = usePersian
    ? formatJalali(date, "dd MMMM yyyy", { locale: faIR }).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])
    : formatGregorian(date, "dd MMM yyyy");

  if (dateOnly) return dateStr;

  const timeStr = usePersian
    ? formatGregorian(date, "HH:mm").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])
    : formatGregorian(date, use12h ? "h:mm a" : "HH:mm");

  return `${dateStr} ${timeStr}`;
};

export const filterReminders = (
  reminders: BookmarkReminder[],
  filter: ReminderFilter,
  now = new Date(),
): BookmarkReminder[] => {
  if (filter === "all") return reminders;

  return reminders.filter((reminder) => {
    const status = computeReminderStatus(reminder, now);
    switch (filter) {
      case "today":
        return status === "today" || status === "pending";
      case "upcoming":
        return status === "upcoming" || status === "pending";
      case "overdue":
        return status === "overdue";
      case "completed":
        return status === "completed";
      case "snoozed":
        return status === "snoozed";
      default: {
        const _exhaustive: never = filter;
        return _exhaustive;
      }
    }
  });
};

const priorityOrder = { high: 0, medium: 1, low: 2 };

export const sortReminders = (reminders: BookmarkReminder[], sort: ReminderSort): BookmarkReminder[] => {
  const sorted = [...reminders];
  sorted.sort((a, b) => {
    switch (sort) {
      case "reminderDate":
        return getEffectiveReminderAt(a) - getEffectiveReminderAt(b);
      case "createdAt":
        return b.createdAt - a.createdAt;
      case "title":
        return a.bookmarkTitle.localeCompare(b.bookmarkTitle);
      case "updatedAt":
        return b.updatedAt - a.updatedAt;
      case "priority":
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      default: {
        const _exhaustive: never = sort;
        return _exhaustive;
      }
    }
  });
  return sorted;
};

export const searchReminders = (reminders: BookmarkReminder[], query: string): BookmarkReminder[] => {
  const term = query.trim().toLowerCase();
  if (!term) return reminders;

  return reminders.filter((reminder) => {
    const hostname = getHostname(reminder.bookmarkUrl);
    return (
      reminder.bookmarkTitle.toLowerCase().includes(term) ||
      reminder.bookmarkUrl?.toLowerCase().includes(term) ||
      hostname.toLowerCase().includes(term) ||
      reminder.note?.toLowerCase().includes(term)
    );
  });
};

export const getDateKeysWithReminders = (reminders: BookmarkReminder[]): Set<string> => {
  const keys = new Set<string>();
  for (const reminder of reminders) {
    if (reminder.completedAt || reminder.dismissedAt) continue;
    const date = new Date(getEffectiveReminderAt(reminder));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    keys.add(key);
  }
  return keys;
};

export const getRemindersForDateKey = (reminders: BookmarkReminder[], dateKey: string): BookmarkReminder[] => {
  return reminders.filter((reminder) => {
    if (reminder.completedAt || reminder.dismissedAt) return false;
    const date = new Date(getEffectiveReminderAt(reminder));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return key === dateKey;
  });
};

export const getActiveReminders = (reminders: BookmarkReminder[]): BookmarkReminder[] =>
  reminders.filter((r) => !r.completedAt && !r.dismissedAt && r.enabled);

export const defaultRepeatRule = (): RepeatRule => ({ type: "none" });
