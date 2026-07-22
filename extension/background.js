const REMINDERS_CACHE_KEY = "nexx_reminders_cache";
const REMINDERS_UPDATED_KEY = "nexx_reminders_updated_at";
const ALARM_PREFIX = "nexx-reminder-";
const DB_NAME = "bookmarkRemindersDB";
const STORE_NAME = "reminders";

const getReminderIdFromAlarm = (name) => name.slice(ALARM_PREFIX.length);

const openRemindersDb = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("bookmarkId", "bookmarkId", { unique: false });
        store.createIndex("reminderAt", "reminderAt", { unique: false });
        store.createIndex("enabled", "enabled", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const getAllRemindersFromDb = async () => {
  const db = await openRemindersDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

const saveReminderToDb = async (reminder) => {
  const db = await openRemindersDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(reminder);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const loadReminders = async () => {
  try {
    return await getAllRemindersFromDb();
  } catch {
    return new Promise((resolve) => {
      chrome.storage.local.get(REMINDERS_CACHE_KEY, (result) => {
        resolve(result[REMINDERS_CACHE_KEY] || []);
      });
    });
  }
};

const syncRemindersCache = async (reminders) => {
  await chrome.storage.local.set({
    [REMINDERS_CACHE_KEY]: reminders,
    [REMINDERS_UPDATED_KEY]: Date.now(),
  });
};

const scheduleReminderAlarms = async (reminders) => {
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
    await chrome.alarms.create(`${ALARM_PREFIX}${reminder.id}`, { delayInMinutes: delayMinutes });
  }
};

const showNotification = (reminder) => {
  chrome.notifications.create(`reminder-${reminder.id}`, {
    type: "basic",
    iconUrl: reminder.favicon || "icons/icon128.png",
    title: reminder.bookmarkTitle,
    message: reminder.note || reminder.bookmarkUrl || "",
    buttons: [{ title: "Open" }, { title: "Snooze" }, { title: "Done" }],
    priority: reminder.priority === "high" ? 2 : reminder.priority === "medium" ? 1 : 0,
    requireInteraction: reminder.priority === "high",
  });
};

const updateReminderInStore = async (id, updates) => {
  const reminders = await loadReminders();
  const next = reminders.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r));
  const updated = next.find((r) => r.id === id);
  if (updated) await saveReminderToDb(updated);
  await syncRemindersCache(next);
  await scheduleReminderAlarms(next);
  return next;
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "NEXX_ADD_REMINDER") return undefined;

  (async () => {
    const payload = message.payload || {};
    const now = Date.now();
    const reminder = {
      id: crypto.randomUUID(),
      bookmarkId: payload.bookmarkId,
      bookmarkTitle: payload.bookmarkTitle,
      bookmarkUrl: payload.bookmarkUrl,
      note: payload.note,
      reminderAt: payload.reminderAt,
      dateOnly: Boolean(payload.dateOnly),
      category: payload.category,
      priority: payload.priority || "medium",
      repeat: payload.repeat || { type: "none" },
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };

    await saveReminderToDb(reminder);
    const all = await loadReminders();
    await syncRemindersCache(all);
    await scheduleReminderAlarms(all);
    sendResponse({ ok: true, reminder });
  })().catch((error) => {
    console.error("[nexx-reminders] add failed:", error);
    sendResponse({ ok: false, error: String(error) });
  });

  return true;
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith(ALARM_PREFIX)) return;

  const reminderId = getReminderIdFromAlarm(alarm.name);
  const reminders = await loadReminders();
  const reminder = reminders.find((r) => r.id === reminderId);
  if (!reminder || !reminder.enabled || reminder.completedAt || reminder.dismissedAt) return;

  showNotification(reminder);
  await updateReminderInStore(reminderId, { lastTriggeredAt: Date.now() });
});

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (!notificationId.startsWith("reminder-")) return;
  const reminderId = notificationId.slice("reminder-".length);
  const reminders = await loadReminders();
  const reminder = reminders.find((r) => r.id === reminderId);
  if (!reminder) return;

  switch (buttonIndex) {
    case 0:
      if (reminder.bookmarkUrl) chrome.tabs.create({ url: reminder.bookmarkUrl });
      break;
    case 1: {
      const snoozeUntil = Date.now() + 30 * 60_000;
      await updateReminderInStore(reminderId, { snoozeUntil });
      chrome.alarms.create(`${ALARM_PREFIX}${reminderId}`, { delayInMinutes: 30 });
      break;
    }
    case 2:
      await updateReminderInStore(reminderId, { completedAt: Date.now(), enabled: false });
      break;
    default:
      break;
  }

  chrome.notifications.clear(notificationId);
});

chrome.notifications.onClicked.addListener(async (notificationId) => {
  if (!notificationId.startsWith("reminder-")) return;
  const reminderId = notificationId.slice("reminder-".length);
  const reminders = await loadReminders();
  const reminder = reminders.find((r) => r.id === reminderId);
  if (reminder?.bookmarkUrl) chrome.tabs.create({ url: reminder.bookmarkUrl });
  chrome.notifications.clear(notificationId);
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.notifications.getPermissionLevel((level) => {
    if (level === "denied") {
      console.warn("[nexx-reminders] Notification permission denied");
    }
  });
});
