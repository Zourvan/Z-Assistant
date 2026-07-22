import createDatabase from "../IndexedDatabase/IndexedDatabase";

interface FaviconCacheEntry {
  key: string;
  dataUrl: string;
  updatedAt: number;
}

const faviconDB = createDatabase({
  dbName: "bookmarkFaviconCacheDB",
  storeName: "favicons",
  version: 1,
  keyPath: "key",
});

export function getFaviconCacheKey(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function getChromeFaviconUrl(pageUrl: string, size: number): string | null {
  if (typeof chrome !== "undefined" && chrome.runtime?.id) {
    return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(pageUrl)}&size=${size}`;
  }
  return null;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    if (!blob.size) return null;
    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}

function buildFaviconSources(url: string, size: number): string[] {
  const hostname = getFaviconCacheKey(url);
  const sources: string[] = [];

  const chromeFavicon = getChromeFaviconUrl(url, size);
  if (chromeFavicon) sources.push(chromeFavicon);

  if (hostname) {
    sources.push(`https://www.google.com/s2/favicons?domain=${hostname}&sz=${size}`);
  }

  return sources;
}

export async function getCachedFavicon(url: string): Promise<string | null> {
  const key = getFaviconCacheKey(url);
  if (!key) return null;

  const entry = await faviconDB.getItem<FaviconCacheEntry>(key);
  return entry?.dataUrl ?? null;
}

export async function cacheFaviconForUrl(url: string, size = 32): Promise<string | null> {
  const key = getFaviconCacheKey(url);
  if (!key) return null;

  const existing = await faviconDB.getItem<FaviconCacheEntry>(key);
  if (existing?.dataUrl) return existing.dataUrl;

  for (const source of buildFaviconSources(url, size)) {
    const dataUrl = await fetchAsDataUrl(source);
    if (dataUrl) {
      await faviconDB.saveItem({ key, dataUrl, updatedAt: Date.now() });
      return dataUrl;
    }
  }

  return null;
}

export async function prefetchFaviconsForUrls(urls: string[], size = 32): Promise<void> {
  const uniqueUrls = [...new Set(urls.filter(Boolean))];
  await Promise.all(uniqueUrls.map((url) => cacheFaviconForUrl(url, size)));
}
