import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { bookmarkRemindersDB } from "../../settings/settingsDb";
import { scheduleSyncPush } from "../../settings/settingsSync";
import { playAlertSound, requestNotificationPermission, showAlertNotification } from "../../timerAlarm/utils";
import { getReminderSettings } from "./reminderSettings";
import { openBookmarkUrl, refreshReminderScheduling } from "./reminderScheduler";
import type { BookmarkReminder, ReminderInput } from "./types";
import {
  computeNextRepeatAt,
  computeReminderStatus,
  getActiveReminders,
  getDateKeysWithReminders,
  getRemindersForDateKey,
  shouldReminderFire,
} from "./reminderUtils";

interface RemindersContextValue {
  reminders: BookmarkReminder[];
  isLoading: boolean;
  addReminder: (input: ReminderInput) => Promise<BookmarkReminder>;
  updateReminder: (id: string, updates: Partial<BookmarkReminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  completeReminder: (id: string) => Promise<void>;
  dismissReminder: (id: string) => Promise<void>;
  snoozeReminder: (id: string, until: number) => Promise<void>;
  getRemindersForBookmark: (bookmarkId: string) => BookmarkReminder[];
  getRemindersForDate: (dateKey: string) => BookmarkReminder[];
  dateKeysWithReminders: Set<string>;
  activeReminders: BookmarkReminder[];
  openReminderBookmark: (id: string) => Promise<void>;
}

const RemindersContext = createContext<RemindersContextValue | null>(null);

const POLL_INTERVAL_MS = 30_000;

export function RemindersProvider({ children }: { children: ReactNode }) {
  const [reminders, setReminders] = useState<BookmarkReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const remindersRef = useRef(reminders);
  remindersRef.current = reminders;

  const loadReminders = useCallback(async () => {
    try {
      const stored = await bookmarkRemindersDB.getAllItems<BookmarkReminder>();
      const sorted = stored.sort((a, b) => a.reminderAt - b.reminderAt);
      setReminders(sorted);
      await refreshReminderScheduling(sorted);
    } catch (error) {
      console.error("Failed to load bookmark reminders:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReminders();
    requestNotificationPermission();
  }, [loadReminders]);

  useEffect(() => {
    const onStorage = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if (area !== "local") return;
      if (changes.nexx_reminders_updated_at || changes.nexx_reminders_cache) {
        void loadReminders();
      }
    };
    chrome.storage.onChanged.addListener(onStorage);
    return () => chrome.storage.onChanged.removeListener(onStorage);
  }, [loadReminders]);

  const persist = useCallback(async (next: BookmarkReminder[]) => {
    setReminders(next);
    await refreshReminderScheduling(next);
    scheduleSyncPush();
  }, []);

  const addReminder = useCallback(
    async (input: ReminderInput): Promise<BookmarkReminder> => {
      const now = Date.now();
      const newReminder: BookmarkReminder = {
        id: crypto.randomUUID(),
        bookmarkId: input.bookmarkId,
        bookmarkTitle: input.bookmarkTitle,
        bookmarkUrl: input.bookmarkUrl,
        note: input.note?.trim() || undefined,
        reminderAt: input.reminderAt,
        dateOnly: input.dateOnly,
        category: input.category,
        priority: input.priority,
        repeat: input.repeat,
        enabled: true,
        createdAt: now,
        updatedAt: now,
      };

      await bookmarkRemindersDB.saveItem(newReminder);
      const next = [...remindersRef.current, newReminder].sort((a, b) => a.reminderAt - b.reminderAt);
      await persist(next);
      return newReminder;
    },
    [persist],
  );

  const updateReminder = useCallback(
    async (id: string, updates: Partial<BookmarkReminder>) => {
      const existing = remindersRef.current.find((r) => r.id === id);
      if (!existing) return;

      const updated: BookmarkReminder = {
        ...existing,
        ...updates,
        updatedAt: Date.now(),
      };

      await bookmarkRemindersDB.saveItem(updated);
      const next = remindersRef.current.map((r) => (r.id === id ? updated : r));
      await persist(next);
    },
    [persist],
  );

  const deleteReminder = useCallback(
    async (id: string) => {
      await bookmarkRemindersDB.deleteItem(id);
      const next = remindersRef.current.filter((r) => r.id !== id);
      await persist(next);
    },
    [persist],
  );

  const handleReminderFired = useCallback(
    async (reminder: BookmarkReminder) => {
      const settings = getReminderSettings();
      const body = [reminder.note, reminder.bookmarkUrl].filter(Boolean).join("\n");

      if (settings.notificationSound) {
        playAlertSound();
      }

      showAlertNotification(reminder.bookmarkTitle, body || reminder.bookmarkUrl || "");

      const nextRepeat = settings.enableRecurring ? computeNextRepeatAt(reminder) : null;

      if (nextRepeat) {
        await updateReminder(reminder.id, {
          reminderAt: nextRepeat,
          snoozeUntil: undefined,
          lastTriggeredAt: Date.now(),
        });
      } else {
        await updateReminder(reminder.id, { lastTriggeredAt: Date.now() });
      }
    },
    [updateReminder],
  );

  useEffect(() => {
    const checkDue = () => {
      const now = new Date();
      for (const reminder of remindersRef.current) {
        if (shouldReminderFire(reminder, now)) {
          void handleReminderFired(reminder);
        }
      }
    };

    checkDue();
    const interval = setInterval(checkDue, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [handleReminderFired]);

  const completeReminder = useCallback(
    async (id: string) => {
      await updateReminder(id, {
        completedAt: Date.now(),
        enabled: false,
        snoozeUntil: undefined,
      });
    },
    [updateReminder],
  );

  const dismissReminder = useCallback(
    async (id: string) => {
      await updateReminder(id, {
        dismissedAt: Date.now(),
        enabled: false,
        snoozeUntil: undefined,
      });
    },
    [updateReminder],
  );

  const snoozeReminder = useCallback(
    async (id: string, until: number) => {
      await updateReminder(id, { snoozeUntil: until, dismissedAt: undefined });
    },
    [updateReminder],
  );

  const openReminderBookmark = useCallback(
    async (id: string) => {
      const reminder = remindersRef.current.find((r) => r.id === id);
      if (!reminder?.bookmarkUrl) return;

      openBookmarkUrl(reminder.bookmarkUrl);

      const settings = getReminderSettings();
      if (settings.autoCompleteOnOpen) {
        await completeReminder(id);
      }
    },
    [completeReminder],
  );

  const getRemindersForBookmark = useCallback(
    (bookmarkId: string) =>
      reminders.filter(
        (r) =>
          !r.completedAt &&
          !r.dismissedAt &&
          (r.bookmarkId === bookmarkId),
      ),
    [reminders],
  );

  const dateKeysWithReminders = useMemo(() => getDateKeysWithReminders(reminders), [reminders]);
  const activeReminders = useMemo(() => getActiveReminders(reminders), [reminders]);

  const value = useMemo<RemindersContextValue>(
    () => ({
      reminders,
      isLoading,
      addReminder,
      updateReminder,
      deleteReminder,
      completeReminder,
      dismissReminder,
      snoozeReminder,
      getRemindersForBookmark,
      getRemindersForDate: (dateKey: string) => getRemindersForDateKey(reminders, dateKey),
      dateKeysWithReminders,
      activeReminders,
      openReminderBookmark,
    }),
    [
      reminders,
      isLoading,
      addReminder,
      updateReminder,
      deleteReminder,
      completeReminder,
      dismissReminder,
      snoozeReminder,
      getRemindersForBookmark,
      dateKeysWithReminders,
      activeReminders,
      openReminderBookmark,
    ],
  );

  return <RemindersContext.Provider value={value}>{children}</RemindersContext.Provider>;
}

export function useReminders(): RemindersContextValue {
  const ctx = useContext(RemindersContext);
  if (!ctx) throw new Error("useReminders must be used within RemindersProvider");
  return ctx;
}

export { computeReminderStatus };
