import { Star } from "lucide-react";
import { useI18n } from "../../i18n/LanguageProvider";
import { getToolCatalogEntry } from "./toolCatalog";
import { useToolsNavigation } from "./ToolsNavigationContext";

interface ToolsQuickListProps {
  keys: string[];
  emptyMessage: string;
}

export function ToolsQuickList({ keys, emptyMessage }: ToolsQuickListProps) {
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
        const favorited = isFavorite(key);

        return (
          <li key={key}>
            <button
              type="button"
              className={`tools-sidebar__item tools-sidebar__item--quick ${activeRefKey === key ? "tools-sidebar__item--active" : ""}`}
              onClick={() => openToolRef(key)}
              title={entry.subToolId ? t(entry.parentTitleKey) : t(entry.titleKey)}
            >
              <span className="tools-sidebar__item-text">
                <span className="tools-sidebar__item-title">{t(entry.titleKey)}</span>
                {entry.subToolId && <span className="tools-sidebar__item-hint">{t(entry.parentTitleKey)}</span>}
              </span>
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
