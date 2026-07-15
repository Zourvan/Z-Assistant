import { useState, useMemo, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { Wrench, X, Star } from "lucide-react";
import { useCalendar } from "./Settings";
import { useI18n } from "../i18n/LanguageProvider";
import { buildThemeVars } from "./settings/themeUtils";
import { TOOL_CATEGORIES, TOOLS, getToolsByCategory } from "./tools/registry";
import type { ToolCategory } from "./tools/types";
import { ToolsNavigationProvider, useToolsNavigation } from "./tools/ToolsNavigationContext";
import { ToolsSidebarLinks } from "./tools/ToolsSidebarLinks";
import { makeToolRefKey } from "./tools/toolRefKey";
import "./Tools.css";

function ToolsModalContent({
  activeToolId,
  onClose,
}: {
  activeToolId: string;
  onClose: () => void;
}) {
  const { textColor, backgroundColor } = useCalendar();
  const { t, dir } = useI18n();
  const { recentKeys, favoriteKeys, openToolRef, toggleFavorite, isFavorite, activeRefKey } = useToolsNavigation();

  const themeStyle = useMemo(() => buildThemeVars(textColor, backgroundColor), [textColor, backgroundColor]);
  const activeTool = useMemo(() => TOOLS.find((tool) => tool.id === activeToolId) ?? TOOLS[0], [activeToolId]);
  const ActiveComponent = activeTool?.component;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="tools-overlay" onClick={onClose}>
      <div
        className="tools-modal backdrop-blur-md"
        style={themeStyle}
        dir={dir}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("tools.title")}
      >
        <header className="tools-modal__header">
          <h2 className="tools-modal__title">{t("tools.title")}</h2>
          <button type="button" className="tools-modal__close" onClick={onClose} aria-label={t("tools.close")}>
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="tools-layout">
          <nav className="tools-sidebar" aria-label={t("tools.title")}>
            <div className="tools-sidebar__group">
              <span className="tools-sidebar__label">{t("tools.recent.title")}</span>
              <ToolsSidebarLinks keys={recentKeys} emptyMessage={t("tools.recent.empty")} />
            </div>

            <div className="tools-sidebar__group">
              <span className="tools-sidebar__label">{t("tools.favorites.title")}</span>
              <ToolsSidebarLinks keys={favoriteKeys} emptyMessage={t("tools.favorites.empty")} />
            </div>

            {TOOL_CATEGORIES.map((category: ToolCategory) => (
              <div key={category} className="tools-sidebar__group">
                <span className="tools-sidebar__label">{t(`tools.categories.${category}`)}</span>
                <ul className="tools-sidebar__list">
                  {getToolsByCategory(category).map((tool) => {
                    const Icon = tool.icon;
                    const refKey = makeToolRefKey(tool.id);
                    const isActive = activeRefKey === refKey;
                    const favorited = isFavorite(refKey);
                    return (
                      <li key={tool.id}>
                        <button
                          type="button"
                          className={`tools-sidebar__item ${isActive ? "tools-sidebar__item--active" : ""}`}
                          onClick={() => openToolRef(refKey)}
                          title={t(`tools.descriptions.${tool.id}`)}
                        >
                          <Icon size={14} strokeWidth={isActive ? 2.25 : 2} />
                          <span>{t(`tools.items.${tool.id}`)}</span>
                          <span
                            role="button"
                            tabIndex={0}
                            className={`tools-sidebar__fav ${favorited ? "tools-sidebar__fav--active" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(refKey);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFavorite(refKey);
                              }
                            }}
                            aria-label={favorited ? t("tools.favorites.remove") : t("tools.favorites.add")}
                          >
                            <Star size={12} fill={favorited ? "currentColor" : "none"} />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <main className="tools-main">
            <div className="tools-main__content">{ActiveComponent && <ActiveComponent key={activeToolId} />}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

export function Tools() {
  const { textColor } = useCalendar();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [activeToolId, setActiveToolId] = useState("dateConverter");

  const handleNavigate = useCallback((parentId: string) => {
    setActiveToolId(parentId);
  }, []);

  return (
    <>
      <button
        type="button"
        className="app-floating-btn hover:bg-white/30"
        style={{ color: textColor }}
        onClick={() => setIsOpen(true)}
        aria-label={t("tools.title")}
        title={t("tools.title")}
      >
        <Wrench size={20} />
      </button>

      {isOpen &&
        ReactDOM.createPortal(
          <ToolsNavigationProvider onNavigate={handleNavigate}>
            <ToolsModalContent activeToolId={activeToolId} onClose={() => setIsOpen(false)} />
          </ToolsNavigationProvider>,
          document.body,
        )}
    </>
  );
}
