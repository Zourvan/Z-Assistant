import { backgroundsDB, bookmarksDB, tasksDB, alarmsDB, bookmarkRemindersDB } from "./settingsDb";
import { getStoredLocation, saveLocation } from "../weather/storage";
import { POMODORO_SETTINGS_KEY, DEFAULT_POMODORO_SETTINGS } from "../timerAlarm/pomodoroUtils";
import { CUSTOM_THEMES_KEY, MAX_CUSTOM_THEMES, type CustomTheme } from "../ThemeProvider";
import type { StoredBackground } from "./types";
import type { PetModeSettings } from "../../features/corgi/types";
import { getPetModeSettings, setPetModeSettings } from "../../features/corgi/CorgiSettings";
import type { Task } from "../tasks/types";
import type { AlarmItem, PomodoroSettings } from "../timerAlarm/types";
import type { BookmarkReminder } from "../bookmarks/reminders/types";
import type { WeatherLocation } from "../weather/types";

export const SYNC_VERSION = 1;
export const SYNC_META_KEY = "nexx_sync_meta";
export const LOCAL_UPDATED_KEY = "nexx_sync_local_updated_at";

export const SYNC_KEYS = {
  preferences: "nexx_sync_preferences",
  tasks: "nexx_sync_tasks",
  alarms: "nexx_sync_alarms",
  bookmarks: "nexx_sync_bookmarks",
  backgrounds: "nexx_sync_backgrounds",
  reminders: "nexx_sync_reminders",
} as const;

const MAX_ITEM_BYTES = 8192;
const MAX_DATA_URL_LENGTH = 1500;
const DEBOUNCE_MS = 2000;

export interface SyncMeta {
  version: number;
  updatedAt: number;
}

export interface SyncPreferences {
  language: string;
  textColor: string;
  backgroundColor: string;
  textOutlineColor: string;
  fontSizeRatio: number;
  customThemes: CustomTheme[];
  calendarType: string;
  tileNumber: number;
  weekendDays: string[];
  weekendColor: string;
  firstDayOfWeek: string;
  selectedBackground: string | null;
  typeofBookmarkForm: string | null;
  bookmarkSearchRecursive: string | null;
  corgiMode: boolean;
  petModeSettings?: PetModeSettings;
  pomodoroSettings: PomodoroSettings;
  toolsFavorites: string[];
  weatherLocation: WeatherLocation | null;
}

export interface SyncBookmarkTile {
  id: string;
  type: string;
  nodeId: string;
  title: string;
  url?: string;
  tileColor: string;
  tileIcon: string;
  position: number;
  createdAt: number;
}

export interface SyncPayload {
  meta: SyncMeta;
  preferences: SyncPreferences;
  tasks: Task[];
  alarms: AlarmItem[];
  bookmarks: SyncBookmarkTile[];
  backgrounds: StoredBackground[];
  reminders: BookmarkReminder[];
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let isPushing = false;

const syncGet = <T>(keys: string | string[]): Promise<Record<string, T>> =>
  new Promise((resolve) => {
    chrome.storage.sync.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        resolve({});
        return;
      }
      resolve(result as Record<string, T>);
    });
  });

const syncSet = (items: Record<string, unknown>): Promise<boolean> =>
  new Promise((resolve) => {
    chrome.storage.sync.set(items, () => {
      if (chrome.runtime.lastError) {
        console.warn("[nexx-sync] write failed:", chrome.runtime.lastError.message);
        resolve(false);
        return;
      }
      resolve(true);
    });
  });

const readJson = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const readCustomThemes = (): CustomTheme[] => {
  const parsed = readJson<unknown>(localStorage.getItem(CUSTOM_THEMES_KEY), []);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter(
      (item): item is CustomTheme =>
        !!item &&
        typeof item === "object" &&
        typeof (item as CustomTheme).id === "string" &&
        typeof (item as CustomTheme).name === "string" &&
        typeof (item as CustomTheme).text === "string" &&
        typeof (item as CustomTheme).bg === "string" &&
        typeof (item as CustomTheme).outline === "string",
    )
    .slice(0, MAX_CUSTOM_THEMES);
};

const readStringArray = (key: string): string[] => {
  const parsed = readJson<unknown>(localStorage.getItem(key), []);
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
};

const stripLargeDataUrl = (url: string): string => {
  if (url.startsWith("data:") && url.length > MAX_DATA_URL_LENGTH) {
    return "";
  }
  return url;
};

const prepareBackgroundForSync = (bg: StoredBackground): StoredBackground | null => {
  const url = stripLargeDataUrl(bg.url);
  if (bg.isBlob && !url) return null;

  const thumbnailUrl = bg.thumbnailUrl ? stripLargeDataUrl(bg.thumbnailUrl) : undefined;
  return {
    ...bg,
    url: url || bg.url.slice(0, MAX_DATA_URL_LENGTH),
    thumbnailUrl: thumbnailUrl || undefined,
  };
};

const prepareBackgroundsForSync = (backgrounds: StoredBackground[]): StoredBackground[] =>
  backgrounds.map(prepareBackgroundForSync).filter((bg): bg is StoredBackground => bg !== null);

const fitsSyncItem = (value: unknown): boolean => JSON.stringify(value).length <= MAX_ITEM_BYTES;

const shrinkBackgroundsUntilFit = (backgrounds: StoredBackground[]): StoredBackground[] => {
  let prepared = prepareBackgroundsForSync(backgrounds);
  while (prepared.length > 0 && !fitsSyncItem(prepared)) {
    prepared = prepared.slice(0, -1);
  }
  return prepared;
};

const shrinkArrayUntilFit = <T>(items: T[]): T[] => {
  let next = [...items];
  while (next.length > 0 && !fitsSyncItem(next)) {
    next = next.slice(0, -1);
  }
  return next;
};

export const getLocalUpdatedAt = (): number => {
  const raw = localStorage.getItem(LOCAL_UPDATED_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
};

const touchLocalUpdatedAt = () => {
  localStorage.setItem(LOCAL_UPDATED_KEY, String(Date.now()));
};

export const collectLocalData = async (): Promise<SyncPayload> => {
  const pomodoroSettings = readJson<PomodoroSettings>(
    localStorage.getItem(POMODORO_SETTINGS_KEY),
    DEFAULT_POMODORO_SETTINGS,
  );

  const fontSizeRaw = localStorage.getItem("fontSizeRatio");
  const fontSizeParsed = fontSizeRaw ? Number.parseFloat(fontSizeRaw) : 1;

  const preferences: SyncPreferences = {
    language: localStorage.getItem("language") === "fa" ? "fa" : "en",
    textColor: localStorage.getItem("textColor") || "#FFFFFF",
    backgroundColor: localStorage.getItem("backgroundColor") || "rgba(0, 0, 0, 0.2)",
    textOutlineColor: localStorage.getItem("textOutlineColor") || "#000000",
    fontSizeRatio: Number.isFinite(fontSizeParsed) ? fontSizeParsed : 1,
    customThemes: readCustomThemes(),
    calendarType: localStorage.getItem("calendarType") || "gregorian",
    tileNumber: readJson<number>(localStorage.getItem("tileNumber"), 10),
    weekendDays: readJson<string[]>(localStorage.getItem("weekendDays"), ["Friday"]),
    weekendColor: localStorage.getItem("weekendColor") || "#1B4D3E",
    firstDayOfWeek: localStorage.getItem("firstDayOfWeek") || "Saturday",
    selectedBackground: localStorage.getItem("selectedBackground"),
    typeofBookmarkForm: localStorage.getItem("typeofBookmarkForm"),
    bookmarkSearchRecursive: localStorage.getItem("bookmarkSearchRecursive"),
    corgiMode: getPetModeSettings().enabled,
    petModeSettings: getPetModeSettings(),
    pomodoroSettings: { ...DEFAULT_POMODORO_SETTINGS, ...pomodoroSettings },
    toolsFavorites: readStringArray("toolsFavorites"),
    weatherLocation: await getStoredLocation(),
  };

  const [tasks, alarms, bookmarks, backgrounds, reminders] = await Promise.all([
    tasksDB.getAllItems<Task>(),
    alarmsDB.getAllItems<AlarmItem>(),
    bookmarksDB.getAllItems<SyncBookmarkTile>(),
    backgroundsDB.getAllItems<StoredBackground>(),
    bookmarkRemindersDB.getAllItems<BookmarkReminder>(),
  ]);

  return {
    meta: { version: SYNC_VERSION, updatedAt: Date.now() },
    preferences,
    tasks,
    alarms,
    bookmarks,
    backgrounds,
    reminders,
  };
};

const applyPreferences = async (preferences: SyncPreferences) => {
  localStorage.setItem("language", preferences.language);
  localStorage.setItem("textColor", preferences.textColor);
  localStorage.setItem("backgroundColor", preferences.backgroundColor);
  localStorage.setItem("textOutlineColor", preferences.textOutlineColor || "#000000");
  localStorage.setItem("fontSizeRatio", String(preferences.fontSizeRatio));
  localStorage.setItem(
    CUSTOM_THEMES_KEY,
    JSON.stringify(Array.isArray(preferences.customThemes) ? preferences.customThemes.slice(0, MAX_CUSTOM_THEMES) : []),
  );
  localStorage.setItem("calendarType", preferences.calendarType);
  localStorage.setItem("tileNumber", JSON.stringify(preferences.tileNumber));
  localStorage.setItem("weekendDays", JSON.stringify(preferences.weekendDays));
  localStorage.setItem("weekendColor", preferences.weekendColor);
  localStorage.setItem("firstDayOfWeek", preferences.firstDayOfWeek);

  if (preferences.selectedBackground) {
    localStorage.setItem("selectedBackground", preferences.selectedBackground);
  } else {
    localStorage.removeItem("selectedBackground");
  }

  if (preferences.typeofBookmarkForm) {
    localStorage.setItem("typeofBookmarkForm", preferences.typeofBookmarkForm);
  }

  if (preferences.bookmarkSearchRecursive !== null) {
    localStorage.setItem("bookmarkSearchRecursive", preferences.bookmarkSearchRecursive);
  }

  if (preferences.petModeSettings) {
    setPetModeSettings({
      ...getPetModeSettings(),
      ...preferences.petModeSettings,
      enabled:
        typeof preferences.petModeSettings.enabled === "boolean"
          ? preferences.petModeSettings.enabled
          : preferences.corgiMode,
    });
  } else if (typeof preferences.corgiMode === "boolean") {
    setPetModeSettings({ ...getPetModeSettings(), enabled: preferences.corgiMode });
  }

  localStorage.setItem(POMODORO_SETTINGS_KEY, JSON.stringify(preferences.pomodoroSettings));
  localStorage.setItem("toolsFavorites", JSON.stringify(preferences.toolsFavorites));

  const calendarSettings = {
    type: preferences.calendarType,
    tileNumber: preferences.tileNumber,
    weekendDays: preferences.weekendDays,
    weekendColor: preferences.weekendColor,
    firstDayOfWeek: preferences.firstDayOfWeek,
    textColor: preferences.textColor,
    backgroundColor: preferences.backgroundColor,
    textOutlineColor: preferences.textOutlineColor || "#000000",
    language: preferences.language,
    fontSizeRatio: preferences.fontSizeRatio,
  };
  localStorage.setItem("calendarSettings", JSON.stringify(calendarSettings));

  if (preferences.weatherLocation) {
    await saveLocation(preferences.weatherLocation);
  }
};

const replaceStoreItems = async <T extends { id: string }>(
  db: typeof backgroundsDB,
  items: T[],
) => {
  const existing = await db.getAllItems<T>();
  for (const item of existing) {
    await db.deleteItem(item.id);
  }
  for (const item of items) {
    await db.saveItem(item);
  }
};

const resolveBookmarkNodeId = (tile: SyncBookmarkTile): Promise<string> =>
  new Promise((resolve) => {
    if (!tile.url) {
      resolve(tile.nodeId);
      return;
    }

    chrome.bookmarks.search({ url: tile.url }, (results) => {
      if (results?.length) {
        resolve(results[0].id);
        return;
      }
      resolve(tile.nodeId);
    });
  });

const applyBookmarks = async (bookmarks: SyncBookmarkTile[]) => {
  const resolved = await Promise.all(
    bookmarks.map(async (tile) => ({
      ...tile,
      nodeId: await resolveBookmarkNodeId(tile),
    })),
  );
  await replaceStoreItems(bookmarksDB, resolved);
};

export const applySyncPayload = async (payload: SyncPayload) => {
  await applyPreferences(payload.preferences);
  await replaceStoreItems(tasksDB, payload.tasks);
  await replaceStoreItems(alarmsDB, payload.alarms);
  await applyBookmarks(payload.bookmarks);
  await replaceStoreItems(backgroundsDB, payload.backgrounds);
  await replaceStoreItems(bookmarkRemindersDB, payload.reminders ?? []);
  localStorage.setItem(LOCAL_UPDATED_KEY, String(payload.meta.updatedAt));
};

const readSyncPayload = async (): Promise<SyncPayload | null> => {
  const keys = [SYNC_META_KEY, ...Object.values(SYNC_KEYS)];
  const result = await syncGet<unknown>(keys);

  const meta = result[SYNC_META_KEY] as SyncMeta | undefined;
  if (!meta?.updatedAt) return null;

  return {
    meta,
    preferences: (result[SYNC_KEYS.preferences] as SyncPreferences) ?? ({} as SyncPreferences),
    tasks: (result[SYNC_KEYS.tasks] as Task[]) ?? [],
    alarms: (result[SYNC_KEYS.alarms] as AlarmItem[]) ?? [],
    bookmarks: (result[SYNC_KEYS.bookmarks] as SyncBookmarkTile[]) ?? [],
    backgrounds: (result[SYNC_KEYS.backgrounds] as StoredBackground[]) ?? [],
    reminders: (result[SYNC_KEYS.reminders] as BookmarkReminder[]) ?? [],
  };
};

export const pushLocalToSync = async (): Promise<boolean> => {
  isPushing = true;
  try {
    const payload = await collectLocalData();
    touchLocalUpdatedAt();
    payload.meta.updatedAt = Date.now();
    localStorage.setItem(LOCAL_UPDATED_KEY, String(payload.meta.updatedAt));

    const backgrounds = shrinkBackgroundsUntilFit(payload.backgrounds);
    const tasks = shrinkArrayUntilFit(payload.tasks);
    const alarms = shrinkArrayUntilFit(payload.alarms);
    const bookmarks = shrinkArrayUntilFit(payload.bookmarks);
    const reminders = shrinkArrayUntilFit(payload.reminders ?? []);

    const items: Record<string, unknown> = {
      [SYNC_META_KEY]: payload.meta,
      [SYNC_KEYS.preferences]: payload.preferences,
      [SYNC_KEYS.tasks]: tasks,
      [SYNC_KEYS.alarms]: alarms,
      [SYNC_KEYS.bookmarks]: bookmarks,
      [SYNC_KEYS.backgrounds]: backgrounds,
      [SYNC_KEYS.reminders]: reminders,
    };

    return syncSet(items);
  } finally {
    isPushing = false;
  }
};

export const bootstrapSync = async (): Promise<void> => {
  const remote = await readSyncPayload();
  const localUpdatedAt = getLocalUpdatedAt();

  if (!remote) {
    await pushLocalToSync();
    return;
  }

  if (remote.meta.updatedAt > localUpdatedAt) {
    await applySyncPayload(remote);
    return;
  }

  if (localUpdatedAt > remote.meta.updatedAt) {
    await pushLocalToSync();
  }
};

export const scheduleSyncPush = () => {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushLocalToSync().catch((error) => console.warn("[nexx-sync] push failed:", error));
  }, DEBOUNCE_MS);
};

const isSyncKey = (key: string) =>
  key === SYNC_META_KEY || (Object.values(SYNC_KEYS) as string[]).includes(key);

export const initSyncListeners = (onRemoteChange: () => void) => {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync" || isPushing) return;

    const hasSyncChange = Object.keys(changes).some(isSyncKey);
    if (!hasSyncChange) return;

    readSyncPayload()
      .then(async (remote) => {
        if (!remote) return;
        const localUpdatedAt = getLocalUpdatedAt();
        if (remote.meta.updatedAt <= localUpdatedAt) return;
        await applySyncPayload(remote);
        onRemoteChange();
      })
      .catch((error) => console.warn("[nexx-sync] remote apply failed:", error));
  });
};
