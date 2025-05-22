import { useEffect, useState, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import createDatabase from "./IndexedDatabase/IndexedDatabase";
import { Folder, ChevronLeft, MoreHorizontal, Settings, Plus, Trash2, Palette, Search, X, SortDesc, List, Grid, Smile } from "lucide-react";
import "./Settings.css";
import Sortable from "sortablejs";
import { throttle } from "lodash";
import { useCalendar } from "./Settings";
import "./Bookmarks.css";
// Import emoji-mart
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

// Constants
const ASPECT_RATIO = "aspect-ratio";

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

// Modify the truncateTitle function to enforce a 15-character limit
function truncateTitle(title: string): string {
  // First, apply the word limit (3 words)
  const words = title.trim().split(/\s+/);
  let truncated = words.length <= 3 ? title : words.slice(0, 3).join(" ") + "...";

  // Then, enforce the character limit (15 characters)
  if (truncated.length > 15) {
    return truncated.substring(0, 12) + "...";
  }

  return truncated;
}

// --- Color Picker Component ---
function ColorPicker({
  currentColor,
  onChange,
  onConfirm,
  onClose,
}: {
  currentColor: string;
  onChange: (color: string) => void;
  onConfirm: () => void;
  onClose: () => void;
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-lg flex items-center justify-center">
      <div className="bg-black/20 p-4 rounded-lg shadow-lg">
        <div className="grid grid-cols-6 gap-1 mb-2">
          {colors.map((color) => (
            <button
              key={color}
              className={`w-6 h-6 rounded-full ${color === currentColor ? "ring-2 ring-offset-1 ring-gray-800" : ""}`}
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
            />
          ))}
        </div>
        <div className="flex justify-center">
          <div className="flex justify-between space-x-2.5 w-full max-w-sm">
            <button onClick={onClose} className="flex-1 px-4 py-2 text-base font-bold bg-red-300 hover:bg-red-400 text-white rounded">
              <span className="mr-2">✗</span>
            </button>
            <button onClick={onConfirm} className="flex-1 px-4 py-2 text-base font-bold bg-blue-500 hover:bg-blue-600 text-white rounded">
              <span className="mr-2">✓</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Action Menu Component (Portal) ---
function ActionMenuPortal({ tile, buttonRect, onEdit, onClear, onColor, onIcon, onClose }: ActionMenuPortalProps) {
  const style = {
    position: "absolute" as const,
    top: buttonRect.bottom + window.scrollY,
    left: buttonRect.left + window.scrollX,
    zIndex: 10000,
  };

  return ReactDOM.createPortal(
    <div style={style} className="action-menu py-0.5 w-24 bg-black/200 backdrop-blur-md rounded-lg shadow-lg">
      <button
        id={`edit-button-${tile.id}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onEdit();
          onClose();
        }}
        className="w-full px-2 py-1 text-left text-white hover:bg-black/20 transition-colors flex items-center gap-1 text-sm"
      >
        <Settings className="w-3 h-3" />
        <span>Edit</span>
      </button>
      <button
        id={`clear-button-${tile.id}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClear();
          onClose();
        }}
        className="w-full px-2 py-1 text-left text-white hover:bg-red-500/20 transition-colors flex items-center gap-1 text-sm"
      >
        <Trash2 className="w-3 h-3" />
        <span>Clear</span>
      </button>
      <button
        id={`color-button-${tile.id}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onColor(); // Call onColor (no more onColor prop)
        }}
        className="w-full px-2 py-1 text-left text-white hover:bg-blue-500/20 transition-colors flex items-center gap-1 text-sm"
      >
        <Palette className="w-3 h-3" />
        <span>Color</span>
      </button>
      {tile.type === "folder" && onIcon && (
        <button
          id={`icon-button-${tile.id}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onIcon();
          }}
          className="w-full px-2 py-1 text-left text-white hover:bg-green-500/20 transition-colors flex items-center gap-1 text-sm"
        >
          <Smile className="w-3 h-3" />
          <span>Icon</span>
        </button>
      )}
    </div>,
    document.body
  );
}

// --- Main Bookmarks Component ---
export function Bookmarks() {
  // Get tileNumber from CalendarContext
  const { tileNumber, textColor, backgroundColor } = useCalendar();

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
      if (openMenuId && !(event.target as Element).closest(".action-menu")) {
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
  const filterNodesBySearch = (nodes: BookmarkNode[], term: string): BookmarkNode[] => {
    if (!term) return nodes;

    const lowerTerm = term.toLowerCase();
    return nodes.filter((node) => node.title.toLowerCase().includes(lowerTerm) || (node.url && node.url.toLowerCase().includes(lowerTerm)));
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
  const filterFolderContentBySearch = (nodes: BookmarkNode[] | undefined, term: string): BookmarkNode[] => {
    if (!nodes) return [];
    if (!term) return nodes;

    const lowerTerm = term.toLowerCase();
    return nodes.filter((node) => node.title.toLowerCase().includes(lowerTerm) || (node.url && node.url.toLowerCase().includes(lowerTerm)));
  };

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
    const filteredNodes = filterNodesBySearch(nodes || [], searchTerm);
    const groupedData = getGroupedNodes(filteredNodes, groupingType);

    // Use type guard to safely check if data is grouped
    const isGrouped = Array.isArray(groupedData) && groupedData.length > 0 && isGroupedData(groupedData);

    return (
      <div className="fixed inset-0 z-20 bg-black/40 backdrop-blur-lg p-4 flex items-center justify-center">
        <div
          ref={selectorRef}
          className="w-[70vw] h-[70vh] max-w-[1120px] bg-black/10 border-2 border-white p-4 rounded-xl backdrop-blur-md relative flex flex-col"
        >
          {/* Top Bar - Fixed */}
          <div className="flex items-center justify-between gap-2 bg-black/40 border border-white/20 p-2 z-10 rounded-lg">
            <button
              onClick={currentFolder ? navigateBack : closeSelector}
              className="flex items-center gap-1 bg-black/30 hover:bg-black/40 border border-white/20 transition-colors rounded-lg px-2 py-1 text-sm"
              style={{ color: textColor }}
            >
              <ChevronLeft className="w-3 h-3" style={{ color: textColor }} />
              {currentFolder ? "Back" : "Cancel"}
            </button>
            <h3 className="text-lg font-medium flex-grow" style={{ color: textColor }}>
              {currentFolder ? currentFolder.title : "Select"}
            </h3>
            {/* Confirm Button (only when inside a folder) */}
            {currentFolder && (
              <button
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
                className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded-lg text-sm"
                style={{ color: textColor }}
              >
                Confirm
              </button>
            )}
          </div>

          {/* Search and Grouping Controls - Fixed */}
          <div className="search-controls mt-2 mb-2 space-y-2 z-10 bg-black/30 border-2 border-white/20 backdrop-blur-lg p-3 rounded-lg shadow-md">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-5 h-5" style={{ color: `${textColor}70` }} />
              </div>
              <input
                type="text"
                placeholder="Search bookmarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 hover:bg-white/15 focus:bg-white/20 
                          rounded-lg placeholder-white/60 text-base
                          border-2 border-white/20 focus:border-white/40
                          transition-all duration-200 ease-in-out
                          focus:outline-none focus:ring-2 focus:ring-white/20"
                style={{ color: textColor }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 hover:text-white"
                  style={{ color: `${textColor}70` }}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Grouping Controls */}
            <div className="flex items-center space-x-2">
              <span className="text-sm" style={{ color: `${textColor}` }}>
                Group by:
              </span>
              <div className="flex bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setGroupingType("none")}
                  className={`px-2 py-1 rounded text-xs font-medium ${groupingType === "none" ? "bg-white/20" : "hover:bg-white/10"}`}
                  style={{
                    color: textColor,
                    fontWeight: groupingType === "none" ? "bold" : "normal",
                  }}
                >
                  <Grid className="w-4 h-4 inline mr-1" style={{ color: textColor }} />
                  None
                </button>
                <button
                  onClick={() => setGroupingType("alphabetical")}
                  className={`px-2 py-1 rounded text-xs font-medium ${groupingType === "alphabetical" ? "bg-white/20" : "hover:bg-white/10"}`}
                  style={{
                    color: textColor,
                    fontWeight: groupingType === "alphabetical" ? "bold" : "normal",
                  }}
                >
                  <SortDesc className="w-4 h-4 inline mr-1" style={{ color: textColor }} />
                  A-Z
                </button>
                <button
                  onClick={() => setGroupingType("type")}
                  className={`px-2 py-1 rounded text-xs font-medium ${groupingType === "type" ? "bg-white/20" : "hover:bg-white/10"}`}
                  style={{
                    color: textColor,
                    fontWeight: groupingType === "type" ? "bold" : "normal",
                  }}
                >
                  <List className="w-4 h-4 inline mr-1" style={{ color: textColor }} />
                  Type
                </button>
              </div>
            </div>
          </div>

          {/* Separated Scrollable Content Area with Border */}
          <div className="flex-1 mt-2 bg-black/20 backdrop-blur-lg rounded-lg border-2 border-white/20 overflow-hidden flex flex-col">
            <div className="overflow-y-auto p-3 h-full">
              {!isGrouped ? (
                // Render regular grid when not grouped
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
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
                        className="bookmark-selector-item flex flex-col items-center justify-center p-2 hover:bg-white/20 backdrop-blur-md rounded-xl transition-colors"
                        style={{ textDecoration: "none" }}
                      >
                        {node.children ? (
                          node.tileIcon && node.tileIcon !== "default" ? (
                            <span className="text-3xl sm:text-4xl mb-1">{node.tileIcon}</span>
                          ) : (
                            <Folder className="w-8 h-8 sm:w-10 sm:h-10 mb-1" style={{ color: textColor }} />
                          )
                        ) : (
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${node.url ? new URL(node.url).hostname : ""}&sz=16`}
                            alt=""
                            className="w-6 h-6 mb-1"
                            onError={(e) => {
                              e.currentTarget.src = "https://www.google.com/s2/favicons?domain=chrome&sz=16";
                            }}
                          />
                        )}
                        <span className="text-center text-xs sm:text-sm font-medium line-clamp-2" style={{ color: textColor }} title={node.title}>
                          {truncateTitle(node.title)}
                        </span>
                      </a>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8" style={{ color: `${textColor}70` }}>
                      No bookmarks match your search
                    </div>
                  )}
                </div>
              ) : (
                // Render grouped content with headers
                <div className="space-y-4">
                  {isGroupedData(groupedData) &&
                    groupedData.map((group) => (
                      <div key={group.title} className="space-y-1">
                        {/* Group header - No longer sticky, scrolls with content */}
                        <div
                          className="bg-white/15 border border-white/30 backdrop-blur-md font-medium px-3 py-2 rounded-md flex items-center shadow-md"
                          style={{ color: textColor }}
                        >
                          {group.title === "Folders" ? (
                            <Folder className="w-4 h-4 mr-2" style={{ color: textColor }} />
                          ) : group.title === "Bookmarks" ? (
                            <List className="w-4 h-4 mr-2" style={{ color: textColor }} />
                          ) : (
                            <span className="w-4 h-4 inline-block mr-2 text-center">{group.title}</span>
                          )}
                          <span>{group.title}</span>
                          <span className="ml-2 text-xs" style={{ color: `${textColor}70` }}>
                            ({group.nodes.length})
                          </span>
                        </div>
                        {/* Group items */}
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
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
                                className="bookmark-selector-item flex flex-col items-center justify-center p-2 hover:bg-white/20 backdrop-blur-md rounded-xl transition-colors"
                                style={{ textDecoration: "none" }}
                              >
                                {node.children ? (
                                  node.tileIcon && node.tileIcon !== "default" ? (
                                    <span className="text-3xl sm:text-4xl mb-1">{node.tileIcon}</span>
                                  ) : (
                                    <Folder className="w-8 h-8 sm:w-10 sm:h-10 mb-1" style={{ color: textColor }} />
                                  )
                                ) : (
                                  <img
                                    src={`https://www.google.com/s2/favicons?domain=${node.url ? new URL(node.url).hostname : ""}&sz=16`}
                                    alt=""
                                    className="w-6 h-6 mb-1"
                                    onError={(e) => {
                                      e.currentTarget.src = "https://www.google.com/s2/favicons?domain=chrome&sz=16";
                                    }}
                                  />
                                )}
                                <span
                                  className="text-center text-xs sm:text-sm font-medium line-clamp-2"
                                  style={{ color: textColor }}
                                  title={node.title}
                                >
                                  {truncateTitle(node.title)}
                                </span>
                              </a>
                            ))}
                        </div>
                      </div>
                    ))}
                  {isGroupedData(groupedData) && groupedData.length === 0 && (
                    <div className="text-center py-8" style={{ color: `${textColor}70` }}>
                      No bookmarks match your search
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFolderContent = () => {
    if (!activeFolderContent) return null;

    const filteredFolderContent = filterFolderContentBySearch(activeFolderContent.children || [], folderSearchTerm);
    const groupedData = getGroupedNodes(filteredFolderContent, groupingType);

    // Use the type guard for safer type checking
    const isGrouped = Array.isArray(groupedData) && groupedData.length > 0 && isGroupedData(groupedData);

    return (
      <div className="fixed inset-0 z-10 bg-black/50 backdrop-blur-lg flex items-center justify-center p-4">
        <div ref={folderContentRef} className="w-[90vw] h-[90vh] max-w-[1400px] bg-black/10 p-4 rounded-xl backdrop-blur-md relative flex flex-col">
          {/* Top Bar - Fixed */}
          <div className="flex items-center justify-between gap-2 bg-black/40 border border-white/20 p-2 z-10 rounded-lg">
            <button
              onClick={navigateBack}
              className="flex items-center gap-1 bg-black/30 hover:bg-black/40 border border-white/20 transition-colors rounded-lg px-2 py-1 text-sm"
              style={{ color: textColor }}
            >
              <ChevronLeft className="w-3 h-3" style={{ color: textColor }} />
              Back
            </button>
            <h3 className="text-lg font-medium" style={{ color: textColor }}>
              {activeFolderContent.title}
            </h3>
          </div>

          {/* Search and Grouping Controls - Fixed */}
          <div className="search-controls mt-2 mb-2 space-y-2 z-10 bg-black/30 border-2 border-white/20 backdrop-blur-lg p-3 rounded-lg shadow-md">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-5 h-5" style={{ color: `${textColor}70` }} />
              </div>
              <input
                type="text"
                placeholder="Search in this folder..."
                value={folderSearchTerm}
                onChange={(e) => setFolderSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 hover:bg-white/15 focus:bg-white/20 
                          rounded-lg placeholder-white/60 text-base
                          border-2 border-white/20 focus:border-white/40
                          transition-all duration-200 ease-in-out
                          focus:outline-none focus:ring-2 focus:ring-white/20"
                style={{ color: textColor }}
              />
              {folderSearchTerm && (
                <button
                  onClick={() => setFolderSearchTerm("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 hover:text-white"
                  style={{ color: `${textColor}70` }}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Grouping Controls */}
            <div className="flex items-center space-x-2">
              <span className="text-sm" style={{ color: `${textColor}` }}>
                Group by:
              </span>
              <div className="flex bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setGroupingType("none")}
                  className={`px-2 py-1 rounded text-xs font-medium ${groupingType === "none" ? "bg-white/20" : "hover:bg-white/10"}`}
                  style={{
                    color: textColor,
                    fontWeight: groupingType === "none" ? "bold" : "normal",
                  }}
                >
                  <Grid className="w-4 h-4 inline mr-1" style={{ color: textColor }} />
                  None
                </button>
                <button
                  onClick={() => setGroupingType("alphabetical")}
                  className={`px-2 py-1 rounded text-xs font-medium ${groupingType === "alphabetical" ? "bg-white/20" : "hover:bg-white/10"}`}
                  style={{
                    color: textColor,
                    fontWeight: groupingType === "alphabetical" ? "bold" : "normal",
                  }}
                >
                  <SortDesc className="w-4 h-4 inline mr-1" style={{ color: textColor }} />
                  A-Z
                </button>
                <button
                  onClick={() => setGroupingType("type")}
                  className={`px-2 py-1 rounded text-xs font-medium ${groupingType === "type" ? "bg-white/20" : "hover:bg-white/10"}`}
                  style={{
                    color: textColor,
                    fontWeight: groupingType === "type" ? "bold" : "normal",
                  }}
                >
                  <List className="w-4 h-4 inline mr-1" style={{ color: textColor }} />
                  Type
                </button>
              </div>
            </div>
          </div>

          {/* Separated Scrollable Content Area with Border */}
          <div className="flex-1 mt-2 bg-black/20 backdrop-blur-lg rounded-lg border-2 border-white/20 overflow-hidden flex flex-col">
            <div className="overflow-y-auto p-3 h-full">
              {!isGrouped ? (
                // Render regular grid when not grouped
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
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
                        className="bookmark-selector-item flex flex-col items-center justify-center p-2 backdrop-blur-md rounded-xl hover:bg-white/30 transition-colors w-full"
                        style={{ textDecoration: "none" }}
                      >
                        {node.children ? (
                          node.tileIcon && node.tileIcon !== "default" ? (
                            <span className="text-3xl sm:text-4xl mb-1">{node.tileIcon}</span>
                          ) : (
                            <Folder className="w-8 h-8 sm:w-10 sm:h-10 mb-1" style={{ color: textColor }} />
                          )
                        ) : (
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${node.url ? new URL(node.url).hostname : ""}&sz=16`}
                            alt=""
                            className="w-6 h-6 sm:w-8 sm:h-8 mb-1"
                            onError={(e) => {
                              e.currentTarget.src = "https://www.google.com/s2/favicons?domain=chrome&sz=16";
                            }}
                          />
                        )}
                        <span
                          className="font-medium text-center text-secondary-800 text-[10px] sm:text-xs line-clamp-2"
                          style={{ color: textColor }}
                          title={node.title}
                        >
                          {truncateTitle(node.title)}
                        </span>
                      </a>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8" style={{ color: `${textColor}70` }}>
                      No bookmarks match your search
                    </div>
                  )}
                </div>
              ) : (
                // Render grouped content with headers
                <div className="space-y-4">
                  {isGroupedData(groupedData) &&
                    groupedData.map((group) => (
                      <div key={group.title} className="space-y-1">
                        {/* Group header - No longer sticky, scrolls with content */}
                        <div
                          className="bg-white/15 border border-white/30 backdrop-blur-md font-medium px-3 py-2 rounded-md flex items-center shadow-md"
                          style={{ color: textColor }}
                        >
                          {group.title === "Folders" ? (
                            <Folder className="w-4 h-4 mr-2" style={{ color: textColor }} />
                          ) : group.title === "Bookmarks" ? (
                            <List className="w-4 h-4 mr-2" style={{ color: textColor }} />
                          ) : (
                            <span className="w-4 h-4 inline-block mr-2 text-center">{group.title}</span>
                          )}
                          <span>{group.title}</span>
                          <span className="ml-2 text-xs" style={{ color: `${textColor}70` }}>
                            ({group.nodes.length})
                          </span>
                        </div>
                        {/* Group items */}
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
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
                                className="bookmark-selector-item flex flex-col items-center justify-center p-2 backdrop-blur-md rounded-xl hover:bg-white/30 transition-colors w-full"
                                style={{ textDecoration: "none" }}
                              >
                                {node.children ? (
                                  node.tileIcon && node.tileIcon !== "default" ? (
                                    <span className="text-3xl sm:text-4xl mb-1">{node.tileIcon}</span>
                                  ) : (
                                    <Folder className="w-8 h-8 sm:w-10 sm:h-10 mb-1" style={{ color: textColor }} />
                                  )
                                ) : (
                                  <img
                                    src={`https://www.google.com/s2/favicons?domain=${node.url ? new URL(node.url).hostname : ""}&sz=16`}
                                    alt=""
                                    className="w-6 h-6 sm:w-8 sm:h-8 mb-1"
                                    onError={(e) => {
                                      e.currentTarget.src = "https://www.google.com/s2/favicons?domain=chrome&sz=16";
                                    }}
                                  />
                                )}
                                <span
                                  className="font-medium text-center text-secondary-800 text-[10px] sm:text-xs line-clamp-2"
                                  style={{ color: textColor }}
                                  title={node.title}
                                >
                                  {truncateTitle(node.title)}
                                </span>
                              </a>
                            ))}
                        </div>
                      </div>
                    ))}
                  {isGroupedData(groupedData) && groupedData.length === 0 && (
                    <div className="text-center py-8" style={{ color: `${textColor}70` }}>
                      No bookmarks match your search
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTile = (tile: TileConfig | null, index: number) => {
    const commonClasses = `${ASPECT_RATIO} relative flex flex-col items-center justify-center p-2 glass-effect backdrop-blur-md rounded-xl group cursor-pointer`;

    const tileBackgroundColor = tile?.tileColor || "rgba(0, 0, 0, 0.2)"; // Using a transparent background

    // --- Empty Tile ---
    if (!tile) {
      return (
        <div
          id={`tile-empty-${index}`}
          className={`${ASPECT_RATIO} relative flex flex-col items-center justify-center p-2 backdrop-blur-md rounded-xl group cursor-pointer`}
          key={`tile-empty-${index}`}
          data-tile-index={index}
          style={{ backgroundColor }}
        >
          <button onClick={() => openSelector(index)} className="flex flex-col items-center p-2 hover:bg-black/10 rounded-lg transition-colors">
            <Plus className="w-6 h-6 mb-1" style={{ color: textColor }} />
          </button>
        </div>
      );
    }

    // --- Common Action Menu Button ---
    const handleEdit = () => {
      openSelector(index);
    };
    const handleClear = () => {
      clearTile(index);
    };

    // --- Folder Tile ---
    if (tile.type === "folder") {
      return (
        <div
          key={`folder-tile-${tile.nodeId}`}
          id={`folder-tile-${tile.nodeId}`}
          className={`${commonClasses} hover:bg-black/30 transition-colors overflow-visible`}
          style={{ position: "relative", zIndex: 1, backgroundColor: tileBackgroundColor }} // Set background color
          data-tile-index={index}
          onClick={() => navigateToFolder(tile.nodeId)}
        >
          <button
            ref={(el) => (menuButtonRefs.current[index] = el)}
            id={`menu-button-${tile.id}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const currentButtonRef = menuButtonRefs.current[index];
              if (currentButtonRef) {
                setMenuButtonRect(currentButtonRef.getBoundingClientRect());
              }
              setOpenMenuId(openMenuId === tile?.id ? null : tile?.id || null);
            }}
            className="absolute top-1 right-1 z-20 p-0.5 bg-black/0 hover:bg-black/20 rounded-md transition-colors action-menu"
            title="Menu"
            style={{ zIndex: 20 }}
          >
            <MoreHorizontal strokeWidth={0.5} className="w-3 h-3 text-white" />
          </button>
          {openMenuId === tile.id && menuButtonRect && (
            <ActionMenuPortal
              tile={tile}
              index={index}
              buttonRect={menuButtonRect}
              onEdit={handleEdit}
              onClear={handleClear}
              onColor={() => handleColorClick(index)}
              onIcon={() => handleIconClick(index)}
              onClose={() => setOpenMenuId(null)}
            />
          )}
          {tile.tileIcon && tile.tileIcon !== "default" ? (
            <span className="text-2xl mb-1 relative z-10">{tile.tileIcon}</span>
          ) : (
            <Folder className="w-3 h-3 mb-1 relative z-10" style={{ color: textColor }} />
          )}
          <span
            className="text-center text-secondary-800 text-xs font-medium line-clamp-2 relative z-10"
            style={{ color: textColor }}
            title={tile.title}
          >
            {truncateTitle(tile.title)}
          </span>
        </div>
      );
    }

    // --- Bookmark Tile ---
    return (
      <div
        key={`bookmark-tile-${tile.nodeId}`}
        id={`bookmark-tile-${tile.nodeId}`}
        className={`${commonClasses} hover:bg-black/30 transition-colors overflow-visible`}
        style={{ position: "relative", zIndex: 1, backgroundColor: tileBackgroundColor }} // Set background color
        data-tile-index={index}
        data-url={tile.url}
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
        <button
          ref={(el) => (menuButtonRefs.current[index] = el)}
          id={`menu-button-${tile.id}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const currentButtonRef = menuButtonRefs.current[index];
            if (currentButtonRef) {
              setMenuButtonRect(currentButtonRef.getBoundingClientRect());
            }
            setOpenMenuId(openMenuId === tile?.id ? null : tile?.id || null);
          }}
          className="absolute top-1 right-1 z-20 p-0.5 bg-black/0 hover:bg-black/20 rounded-md transition-colors action-menu"
          title="Menu"
          style={{ zIndex: 20 }}
        >
          <MoreHorizontal strokeWidth={0.5} className="w-3 h-3 text-white" />
        </button>
        {openMenuId === tile.id && menuButtonRect && (
          <ActionMenuPortal
            tile={tile}
            index={index}
            buttonRect={menuButtonRect}
            onEdit={handleEdit}
            onClear={handleClear}
            onColor={() => handleColorClick(index)}
            onIcon={() => handleIconClick(index)}
            onClose={() => setOpenMenuId(null)}
          />
        )}
        <img
          src={`https://www.google.com/s2/favicons?domain=${tile.url ? new URL(tile.url).hostname : ""}&sz=16`}
          alt=""
          className="w-6 h-6 mb-1 relative z-10"
          onError={(e) => {
            e.currentTarget.src = "https://www.google.com/s2/favicons?domain=chrome&sz=16";
          }}
        />
        <span className="text-center text-[0.8vh] font-medium line-clamp-2 relative z-10" style={{ color: textColor }} title={tile.title}>
          {truncateTitle(tile.title)}
        </span>
      </div>
    );
  };

  // --- Main Tile Grid Rendering ---
  return (
    <div className="relative">
      <div ref={tileGridRef} className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-8 gap-1">
        {Array(tileNumber)
          .fill(null)
          .map((_, i) => renderTile(tiles[i], i))}
      </div>
      {isSelecting && renderSelector()}
      {activeFolderContent && renderFolderContent()}
      {/* Color Picker */}
      {isColorPickerOpen && (
        <ColorPicker
          currentColor={selectedTileColor}
          onChange={handleColorChange}
          onConfirm={handleColorConfirm}
          onClose={() => {
            setIsColorPickerOpen(false);
            setTileIndexForColor(null);
          }}
        />
      )}
      {/* Emoji Picker using emoji-mart */}
      {isEmojiPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-lg flex items-center justify-center">
          <div className="bg-black/20 p-4 rounded-lg shadow-lg">
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              onClickOutside={handleEmojiPickerClose} // Close picker on clicking outside
              theme="dark" // Optional: set theme

              // You might need additional props based on emoji-mart documentation
            />
          </div>
        </div>
      )}
    </div>
  );
}
