import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, Folder, X } from "lucide-react";
import { useI18n } from "../../../i18n/LanguageProvider";
import { useCalendar } from "../../Settings";
import { buildThemeCssVars } from "../../settings/themeUtils";
import { BookmarkFavicon } from "../BookmarkFavicon";
import "./BookmarkReminderModal.css";
import "./ReminderManager.css";

export interface PickedBookmark {
  id: string;
  title: string;
  url?: string;
  isFolder: boolean;
}

interface BookmarkTreePickerProps {
  onPick: (item: PickedBookmark) => void;
  onClose: () => void;
}

interface TreeNode {
  id: string;
  title: string;
  url?: string;
  children?: TreeNode[];
}

function transformNode(node: chrome.bookmarks.BookmarkTreeNode): TreeNode {
  return {
    id: node.id,
    title: node.title || (node.url ? node.url : "Folder"),
    url: node.url,
    children: node.children?.map(transformNode),
  };
}

export function BookmarkTreePicker({ onPick, onClose }: BookmarkTreePickerProps) {
  const { t } = useI18n();
  const { textColor, backgroundColor } = useCalendar();
  const themeCssVars = buildThemeCssVars(textColor, backgroundColor);
  const [roots, setRoots] = useState<TreeNode[]>([]);
  const [current, setCurrent] = useState<TreeNode | null>(null);
  const [history, setHistory] = useState<TreeNode[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    chrome.bookmarks.getTree((tree) => {
      const top = (tree[0]?.children || []).map(transformNode);
      setRoots(top);
    });
  }, []);

  const openFolder = useCallback((node: TreeNode) => {
    setHistory((prev) => (current ? [...prev, current] : prev));
    setCurrent(node);
    setSearch("");
  }, [current]);

  const goBack = () => {
    const prev = [...history];
    const last = prev.pop();
    setHistory(prev);
    setCurrent(last ?? null);
  };

  const nodes = useMemo(() => {
    const list = current?.children ?? roots;
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (node) =>
        node.title.toLowerCase().includes(term) ||
        node.url?.toLowerCase().includes(term),
    );
  }, [current, roots, search]);

  return (
    <div className="bookmarks-overlay" onClick={onClose}>
      <div
        className="bookmarks-modal reminder-modal"
        style={themeCssVars}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="reminder-modal__header">
          <h3>{t("bookmarks.reminder.pickBookmark")}</h3>
          <button type="button" className="reminder-modal__close" onClick={onClose} aria-label={t("bookmarks.cancel")}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="reminder-modal__bookmark-title">{t("bookmarks.reminder.pickBookmarkHint")}</p>

        <div className="reminder-modal__datetime" style={{ marginBottom: "0.75rem" }}>
          {current && (
            <button type="button" className="reminder-modal__btn reminder-modal__btn--secondary" onClick={goBack}>
              <ChevronLeft className="w-4 h-4" />
              {t("bookmarks.back")}
            </button>
          )}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("bookmarks.search")}
            style={{ flex: 1 }}
          />
        </div>

        <div className="reminder-picker-list">
          {nodes.map((node) => {
            const isFolder = Boolean(node.children);
            return (
              <button
                key={node.id}
                type="button"
                className="reminder-picker-item"
                onClick={() => {
                  if (isFolder && !search.trim()) {
                    openFolder(node);
                    return;
                  }
                  onPick({
                    id: node.id,
                    title: node.title,
                    url: node.url,
                    isFolder,
                  });
                }}
              >
                {isFolder ? (
                  <Folder className="w-4 h-4" />
                ) : (
                  <BookmarkFavicon url={node.url} size={16} />
                )}
                <span className="reminder-picker-item__title">{node.title}</span>
                {isFolder && (
                  <span
                    className="reminder-picker-item__action"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPick({
                        id: node.id,
                        title: node.title,
                        url: node.url,
                        isFolder: true,
                      });
                    }}
                  >
                    {t("bookmarks.reminder.useFolder")}
                  </span>
                )}
              </button>
            );
          })}
          {nodes.length === 0 && <p className="reminder-manager__empty">{t("bookmarks.emptySearch")}</p>}
        </div>
      </div>
    </div>
  );
}
