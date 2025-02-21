import { useEffect, useState, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import createDatabase from "./IndexedDatabase/IndexedDatabase";
import { Folder, ChevronLeft, MoreHorizontal, Settings, Plus, Trash2, Palette } from "lucide-react";
import "./BackgroundSelector.css";
import Sortable from "sortablejs"; // Import SortableJS
import { throttle } from "lodash"; // Import throttle

// Constants
const MAX_TILES = 60;
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
  indexes: [{ name: "createdAt", keyPath: "createdAt", unique: false }]
});

// --- Helper Functions ---

// Transforms a Chrome BookmarkTreeNode to our custom BookmarkNode format.
function transformBookmarkNode(node: chrome.bookmarks.BookmarkTreeNode): BookmarkNode {
  return {
    id: node.id,
    title: node.title,
    url: node.url,
    tileIcon: "default", // Default icon
    tileColor: "#F0F0F0", // Default color
    children: node.children?.map((child) => transformBookmarkNode(child))
  };
}

// --- Action Menu Component (Portal) ---

function ActionMenuPortal({ tile, buttonRect, onEdit, onClear, onColor, onClose }: ActionMenuPortalProps) {
  const style = {
    position: "absolute" as const,
    top: buttonRect.bottom + window.scrollY,
    left: buttonRect.left + window.scrollX,
    zIndex: 10000
  };

  return ReactDOM.createPortal(
    <div style={style} className="action-menu py-0.5 w-24 bg-black/100 backdrop-blur-md rounded-lg shadow-lg">
      <button
        id={`edit-button-${tile.id}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onEdit();
          onClose();
        }}
        className="w-full px-2 py-1 text-left text-white hover:bg-white/20 transition-colors flex items-center gap-1 text-sm"
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
          onColor();
          onClose();
        }}
        className="w-full px-2 py-1 text-left text-white hover:bg-red-500/20 transition-colors flex items-center gap-1 text-sm"
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

  // --- Refs ---
  const selectorRef = useRef<HTMLDivElement>(null);
  const folderContentRef = useRef<HTMLDivElement>(null);
  const tileGridRef = useRef<HTMLDivElement>(null); // Ref for the tile grid container
  const sortableRef = useRef<Sortable | null>(null); // Ref for the Sortable instance

  // --- Effects ---

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

  // Memoize handleSortEnd using useCallback.  This is crucial for performance
  // and to prevent unnecessary re-renders and re-initializations of Sortable.
  const handleSortEndCallback = useCallback(
    throttle(async () => {
      if (!tileGridRef.current) {
        return;
      }

      const tileElements = Array.from(tileGridRef.current.children);
      const newTiles: (TileConfig | null)[] = [];

      //Build the new tiles array
      for (const tileElement of tileElements) {
        const indexStr = tileElement.getAttribute("data-tile-index");
        if (indexStr) {
          const index = parseInt(indexStr, 10);
          const existingTile = preferences.tiles[index]; //Finds the original tile.
          newTiles.push(existingTile); //Add the tile (or null)
        } else {
          console.error("Tile element missing data-tile-index attribute");
          newTiles.push(null); //Should never occur, but good practice to avoid errors
        }
      }

      //Pad the array if there are empty tiles at the end.
      while (newTiles.length < MAX_TILES) {
        newTiles.push(null);
      }
      console.log("Before setPreferences:", preferences.tiles); // Log before
      // Set the *entire* newTiles array.
      setPreferences((prevPreferences) => ({
        ...prevPreferences,
        tiles: newTiles
      }));
      console.log("After setPreferences:", newTiles); //Log after
    }, 200),
    [preferences.tiles, tileGridRef]
  ); //tileGridRef added as dependency

  // Initialize SortableJS on the tile grid.  Use useCallback for onEnd.
  useEffect(() => {
    if (tileGridRef.current) {
      sortableRef.current = new Sortable(tileGridRef.current, {
        animation: 150,
        onEnd: handleSortEndCallback // Use the memoized handler
      });
    }

    // Cleanup function to destroy the Sortable instance.
    return () => {
      sortableRef.current?.destroy();
      sortableRef.current = null;
    };
  }, [handleSortEndCallback]); //  handleSortEndCallback is a dependency

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
      tileColor: node.tileColor || "#F0F0F0",
      tileIcon: node.tileIcon || "default"
    };

    updateTile(newTile);
  };

  const updateTile = (tile: TileConfig) => {
    if (selectedTileIndex === null) return;

    const newTiles = [...preferences.tiles];
    newTiles[selectedTileIndex] = tile;

    setPreferences({ ...preferences, tiles: newTiles });
    setIsSelecting(false);
    setSelectedTileIndex(null);
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

  // --- Navigation Functions ---
  const navigateToFolder = (folderId: string) => {
    chrome.bookmarks.getSubTree(folderId, (nodes) => {
      if (nodes[0]) {
        const transformedNode = transformBookmarkNode(nodes[0]);
        //Distinguish between selector and folder content
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
    //Distinguish between selector and folder content
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
        <div ref={selectorRef} className="w-[70vw] h-[70vh] max-w-[1120px] bg-white/10 p-4 rounded-xl backdrop-blur-md overflow-y-auto relative">
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-2 mb-4 sticky top-0 bg-black/50 p-2 z-10">
            <button
              onClick={currentFolder ? navigateBack : closeSelector}
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-2 py-1 text-white text-sm"
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
                    tileColor: "#F0F0F0",
                    tileIcon: "Luci"
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
                <span className="text-white text-center text-[1vh] font-medium line-clamp-2">{node.title}</span>
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
        <div ref={folderContentRef} className="w-[70vw] h-[70vh] max-w-[1400px] bg-white/10 p-4 rounded-xl backdrop-blur-md relative">
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-2 sticky top-0 bg-black/50 p-2 z-20">
            <button
              onClick={navigateBack}
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-2 py-1 text-white text-sm"
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
                  onClick={() => {
                    if (node.children) {
                      navigateToFolder(node.id);
                    } else {
                      window.location.href = node.url || "";
                    }
                  }}
                  className="flex flex-col items-center justify-center p-2 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30 transition-colors w-full"
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
                  <span className="font-bold text-white text-center text-[1vh] line-clamp-2">{node.title}</span>
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

    const commonClasses = `${ASPECT_RATIO} relative flex flex-col items-center justify-center p-2 bg-white/20 backdrop-blur-md rounded-xl group`;

    // --- Empty Tile ---
    if (!tile) {
      return (
        <div
          id={`tile-empty-${index}`}
          className={`${ASPECT_RATIO} relative flex flex-col items-center justify-center p-2 bg-white/10 backdrop-blur-md rounded-xl group`}
          key={`tile-empty-${index}`}
          data-tile-index={index} // Add data attribute for Sortable
        >
          <button onClick={() => openSelector(index)} className="flex flex-col items-center p-2 hover:bg-white/10 rounded-lg transition-colors">
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
        className="p-0.5 bg-white/0 hover:bg-white/20 rounded-md transition-colors action-menu"
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
    const handleColor = () => {
      console.log("Change color");
    };

    // --- Folder Tile ---
    if (tile.type === "folder") {
      return (
        <div
          key={`folder-tile-${tile.nodeId}`}
          id={`folder-tile-${tile.nodeId}`}
          className={`${commonClasses} hover:bg-white/30 transition-colors`}
          style={{ position: "relative", zIndex: 1 }}
          data-tile-index={index} // Add data attribute for Sortable
        >
          <button
            onClick={() => navigateToFolder(tile.nodeId)}
            className="h-full w-full absolute inset-0" // Clickable area
          >
            {/* Empty button for click handling */}
          </button>
          <div className="absolute top-1 right-1">{actionMenuButton}</div>
          {openMenuId === tile.id && menuButtonRect && (
            <ActionMenuPortal
              tile={tile}
              index={index}
              buttonRect={menuButtonRect}
              onEdit={handleEdit}
              onClear={handleClear}
              onColor={handleColor}
              onClose={() => setOpenMenuId(null)}
            />
          )}
          <Folder className="w-6 h-6 mb-1 text-white relative z-10" />
          <span className="text-white text-center text-[0.6vw] font-medium line-clamp-2 relative z-10">{tile.title}</span>
        </div>
      );
    }

    // --- Bookmark Tile ---
    return (
      <div
        key={`bookmark-tile-${tile.nodeId}`}
        id={`bookmark-tile-${tile.nodeId}`}
        className={`${commonClasses} hover:bg-white/30 transition-colors`}
        style={{ position: "relative", zIndex: 1 }}
        data-tile-index={index} // Add data attribute for Sortable
      >
        <a
          href={tile.url}
          target="_self"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = tile.url || "";
          }}
          rel="noopener noreferrer"
          className="h-full w-full absolute inset-0" // Clickable area
        >
          {/*Empty a for click handling */}
        </a>
        <div className="absolute top-1 right-1">{actionMenuButton}</div>
        {openMenuId === tile.id && menuButtonRect && (
          <ActionMenuPortal
            tile={tile}
            index={index}
            buttonRect={menuButtonRect}
            onEdit={handleEdit}
            onClear={handleClear}
            onColor={handleColor}
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
      <div ref={tileGridRef} className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1">
        {tiles.map((tile, index) => renderTile(tile, index))}
      </div>
      {isSelecting && renderSelector()}
      {activeFolderContent && renderFolderContent()}
    </div>
  );
}
