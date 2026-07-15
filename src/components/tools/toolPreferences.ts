const RECENT_KEY = "toolsRecent";
const FAVORITES_KEY = "toolsFavorites";
export const MAX_RECENT_TOOLS = 10;

const readKeys = (storageKey: string): string[] => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === "string") : [];
  } catch {
    return [];
  }
};

const writeKeys = (storageKey: string, keys: string[]) => {
  localStorage.setItem(storageKey, JSON.stringify(keys));
};

export const loadRecentToolKeys = (): string[] => readKeys(RECENT_KEY).slice(0, MAX_RECENT_TOOLS);

export const loadFavoriteToolKeys = (): string[] => readKeys(FAVORITES_KEY);

export const addRecentToolKey = (key: string): string[] => {
  const next = [key, ...readKeys(RECENT_KEY).filter((k) => k !== key)].slice(0, MAX_RECENT_TOOLS);
  writeKeys(RECENT_KEY, next);
  return next;
};

export const toggleFavoriteToolKey = (key: string): string[] => {
  const current = readKeys(FAVORITES_KEY);
  const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
  writeKeys(FAVORITES_KEY, next);
  return next;
};

export const isFavoriteToolKey = (key: string): boolean => readKeys(FAVORITES_KEY).includes(key);
