import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { getToolCatalogEntry } from "./toolCatalog";
import {
  addRecentToolKey,
  loadFavoriteToolKeys,
  loadRecentToolKeys,
  toggleFavoriteToolKey,
} from "./toolPreferences";

export interface ToolNavigationRequest {
  refKey: string;
  parentId: string;
  subToolId?: string;
  seq: number;
}

interface ToolsNavigationContextValue {
  recentKeys: string[];
  favoriteKeys: string[];
  activeRefKey: string | null;
  navigationRequest: ToolNavigationRequest | null;
  recordToolUse: (key: string) => void;
  toggleFavorite: (key: string) => void;
  isFavorite: (key: string) => boolean;
  openToolRef: (key: string) => void;
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
  const [activeRefKey, setActiveRefKey] = useState<string | null>(null);
  const [navigationRequest, setNavigationRequest] = useState<ToolNavigationRequest | null>(null);
  const navSeq = useRef(0);

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

      navSeq.current += 1;
      setActiveRefKey(key);
      setRecentKeys(addRecentToolKey(key));
      setNavigationRequest({
        refKey: key,
        parentId: entry.parentId,
        subToolId: entry.subToolId,
        seq: navSeq.current,
      });
      onNavigate(entry.parentId);
    },
    [onNavigate],
  );

  const value = useMemo(
    () => ({
      recentKeys,
      favoriteKeys,
      activeRefKey,
      navigationRequest,
      recordToolUse,
      toggleFavorite,
      isFavorite,
      openToolRef,
    }),
    [recentKeys, favoriteKeys, activeRefKey, navigationRequest, recordToolUse, toggleFavorite, isFavorite, openToolRef],
  );

  return <ToolsNavigationContext.Provider value={value}>{children}</ToolsNavigationContext.Provider>;
}

export function useToolsNavigation() {
  const ctx = useContext(ToolsNavigationContext);
  if (!ctx) throw new Error("useToolsNavigation must be used within ToolsNavigationProvider");
  return ctx;
}
