export interface ReminderSettings {
  defaultReminderHour: number;
  defaultReminderMinute: number;
  defaultSnoozeMinutes: number;
  notificationSound: boolean;
  silentNotifications: boolean;
  timeFormat12h: boolean;
  timezone: string;
  enableRecurring: boolean;
  autoCompleteOnOpen: boolean;
  overdueReNotifyMinutes: number;
}

export const REMINDER_SETTINGS_KEY = "nexx_reminder_settings";

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  defaultReminderHour: 9,
  defaultReminderMinute: 0,
  defaultSnoozeMinutes: 30,
  notificationSound: true,
  silentNotifications: false,
  timeFormat12h: false,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  enableRecurring: true,
  autoCompleteOnOpen: false,
  overdueReNotifyMinutes: 60,
};

export const getReminderSettings = (): ReminderSettings => {
  try {
    const raw = localStorage.getItem(REMINDER_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_REMINDER_SETTINGS };
    return { ...DEFAULT_REMINDER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_REMINDER_SETTINGS };
  }
};

export const setReminderSettings = (settings: Partial<ReminderSettings>) => {
  const next = { ...getReminderSettings(), ...settings };
  localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(next));
  return next;
};
