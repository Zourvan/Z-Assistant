import React, { useEffect, useState } from 'react';
import { Bookmark, Folder, ChevronLeft, Settings, Plus, Trash2 } from 'lucide-react';

interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  children?: BookmarkNode[];
}

interface TileConfig {
  id: string;
  type: 'bookmark' | 'folder';
  nodeId: string;
  title: string;
  url?: string;
}

interface BookmarkPreferences {
  tiles: TileConfig[];
}

const MAX_TILES = 30-6;
const ASPECT_RATIO = 'aspect-square';

export function Bookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkNode[]>([]);
  const [preferences, setPreferences] = useState<BookmarkPreferences>({ tiles: [] });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [currentFolder, setCurrentFolder] = useState<BookmarkNode | null>(null);
  const [activeFolderContent, setActiveFolderContent] = useState<BookmarkNode | null>(null);

  useEffect(() => {
    const loadData = async () => {
      chrome.storage.sync.get(['bookmarkPreferences'], (result) => {
        if (result.bookmarkPreferences) {
          setPreferences(result.bookmarkPreferences);
        }
      });

      chrome.bookmarks.getTree((bookmarkNodes) => {
        setBookmarks(bookmarkNodes[0].children || []);
      });
    };

    loadData();
  }, []);

  useEffect(() => {
    chrome.storage.sync.set({ bookmarkPreferences: preferences });
  }, [preferences]);

  const openSelector = (index: number) => {
    setSelectedTileIndex(index);
    setIsSelecting(true);
    setCurrentFolder(null);
  };

  const selectNode = (node: BookmarkNode) => {
    if (selectedTileIndex === null) return;

    const newTile = {
      id: crypto.randomUUID(),
      type: node.children ? 'folder' : 'bookmark',
      nodeId: node.id,
      title: node.title,
      url: node.url,
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
    setCurrentFolder(null);
  };

  const clearTile = (index: number) => {
    const newTiles = [...preferences.tiles];
    newTiles[index] = null;
    setPreferences({ ...preferences, tiles: newTiles.filter(Boolean) });
  };

  const navigateToFolder = (folderId: string) => {
    chrome.bookmarks.getSubTree(folderId, (nodes) => {
      if (nodes[0]) {
        if (isSelecting) {
          setCurrentFolder(nodes[0]);
        } else {
          setActiveFolderContent(nodes[0]);
        }
      }
    });
  };

  const navigateBack = () => {
    if (isSelecting) {
      setCurrentFolder(null);
    } else {
      setActiveFolderContent(null);
    }
  };

  const renderSelector = () => {
    const nodes = currentFolder?.children || bookmarks;

    return (
      <div className="fixed inset-0 z-20 bg-black/50 backdrop-blur-lg p-4 overflow-y-auto flex items-center justify-center">
        <div className="w-[80%] h-[80%] max-w-[1120px] bg-white/10 p-4 rounded-xl backdrop-blur-md overflow-y-auto relative">
          <div className="flex items-center justify-between gap-4 mb-6 sticky top-0 bg-black/50 p-4 z-10">
            <button
              onClick={currentFolder ? navigateBack : () => setIsSelecting(false)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-3 py-1.5 text-white"
            >
              <ChevronLeft className="w-4 h-4" />
              {currentFolder ? 'Back' : 'Cancel'}
            </button>
            <h3 className="text-white text-xl font-medium flex-grow">
              {currentFolder ? currentFolder.title : 'Select a bookmark or folder'}
            </h3>
            {currentFolder && (
              <button
                onClick={() => updateTile({
                  id: crypto.randomUUID(),
                  type: 'folder',
                  nodeId: currentFolder.id,
                  title: currentFolder.title,
                })}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
              >
                Confirm
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {nodes.map(node => (
              <button
                key={node.id}
                onClick={() => node.children ? navigateToFolder(node.id) : selectNode(node)}
                className={`flex flex-col items-center justify-center p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl transition-colors`}
              >
                {node.children ? (
                  <Folder className="w-8 h-8 mb-2 text-white" />
                ) : (
                  <img 
                    src={`https://www.google.com/s2/favicons?domain=${node.url ? new URL(node.url).hostname : ''}&sz=32`}
                    alt=""
                    className="w-8 h-8 mb-2"
                    onError={(e) => {
                      e.currentTarget.src = 'https://www.google.com/s2/favicons?domain=chrome&sz=32';
                    }}
                  />
                )}
                <span className="text-white text-center text-sm font-medium line-clamp-2">
                  {node.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTile = (tile: TileConfig | null, index: number) => {
    if (!tile) {
      return (
        <div className={`${ASPECT_RATIO} relative flex flex-col items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-xl group`}>
          <button
            onClick={() => openSelector(index)}
            className="flex flex-col items-center p-3 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Plus className="w-6 h-6 text-white/60 mb-1" />
            <span className="text-white/60 text-xs">Add Bookmark or Folder</span>
          </button>
        </div>
      );
    }

    const commonClasses = `${ASPECT_RATIO} relative flex flex-col items-center justify-center p-4 bg-white/20 backdrop-blur-md rounded-xl group`;
    const actionButtons = (
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openSelector(index);
          }}
          className="p-1.5 bg-white/0 hover:bg-white/20 rounded-lg transition-colors"
          title="Edit"
        >
          <Settings className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            clearTile(index);
          }}
          className="p-1.5 bg-white/0 hover:bg-red-500/20 rounded-lg transition-colors"
          title="Clear"
        >
          <Trash2 className="w-4 h-4 text-white" />
        </button>
      </div>
    );

    if (tile.type === 'folder') {
      return (
        <button
          onClick={() => navigateToFolder(tile.nodeId)}
          className={`${commonClasses} hover:bg-white/30 transition-colors`}
        >
          {actionButtons}
          <Folder className="w-8 h-8 mb-2 text-white" />
          <span className="text-white text-center text-sm font-medium line-clamp-2">
            {tile.title}
          </span>
        </button>
      );
    }

    return (
      <a
        href={tile.url}
        className={`${commonClasses} hover:bg-white/30 transition-colors`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {actionButtons}
        <img
          src={`https://www.google.com/s2/favicons?domain=${tile.url ? new URL(tile.url).hostname : ''}&sz=32`}
          alt=""
          className="w-8 h-8 mb-2"
          onError={(e) => {
            e.currentTarget.src = 'https://www.google.com/s2/favicons?domain=chrome&sz=32';
          }}
        />
        <span className="text-white text-center text-sm font-medium line-clamp-2">
          {tile.title}
        </span>
      </a>
    );
  };

  const renderFolderContent = () => {
    if (!activeFolderContent) return null;
  
    return (
      <div className="fixed inset-0 z-10 bg-black/50 backdrop-blur-lg flex items-center justify-center p-4">
        <div className="w-[80%] h-[80%] max-w-[1400px] bg-white/10 p-4 rounded-xl backdrop-blur-md relative box-border">
    
          {/* هدر ثابت */}
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
    
          {/* محتوای اصلی با تنظیمات مناسب اسکرول */}
          <div className="overflow-y-auto overflow-x-hidden h-[85%] pt-4 box-border">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {activeFolderContent.children?.map(node => (
                <button
                  key={node.id}
                  onClick={() => node.children ? navigateToFolder(node.id) : window.open(node.url, '_blank')}
                  className="flex flex-col items-center justify-center p-4 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30 transition-colors box-border"
                  style={{ width: '100%' }}
                >
                  {node.children ? (
                    <Folder className="w-8 h-8 mb-2 text-white" />
                  ) : (
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${node.url ? new URL(node.url).hostname : ''}&sz=32`}
                      alt=""
                      className="w-8 h-8 mb-2"
                      onError={(e) => {
                        e.currentTarget.src = 'https://www.google.com/s2/favicons?domain=chrome&sz=32';
                      }}
                    />
                  )}
                  <span className="text-white text-center text-sm font-medium line-clamp-2">
                    {node.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
    
        </div>
      </div>
    );
    
  };
  

  const tiles = Array(MAX_TILES).fill(null).map((_, i) => preferences.tiles[i] || null);

  return (
    <div className="relative">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {tiles.map((tile, index) => renderTile(tile, index))}
      </div>

      {isSelecting && renderSelector()}
      {activeFolderContent && renderFolderContent()}
    </div>
  );
}
