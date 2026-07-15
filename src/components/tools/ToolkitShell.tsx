import { useState, useMemo, type ComponentType } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../../i18n/LanguageProvider";
import { ToolPanel } from "./shared";

export interface ToolkitSubTool {
  id: string;
  group: string;
  keywords: string[];
  component: ComponentType;
  comingSoon?: boolean;
}

export interface ToolkitShellProps {
  className?: string;
  i18nPrefix: string;
  groups: string[];
  subTools: ToolkitSubTool[];
  matchSearch: (query: string, tool: ToolkitSubTool, t: (key: string) => string) => boolean;
}

export function ToolkitShell({ className = "tools-toolkit", i18nPrefix, groups, subTools, matchSearch }: ToolkitShellProps) {
  const { t, dir } = useI18n();
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | "all">("all");
  const [activeToolId, setActiveToolId] = useState<string | null>(null);

  const filteredTools = useMemo(() => {
    return subTools.filter((tool) => {
      if (activeGroup !== "all" && tool.group !== activeGroup) return false;
      return matchSearch(search, tool, t);
    });
  }, [search, activeGroup, t, subTools, matchSearch]);

  const activeTool = useMemo(() => subTools.find((tool) => tool.id === activeToolId) ?? null, [activeToolId, subTools]);
  const ActivePanel = activeTool?.component;
  const BackIcon = dir === "rtl" ? ChevronRight : ChevronLeft;

  if (activeTool && ActivePanel) {
    return (
      <ToolPanel className={className}>
        <div className="tools-toolkit__header">
          <button type="button" className="tools-toolkit__back" onClick={() => setActiveToolId(null)}>
            <BackIcon size={14} />
            <span>{t(`${i18nPrefix}.back`)}</span>
          </button>
          <div className="tools-toolkit__active-meta">
            <h3 className="tools-toolkit__active-title">{t(`${i18nPrefix}.subTools.${activeTool.id}.title`)}</h3>
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
          filteredTools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              className={`tools-toolkit__card ${tool.comingSoon ? "tools-toolkit__card--soon" : ""}`}
              onClick={() => setActiveToolId(tool.id)}
            >
              <span className="tools-toolkit__card-group">{t(`${i18nPrefix}.groups.${tool.group}`)}</span>
              <span className="tools-toolkit__card-title">
                {t(`${i18nPrefix}.subTools.${tool.id}.title`)}
                {tool.comingSoon && <span className="tools-toolkit__card-badge">{t(`${i18nPrefix}.comingSoon`)}</span>}
              </span>
              <span className="tools-toolkit__card-desc">{t(`${i18nPrefix}.subTools.${tool.id}.description`)}</span>
            </button>
          ))
        )}
      </div>
    </ToolPanel>
  );
}
