import type { BookmarkReminder } from "./types";
import { REMINDERS_CACHE_KEY } from "./reminderUtils";

const ALARM_PREFIX = "nexx-reminder-";

export const getAlarmName = (reminderId: string) => `${ALARM_PREFIX}${reminderId}`;

export const syncRemindersToStorage = async (reminders: BookmarkReminder[]): Promise<void> => {
  await chrome.storage.local.set({ [REMINDERS_CACHE_KEY]: reminders });
};

export const scheduleReminderAlarms = async (reminders: BookmarkReminder[]): Promise<void> => {
  if (!chrome.alarms) return;

  const existing = await chrome.alarms.getAll();
  for (const alarm of existing) {
    if (alarm.name.startsWith(ALARM_PREFIX)) {
      await chrome.alarms.clear(alarm.name);
    }
  }

  const now = Date.now();
  for (const reminder of reminders) {
    if (!reminder.enabled || reminder.completedAt || reminder.dismissedAt) continue;

    const fireAt = reminder.snoozeUntil && reminder.snoozeUntil > now ? reminder.snoozeUntil : reminder.reminderAt;
    if (fireAt <= now) continue;

    const delayMinutes = Math.max(1, (fireAt - now) / 60_000);
    await chrome.alarms.create(getAlarmName(reminder.id), { delayInMinutes: delayMinutes });
  }
};

export const refreshReminderScheduling = async (reminders: BookmarkReminder[]): Promise<void> => {
  await syncRemindersToStorage(reminders);
  await scheduleReminderAlarms(reminders);
};

export const openBookmarkUrl = (url?: string) => {
  if (!url) return;
  chrome.tabs.create({ url });
};
