import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { getToolCatalogEntry } from "./toolCatalog";
import {
  addRecentToolKey,
  loadFavoriteToolKeys,
  loadRecentToolKeys,
  toggleFavoriteToolKey,
} from "./toolPreferences";

interface PendingSubTool {
  parentId: string;
  subToolId: string;
}

interface ToolsNavigationContextValue {
  recentKeys: string[];
  favoriteKeys: string[];
  activeRefKey: string | null;
  recordToolUse: (key: string) => void;
  toggleFavorite: (key: string) => void;
  isFavorite: (key: string) => boolean;
  openToolRef: (key: string) => void;
  consumePendingSubTool: (parentId: string) => string | null;
}

const ToolsNavigationContext = createContext<ToolsNavigationContextValue | null>(null);

export function ToolsNavigationProvider({
  children,
  onNavigate,
}: {
  children: ReactNode;
  onNavigate: (parentId: string) => void;
}) {
  const [recentKeys, setRecentKeys] = useState(loadRecentToolKeys);
  const [favoriteKeys, setFavoriteKeys] = useState(loadFavoriteToolKeys);
  const [pendingSubTool, setPendingSubTool] = useState<PendingSubTool | null>(null);
  const [activeRefKey, setActiveRefKey] = useState<string | null>(null);

  const recordToolUse = useCallback((key: string) => {
    if (!getToolCatalogEntry(key)) return;
    setActiveRefKey(key);
    setRecentKeys(addRecentToolKey(key));
  }, []);

  const toggleFavorite = useCallback((key: string) => {
    if (!getToolCatalogEntry(key)) return;
    setFavoriteKeys(toggleFavoriteToolKey(key));
  }, []);

  const isFavorite = useCallback((key: string) => favoriteKeys.includes(key), [favoriteKeys]);

  const openToolRef = useCallback(
    (key: string) => {
      const entry = getToolCatalogEntry(key);
      if (!entry) return;
      setActiveRefKey(key);
      setRecentKeys(addRecentToolKey(key));
      if (entry.subToolId) {
        setPendingSubTool({ parentId: entry.parentId, subToolId: entry.subToolId });
      } else {
        setPendingSubTool(null);
      }
      onNavigate(entry.parentId);
    },
    [onNavigate],
  );

  const consumePendingSubTool = useCallback(
    (parentId: string) => {
      if (pendingSubTool?.parentId !== parentId) return null;
      const subToolId = pendingSubTool.subToolId;
      setPendingSubTool(null);
      return subToolId;
    },
    [pendingSubTool],
  );

  const value = useMemo(
    () => ({
      recentKeys,
      favoriteKeys,
      activeRefKey,
      recordToolUse,
      toggleFavorite,
      isFavorite,
      openToolRef,
      consumePendingSubTool,
    }),
    [recentKeys, favoriteKeys, activeRefKey, recordToolUse, toggleFavorite, isFavorite, openToolRef, consumePendingSubTool],
  );

  return <ToolsNavigationContext.Provider value={value}>{children}</ToolsNavigationContext.Provider>;
}

export function useToolsNavigation() {
  const ctx = useContext(ToolsNavigationContext);
  if (!ctx) throw new Error("useToolsNavigation must be used within ToolsNavigationProvider");
  return ctx;
}
