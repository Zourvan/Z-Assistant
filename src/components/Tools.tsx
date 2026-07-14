import { useState, useMemo, useEffect } from "react";
import ReactDOM from "react-dom";
import { Wrench, X } from "lucide-react";
import { useCalendar } from "./Settings";
import { useI18n } from "../i18n/LanguageProvider";
import { buildThemeVars } from "./settings/themeUtils";
import { TOOL_CATEGORIES, TOOLS, getToolsByCategory } from "./tools/registry";
import type { ToolCategory } from "./tools/types";
import "./Tools.css";

export function Tools() {
  const { textColor, backgroundColor } = useCalendar();
  const { t, dir } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [activeToolId, setActiveToolId] = useState("dateConverter");

  const themeStyle = useMemo(() => buildThemeVars(textColor, backgroundColor), [textColor, backgroundColor]);
  const activeTool = useMemo(() => TOOLS.find((tool) => tool.id === activeToolId) ?? TOOLS[0], [activeToolId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const ActiveComponent = activeTool?.component;

  return (
    <div className="tools-trigger-wrap" dir="ltr" style={themeStyle}>
      <button
        type="button"
        className="tools-trigger backdrop-blur-md"
        style={{ backgroundColor, color: textColor }}
        onClick={() => setIsOpen(true)}
        aria-label={t("tools.title")}
        title={t("tools.title")}
      >
        <Wrench className="w-5 h-5" />
      </button>

      {isOpen &&
        ReactDOM.createPortal(
          <div className="tools-overlay" onClick={() => setIsOpen(false)}>
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
                <button
                  type="button"
                  className="tools-modal__close"
                  onClick={() => setIsOpen(false)}
                  aria-label={t("tools.close")}
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              <div className="tools-layout">
                <nav className="tools-sidebar" aria-label={t("tools.title")}>
                  {TOOL_CATEGORIES.map((category: ToolCategory) => (
                    <div key={category} className="tools-sidebar__group">
                      <span className="tools-sidebar__label">{t(`tools.categories.${category}`)}</span>
                      <ul className="tools-sidebar__list">
                        {getToolsByCategory(category).map((tool) => {
                          const Icon = tool.icon;
                          const isActive = activeTool?.id === tool.id;
                          return (
                            <li key={tool.id}>
                              <button
                                type="button"
                                className={`tools-sidebar__item ${isActive ? "tools-sidebar__item--active" : ""}`}
                                onClick={() => setActiveToolId(tool.id)}
                                title={t(`tools.descriptions.${tool.id}`)}
                              >
                                <Icon size={14} strokeWidth={isActive ? 2.25 : 2} />
                                <span>{t(`tools.items.${tool.id}`)}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </nav>

                <main className="tools-main">
                  <div className="tools-main__content">
                    {ActiveComponent && <ActiveComponent />}
                  </div>
                </main>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
