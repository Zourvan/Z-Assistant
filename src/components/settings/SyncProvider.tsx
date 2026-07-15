import { useEffect, useState, type ReactNode } from "react";
import { bootstrapSync, initSyncListeners } from "./settingsSync";

interface SyncProviderProps {
  children: ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    bootstrapSync()
      .catch((error) => console.warn("[nexx-sync] bootstrap failed:", error))
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    initSyncListeners(() => {
      window.location.reload();
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}
