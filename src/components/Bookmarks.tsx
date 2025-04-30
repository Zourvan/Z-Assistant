import { useEffect, useState, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import createDatabase from "./IndexedDatabase/IndexedDatabase";
import { Folder, ChevronLeft, MoreHorizontal, Settings, Plus, Trash2, Palette, Search, X, SortDesc, List, Grid } from "lucide-react";
import "./Settings.css";
import Sortable from "sortablejs";
import { throttle } from "lodash";
import { useCalendar } from "./Settings";

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

interface BookmarkPreferences {
  tiles: (TileConfig | null)[];
}

interface ActionMenuPortalProps {
  tile: TileConfig;
  buttonRect: DOMRect;
  index: number;
  onEdit: () => void;
  onClear: () => void;
  onColor: () => void;
  onClose: () => void;
}

// Add types for grouping options
type GroupingType = "none" | "alphabetical" | "type";

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

// --- Helper Functions ---
function transformBookmarkNode(node: chrome.bookmarks.BookmarkTreeNode): BookmarkNode {
  return {
    id: node.id,
    title: node.title,
    url: node.url,
    tileIcon: "default",
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
function ActionMenuPortal({ tile, buttonRect, onEdit, onClear, onColor, onClose }: ActionMenuPortalProps) {
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
  const [groupingType, setGroupingType] = useState<GroupingType>("none"); // New state for grouping

  const [selectedTileColor, setSelectedTileColor] = useState<string>("rgba(0, 0, 0, 0.6)"); // State for color
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [tileIndexForColor, setTileIndexForColor] = useState<number | null>(null);

  // --- Refs ---
  const selectorRef = useRef<HTMLDivElement>(null);
  const folderContentRef = useRef<HTMLDivElement>(null);
  const tileGridRef = useRef<HTMLDivElement>(null);
  const sortableRef = useRef<Sortable | null>(null);
  const menuButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

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
      tileIcon: node.tileIcon || "default",
      position: selectedTileIndex,
      createdAt: Date.now(),
    };

    await updateTile(newTile);
  };

  const updateTile = async (tile: TileConfig, color?: string) => {
    if (selectedTileIndex === null && tileIndexForColor === null) return;

    const indexToUpdate = selectedTileIndex !== null ? selectedTileIndex : tileIndexForColor;

    if (indexToUpdate === null) return;

    // If updating color, update the tile with new color
    const updatedTile = color ? { ...tile, tileColor: color } : tile;

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
  };

  // Add a helper function to filter nodes based on search term
  const filterNodesBySearch = (nodes: BookmarkNode[], term: string): BookmarkNode[] => {
    if (!term) return nodes;

    const lowerTerm = term.toLowerCase();
    return nodes.filter((node) => node.title.toLowerCase().includes(lowerTerm) || (node.url && node.url.toLowerCase().includes(lowerTerm)));
  };

  // Add a method to handle grouping of bookmark nodes
  const getGroupedNodes = (nodes: BookmarkNode[], groupType: GroupingType): BookmarkNode[] => {
    if (groupType === "none") return nodes;

    const nodesCopy = [...nodes];

    if (groupType === "alphabetical") {
      // Sort alphabetically by title
      return nodesCopy.sort((a, b) => a.title.localeCompare(b.title));
    } else if (groupType === "type") {
      // Sort by type (folders first, then bookmarks)
      return nodesCopy.sort((a, b) => {
        // If a has children and b doesn't, a comes first
        if (a.children && !b.children) return -1;
        // If b has children and a doesn't, b comes first
        if (!a.children && b.children) return 1;
        // Otherwise, sort alphabetically
        return a.title.localeCompare(b.title);
      });
    }

    return nodesCopy;
  };

  // Add a function to filter folder content by search term
  const filterFolderContentBySearch = (nodes: BookmarkNode[] | undefined, term: string): BookmarkNode[] => {
    if (!nodes) return [];
    if (!term) return nodes;

    const lowerTerm = term.toLowerCase();
    return nodes.filter((node) => node.title.toLowerCase().includes(lowerTerm) || (node.url && node.url.toLowerCase().includes(lowerTerm)));
  };

  // --- Rendering Functions ---
  const renderSelector = () => {
    const nodes = currentFolder?.children || bookmarks;
    const filteredNodes = filterNodesBySearch(nodes, searchTerm);
    const groupedNodes = getGroupedNodes(filteredNodes, groupingType);

    return (
      <div className="fixed inset-0 z-20 bg-black/50 backdrop-blur-lg p-4 overflow-y-auto flex items-center justify-center">
        <div ref={selectorRef} className="w-[70vw] h-[70vh] max-w-[1120px] bg-black/10 p-4 rounded-xl backdrop-blur-md overflow-y-auto relative">
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-2 mb-4 sticky top-0 bg-black/50 p-2 z-10">
            <button
              onClick={currentFolder ? navigateBack : closeSelector}
              className="flex items-center gap-1 bg-black/20 hover:bg-black/30 transition-colors rounded-lg px-2 py-1 text-white text-sm"
            >
              <ChevronLeft className="w-3 h-3" />
              {currentFolder ? "Back" : "Cancel"}
            </button>
            <h3 className="text-white text-lg font-medium flex-grow">{currentFolder ? currentFolder.title : "Select"}</h3>
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
                    tileIcon: "Luci",
                    position: selectedTileIndex !== null ? selectedTileIndex : 0,
                    createdAt: Date.now(),
                  })
                }
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm"
              >
                Confirm
              </button>
            )}
          </div>

          {/* Search and Grouping Controls */}
          <div className="mb-4 sticky top-14 z-10 space-y-2">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-5 h-5 text-white/70" />
              </div>
              <input
                type="text"
                placeholder="Search bookmarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 hover:bg-white/15 focus:bg-white/20 
                          rounded-lg text-white placeholder-white/60 text-base
                          border-2 border-transparent focus:border-white/30
                          transition-all duration-200 ease-in-out
                          focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Grouping Controls */}
            <div className="flex items-center space-x-2">
              <span className="text-white/70 text-sm">Group by:</span>
              <div className="flex bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setGroupingType("none")}
                  className={`px-2 py-1 rounded text-xs font-medium ${groupingType === "none" ? "bg-white/20 text-white" : "text-white/70 hover:text-white"}`}
                >
                  <Grid className="w-4 h-4 inline mr-1" />
                  None
                </button>
                <button
                  onClick={() => setGroupingType("alphabetical")}
                  className={`px-2 py-1 rounded text-xs font-medium ${groupingType === "alphabetical" ? "bg-white/20 text-white" : "text-white/70 hover:text-white"}`}
                >
                  <SortDesc className="w-4 h-4 inline mr-1" />
                  A-Z
                </button>
                <button
                  onClick={() => setGroupingType("type")}
                  className={`px-2 py-1 rounded text-xs font-medium ${groupingType === "type" ? "bg-white/20 text-white" : "text-white/70 hover:text-white"}`}
                >
                  <List className="w-4 h-4 inline mr-1" />
                  Type
                </button>
              </div>
            </div>
          </div>

          {/* Bookmark/Folder Grid with Responsive Font Sizes */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1">
            {groupedNodes.length > 0 ? (
              groupedNodes.map((node) => (
                <button
                  key={node.id}
                  onClick={() => (node.children ? navigateToFolder(node.id) : selectNode(node))}
                  className={`flex flex-col items-center justify-center p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl transition-colors`}
                >
                  {node.children ? (
                    <Folder className="w-6 h-6 mb-1 text-white" />
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
                  <span className="text-white text-center text-xs sm:text-sm font-medium line-clamp-2" title={node.title}>
                    {truncateTitle(node.title)}
                  </span>
                </button>
              ))
            ) : (
              <div className="col-span-full text-center text-white/70 py-8">No bookmarks match your search</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFolderContent = () => {
    if (!activeFolderContent) return null;

    const filteredFolderContent = filterFolderContentBySearch(activeFolderContent.children, folderSearchTerm);
    const groupedFolderContent = getGroupedNodes(filteredFolderContent, groupingType);

    return (
      <div className="fixed inset-0 z-10 bg-black/50 backdrop-blur-lg flex items-center justify-center p-4">
        <div ref={folderContentRef} className="w-[70vw] h-[70vh] max-w-[1400px] bg-black/10 p-4 rounded-xl backdrop-blur-md relative">
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-2 sticky top-0 bg-black/50 p-2 z-20">
            <button
              onClick={navigateBack}
              className="flex items-center gap-1 bg-black/20 hover:bg-black/30 transition-colors rounded-lg px-2 py-1 text-white text-sm"
            >
              <ChevronLeft className="w-3 h-3" />
              Back
            </button>
            <h3 className="text-white text-lg font-medium">{activeFolderContent.title}</h3>
          </div>

          {/* Search and Grouping Controls for Folder Content */}
          <div className="mt-2 mb-4 space-y-2">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-5 h-5 text-white/70" />
              </div>
              <input
                type="text"
                placeholder="Search in this folder..."
                value={folderSearchTerm}
                onChange={(e) => setFolderSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 hover:bg-white/15 focus:bg-white/20 
                          rounded-lg text-white placeholder-white/60 text-base
                          border-2 border-transparent focus:border-white/30
                          transition-all duration-200 ease-in-out
                          focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              {folderSearchTerm && (
                <button
                  onClick={() => setFolderSearchTerm("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Grouping Controls */}
            <div className="flex items-center space-x-2">
              <span className="text-white/70 text-sm">Group by:</span>
              <div className="flex bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setGroupingType("none")}
                  className={`px-2 py-1 rounded text-xs font-medium ${groupingType === "none" ? "bg-white/20 text-white" : "text-white/70 hover:text-white"}`}
                >
                  <Grid className="w-4 h-4 inline mr-1" />
                  None
                </button>
                <button
                  onClick={() => setGroupingType("alphabetical")}
                  className={`px-2 py-1 rounded text-xs font-medium ${groupingType === "alphabetical" ? "bg-white/20 text-white" : "text-white/70 hover:text-white"}`}
                >
                  <SortDesc className="w-4 h-4 inline mr-1" />
                  A-Z
                </button>
                <button
                  onClick={() => setGroupingType("type")}
                  className={`px-2 py-1 rounded text-xs font-medium ${groupingType === "type" ? "bg-white/20 text-white" : "text-white/70 hover:text-white"}`}
                >
                  <List className="w-4 h-4 inline mr-1" />
                  Type
                </button>
              </div>
            </div>
          </div>

          {/* Content Grid with Responsive Font Sizes */}
          <div className="overflow-y-auto h-[70%] pt-2">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1">
              {groupedFolderContent.length > 0 ? (
                groupedFolderContent.map((node) => (
                  <button
                    key={node.id}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
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
                    className="flex flex-col items-center justify-center p-2 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30 transition-colors w-full"
                  >
                    {node.children ? (
                      <Folder className="w-8 h-8 sm:w-10 sm:h-10 mb-1 text-white" />
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
                    <span className="font-medium text-white text-center text-secondary-800 text-[10px] sm:text-xs line-clamp-2" title={node.title}>
                      {truncateTitle(node.title)}
                    </span>
                  </button>
                ))
              ) : (
                <div className="col-span-full text-center text-white/70 py-8">No bookmarks match your search</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTile = (tile: TileConfig | null, index: number) => {
    // Don't create a new ref inside the function; use the array of refs
    const handleMenuButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const currentButtonRef = menuButtonRefs.current[index];
      if (currentButtonRef) {
        setMenuButtonRect(currentButtonRef.getBoundingClientRect());
      }
      setOpenMenuId(openMenuId === tile?.id ? null : tile?.id || null);
    };

    const commonClasses = `${ASPECT_RATIO} relative flex flex-col items-center justify-center p-2  backdrop-blur-md rounded-xl group cursor-pointer`; //removed bg-black/20

    const tileBackgroundColor = tile?.tileColor || "#f0f0f0"; // Use tileColor, default to #f0f0f0

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
    const actionMenuButton = (
      <button
        ref={(el) => (menuButtonRefs.current[index] = el)}
        id={`menu-button-${tile.id}`}
        onClick={handleMenuButtonClick}
        className="p-0.5 bg-black/0 hover:bg-black/20 rounded-md transition-colors action-menu"
        title="Menu"
      >
        <MoreHorizontal strokeWidth={0.5} className="w-3 h-3 text-white" />
      </button>
    );

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
          className={`${commonClasses} hover:bg-black/30 transition-colors`}
          style={{ position: "relative", zIndex: 1, backgroundColor: tileBackgroundColor }} // Set background color
          data-tile-index={index}
          onClick={() => navigateToFolder(tile.nodeId)}
        >
          <div className="absolute top-1 right-1">{actionMenuButton}</div>
          {openMenuId === tile.id && menuButtonRect && (
            <ActionMenuPortal
              tile={tile}
              index={index}
              buttonRect={menuButtonRect}
              onEdit={handleEdit}
              onClear={handleClear}
              onColor={() => handleColorClick(index)} // Pass index
              onClose={() => setOpenMenuId(null)}
            />
          )}
          <Folder className="w-3 h-3 mb-1 text-white relative z-10" />
          <span className="text-white text-center text-secondary-800 text-xs font-medium line-clamp-2 relative z-10" title={tile.title}>
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
        className={`${commonClasses} hover:bg-black/30 transition-colors`}
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
        <div className="absolute top-1 right-1">{actionMenuButton}</div>
        {openMenuId === tile.id && menuButtonRect && (
          <ActionMenuPortal
            tile={tile}
            index={index}
            buttonRect={menuButtonRect}
            onEdit={handleEdit}
            onClear={handleClear}
            onColor={() => handleColorClick(index)} // Pass index
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
        <span className="text-white text-center text-[0.8vh] font-medium line-clamp-2 relative z-10" title={tile.title}>
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
    </div>
  );
}
