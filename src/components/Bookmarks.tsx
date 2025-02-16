import { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import createDatabase from "./IndexedDatabase/IndexedDatabase";
import { Folder, ChevronLeft, MoreHorizontal, Settings, Plus, Trash2, Palette } from "lucide-react";

import "./BackgroundSelector.css";

const bookmarkDB = createDatabase({
  dbName: "bookmarkManagerDB",
  storeName: "tiles",
  version: 1,
  keyPath: "id",
  indexes: [{ name: "createdAt", keyPath: "createdAt", unique: false }]
});

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
  tiles: TileConfig[];
}

const MAX_TILES = 30;
const ASPECT_RATIO = "aspect-ratio";

// کامپوننتی برای رندر منوی action در یک پورتال
interface ActionMenuPortalProps {
  tile: TileConfig;
  buttonRect: DOMRect;
  index: number;
  onEdit: () => void;
  onClear: () => void;
  onColor: () => void;
  onClose: () => void;
}

function ActionMenuPortal({ tile, buttonRect, index, onEdit, onClear, onColor, onClose }: ActionMenuPortalProps) {
  const style = {
    position: "absolute" as const,
    top: buttonRect.bottom + window.scrollY,
    left: buttonRect.left + window.scrollX,
    zIndex: 10000
  };

  // اضافه کردن کلاس action-menu به ریشه منو
  const menu = (
    <div style={style} className="action-menu py-1 w-32 bg-black/100 backdrop-blur-md rounded-lg shadow-lg">
      <button
        id={`edit-button-${tile.id}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onEdit();
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-white hover:bg-white/20 transition-colors flex items-center gap-2"
      >
        <Settings className="w-4 h-4" />
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
        className="w-full px-4 py-2 text-left text-white hover:bg-red-500/20 transition-colors flex items-center gap-2"
      >
        <Trash2 className="w-4 h-4" />
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
        className="w-full px-4 py-2 text-left text-white hover:bg-red-500/20 transition-colors flex items-center gap-2"
      >
        <Palette className="w-4 h-4" />
        <span>Color</span>
      </button>
    </div>
  );

  return ReactDOM.createPortal(menu, document.body);
}

export function Bookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkNode[]>([]);
  const [preferences, setPreferences] = useState<BookmarkPreferences>({ tiles: [] });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [currentFolder, setCurrentFolder] = useState<BookmarkNode | null>(null);
  const [activeFolderContent, setActiveFolderContent] = useState<BookmarkNode | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [folderHistory, setFolderHistory] = useState<BookmarkNode[]>([]);
  const [menuButtonRect, setMenuButtonRect] = useState<DOMRect | null>(null);

  const selectorRef = useRef<HTMLDivElement>(null);
  const folderContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedPreferences = await bookmarkDB.getPreferences<BookmarkPreferences>();
        if (storedPreferences && Array.isArray(storedPreferences.tiles)) {
          setPreferences(storedPreferences);
        } else {
          setPreferences({ tiles: [] });
        }
        chrome.bookmarks.getTree((bookmarkNodes) => {
          setBookmarks(bookmarkNodes[0].children || []);
        });
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, []);

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

  useEffect(() => {
    chrome.storage.sync.set({ bookmarkPreferences: preferences });
  }, [preferences]);

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSelecting, activeFolderContent]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && !(event.target as Element).closest(".action-menu")) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

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
      tileColor: node.tileColor,
      tileIcon: node.tileIcon
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

  const navigateToFolder = (folderId: string) => {
    chrome.bookmarks.getSubTree(folderId, (nodes) => {
      if (nodes[0]) {
        if (isSelecting) {
          if (currentFolder) {
            setFolderHistory((prev) => [...prev, currentFolder]);
          }
          setCurrentFolder(nodes[0]);
        } else {
          if (activeFolderContent) {
            setFolderHistory((prev) => [...prev, activeFolderContent]);
          }
          setActiveFolderContent(nodes[0]);
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

  const renderSelector = () => {
    const nodes = currentFolder?.children || bookmarks;

    return (
      <div className="fixed inset-0 z-20 bg-black/50 backdrop-blur-lg p-4 overflow-y-auto flex items-center justify-center">
        <div ref={selectorRef} className="w-[80vw] h-[80vh] max-w-[1120px] bg-white/10 p-4 rounded-xl backdrop-blur-md overflow-y-auto relative">
          <div className="flex items-center justify-between gap-4 mb-6 sticky top-0 bg-black/50 p-4 z-10">
            <button
              onClick={currentFolder ? navigateBack : closeSelector}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-3 py-1.5 text-white"
            >
              <ChevronLeft className="w-4 h-4" />
              {currentFolder ? "Back" : "Cancel"}
            </button>
            <h3 className="text-white text-xl font-medium flex-grow">{currentFolder ? currentFolder.title : "Select a bookmark or folder"}</h3>
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
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
              >
                Confirm
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {nodes.map((node) => (
              <button
                key={node.id}
                onClick={() => (node.children ? navigateToFolder(node.id) : selectNode(node))}
                className={`flex flex-col items-center justify-center p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl transition-colors`}
              >
                {node.children ? (
                  <Folder className="w-8 h-8 mb-2 text-white" />
                ) : (
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${node.url ? new URL(node.url).hostname : ""}&sz=32`}
                    alt=""
                    className="w-8 h-8 mb-2"
                    onError={(e) => {
                      e.currentTarget.src = "https://www.google.com/s2/favicons?domain=chrome&sz=32";
                    }}
                  />
                )}
                <span className="text-white text-center text-[2vh] font-medium line-clamp-2">{node.title}</span>
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
        <div ref={folderContentRef} className="w-[80vw] h-[80vh] max-w-[1400px] bg-white/10 p-4 rounded-xl backdrop-blur-md relative">
          <div className="flex items-center justify-between gap-4 sticky top-0 bg-black/50 p-4 z-20">
            <button
              onClick={navigateBack}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-3 py-1.5 text-white"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <h3 className="text-white text-xl font-medium">{activeFolderContent.title}</h3>
          </div>

          <div className="overflow-y-auto h-[85%] pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
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
                  className="flex flex-col items-center justify-center p-4 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30 transition-colors w-full"
                >
                  {node.children ? (
                    <Folder className="w-8 h-8 mb-2 text-white" />
                  ) : (
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${node.url ? new URL(node.url).hostname : ""}&sz=32`}
                      alt=""
                      className="w-8 h-8 mb-2"
                      onError={(e) => {
                        e.currentTarget.src = "https://www.google.com/s2/favicons?domain=chrome&sz=32";
                      }}
                    />
                  )}
                  <span className="font-bold text-white text-center text-sm line-clamp-2">{node.title}</span>
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
        const rect = menuButtonRef.current.getBoundingClientRect();
        setMenuButtonRect(rect);
      }
      setOpenMenuId(openMenuId === tile?.id ? null : tile?.id || null);
    };

    const commonClasses = `${ASPECT_RATIO} relative flex flex-col items-center justify-center p-4 bg-white/20 backdrop-blur-md rounded-xl group`;

    if (!tile) {
      return (
        <div
          id={`tile-empty-${index}`}
          className={`${ASPECT_RATIO} relative flex flex-col items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-xl group`}
          key={`tile-empty-${index}`}
        >
          <button onClick={() => openSelector(index)} className="flex flex-col items-center p-3 hover:bg-white/10 rounded-lg transition-colors">
            <Plus className="w-6 h-6 text-white/60 mb-1" />
          </button>
        </div>
      );
    }

    const handleEdit = () => {
      openSelector(index);
    };

    const handleClear = () => {
      clearTile(index);
    };

    const handleColor = () => {
      console.log("Change color");
    };

    const actionMenuButton = (
      <button
        ref={menuButtonRef}
        id={`menu-button-${tile.id}`}
        onClick={handleMenuButtonClick}
        className="p-0.75 bg-white/0 hover:bg-white/20 rounded-md transition-colors action-menu"
        title="Menu"
      >
        <MoreHorizontal strokeWidth={0.5} className="w-4 h-4 text-white" />
      </button>
    );

    if (tile.type === "folder") {
      return (
        <button
          key={`folder-tile-${tile.nodeId}`}
          id={`folder-tile-${tile.nodeId}`}
          onClick={() => navigateToFolder(tile.nodeId)}
          className={`${commonClasses} hover:bg-white/30 transition-colors`}
          style={{ position: "relative", zIndex: 1 }}
        >
          <div className="absolute top-2 right-2">{actionMenuButton}</div>
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
          <Folder className="w-8 h-8 mb-2 text-white" />
          <span className="text-white text-center text-[0.8vw] font-medium line-clamp-2">{tile.title}</span>
        </button>
      );
    }

    return (
      <a
        key={`bookmark-tile-${tile.nodeId}`}
        id={`bookmark-tile-${tile.nodeId}`}
        href={tile.url}
        className={`${commonClasses} hover:bg-white/30 transition-colors`}
        target="_self"
        onClick={(e) => {
          e.preventDefault();
          window.location.href = tile.url || "";
        }}
        rel="noopener noreferrer"
        style={{ position: "relative", zIndex: 1 }}
      >
        <div className="absolute top-2 right-2">{actionMenuButton}</div>
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
          className="w-8 h-8 mb-2"
          onError={(e) => {
            e.currentTarget.src = "https://www.google.com/s2/favicons?domain=chrome&sz=32";
          }}
        />
        <span className="text-white text-center text-[1vh] font-medium line-clamp-2">{tile.title}</span>
      </a>
    );
  };

  const tiles = Array(MAX_TILES)
    .fill(null)
    .map((_, i) => (preferences?.tiles ? preferences.tiles[i] : null));

  return (
    <div className="relative">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">{tiles.map((tile, index) => renderTile(tile, index))}</div>
      {isSelecting && renderSelector()}
      {activeFolderContent && renderFolderContent()}
    </div>
  );
}
