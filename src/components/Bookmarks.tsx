import { useEffect, useState, useRef, useCallback, useMemo, Fragment, type CSSProperties } from "react";
import ReactDOM from "react-dom";
import createDatabase from "./IndexedDatabase/IndexedDatabase";
import { Folder, ChevronLeft, ChevronDown, MoreHorizontal, Settings, Plus, Trash2, Palette, Search, X, List, Smile, Bell } from "lucide-react";
import Sortable from "sortablejs";
import { throttle } from "lodash";
import { useCalendar } from "./Settings";
import { buildThemeCssVars } from "./settings/themeUtils";
import { useI18n } from "../i18n/LanguageProvider";
import { scheduleSyncPush } from "./settings/settingsSync";
import { BookmarkFavicon } from "./bookmarks/BookmarkFavicon";
import { cacheFaviconForUrl, prefetchFaviconsForUrls } from "./bookmarks/faviconCache";
import { BookmarkReminderModal } from "./bookmarks/reminders/BookmarkReminderModal";
import { ReminderManager } from "./bookmarks/reminders/ReminderManager";
import { useReminders } from "./bookmarks/reminders/RemindersContext";
import "./Bookmarks.css";
import "./shared/themedSelect.css";
// Import emoji-mart
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

// --- Interfaces and Types ---
interface BookmarkNode {
  tileIcon: string;
  tileColor: string;
  id: string;
  title: string;
  url?: string;
  children?: BookmarkNode[];
}

interface TileConfig {
  id: string;
  type: string;
  nodeId: string;
  title: string;
  url?: string;
  tileColor: string;
  tileIcon: string;
  position: number;
  createdAt: number;
}

interface ActionMenuPortalProps {
  tile: TileConfig;
  buttonRect: DOMRect;
  index: number;
  onEdit: () => void;
  onClear: () => void;
  onColor: () => void;
  onIcon?: () => void;
  onReminder?: () => void;
  onClose: () => void;
  themeStyle: CSSProperties;
  labels: { edit: string; clear: string; color: string; icon: string; reminder: string };
}

// Add types for grouping / sorting options
type GroupingType = "none" | "alphabetical" | "type";
type SortType = "default" | "name-asc" | "name-desc" | "type";
type SearchField = "all" | "name" | "address";

// Add interfaces for grouped nodes
interface GroupedData {
  title: string;
  nodes: BookmarkNode[];
}

// --- Database Setup ---
const bookmarkDB = createDatabase({
  dbName: "bookmarkManagerDB",
  storeName: "tiles",
  version: 1,
  keyPath: "id",
  indexes: [
    { name: "createdAt", keyPath: "createdAt", unique: false },
    { name: "position", keyPath: "position", unique: false }, // Add index for position
  ],
});

// Create a database for bookmark settings
// const bookmarkSettingsDB = createDatabase({
//   dbName: "bookmarkSettingsDB",
//   storeName: "settings",
//   version: 1,
//   keyPath: "id",
//   indexes: [
//     { name: "updatedAt", keyPath: "updatedAt", unique: false },
//   ],
// });

// --- Helper Functions ---
function transformBookmarkNode(node: chrome.bookmarks.BookmarkTreeNode): BookmarkNode {
  return {
    id: node.id,
    title: node.title,
    url: node.url,
    tileIcon: node.children ? "📁" : "default",
    tileColor: "rgba(0, 0, 0, 0.6)", // Default color
    children: node.children?.map((child) => transformBookmarkNode(child)),
  };
}

function truncateTitle(title: string): string {
  const words = title.trim().split(/\s+/);
  const truncated = words.length <= 4 ? title : words.slice(0, 4).join(" ") + "…";

  if (truncated.length > 20) {
    return truncated.substring(0, 17) + "…";
  }

  return truncated;
}

function getHostname(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function matchesName(title: string, term: string): boolean {
  return title.toLowerCase().includes(term.toLowerCase());
}

function matchesAddress(url: string | undefined, term: string): boolean {
  const lowerTerm = term.toLowerCase();
  if (url?.toLowerCase().includes(lowerTerm)) return true;
  return getHostname(url).toLowerCase().includes(lowerTerm);
}

function matchesSearchField(title: string, url: string | undefined, term: string, field: SearchField): boolean {
  if (field === "name") return matchesName(title, term);
  if (field === "address") return matchesAddress(url, term);
  return matchesName(title, term) || matchesAddress(url, term);
}

function nodeMatchesSearch(node: BookmarkNode, term: string, field: SearchField = "all"): boolean {
  return matchesSearchField(node.title, node.url, term, field);
}

function searchNodesRecursive(nodes: BookmarkNode[], term: string, field: SearchField = "all"): BookmarkNode[] {
  const results: BookmarkNode[] = [];

  for (const node of nodes) {
    if (nodeMatchesSearch(node, term, field)) {
      results.push(node);
    }
    if (node.children?.length) {
      results.push(...searchNodesRecursive(node.children, term, field));
    }
  }

  return results;
}

// --- Color Picker Component ---
function ColorPicker({
  currentColor,
  onChange,
  onConfirm,
  onClose,
  themeStyle,
}: {
  currentColor: string;
  onChange: (color: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  themeStyle: CSSProperties;
}) {
  const colors = [
    "rgba(255, 0, 255, 0.6)", // سرخابی (Magenta) - Hue نزدیک به 300
    "rgba(233, 69, 96, 0.6)", // قرمز مایل به صورتی
    "rgba(242, 139, 130, 0.6)", // قرمز-نارنجی
    "rgba(255, 128, 0, 0.6)", // نارنجی
    "rgba(251, 188, 4, 0.6)", // زرد-نارنجی
    "rgba(184, 115, 51, 0.6)", // قهوه‌ای (Hue بین قرمز و زرد)
    "rgba(255, 238, 88, 0.6)", // زرد
    "rgba(255, 244, 117, 0.6)", // زرد روشن
    "rgba(204, 255, 144, 0.6)", // سبز-زرد
    "rgba(152, 251, 152, 0.6)", // سبز
    "rgba(167, 255, 235, 0.6)", // فیروزه‌ای روشن
    "rgba(0, 255, 255, 0.6)", // فیروزه‌ای (Cyan)
    "rgba(125, 249, 255, 0.6)", // آبی-فیروزه‌ای
    "rgba(130, 238, 253, 0.6)", // آبی آسمانی
    "rgba(0, 150, 255, 0.6)", // آبی
    "rgba(174, 203, 250, 0.6)", // آبی-بنفش
    "rgba(203, 240, 248, 0.6)", // آبی خیلی روشن (نزدیک به سفید)
    "rgba(215, 174, 251, 0.6)", // بنفش-آبی
    "rgba(253, 207, 232, 0.6)", // صورتی
    "rgba(230, 201, 168, 0.6)", // هلویی/بژ
    "rgba(232, 234, 237, 0.6)", // خاکستری بسیار روشن
    "rgba(105, 105, 105, 0.6)", // خاکستری
    "rgba(0, 0, 0, 0.6)", // سیاه
    "rgba(255, 255, 255, 0.6)", // سفید
  ];

  return (
    <div className="bookmarks-overlay">
      <div className="bookmarks-modal" style={{ ...themeStyle, width: "auto", height: "auto", maxWidth: "18rem" }}>
        <div className="bookmarks-color-grid grid grid-cols-6 gap-1.5 mb-3">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              className={color === currentColor ? "selected" : ""}
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="bookmarks-btn flex-1 justify-center">
            ✗
          </button>
          <button type="button" onClick={onConfirm} className="bookmarks-btn bookmarks-btn--primary flex-1 justify-center">
            ✓
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Action Menu Component (Portal) ---
const MENU_WIDTH = 112;
const MENU_HEIGHT = 168;
const MENU_MARGIN = 8;

function getMenuPosition(buttonRect: DOMRect) {
  let top = buttonRect.bottom + MENU_MARGIN;
  let left = buttonRect.left;

  if (top + MENU_HEIGHT > window.innerHeight - MENU_MARGIN) {
    top = buttonRect.top - MENU_HEIGHT - MENU_MARGIN;
  }
  if (left + MENU_WIDTH > window.innerWidth - MENU_MARGIN) {
    left = window.innerWidth - MENU_WIDTH - MENU_MARGIN;
  }
  if (left < MENU_MARGIN) {
    left = MENU_MARGIN;
  }
  if (top < MENU_MARGIN) {
    top = MENU_MARGIN;
  }

  return { top, left };
}

function ActionMenuPortal({ tile, buttonRect, onEdit, onClear, onColor, onIcon, onReminder, onClose, themeStyle, labels }: ActionMenuPortalProps) {
  const { top, left } = getMenuPosition(buttonRect);
  const style = {
    position: "fixed" as const,
    top,
    left,
    zIndex: 45,
  };

  return ReactDOM.createPortal(
    <div style={{ ...style, ...themeStyle }} className="bookmarks-action-menu" data-bookmarks-menu>
      <button
        id={`edit-button-${tile.id}`}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onEdit();
          onClose();
        }}
      >
        <Settings className="w-3.5 h-3.5" />
        <span>{labels.edit}</span>
      </button>
      <button
        id={`clear-button-${tile.id}`}
        type="button"
        className="danger"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClear();
          onClose();
        }}
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>{labels.clear}</span>
      </button>
      <button
        id={`color-button-${tile.id}`}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onColor();
        }}
      >
        <Palette className="w-3.5 h-3.5" />
        <span>{labels.color}</span>
      </button>
      {(tile.type === "bookmark" || tile.type === "folder") && onReminder && (
        <button
          id={`reminder-button-${tile.id}`}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onReminder();
            onClose();
          }}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>{labels.reminder}</span>
        </button>
      )}
      {tile.type === "folder" && onIcon && (
        <button
          id={`icon-button-${tile.id}`}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onIcon();
          }}
        >
          <Smile className="w-3.5 h-3.5" />
          <span>{labels.icon}</span>
        </button>
      )}
    </div>,
    document.body
  );
}

// --- Main Bookmarks Component ---
export function Bookmarks() {
  const { tileNumber, textColor, backgroundColor } = useCalendar();
  const { t } = useI18n();
  const { addReminder, reminders } = useReminders();

  const tileHasReminder = useCallback(
    (tile: TileConfig) =>
      reminders.some(
        (r) =>
          !r.completedAt &&
          !r.dismissedAt &&
          (r.bookmarkId === tile.id ||
            r.bookmarkId === tile.nodeId ||
            (Boolean(tile.url) && r.bookmarkUrl === tile.url)),
      ),
    [reminders],
  );

  const themeCssVars = useMemo(() => buildThemeCssVars(textColor, backgroundColor), [textColor, backgroundColor]);

  const menuLabels = useMemo(
    () => ({
      edit: t("bookmarks.edit"),
      clear: t("bookmarks.clear"),
      color: t("bookmarks.color"),
      icon: t("bookmarks.icon"),
      reminder: t("bookmarks.reminder.setReminder"),
    }),
    [t]
  );

  const groupLabel = useCallback(
    (title: string) => {
      if (title === "Folders") return t("bookmarks.folders");
      if (title === "Bookmarks") return t("bookmarks.bookmarksGroup");
      return title;
    },
    [t]
  );

  // --- State ---
  const [bookmarks, setBookmarks] = useState<BookmarkNode[]>([]);
  const [tiles, setTiles] = useState<(TileConfig | null)[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [currentFolder, setCurrentFolder] = useState<BookmarkNode | null>(null);
  const [activeFolderContent, setActiveFolderContent] = useState<BookmarkNode | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [folderHistory, setFolderHistory] = useState<BookmarkNode[]>([]);
  const [menuButtonRect, setMenuButtonRect] = useState<DOMRect | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [folderSearchTerm, setFolderSearchTerm] = useState<string>(""); // New state for folder panel search
  const [isSearchingBookmarks, setIsSearchingBookmarks] = useState(false);
  const [searchField, setSearchField] = useState<SearchField>("all");
  const [groupingType, setGroupingTypeState] = useState<GroupingType>("none");
  const [sortType, setSortTypeState] = useState<SortType>("default");
  const [searchRecursive, setSearchRecursiveState] = useState(false);
  const [openSelectId, setOpenSelectId] = useState<string | null>(null);
  const [reminderTile, setReminderTile] = useState<TileConfig | null>(null);
  const [isReminderManagerOpen, setIsReminderManagerOpen] = useState(false);

  const [selectedTileColor, setSelectedTileColor] = useState<string>("rgba(0, 0, 0, 0.6)"); // State for color
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [tileIndexForColor, setTileIndexForColor] = useState<number | null>(null);

  // Add state for emoji picker
  const [, setSelectedTileIcon] = useState<string>("📁"); // Default folder emoji
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [tileIndexForIcon, setTileIndexForIcon] = useState<number | null>(null);

  // --- Refs ---
  const selectorRef = useRef<HTMLDivElement>(null);
  const folderContentRef = useRef<HTMLDivElement>(null);
  const tileGridRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sortableRef = useRef<Sortable | null>(null);
  const menuButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Custom setters that also save to localStorage
  const setGroupingType = (type: GroupingType) => {
    setGroupingTypeState(type);
    localStorage.setItem("typeofBookmarkForm", type);
    scheduleSyncPush();
  };

  const setSortType = (type: SortType) => {
    setSortTypeState(type);
    localStorage.setItem("bookmarkSortType", type);
    scheduleSyncPush();
  };

  const setSearchRecursive = (recursive: boolean) => {
    setSearchRecursiveState(recursive);
    localStorage.setItem("bookmarkSearchRecursive", recursive ? "1" : "0");
    scheduleSyncPush();
  };

  // Close bookmark popups when settings opens so they don't block the modal
  useEffect(() => {
    const closeAll = () => {
      setIsSelecting(false);
      setSelectedTileIndex(null);
      setCurrentFolder(null);
      setActiveFolderContent(null);
      setOpenMenuId(null);
      setIsColorPickerOpen(false);
      setIsEmojiPickerOpen(false);
      setIsSearchingBookmarks(false);
      setSearchTerm("");
      setFolderSearchTerm("");
      setSearchField("all");
    };

    window.addEventListener("nexx:settings-open", closeAll);
    return () => window.removeEventListener("nexx:settings-open", closeAll);
  }, []);

  // --- Data Loading ---
  // Load initial data (bookmarks and tiles)
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all tiles from database
        const storedTiles = await bookmarkDB.getAllItems<TileConfig>();

        // Sort tiles by position
        const sortedTiles = storedTiles.sort((a, b) => a.position - b.position);

        // Initialize tile array with the right length
        const initialTiles: (TileConfig | null)[] = Array(tileNumber).fill(null);

        // Fill in the tiles at their positions
        sortedTiles.forEach((tile) => {
          if (tile.position < tileNumber) {
            initialTiles[tile.position] = tile;
          }
        });

        setTiles(initialTiles);

        const bookmarkUrls = sortedTiles
          .filter((tile) => tile.type === "bookmark" && tile.url)
          .map((tile) => tile.url as string);
        void prefetchFaviconsForUrls(bookmarkUrls, 32);

        // Get bookmark data from Chrome
        chrome.bookmarks.getTree((bookmarkNodes) => {
          const transformedNodes = bookmarkNodes[0].children?.map(transformBookmarkNode) || [];
          setBookmarks(transformedNodes);
        });

        // Load grouping / sort preferences from localStorage
        try {
          const savedGroupingType = localStorage.getItem("typeofBookmarkForm");
          if (savedGroupingType === "none" || savedGroupingType === "alphabetical" || savedGroupingType === "type") {
            setGroupingTypeState(savedGroupingType);
          }

          const savedSortType = localStorage.getItem("bookmarkSortType");
          if (
            savedSortType === "default" ||
            savedSortType === "name-asc" ||
            savedSortType === "name-desc" ||
            savedSortType === "type"
          ) {
            setSortTypeState(savedSortType);
          }

          const savedSearchRecursive = localStorage.getItem("bookmarkSearchRecursive");
          if (savedSearchRecursive !== null) {
            setSearchRecursiveState(savedSearchRecursive === "1");
          }
        } catch (error) {
          console.error("Error loading bookmark view preferences from localStorage:", error);
        }
      } catch (error) {
        console.error("Error loading tile data:", error);
      }
    };

    loadData();
  }, [tileNumber]);

  // Ensure menuButtonRefs array has the correct length based on tileNumber
  useEffect(() => {
    // Reset the refs array with the right length when tileNumber changes
    menuButtonRefs.current = Array(tileNumber).fill(null);
  }, [tileNumber]);

  // Handle clicks outside the selector and folder content to close them.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if ((isSelecting || isSearchingBookmarks) && selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        if (isSelecting) {
          setIsSelecting(false);
          setSelectedTileIndex(null);
          setCurrentFolder(null);
          setFolderHistory([]);
          setSearchTerm("");
        } else {
          setIsSearchingBookmarks(false);
          setCurrentFolder(null);
          setFolderHistory([]);
          setSearchTerm("");
          setSearchField("all");
        }
      }
      if (activeFolderContent && folderContentRef.current && !folderContentRef.current.contains(event.target as Node)) {
        setActiveFolderContent(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSelecting, isSearchingBookmarks, activeFolderContent]);

  // Handle clicks outside the action menu to close it.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && !(event.target as Element).closest("[data-bookmarks-menu]")) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  const handleSortEndCallback = useMemo(
    () =>
      throttle(async () => {
        if (!tileGridRef.current) {
          return;
        }

        const tileElements = Array.from(tileGridRef.current.children);
        const newTiles: (TileConfig | null)[] = [];

        for (const tileElement of tileElements) {
          const indexStr = tileElement.getAttribute("data-tile-index");
          if (indexStr) {
            const index = parseInt(indexStr, 10);
            const existingTile = tiles[index];
            newTiles.push(existingTile);
          } else {
            console.error("Tile element missing data-tile-index attribute");
            newTiles.push(null);
          }
        }

        while (newTiles.length < tileNumber) {
          newTiles.push(null);
        }

        // Update positions and save to database
        const updatedTiles = newTiles.map((tile, index) => (tile ? { ...tile, position: index } : null));

        // Save each tile with its new position
        for (let i = 0; i < updatedTiles.length; i++) {
          const tile = updatedTiles[i];
          if (tile) {
            await bookmarkDB.saveItem(tile);
          }
        }

        setTiles(updatedTiles);
        scheduleSyncPush();
      }, 200),
    [tiles, tileNumber]
  );

  useEffect(() => {
    if (tileGridRef.current) {
      sortableRef.current = new Sortable(tileGridRef.current, {
        animation: 150,
        onEnd: handleSortEndCallback,
      });
    }

    return () => {
      sortableRef.current?.destroy();
      sortableRef.current = null;
    };
  }, [handleSortEndCallback]);

  useEffect(() => {
    if (isSearchingBookmarks) {
      searchInputRef.current?.focus();
    }
  }, [isSearchingBookmarks]);

  // --- Tile Interaction Functions ---
  const openSelector = (index: number) => {
    setIsSearchingBookmarks(false);
    setSelectedTileIndex(index);
    setIsSelecting(true);
    setCurrentFolder(null);
    setFolderHistory([]);
    setSearchTerm("");
  };

  const openBookmarkSearch = () => {
    setIsSelecting(false);
    setSelectedTileIndex(null);
    setActiveFolderContent(null);
    setCurrentFolder(null);
    setFolderHistory([]);
    setSearchTerm("");
    setIsSearchingBookmarks(true);
  };

  const closeBookmarkSearch = () => {
    setIsSearchingBookmarks(false);
    setCurrentFolder(null);
    setFolderHistory([]);
    setSearchTerm("");
    setSearchField("all");
  };

  const openBookmarkUrl = (url: string, e?: React.MouseEvent) => {
    if (e?.ctrlKey) {
      window.open(url, "_blank");
    } else {
      window.location.href = url;
    }
  };

  const selectNode = async (node: BookmarkNode) => {
    if (selectedTileIndex === null) return;

    const newTile = {
      id: crypto.randomUUID(),
      type: node.children ? "folder" : "bookmark",
      nodeId: node.id,
      title: node.title,
      url: node.url,
      tileColor: node.tileColor || "rgba(0, 0, 0, 0.6)",
      tileIcon: node.tileIcon || (node.children ? "📁" : "default"),
      position: selectedTileIndex,
      createdAt: Date.now(),
    };

    await updateTile(newTile);
  };

  const updateTile = async (tile: TileConfig, color?: string, icon?: string) => {
    if (selectedTileIndex === null && tileIndexForColor === null && tileIndexForIcon === null) return;

    const indexToUpdate = selectedTileIndex !== null ? selectedTileIndex : tileIndexForColor !== null ? tileIndexForColor : tileIndexForIcon;

    if (indexToUpdate === null) return;

    // Create an updated tile with new properties if provided
    const updatedTile = {
      ...tile,
      ...(color ? { tileColor: color } : {}),
      ...(icon ? { tileIcon: icon } : {}),
    };

    // Save to database directly like in Notes.tsx
    await bookmarkDB.saveItem(updatedTile);

    if (updatedTile.type === "bookmark" && updatedTile.url) {
      void cacheFaviconForUrl(updatedTile.url, 32);
    }

    // Update state with new tile
    setTiles((prevTiles) => {
      const newTiles = [...prevTiles];
      newTiles[indexToUpdate] = updatedTile;
      return newTiles;
    });

    // Reset UI states
    setIsSelecting(false);
    setSelectedTileIndex(null);
    setIsColorPickerOpen(false);
    setTileIndexForColor(null);
    setIsEmojiPickerOpen(false);
    setTileIndexForIcon(null);
    scheduleSyncPush();
  };

  const clearTile = async (index: number) => {
    const tileToClear = tiles[index];
    if (!tileToClear) return;

    // Delete from database
    await bookmarkDB.deleteItem(tileToClear.id);

    // Update state
    setTiles((prevTiles) => {
      const newTiles = [...prevTiles];
      newTiles[index] = null;
      return newTiles;
    });
    scheduleSyncPush();
  };

  const handleColorClick = (index: number) => {
    setTileIndexForColor(index);
    const tile = tiles[index];
    // Set initial color
    setSelectedTileColor(tile?.tileColor || "#f0f0f0");
    setIsColorPickerOpen(true);
    setOpenMenuId(null);
  };

  const handleColorChange = (color: string) => {
    setSelectedTileColor(color);
  };

  const handleColorConfirm = () => {
    if (tileIndexForColor === null) return;

    const currentTile = tiles[tileIndexForColor];
    if (!currentTile) return;

    updateTile(currentTile, selectedTileColor);
  };

  // Icon picker handlers
  const handleIconClick = (index: number) => {
    setTileIndexForIcon(index);
    const tile = tiles[index];
    // Check if tile exists and has a non-default icon
    let initialIcon = "📁"; // Default emoji
    if (tile && tile.tileIcon && tile.tileIcon !== "default") {
      initialIcon = tile.tileIcon;
    }
    setSelectedTileIcon(initialIcon);
    setIsEmojiPickerOpen(true);
    setOpenMenuId(null);
  };

  // Handler for when an emoji is selected in emoji-mart
  const handleEmojiSelect = (emojiData: { native: string }) => {
    if (tileIndexForIcon === null) return;

    const currentTile = tiles[tileIndexForIcon];
    if (!currentTile) return;

    updateTile(currentTile, undefined, emojiData.native); // Update tile with native emoji
    handleEmojiPickerClose(); // Close the picker after selection
  };

  const handleEmojiPickerClose = () => {
    setIsEmojiPickerOpen(false);
    setTileIndexForIcon(null);
  };

  // --- Navigation Functions ---
  const navigateToFolder = (folderId: string) => {
    chrome.bookmarks.getSubTree(folderId, (nodes) => {
      if (nodes[0]) {
        const transformedNode = transformBookmarkNode(nodes[0]);
        if (isSelecting || isSearchingBookmarks) {
          if (currentFolder) {
            setFolderHistory((prev) => [...prev, currentFolder]);
          }
          setCurrentFolder(transformedNode);
          setSearchTerm("");
        } else {
          if (activeFolderContent) {
            setFolderHistory((prev) => [...prev, activeFolderContent]);
          }
          setActiveFolderContent(transformedNode);
        }
      }
    });
  };

  const navigateBack = () => {
    if (isSelecting || isSearchingBookmarks) {
      if (folderHistory.length > 0) {
        const previousFolder = folderHistory[folderHistory.length - 1];
        setFolderHistory((prev) => prev.slice(0, prev.length - 1));
        setCurrentFolder(previousFolder);
        setSearchTerm(""); // Clear search term when navigating back
      } else {
        setCurrentFolder(null);
        setSearchTerm(""); // Clear search term when exiting folder
      }
    } else {
      if (folderHistory.length > 0) {
        const previousFolder = folderHistory[folderHistory.length - 1];
        setFolderHistory((prev) => prev.slice(0, prev.length - 1));
        setActiveFolderContent(previousFolder);
        setFolderSearchTerm(""); // Clear folder search term when navigating back
      } else {
        setActiveFolderContent(null);
        setFolderSearchTerm(""); // Clear folder search term when exiting folder
      }
    }
  };

  const navigateToBreadcrumb = (index: number) => {
    if (index === 0) {
      setFolderHistory([]);
      if (isSelecting || isSearchingBookmarks) {
        setCurrentFolder(null);
        setSearchTerm("");
      } else {
        setActiveFolderContent(null);
        setFolderSearchTerm("");
      }
      return;
    }

    const historyIndex = index - 1;
    if (historyIndex >= folderHistory.length) return;

    const targetFolder = folderHistory[historyIndex];
    const newHistory = folderHistory.slice(0, historyIndex);

    if (isSelecting || isSearchingBookmarks) {
      setFolderHistory(newHistory);
      setCurrentFolder(targetFolder);
      setSearchTerm("");
    } else {
      setFolderHistory(newHistory);
      setActiveFolderContent(targetFolder);
      setFolderSearchTerm("");
    }
  };

  const renderFolderBreadcrumb = (current: BookmarkNode | null) => {
    const rootLabel = t("bookmarks.root");
    const items: { id: string; title: string; isCurrent: boolean }[] = current
      ? [
          { id: "root", title: rootLabel, isCurrent: false },
          ...folderHistory.map((folder) => ({ id: folder.id, title: folder.title, isCurrent: false })),
          { id: current.id, title: current.title, isCurrent: true },
        ]
      : [{ id: "root", title: rootLabel, isCurrent: true }];

    return (
      <nav className="bookmarks-breadcrumb" aria-label={t("bookmarks.path")}>
        {items.map((item, index) => (
          <Fragment key={`${item.id}-${index}`}>
            {index > 0 && <span className="bookmarks-breadcrumb__sep" aria-hidden>/</span>}
            {item.isCurrent ? (
              <span className="bookmarks-breadcrumb__current" title={item.title}>
                {item.title}
              </span>
            ) : (
              <button
                type="button"
                className="bookmarks-breadcrumb__link"
                title={item.title}
                onClick={() => navigateToBreadcrumb(index)}
              >
                {item.title}
              </button>
            )}
          </Fragment>
        ))}
      </nav>
    );
  };

  const closeSelector = () => {
    setIsSelecting(false);
    setSelectedTileIndex(null);
    setCurrentFolder(null);
    setFolderHistory([]);
    setSearchTerm("");
    setFolderSearchTerm("");
    // Don't reset groupingType as it should persist
  };

  // Add a helper function to filter nodes based on search term
  const filterNodesBySearch = (
    nodes: BookmarkNode[],
    term: string,
    recursive = false,
    field: SearchField = "all"
  ): BookmarkNode[] => {
    if (!term) return nodes;
    if (recursive) return searchNodesRecursive(nodes, term, field);

    return nodes.filter((node) => nodeMatchesSearch(node, term, field));
  };

  const sortNodes = (nodes: BookmarkNode[], sort: SortType): BookmarkNode[] => {
    if (sort === "default") return [...nodes];

    if (sort === "type") {
      return [...nodes].sort((a, b) => {
        const aIsFolder = Boolean(a.children);
        const bIsFolder = Boolean(b.children);
        if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1;
        return a.title.localeCompare(b.title);
      });
    }

    const sorted = [...nodes].sort((a, b) => a.title.localeCompare(b.title));
    return sort === "name-desc" ? sorted.reverse() : sorted;
  };

  const getGroupedNodes = (
    nodes: BookmarkNode[],
    groupType: GroupingType,
    sort: SortType = sortType
  ): GroupedData[] | BookmarkNode[] => {
    if (!nodes || nodes.length === 0) return [];

    const ordered = sortNodes(nodes, sort);

    if (groupType === "none") return ordered;

    if (groupType === "alphabetical") {
      const groups: Record<string, BookmarkNode[]> = {};

      ordered.forEach((node) => {
        const firstLetter = node.title.charAt(0).toUpperCase() || "#";
        if (!groups[firstLetter]) {
          groups[firstLetter] = [];
        }
        groups[firstLetter].push(node);
      });

      return Object.entries(groups).map(([letter, groupNodes]) => ({
        title: letter,
        nodes: groupNodes,
      }));
    }

    if (groupType === "type") {
      const folders: BookmarkNode[] = [];
      const bookmarkItems: BookmarkNode[] = [];

      ordered.forEach((node) => {
        if (node.children) {
          folders.push(node);
        } else {
          bookmarkItems.push(node);
        }
      });

      const result: GroupedData[] = [];

      if (folders.length > 0) {
        result.push({
          title: "Folders",
          nodes: folders,
        });
      }

      if (bookmarkItems.length > 0) {
        result.push({
          title: "Bookmarks",
          nodes: bookmarkItems,
        });
      }

      return result;
    }

    return ordered;
  };

  const renderOrganizeSelects = () => (
    <div className="bookmarks-organize-selects">
      {renderThemedSelect("groupBy", t("bookmarks.groupBy"), groupingType, [
        { value: "none", label: t("bookmarks.groupNone") },
        { value: "alphabetical", label: t("bookmarks.groupAz") },
        { value: "type", label: t("bookmarks.groupType") },
      ], setGroupingType)}
      {renderThemedSelect("sortBy", t("bookmarks.sortBy"), sortType, [
        { value: "default", label: t("bookmarks.sortDefault") },
        { value: "name-asc", label: t("bookmarks.sortNameAsc") },
        { value: "name-desc", label: t("bookmarks.sortNameDesc") },
        { value: "type", label: t("bookmarks.sortType") },
      ], setSortType)}
    </div>
  );

  type ThemedSelectOption<T extends string> = { value: T; label: string };

  const renderThemedSelect = <T extends string>(
    id: string,
    label: string,
    value: T,
    options: ThemedSelectOption<T>[],
    onChange: (next: T) => void
  ) => {
    const isOpen = openSelectId === id;
    const selectedLabel = options.find((option) => option.value === value)?.label ?? value;

    return (
      <div className="bookmarks-select">
        <span className="bookmarks-select__label" id={`${id}-label`}>
          {label}
        </span>
        <div className="bookmarks-select__control">
          <button
            type="button"
            className={`bookmarks-select__btn${isOpen ? " is-open" : ""}`}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-labelledby={`${id}-label`}
            onClick={() => setOpenSelectId(isOpen ? null : id)}
          >
            <span className="bookmarks-select__value">{selectedLabel}</span>
            <ChevronDown size={14} className="bookmarks-select__chevron" aria-hidden />
          </button>
          {isOpen && (
            <ul className="bookmarks-select__menu" role="listbox" aria-labelledby={`${id}-label`}>
              {options.map((option) => {
                const selected = option.value === value;
                return (
                  <li key={option.value} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      className={`bookmarks-select__option${selected ? " is-selected" : ""}`}
                      onClick={() => {
                        onChange(option.value);
                        setOpenSelectId(null);
                      }}
                    >
                      {option.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    );
  };

  // Add a type guard function to check if data is grouped
  const isGroupedData = (data: unknown[]): data is GroupedData[] => {
    return data.length > 0 && typeof data[0] === "object" && data[0] !== null && "title" in data[0] && "nodes" in data[0];
  };

  // Add a function to filter folder content by search term
  const filterFolderContentBySearch = (nodes: BookmarkNode[] | undefined, term: string, recursive = false): BookmarkNode[] => {
    if (!nodes) return [];
    return filterNodesBySearch(nodes, term, recursive);
  };

  const renderRecursiveSearchOption = () => (
    <label className="bookmarks-recursive-search">
      <input
        type="checkbox"
        checked={searchRecursive}
        onChange={(e) => setSearchRecursive(e.target.checked)}
      />
      <span>{t("bookmarks.searchRecursive")}</span>
    </label>
  );

  useEffect(() => {
    if (!openSelectId) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest(".bookmarks-select")) {
        setOpenSelectId(null);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenSelectId(null);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openSelectId]);

  // Add a scroll padding utility function to handle scrolling behavior
  useEffect(() => {
    // Apply scroll padding when the selector or folder content is open
    const applyScrollPadding = () => {
      if ((isSelecting || isSearchingBookmarks) && selectorRef.current) {
        const searchControls = selectorRef.current.querySelector(".search-controls");
        if (searchControls) {
          const height = searchControls.getBoundingClientRect().height;
          document.documentElement.style.setProperty("--scroll-padding-top", `${height + 16}px`);
        }
      } else if (activeFolderContent && folderContentRef.current) {
        const folderControls = folderContentRef.current.querySelector(".search-controls");
        if (folderControls) {
          const height = folderControls.getBoundingClientRect().height;
          document.documentElement.style.setProperty("--scroll-padding-top", `${height + 16}px`);
        }
      } else {
        document.documentElement.style.setProperty("--scroll-padding-top", "0px");
      }
    };

    applyScrollPadding();
    window.addEventListener("resize", applyScrollPadding);

    return () => {
      window.removeEventListener("resize", applyScrollPadding);
      document.documentElement.style.setProperty("--scroll-padding-top", "0px");
    };
  }, [isSelecting, isSearchingBookmarks, activeFolderContent]);

  // --- Rendering Functions ---
  const handlePickerNodeClick = (node: BookmarkNode, e: React.MouseEvent) => {
    e.preventDefault();
    if (node.children) {
      navigateToFolder(node.id);
      return;
    }
    if (isSearchingBookmarks && node.url) {
      openBookmarkUrl(node.url, e);
      return;
    }
    selectNode(node);
  };

  const renderPickerNode = (node: BookmarkNode) => (
    <a
      key={node.id}
      href={node.url || "#"}
      onClick={(e) => handlePickerNodeClick(node, e)}
      className="bookmark-selector-item"
      style={{ textDecoration: "none" }}
      title={node.url || node.title}
    >
      {node.children ? (
        node.tileIcon && node.tileIcon !== "default" ? (
          <span className="text-3xl sm:text-4xl mb-1">{node.tileIcon}</span>
        ) : (
          <Folder className="w-8 h-8 sm:w-10 sm:h-10 mb-1" />
        )
      ) : (
        <BookmarkFavicon url={node.url} size={16} className="w-6 h-6 mb-1" />
      )}
      <span className="bookmark-tile__title text-xs sm:text-sm" title={node.title}>
        {truncateTitle(node.title)}
      </span>
      {isSearchingBookmarks && !node.children && node.url && (
        <span className="bookmark-tile__domain">{getHostname(node.url)}</span>
      )}
    </a>
  );

  const renderSelector = () => {
    const hasSearchTerm = searchTerm.trim().length > 0;
    // When searching, always scan the full bookmark tree so every match is listed
    const nodes =
      isSearchingBookmarks && hasSearchTerm ? bookmarks : currentFolder?.children || bookmarks;
    const useRecursive = isSearchingBookmarks || searchRecursive;
    const activeSearchField = isSearchingBookmarks ? searchField : "all";
    const filteredNodes = filterNodesBySearch(nodes || [], searchTerm, useRecursive, activeSearchField);

    const groupedData = getGroupedNodes(filteredNodes, groupingType, sortType);

    // Use type guard to safely check if data is grouped
    const isGrouped = Array.isArray(groupedData) && groupedData.length > 0 && isGroupedData(groupedData);
    const closeModal = isSearchingBookmarks ? closeBookmarkSearch : closeSelector;
    const modalTitle = currentFolder
      ? currentFolder.title
      : isSearchingBookmarks
        ? t("bookmarks.searchTitle")
        : t("bookmarks.select");

    const searchPlaceholder =
      !isSearchingBookmarks
        ? t("bookmarks.search")
        : searchField === "name"
          ? t("bookmarks.searchByName")
          : searchField === "address"
            ? t("bookmarks.searchByAddress")
            : t("bookmarks.searchTiles");

    return (
      <div className="bookmarks-overlay">
        <div ref={selectorRef} className="bookmarks-modal bookmarks-modal--large" style={themeCssVars}>
          <div className="bookmarks-toolbar">
            <button type="button" onClick={currentFolder ? navigateBack : closeModal} className="bookmarks-btn">
              <ChevronLeft className="w-3.5 h-3.5" />
              {currentFolder ? t("bookmarks.back") : t("bookmarks.cancel")}
            </button>
            <h3 className="text-base font-medium flex-grow text-center">{modalTitle}</h3>
            {isSelecting && currentFolder && (
              <button
                type="button"
                onClick={() =>
                  updateTile({
                    id: crypto.randomUUID(),
                    type: "folder",
                    nodeId: currentFolder.id,
                    title: currentFolder.title,
                    tileColor: "rgba(0, 0, 0, 0.6)",
                    tileIcon: "📁",
                    position: selectedTileIndex !== null ? selectedTileIndex : 0,
                    createdAt: Date.now(),
                  })
                }
                className="bookmarks-btn bookmarks-btn--primary"
              >
                {t("bookmarks.confirm")}
              </button>
            )}
          </div>

          {renderFolderBreadcrumb(currentFolder)}

          <div className="bookmarks-search-panel search-controls">
            <div className="bookmarks-search-row">
              {renderOrganizeSelects()}
              {isSearchingBookmarks &&
                renderThemedSelect("searchIn", t("bookmarks.searchIn"), searchField, [
                  { value: "all", label: t("bookmarks.searchFieldAll") },
                  { value: "name", label: t("bookmarks.searchFieldName") },
                  { value: "address", label: t("bookmarks.searchFieldAddress") },
                ], setSearchField)}
              <div className="relative bookmarks-search-field">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                  <Search className="w-4 h-4 opacity-60" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bookmarks-input"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute inset-y-0 end-0 flex items-center pe-3 opacity-70 hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {!isSearchingBookmarks && renderRecursiveSearchOption()}
          </div>

          <div className="bookmarks-scroll-area">
            {!isGrouped ? (
              <div className="bookmarks-picker-grid">
                {filteredNodes.length > 0 ? (
                  filteredNodes.map((node) => renderPickerNode(node))
                ) : (
                  <div className="bookmarks-empty col-span-full">{t("bookmarks.emptySearch")}</div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {isGroupedData(groupedData) &&
                  groupedData.map((group) => (
                    <div key={group.title} className="space-y-1">
                      <div className="bookmarks-group-header">
                        {group.title === "Folders" ? (
                          <Folder className="w-4 h-4" />
                        ) : group.title === "Bookmarks" ? (
                          <List className="w-4 h-4" />
                        ) : (
                          <span className="w-4 h-4 inline-block text-center">{group.title.charAt(0)}</span>
                        )}
                        <span>{groupLabel(group.title)}</span>
                        <span className="text-xs opacity-60">({group.nodes.length})</span>
                      </div>
                      <div className="bookmarks-picker-grid">
                        {group.nodes?.map((node) => renderPickerNode(node))}
                      </div>
                    </div>
                  ))}
                {isGroupedData(groupedData) && groupedData.length === 0 && (
                  <div className="bookmarks-empty">{t("bookmarks.emptySearch")}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFolderContent = () => {
    if (!activeFolderContent) return null;

    const filteredFolderContent = filterFolderContentBySearch(activeFolderContent.children || [], folderSearchTerm, searchRecursive);
    const groupedData = getGroupedNodes(filteredFolderContent, groupingType, sortType);

    // Use the type guard for safer type checking
    const isGrouped = Array.isArray(groupedData) && groupedData.length > 0 && isGroupedData(groupedData);

    return (
      <div className="bookmarks-overlay">
        <div ref={folderContentRef} className="bookmarks-modal bookmarks-modal--large" style={themeCssVars}>
          <div className="bookmarks-toolbar">
            <button type="button" onClick={navigateBack} className="bookmarks-btn">
              <ChevronLeft className="w-3.5 h-3.5" />
              {t("bookmarks.back")}
            </button>
            <h3 className="text-base font-medium flex-grow text-center">{activeFolderContent.title}</h3>
            <span className="w-16" aria-hidden />
          </div>

          {renderFolderBreadcrumb(activeFolderContent)}

          <div className="bookmarks-search-panel search-controls">
            <div className="bookmarks-search-row">
              {renderOrganizeSelects()}
              <div className="relative bookmarks-search-field">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                  <Search className="w-4 h-4 opacity-60" />
                </div>
                <input
                  type="text"
                  placeholder={t("bookmarks.searchFolder")}
                  value={folderSearchTerm}
                  onChange={(e) => setFolderSearchTerm(e.target.value)}
                  className="bookmarks-input"
                />
                {folderSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setFolderSearchTerm("")}
                    className="absolute inset-y-0 end-0 flex items-center pe-3 opacity-70 hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {renderRecursiveSearchOption()}
          </div>

          <div className="bookmarks-scroll-area">
              {!isGrouped ? (
                // Render regular grid when not grouped
                <div className="bookmarks-picker-grid">
                  {filteredFolderContent.length > 0 ? (
                    filteredFolderContent.map((node) => (
                      <a
                        key={node.id}
                        href={node.url || "#"}
                        onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                          event.preventDefault(); // Prevent default only for left click
                          if (node.children) {
                            navigateToFolder(node.id);
                          } else {
                            if (event.ctrlKey) {
                              window.open(node.url || "", "_blank");
                            } else {
                              window.location.href = node.url || "";
                            }
                          }
                        }}
                        className="bookmark-selector-item"
                        style={{ textDecoration: "none" }}
                      >
                        {node.children ? (
                          node.tileIcon && node.tileIcon !== "default" ? (
                            <span className="text-3xl sm:text-4xl mb-1">{node.tileIcon}</span>
                          ) : (
                            <Folder className="w-8 h-8 sm:w-10 sm:h-10 mb-1" />
                          )
                        ) : (
                          <BookmarkFavicon url={node.url} size={16} className="w-6 h-6 sm:w-8 sm:h-8 mb-1" />
                        )}
                        <span className="bookmark-tile__title text-xs" title={node.title}>
                          {truncateTitle(node.title)}
                        </span>
                      </a>
                    ))
                  ) : (
                    <div className="bookmarks-empty col-span-full">{t("bookmarks.emptySearch")}</div>
                  )}
                </div>
              ) : (
                // Render grouped content with headers
                <div className="space-y-4">
                  {isGroupedData(groupedData) &&
                    groupedData.map((group) => (
                      <div key={group.title} className="space-y-1">
                        {/* Group header - No longer sticky, scrolls with content */}
                        <div className="bookmarks-group-header">
                          {group.title === "Folders" ? (
                            <Folder className="w-4 h-4" />
                          ) : group.title === "Bookmarks" ? (
                            <List className="w-4 h-4" />
                          ) : (
                            <span className="w-4 h-4 inline-block text-center">{group.title.charAt(0)}</span>
                          )}
                          <span>{groupLabel(group.title)}</span>
                          <span className="text-xs opacity-60">({group.nodes.length})</span>
                        </div>
                        {/* Group items */}
                        <div className="bookmarks-picker-grid">
                          {group.nodes &&
                            group.nodes.map((node) => (
                              <a
                                key={node.id}
                                href={node.url || "#"}
                                onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                                  event.preventDefault(); // Prevent default only for left click
                                  if (node.children) {
                                    navigateToFolder(node.id);
                                  } else {
                                    if (event.ctrlKey) {
                                      window.open(node.url || "", "_blank");
                                    } else {
                                      window.location.href = node.url || "";
                                    }
                                  }
                                }}
                                className="bookmark-selector-item"
                                style={{ textDecoration: "none" }}
                              >
                                {node.children ? (
                                  node.tileIcon && node.tileIcon !== "default" ? (
                                    <span className="text-3xl sm:text-4xl mb-1">{node.tileIcon}</span>
                                  ) : (
                                    <Folder className="w-8 h-8 sm:w-10 sm:h-10 mb-1" />
                                  )
                                ) : (
                                  <BookmarkFavicon url={node.url} size={16} className="w-6 h-6 sm:w-8 sm:h-8 mb-1" />
                                )}
                                <span className="bookmark-tile__title text-xs" title={node.title}>
                                  {truncateTitle(node.title)}
                                </span>
                              </a>
                            ))}
                        </div>
                      </div>
                    ))}
                  {isGroupedData(groupedData) && groupedData.length === 0 && (
                    <div className="bookmarks-empty">{t("bookmarks.emptySearch")}</div>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>
    );
  };

  const renderTileMenu = (tile: TileConfig, index: number, onEdit: () => void, onClear: () => void) => (
    <>
      <button
        type="button"
        ref={(el) => (menuButtonRefs.current[index] = el)}
        id={`menu-button-${tile.id}`}
        data-bookmarks-menu
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const currentButtonRef = menuButtonRefs.current[index];
          if (currentButtonRef) {
            setMenuButtonRect(currentButtonRef.getBoundingClientRect());
          }
          setOpenMenuId(openMenuId === tile.id ? null : tile.id);
        }}
        className="bookmark-tile__menu"
        title={t("bookmarks.menu")}
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>
      {openMenuId === tile.id && menuButtonRect && (
        <ActionMenuPortal
          tile={tile}
          index={index}
          buttonRect={menuButtonRect}
          onEdit={onEdit}
          onClear={onClear}
          onColor={() => handleColorClick(index)}
          onIcon={() => handleIconClick(index)}
          onReminder={() => setReminderTile(tile)}
          onClose={() => setOpenMenuId(null)}
          themeStyle={themeCssVars}
          labels={menuLabels}
        />
      )}
    </>
  );

  const renderTile = (tile: TileConfig | null, index: number) => {
    if (!tile) {
      return (
        <div
          id={`tile-empty-${index}`}
          className="bookmark-tile bookmark-tile--empty tile-handle"
          key={`tile-empty-${index}`}
          data-tile-index={index}
          onClick={() => openSelector(index)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openSelector(index);
            }
          }}
        >
          <Plus className="w-6 h-6 bookmark-tile__icon opacity-70" />
          <span className="bookmark-tile__add-label">{t("bookmarks.add")}</span>
        </div>
      );
    }

    const tileBackgroundColor = tile.tileColor || "rgba(0, 0, 0, 0.35)";
    const hostname = getHostname(tile.url);

    if (tile.type === "folder") {
      return (
        <div
          key={`folder-tile-${tile.nodeId}`}
          id={`folder-tile-${tile.nodeId}`}
          className="bookmark-tile tile-handle"
          style={{ backgroundColor: tileBackgroundColor }}
          data-tile-index={index}
          onClick={() => navigateToFolder(tile.nodeId)}
          title={tile.title}
        >
          {renderTileMenu(tile, index, () => openSelector(index), () => clearTile(index))}
          {tileHasReminder(tile) && (
            <span className="bookmark-tile__reminder-badge" title={t("bookmarks.reminder.hasReminder")}>
              <Bell className="w-3 h-3" />
            </span>
          )}
          {tile.tileIcon && tile.tileIcon !== "default" ? (
            <span className="text-2xl bookmark-tile__icon">{tile.tileIcon}</span>
          ) : (
            <Folder className="w-5 h-5 bookmark-tile__icon" />
          )}
          <span className="bookmark-tile__title">{truncateTitle(tile.title)}</span>
        </div>
      );
    }

    return (
      <div
        key={`bookmark-tile-${tile.nodeId}`}
        id={`bookmark-tile-${tile.nodeId}`}
        className="bookmark-tile tile-handle"
        style={{ backgroundColor: tileBackgroundColor }}
        data-tile-index={index}
        data-url={tile.url}
        title={tile.title}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
          e.preventDefault();
          const url = (e.currentTarget as HTMLDivElement).dataset.url;
          if (url) {
            if (e.ctrlKey) {
              window.open(url, "_blank");
            } else {
              window.location.href = url;
            }
          }
        }}
      >
        {renderTileMenu(tile, index, () => openSelector(index), () => clearTile(index))}
        <BookmarkFavicon url={tile.url} size={32} className="w-6 h-6 bookmark-tile__icon" />
        {tileHasReminder(tile) && (
          <span className="bookmark-tile__reminder-badge" title={t("bookmarks.reminder.hasReminder")}>
            <Bell className="w-3 h-3" />
          </span>
        )}
        <span className="bookmark-tile__title">{truncateTitle(tile.title)}</span>
        {hostname && <span className="bookmark-tile__domain">{hostname}</span>}
      </div>
    );
  };

  // --- Main Tile Grid Rendering ---
  return (
    <div className="bookmarks-root" style={{ ...themeCssVars, color: textColor }}>
      <div className="bookmarks-header">
        <div className="bookmarks-title-row">
          <h2 className="bookmarks-title">{t("bookmarks.title")}</h2>
          <div className="bookmarks-header-actions">
            <button
              type="button"
              className="bookmarks-search-toggle"
              onClick={() => setIsReminderManagerOpen(true)}
              aria-label={t("bookmarks.reminder.managerTitle")}
              title={t("bookmarks.reminder.managerTitle")}
            >
              <Bell className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              className={`bookmarks-search-toggle ${isSearchingBookmarks ? "bookmarks-search-toggle--active" : ""}`}
              onClick={openBookmarkSearch}
              aria-label={t("bookmarks.search")}
              aria-expanded={isSearchingBookmarks}
              title={t("bookmarks.search")}
            >
              <Search className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
        <p className="bookmarks-hint">{t("bookmarks.hint")}</p>
      </div>
      <div ref={tileGridRef} className="bookmarks-grid">
        {Array(tileNumber)
          .fill(null)
          .map((_, i) => renderTile(tiles[i], i))}
      </div>
      {(isSelecting || isSearchingBookmarks) && renderSelector()}
      {activeFolderContent && renderFolderContent()}
      {isColorPickerOpen && (
        <ColorPicker
          currentColor={selectedTileColor}
          onChange={handleColorChange}
          onConfirm={handleColorConfirm}
          onClose={() => {
            setIsColorPickerOpen(false);
            setTileIndexForColor(null);
          }}
          themeStyle={themeCssVars}
        />
      )}
      {isEmojiPickerOpen && (
        <div className="bookmarks-overlay">
          <div className="bookmarks-modal" style={{ ...themeCssVars, width: "auto", height: "auto" }}>
            <Picker data={data} onEmojiSelect={handleEmojiSelect} onClickOutside={handleEmojiPickerClose} theme="auto" />
          </div>
        </div>
      )}
      {reminderTile && (
        <BookmarkReminderModal
          bookmarkId={reminderTile.id}
          bookmarkTitle={reminderTile.title}
          bookmarkUrl={reminderTile.url}
          isFolder={reminderTile.type === "folder"}
          onSave={addReminder}
          onClose={() => setReminderTile(null)}
        />
      )}
      {isReminderManagerOpen && <ReminderManager onClose={() => setIsReminderManagerOpen(false)} />}
    </div>
  );
}
