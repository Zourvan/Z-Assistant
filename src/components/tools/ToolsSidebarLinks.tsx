import { Star } from "lucide-react";
import { useI18n } from "../../i18n/LanguageProvider";
import { getToolCatalogEntry } from "./toolCatalog";
import { TOOLS } from "./registry";
import { useToolsNavigation } from "./ToolsNavigationContext";

interface ToolsSidebarLinksProps {
  keys: string[];
  emptyMessage: string;
}

export function ToolsSidebarLinks({ keys, emptyMessage }: ToolsSidebarLinksProps) {
  const { t } = useI18n();
  const { openToolRef, toggleFavorite, isFavorite, activeRefKey } = useToolsNavigation();

  if (keys.length === 0) {
    return <p className="tools-sidebar__empty">{emptyMessage}</p>;
  }

  return (
    <ul className="tools-sidebar__list">
      {keys.map((key) => {
        const entry = getToolCatalogEntry(key);
        if (!entry) return null;

        const parentTool = TOOLS.find((tool) => tool.id === entry.parentId);
        const Icon = parentTool?.icon;
        const favorited = isFavorite(key);
        const isActive = activeRefKey === key;
        const label = t(entry.titleKey);

        return (
          <li key={key}>
            <button
              type="button"
              className={`tools-sidebar__item ${isActive ? "tools-sidebar__item--active" : ""}`}
              onClick={() => openToolRef(key)}
              title={entry.subToolId ? `${label} · ${t(entry.parentTitleKey)}` : t(`tools.descriptions.${entry.parentId}`)}
            >
              {Icon && <Icon size={14} strokeWidth={isActive ? 2.25 : 2} />}
              <span>{label}</span>
              <span
                role="button"
                tabIndex={0}
                className={`tools-sidebar__fav ${favorited ? "tools-sidebar__fav--active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(key);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorite(key);
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
  );
}
