import { useEffect, useState, useRef, useCallback, useMemo, Fragment, type CSSProperties } from "react";
import ReactDOM from "react-dom";
import createDatabase from "./IndexedDatabase/IndexedDatabase";
import { Folder, ChevronLeft, MoreHorizontal, Settings, Plus, Trash2, Palette, Search, X, SortDesc, List, Grid, Smile } from "lucide-react";
import Sortable from "sortablejs";
import { throttle } from "lodash";
import { useCalendar } from "./Settings";
import { buildThemeCssVars } from "./settings/themeUtils";
import { useI18n } from "../i18n/LanguageProvider";
import "./Bookmarks.css";
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
  onClose: () => void;
  themeStyle: CSSProperties;
  labels: { edit: string; clear: string; color: string; icon: string };
}

// Add types for grouping options
type GroupingType = "none" | "alphabetical" | "type";

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
  let truncated = words.length <= 4 ? title : words.slice(0, 4).join(" ") + "…";

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

function nodeMatchesSearch(node: BookmarkNode, term: string): boolean {
  const lowerTerm = term.toLowerCase();
  return node.title.toLowerCase().includes(lowerTerm) || Boolean(node.url && node.url.toLowerCase().includes(lowerTerm));
}

function searchNodesRecursive(nodes: BookmarkNode[], term: string): BookmarkNode[] {
  const results: BookmarkNode[] = [];

  for (const node of nodes) {
    if (nodeMatchesSearch(node, term)) {
      results.push(node);
    }
    if (node.children?.length) {
      results.push(...searchNodesRecursive(node.children, term));
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

function ActionMenuPortal({ tile, buttonRect, onEdit, onClear, onColor, onIcon, onClose, themeStyle, labels }: ActionMenuPortalProps) {
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

  const themeCssVars = useMemo(() => buildThemeCssVars(textColor, backgroundColor), [textColor, backgroundColor]);

  const menuLabels = useMemo(
    () => ({
      edit: t("bookmarks.edit"),
      clear: t("bookmarks.clear"),
      color: t("bookmarks.color"),
      icon: t("bookmarks.icon"),
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
  const [groupingType, setGroupingTypeState] = useState<GroupingType>("none"); // New state for grouping
  const [searchRecursive, setSearchRecursiveState] = useState(false);

  const [selectedTileColor, setSelectedTileColor] = useState<string>("rgba(0, 0, 0, 0.6)"); // State for color
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [tileIndexForColor, setTileIndexForColor] = useState<number | null>(null);

  // Add state for emoji picker
  const [selectedTileIcon, setSelectedTileIcon] = useState<string>("📁"); // Default folder emoji
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [tileIndexForIcon, setTileIndexForIcon] = useState<number | null>(null);

  // --- Refs ---
  const selectorRef = useRef<HTMLDivElement>(null);
  const folderContentRef = useRef<HTMLDivElement>(null);
  const tileGridRef = useRef<HTMLDivElement>(null);
  const sortableRef = useRef<Sortable | null>(null);
  const menuButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Custom setter for groupingType that also saves to localStorage
  const setGroupingType = (type: GroupingType) => {
    setGroupingTypeState(type);
    localStorage.setItem("typeofBookmarkForm", type);
  };

  const setSearchRecursive = (recursive: boolean) => {
    setSearchRecursiveState(recursive);
    localStorage.setItem("bookmarkSearchRecursive", recursive ? "1" : "0");
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
      setSearchTerm("");
      setFolderSearchTerm("");
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

        // Get bookmark data from Chrome
        chrome.bookmarks.getTree((bookmarkNodes) => {
          const transformedNodes = bookmarkNodes[0].children?.map(transformBookmarkNode) || [];
          setBookmarks(transformedNodes);
        });

        // Load grouping preference from localStorage
        try {
          const savedGroupingType = localStorage.getItem("typeofBookmarkForm");
          if (savedGroupingType) {
            // Use the state setter directly to avoid double-saving to localStorage
            setGroupingTypeState(savedGroupingType as GroupingType);
          }

          const savedSearchRecursive = localStorage.getItem("bookmarkSearchRecursive");
          if (savedSearchRecursive !== null) {
            setSearchRecursiveState(savedSearchRecursive === "1");
          }
        } catch (error) {
          console.error("Error loading grouping preference from localStorage:", error);
        }
      } catch (error) {
        console.error("Error loading tile data:", error);
      }
    };

    loadData();
  }, [tileNumber]);

  // Save tiles to Chrome sync storage
  useEffect(() => {
    chrome.storage.sync.set({ bookmarkPreferences: { tiles } });
  }, [tiles]);

  // Ensure menuButtonRefs array has the correct length based on tileNumber
  useEffect(() => {
    // Reset the refs array with the right length when tileNumber changes
    menuButtonRefs.current = Array(tileNumber).fill(null);
  }, [tileNumber]);

  // Handle clicks outside the selector and folder content to close them.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSelecting && selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsSelecting(false);
        setSelectedTileIndex(null);
        setCurrentFolder(null);
      }
      if (activeFolderContent && folderContentRef.current && !folderContentRef.current.contains(event.target as Node)) {
        setActiveFolderContent(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSelecting, activeFolderContent]);

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

  const handleSortEndCallback = useCallback(
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
    }, 200),
    [tiles, tileGridRef, tileNumber]
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

  // --- Tile Interaction Functions ---
  const openSelector = (index: number) => {
    setSelectedTileIndex(index);
    setIsSelecting(true);
    setCurrentFolder(null);
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
    let updatedTile = { ...tile };
    if (color) updatedTile.tileColor = color;
    if (icon) updatedTile.tileIcon = icon;

    // Save to database directly like in Notes.tsx
    await bookmarkDB.saveItem(updatedTile);

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
        if (isSelecting) {
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
    if (isSelecting) {
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
      if (isSelecting) {
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

    if (isSelecting) {
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
  const filterNodesBySearch = (nodes: BookmarkNode[], term: string, recursive = false): BookmarkNode[] => {
    if (!term) return nodes;
    if (recursive) return searchNodesRecursive(nodes, term);

    return nodes.filter((node) => nodeMatchesSearch(node, term));
  };

  // Modify the getGroupedNodes function to check for empty inputs
  const getGroupedNodes = (nodes: BookmarkNode[], groupType: GroupingType): GroupedData[] | BookmarkNode[] => {
    // Return empty array if nodes is undefined or empty
    if (!nodes || nodes.length === 0) return [];

    if (groupType === "none") return nodes;

    if (groupType === "alphabetical") {
      // Group alphabetically by first letter
      const groups: Record<string, BookmarkNode[]> = {};

      // Sort and group by first letter
      [...nodes]
        .sort((a, b) => a.title.localeCompare(b.title))
        .forEach((node) => {
          const firstLetter = node.title.charAt(0).toUpperCase();
          if (!groups[firstLetter]) {
            groups[firstLetter] = [];
          }
          groups[firstLetter].push(node);
        });

      // Convert to array of groups
      return Object.entries(groups).map(([letter, groupNodes]) => ({
        title: letter,
        nodes: groupNodes,
      }));
    } else if (groupType === "type") {
      // Create folder and bookmark groups
      const folders: BookmarkNode[] = [];
      const bookmarks: BookmarkNode[] = [];

      nodes.forEach((node) => {
        if (node.children) {
          folders.push(node);
        } else {
          bookmarks.push(node);
        }
      });

      // Sort each group alphabetically
      folders.sort((a, b) => a.title.localeCompare(b.title));
      bookmarks.sort((a, b) => a.title.localeCompare(b.title));

      const result: GroupedData[] = [];

      if (folders.length > 0) {
        result.push({
          title: "Folders",
          nodes: folders,
        });
      }

      if (bookmarks.length > 0) {
        result.push({
          title: "Bookmarks",
          nodes: bookmarks,
        });
      }

      return result;
    }

    return nodes;
  };

  // Add a type guard function to check if data is grouped
  const isGroupedData = (data: any[]): data is GroupedData[] => {
    return data.length > 0 && "title" in data[0] && "nodes" in data[0];
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

  // Add a scroll padding utility function to handle scrolling behavior
  useEffect(() => {
    // Apply scroll padding when the selector or folder content is open
    const applyScrollPadding = () => {
      if (isSelecting && selectorRef.current) {
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
  }, [isSelecting, activeFolderContent]);

  // --- Rendering Functions ---
  const renderSelector = () => {
    const nodes = currentFolder?.children || bookmarks;
    const filteredNodes = filterNodesBySearch(nodes || [], searchTerm, searchRecursive);
    const groupedData = getGroupedNodes(filteredNodes, groupingType);

    // Use type guard to safely check if data is grouped
    const isGrouped = Array.isArray(groupedData) && groupedData.length > 0 && isGroupedData(groupedData);

    return (
      <div className="bookmarks-overlay">
        <div ref={selectorRef} className="bookmarks-modal bookmarks-modal--large" style={themeCssVars}>
          <div className="bookmarks-toolbar">
            <button type="button" onClick={currentFolder ? navigateBack : closeSelector} className="bookmarks-btn">
              <ChevronLeft className="w-3.5 h-3.5" />
              {currentFolder ? t("bookmarks.back") : t("bookmarks.cancel")}
            </button>
            <h3 className="text-base font-medium flex-grow text-center">
              {currentFolder ? currentFolder.title : t("bookmarks.select")}
            </h3>
            {currentFolder && (
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
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <Search className="w-4 h-4 opacity-60" />
              </div>
              <input
                type="text"
                placeholder={t("bookmarks.search")}
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

            {renderRecursiveSearchOption()}

            <div className="bookmarks-group-controls">
              <span className="bookmarks-group-label">{t("bookmarks.groupBy")}</span>
              <div className="bookmarks-toggle-group" role="group" aria-label={t("bookmarks.groupBy")}>
                <button
                  type="button"
                  onClick={() => setGroupingType("none")}
                  className={`bookmarks-toggle-btn ${groupingType === "none" ? "bookmarks-toggle-btn--active" : ""}`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  {t("bookmarks.groupNone")}
                </button>
                <button
                  type="button"
                  onClick={() => setGroupingType("alphabetical")}
                  className={`bookmarks-toggle-btn ${groupingType === "alphabetical" ? "bookmarks-toggle-btn--active" : ""}`}
                >
                  <SortDesc className="w-3.5 h-3.5" />
                  {t("bookmarks.groupAz")}
                </button>
                <button
                  type="button"
                  onClick={() => setGroupingType("type")}
                  className={`bookmarks-toggle-btn ${groupingType === "type" ? "bookmarks-toggle-btn--active" : ""}`}
                >
                  <List className="w-3.5 h-3.5" />
                  {t("bookmarks.groupType")}
                </button>
              </div>
            </div>
          </div>

          <div className="bookmarks-scroll-area">
              {!isGrouped ? (
                // Render regular grid when not grouped
                <div className="bookmarks-picker-grid">
                  {filteredNodes.length > 0 ? (
                    filteredNodes.map((node) => (
                      <a
                        key={node.id}
                        href={node.url || "#"}
                        onClick={(e) => {
                          e.preventDefault(); // Prevent default for left click
                          if (node.children) {
                            navigateToFolder(node.id);
                          } else {
                            selectNode(node);
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
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${getHostname(node.url)}&sz=16`}
                            alt=""
                            className="w-6 h-6 mb-1"
                            onError={(e) => {
                              e.currentTarget.src = "https://www.google.com/s2/favicons?domain=chrome&sz=16";
                            }}
                          />
                        )}
                        <span className="bookmark-tile__title text-xs sm:text-sm" title={node.title}>
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
                                onClick={(e) => {
                                  e.preventDefault(); // Prevent default for left click
                                  if (node.children) {
                                    navigateToFolder(node.id);
                                  } else {
                                    selectNode(node);
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
                                  <img
                                    src={`https://www.google.com/s2/favicons?domain=${getHostname(node.url)}&sz=16`}
                                    alt=""
                                    className="w-6 h-6 mb-1"
                                    onError={(e) => {
                                      e.currentTarget.src = "https://www.google.com/s2/favicons?domain=chrome&sz=16";
                                    }}
                                  />
                                )}
                                <span className="bookmark-tile__title text-xs sm:text-sm" title={node.title}>
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

  const renderFolderContent = () => {
    if (!activeFolderContent) return null;

    const filteredFolderContent = filterFolderContentBySearch(activeFolderContent.children || [], folderSearchTerm, searchRecursive);
    const groupedData = getGroupedNodes(filteredFolderContent, groupingType);

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
            <div className="relative">
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

            {renderRecursiveSearchOption()}

            <div className="bookmarks-group-controls">
              <span className="bookmarks-group-label">{t("bookmarks.groupBy")}</span>
              <div className="bookmarks-toggle-group" role="group" aria-label={t("bookmarks.groupBy")}>
                <button
                  type="button"
                  onClick={() => setGroupingType("none")}
                  className={`bookmarks-toggle-btn ${groupingType === "none" ? "bookmarks-toggle-btn--active" : ""}`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  {t("bookmarks.groupNone")}
                </button>
                <button
                  type="button"
                  onClick={() => setGroupingType("alphabetical")}
                  className={`bookmarks-toggle-btn ${groupingType === "alphabetical" ? "bookmarks-toggle-btn--active" : ""}`}
                >
                  <SortDesc className="w-3.5 h-3.5" />
                  {t("bookmarks.groupAz")}
                </button>
                <button
                  type="button"
                  onClick={() => setGroupingType("type")}
                  className={`bookmarks-toggle-btn ${groupingType === "type" ? "bookmarks-toggle-btn--active" : ""}`}
                >
                  <List className="w-3.5 h-3.5" />
                  {t("bookmarks.groupType")}
                </button>
              </div>
            </div>
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
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${getHostname(node.url)}&sz=16`}
                            alt=""
                            className="w-6 h-6 sm:w-8 sm:h-8 mb-1"
                            onError={(e) => {
                              e.currentTarget.src = "https://www.google.com/s2/favicons?domain=chrome&sz=16";
                            }}
                          />
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
                                  <img
                                    src={`https://www.google.com/s2/favicons?domain=${getHostname(node.url)}&sz=16`}
                                    alt=""
                                    className="w-6 h-6 sm:w-8 sm:h-8 mb-1"
                                    onError={(e) => {
                                      e.currentTarget.src = "https://www.google.com/s2/favicons?domain=chrome&sz=16";
                                    }}
                                  />
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
        <img
          src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
          alt=""
          className="w-6 h-6 bookmark-tile__icon"
          onError={(e) => {
            e.currentTarget.src = "https://www.google.com/s2/favicons?domain=chrome&sz=32";
          }}
        />
        <span className="bookmark-tile__title">{truncateTitle(tile.title)}</span>
        {hostname && <span className="bookmark-tile__domain">{hostname}</span>}
      </div>
    );
  };

  // --- Main Tile Grid Rendering ---
  return (
    <div className="bookmarks-root" style={{ ...themeCssVars, color: textColor }}>
      <div className="bookmarks-header">
        <h2 className="bookmarks-title">{t("bookmarks.title")}</h2>
        <p className="bookmarks-hint">{t("bookmarks.hint")}</p>
      </div>
      <div ref={tileGridRef} className="bookmarks-grid">
        {Array(tileNumber)
          .fill(null)
          .map((_, i) => renderTile(tiles[i], i))}
      </div>
      {isSelecting && renderSelector()}
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
    </div>
  );
}
