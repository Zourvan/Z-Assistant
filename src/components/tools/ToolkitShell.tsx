import { useState, useMemo, useEffect, type ComponentType } from "react";
import { Search, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useI18n } from "../../i18n/LanguageProvider";
import { ToolPanel } from "./shared";
import { makeToolRefKey } from "./toolRefKey";
import { useToolsNavigation } from "./ToolsNavigationContext";

export interface ToolkitSubTool {
  id: string;
  group: string;
  keywords: string[];
  component: ComponentType;
  comingSoon?: boolean;
}

export interface ToolkitShellProps {
  className?: string;
  parentToolId: string;
  i18nPrefix: string;
  groups: string[];
  subTools: ToolkitSubTool[];
  matchSearch: (query: string, tool: ToolkitSubTool, t: (key: string) => string) => boolean;
}

export function ToolkitShell({
  className = "tools-toolkit",
  parentToolId,
  i18nPrefix,
  groups,
  subTools,
  matchSearch,
}: ToolkitShellProps) {
  const { t, dir } = useI18n();
  const { recordToolUse, toggleFavorite, isFavorite, navigationRequest } = useToolsNavigation();
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | "all">("all");
  const [activeToolId, setActiveToolId] = useState<string | null>(null);

  useEffect(() => {
    if (navigationRequest?.parentId !== parentToolId) return;
    setActiveToolId(navigationRequest.subToolId ?? null);
  }, [navigationRequest, parentToolId]);

  const filteredTools = useMemo(() => {
    return subTools.filter((tool) => {
      if (activeGroup !== "all" && tool.group !== activeGroup) return false;
      return matchSearch(search, tool, t);
    });
  }, [search, activeGroup, t, subTools, matchSearch]);

  const activeTool = useMemo(() => subTools.find((tool) => tool.id === activeToolId) ?? null, [activeToolId, subTools]);
  const ActivePanel = activeTool?.component;
  const BackIcon = dir === "rtl" ? ChevronRight : ChevronLeft;

  const openSubTool = (subToolId: string) => {
    setActiveToolId(subToolId);
    recordToolUse(makeToolRefKey(parentToolId, subToolId));
  };

  const renderFavoriteButton = (refKey: string) => {
    const favorited = isFavorite(refKey);
    return (
      <button
        type="button"
        className={`tools-fav-btn ${favorited ? "tools-fav-btn--active" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(refKey);
        }}
        aria-label={favorited ? t("tools.favorites.remove") : t("tools.favorites.add")}
        title={favorited ? t("tools.favorites.remove") : t("tools.favorites.add")}
      >
        <Star size={13} fill={favorited ? "currentColor" : "none"} />
      </button>
    );
  };

  if (activeTool && ActivePanel) {
    const refKey = makeToolRefKey(parentToolId, activeTool.id);
    return (
      <ToolPanel className={className}>
        <div className="tools-toolkit__header">
          <button type="button" className="tools-toolkit__back" onClick={() => setActiveToolId(null)}>
            <BackIcon size={14} />
            <span>{t(`${i18nPrefix}.back`)}</span>
          </button>
          <div className="tools-toolkit__active-meta">
            <div className="tools-toolkit__active-title-row">
              <h3 className="tools-toolkit__active-title">{t(`${i18nPrefix}.subTools.${activeTool.id}.title`)}</h3>
              {renderFavoriteButton(refKey)}
            </div>
            <p className="tools-toolkit__active-desc">{t(`${i18nPrefix}.subTools.${activeTool.id}.description`)}</p>
          </div>
        </div>
        <div className="tools-toolkit__panel">
          <ActivePanel />
        </div>
      </ToolPanel>
    );
  }

  return (
    <ToolPanel className={className}>
      <div className="tools-toolkit__search">
        <Search size={14} className="tools-toolkit__search-icon" />
        <input
          type="search"
          className="tools-toolkit__search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t(`${i18nPrefix}.search.placeholder`)}
          aria-label={t(`${i18nPrefix}.search.placeholder`)}
        />
      </div>

      <div className="tools-toolkit__groups">
        <button
          type="button"
          className={`tools-toolkit__group-btn ${activeGroup === "all" ? "tools-toolkit__group-btn--active" : ""}`}
          onClick={() => setActiveGroup("all")}
        >
          {t(`${i18nPrefix}.search.all`)}
        </button>
        {groups.map((group) => (
          <button
            key={group}
            type="button"
            className={`tools-toolkit__group-btn ${activeGroup === group ? "tools-toolkit__group-btn--active" : ""}`}
            onClick={() => setActiveGroup(group)}
          >
            {t(`${i18nPrefix}.groups.${group}`)}
          </button>
        ))}
      </div>

      <div className="tools-toolkit__grid">
        {filteredTools.length === 0 ? (
          <p className="tools-toolkit__empty">{t(`${i18nPrefix}.search.noResults`)}</p>
        ) : (
          filteredTools.map((tool) => {
            const refKey = makeToolRefKey(parentToolId, tool.id);
            return (
              <button
                key={tool.id}
                type="button"
                className={`tools-toolkit__card ${tool.comingSoon ? "tools-toolkit__card--soon" : ""}`}
                onClick={() => openSubTool(tool.id)}
              >
                <span className="tools-toolkit__card-top">
                  <span className="tools-toolkit__card-group">{t(`${i18nPrefix}.groups.${tool.group}`)}</span>
                  {renderFavoriteButton(refKey)}
                </span>
                <span className="tools-toolkit__card-title">
                  {t(`${i18nPrefix}.subTools.${tool.id}.title`)}
                  {tool.comingSoon && <span className="tools-toolkit__card-badge">{t(`${i18nPrefix}.comingSoon`)}</span>}
                </span>
                <span className="tools-toolkit__card-desc">{t(`${i18nPrefix}.subTools.${tool.id}.description`)}</span>
              </button>
            );
          })
        )}
      </div>
    </ToolPanel>
  );
}
