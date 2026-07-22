import { useEffect, useState } from "react";
import { cacheFaviconForUrl, getCachedFavicon, getFaviconCacheKey } from "./faviconCache";

const FALLBACK_FAVICON = "https://www.google.com/s2/favicons?domain=chrome&sz=32";

interface BookmarkFaviconProps {
  url?: string;
  size: 16 | 32;
  className?: string;
}

function getOnlineFaviconUrl(url: string, size: number): string {
  const hostname = getFaviconCacheKey(url);
  return hostname
    ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=${size}`
    : FALLBACK_FAVICON;
}

export function BookmarkFavicon({ url, size, className }: BookmarkFaviconProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setSrc(null);
      return;
    }

    let cancelled = false;
    const onlineFallback = getOnlineFaviconUrl(url, size);

    const loadFavicon = async () => {
      const cached = await getCachedFavicon(url);
      if (cancelled) return;

      if (cached) {
        setSrc(cached);
        return;
      }

      if (navigator.onLine) {
        const dataUrl = await cacheFaviconForUrl(url, size);
        if (!cancelled) {
          setSrc(dataUrl ?? onlineFallback);
        }
        return;
      }

      setSrc(onlineFallback);
    };

    void loadFavicon();

    return () => {
      cancelled = true;
    };
  }, [url, size]);

  if (!url) return null;

  const displaySrc = src ?? getOnlineFaviconUrl(url, size);

  return (
    <img
      src={displaySrc}
      alt=""
      className={className}
      onError={(e) => {
        if (e.currentTarget.src !== FALLBACK_FAVICON) {
          e.currentTarget.src = FALLBACK_FAVICON;
        }
      }}
    />
  );
}
