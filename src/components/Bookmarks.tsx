import { useEffect, useState, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import createDatabase from "./IndexedDatabase/IndexedDatabase";
import { Folder, ChevronLeft, MoreHorizontal, Settings, Plus, Trash2, Palette } from "lucide-react";
import "./BackgroundSelector.css";
import Sortable from "sortablejs";
import { throttle } from "lodash";

// Constants
const MAX_TILES = 56;
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

// --- Database Setup ---
const bookmarkDB = createDatabase({
  dbName: "bookmarkManagerDB",
  storeName: "tiles",
  version: 1,
  keyPath: "id",
  indexes: [{ name: "createdAt", keyPath: "createdAt", unique: false }],
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
  // --- State ---
  const [bookmarks, setBookmarks] = useState<BookmarkNode[]>([]);
  const [preferences, setPreferences] = useState<BookmarkPreferences>({ tiles: [] });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [currentFolder, setCurrentFolder] = useState<BookmarkNode | null>(null);
  const [activeFolderContent, setActiveFolderContent] = useState<BookmarkNode | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [folderHistory, setFolderHistory] = useState<BookmarkNode[]>([]);
  const [menuButtonRect, setMenuButtonRect] = useState<DOMRect | null>(null);

  const [selectedTileColor, setSelectedTileColor] = useState<string>("rgba(0, 0, 0, 0.6)"); // State for color
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [tileIndexForColor, setTileIndexForColor] = useState<number | null>(null);

  // --- Refs ---
  const selectorRef = useRef<HTMLDivElement>(null);
  const folderContentRef = useRef<HTMLDivElement>(null);
  const tileGridRef = useRef<HTMLDivElement>(null);
  const sortableRef = useRef<Sortable | null>(null);

  // --- Effects ---
  // (Load initial data, save preferences, handle clicks outside - No changes here)

  // Load initial data (bookmarks and preferences).
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedPreferences = await bookmarkDB.getPreferences<BookmarkPreferences>();
        setPreferences(storedPreferences && Array.isArray(storedPreferences.tiles) ? storedPreferences : { tiles: [] });

        chrome.bookmarks.getTree((bookmarkNodes) => {
          const transformedNodes = bookmarkNodes[0].children?.map(transformBookmarkNode) || [];
          setBookmarks(transformedNodes);
        });
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, []);

  // Save preferences to IndexedDB whenever they change.
  useEffect(() => {
    const savePreferences = async () => {
      try {
        await bookmarkDB.savePreferences(preferences);
      } catch (error) {
        console.error("Error saving preferences to IndexedDB", error);
      }
    };

    savePreferences();
  }, [preferences]);

  // Save preferences to Chrome storage (sync).
  useEffect(() => {
    chrome.storage.sync.set({ bookmarkPreferences: preferences });
  }, [preferences]);

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
          const existingTile = preferences.tiles[index];
          newTiles.push(existingTile);
        } else {
          console.error("Tile element missing data-tile-index attribute");
          newTiles.push(null);
        }
      }

      while (newTiles.length < MAX_TILES) {
        newTiles.push(null);
      }
      console.log("Before setPreferences:", preferences.tiles);
      setPreferences((prevPreferences) => ({
        ...prevPreferences,
        tiles: newTiles,
      }));
      console.log("After setPreferences:", newTiles);
    }, 200),
    [preferences.tiles, tileGridRef]
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

  const selectNode = (node: BookmarkNode) => {
    if (selectedTileIndex === null) return;

    const newTile = {
      id: crypto.randomUUID(),
      type: node.children ? "folder" : "bookmark",
      nodeId: node.id,
      title: node.title,
      url: node.url,
      tileColor: node.tileColor || "rgba(0, 0, 0, 0.6)",
      tileIcon: node.tileIcon || "default",
    };

    updateTile(newTile);
  };

  const updateTile = (tile: TileConfig, color?: string) => {
    if (selectedTileIndex === null && tileIndexForColor === null) return;

    const indexToUpdate = selectedTileIndex !== null ? selectedTileIndex : tileIndexForColor;

    const newTiles = [...preferences.tiles];
    if (color && indexToUpdate !== null) {
      newTiles[indexToUpdate] = { ...tile, tileColor: color }; //Update with new color
    } else if (indexToUpdate !== null) {
      newTiles[indexToUpdate] = tile;
    }

    setPreferences({ ...preferences, tiles: newTiles });
    setIsSelecting(false);
    setSelectedTileIndex(null);
    setIsColorPickerOpen(false);
    setTileIndexForColor(null);
  };

  const clearTile = async (index: number) => {
    const tileToClear = preferences.tiles[index];
    if (!tileToClear) return;

    setPreferences((prevPreferences) => {
      const newTiles = [...prevPreferences.tiles];
      newTiles[index] = null;
      return { ...prevPreferences, tiles: newTiles };
    });

    await bookmarkDB.deleteItem(tileToClear.id);
  };

  const handleColorClick = (index: number) => {
    setTileIndexForColor(index);
    const tile = preferences.tiles[index];
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

    const currentTile = preferences.tiles[tileIndexForColor];
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
      } else {
        setCurrentFolder(null);
      }
    } else {
      if (folderHistory.length > 0) {
        const previousFolder = folderHistory[folderHistory.length - 1];
        setFolderHistory((prev) => prev.slice(0, prev.length - 1));
        setActiveFolderContent(previousFolder);
      } else {
        setActiveFolderContent(null);
      }
    }
  };

  const closeSelector = () => {
    setIsSelecting(false);
    setSelectedTileIndex(null);
    setCurrentFolder(null);
    setFolderHistory([]);
  };

  // --- Rendering Functions ---
  const renderSelector = () => {
    const nodes = currentFolder?.children || bookmarks;

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
                  })
                }
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm"
              >
                Confirm
              </button>
            )}
          </div>

          {/* Bookmark/Folder Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1">
            {nodes.map((node) => (
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
                <span className="text-white text-center text-lg text-[1vw] font-medium line-clamp-2">{node.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderFolderContent = () => {
    if (!activeFolderContent) return null;

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

          {/* Content Grid */}
          <div className="overflow-y-auto h-[85%] pt-2">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1">
              {activeFolderContent.children?.map((node) => (
                <button
                key={node.id}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                  if (node.children) {
                    navigateToFolder(node.id);
                  } else {
                    if (event.ctrlKey) {
                      window.open(node.url || "", '_blank');
                    } else {
                      window.location.href = node.url || "";
                    }
                  }
                }}
                className="flex flex-col items-center justify-center p-2 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30 transition-colors w-full"
              >
                {node.children ? (
                    <Folder className="w-10 h-10 mb-1 text-white" />
                  ) : (
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${node.url ? new URL(node.url).hostname : ""}&sz=16`}
                      alt=""
                      className="w-8 h-8 mb-1"
                      onError={(e) => {
                        e.currentTarget.src = "https://www.google.com/s2/favicons?domain=chrome&sz=16";
                      }}
                    />
                  )}
                  <span className="font-extrabold text-white text-center text-secondary-800 text-xs  line-clamp-2">{node.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTile = (tile: TileConfig | null, index: number) => {
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    const handleMenuButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (menuButtonRef.current) {
        setMenuButtonRect(menuButtonRef.current.getBoundingClientRect());
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
          className={`${ASPECT_RATIO} relative flex flex-col items-center justify-center p-2 bg-black/10 backdrop-blur-md rounded-xl group cursor-pointer`}
          key={`tile-empty-${index}`}
          data-tile-index={index}
        >
          <button onClick={() => openSelector(index)} className="flex flex-col items-center p-2 hover:bg-black/10 rounded-lg transition-colors">
            <Plus className="w-6 h-6 text-white/60 mb-1" />
          </button>
        </div>
      );
    }

    // --- Common Action Menu Button ---
    const actionMenuButton = (
      <button
        ref={menuButtonRef}
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
          <span className="text-white text-center text-secondary-800 text-xs font-medium line-clamp-2 relative z-10">{tile.title}</span>
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
              window.open(url, '_blank');
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
        <span className="text-white text-center text-[0.8vh] font-medium line-clamp-2 relative z-10">{tile.title}</span>
      </div>
    );
  };

  // --- Main Tile Grid Rendering ---
  const tiles = Array(MAX_TILES)
    .fill(null)
    .map((_, i) => (preferences?.tiles ? preferences.tiles[i] : null));

  return (
    <div className="relative">
      <div ref={tileGridRef} className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-8 gap-1">
        {tiles.map((tile, index) => renderTile(tile, index))}
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
