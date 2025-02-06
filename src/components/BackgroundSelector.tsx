import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Image, Upload, Link, X, Palette } from 'lucide-react';

interface BackgroundSelectorProps {
  onSelectBackground: (background: string) => void;
  storageKey?: string;
}

const isDataUrl = (url: string) => url.startsWith('data:');
const isColor = (str: string) => /^#([0-9A-F]{3}){1,2}$/i.test(str);

const processImageUrl = (url: string, width = 1920, height = 1080) => {
  if (isDataUrl(url) || isColor(url)) {
    return url;
  }
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('auto', 'format');
    urlObj.searchParams.set('fit', 'crop');
    urlObj.searchParams.set('w', width.toString());
    urlObj.searchParams.set('h', height.toString());
    return urlObj.toString();
  } catch {
    return url;
  }
};

const BackgroundThumbnail: React.FC<{
  bg: { id: string; url: string; isBlob: boolean; type: 'image' | 'color' };
  onSelect: () => void;
  onRemove?: () => void;
}> = ({ bg, onSelect, onRemove }) => {
  const [isLoading, setIsLoading] = useState(bg.type === 'image');
  const [error, setError] = useState(false);

  return (
    <div className="relative group aspect-square">
      <button
        onClick={onSelect}
        className="w-full h-full rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
        style={bg.type === 'color' ? { backgroundColor: bg.url } : {}}
      >
        {bg.type === 'image' && (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-200 animate-pulse">
                <Image className="w-6 h-6 text-slate-400" />
              </div>
            )}
            {error ? (
              <div className="absolute inset-0 flex items-center justify-center bg-red-100">
                <X className="w-6 h-6 text-red-400" />
              </div>
            ) : (
              <img 
                src={bg.url}
                alt="Background option"
                className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                loading="lazy"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setError(true);
                }}
              />
            )}
          </>
        )}
      </button>
      {bg.isBlob && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      )}
    </div>
  );
};

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({ 
  onSelectBackground,
  storageKey = 'selectedBackground'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'images' | 'colors'>('images');
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [savedBackgrounds, setSavedBackgrounds] = useState<Array<{
    id: string;
    url: string;
    isBlob: boolean;
    type: 'image' | 'color';
  }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultBackgrounds = useMemo(() => [
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05',
  ].map(url => ({ id: url, url, isBlob: false, type: 'image' as const })), []);

  const colorOptions = useMemo(() => [
    '#000000', // black
    '#FFFFFF', // white
    '#1E40AF', // blue-800
    '#047857', // emerald-800
    '#B45309', // amber-700
    '#9F1239', // rose-800
    '#4C1D95', // violet-900
    '#831843', // pink-800
    '#3730A3', // indigo-800
    '#064E3B', // emerald-900
    '#701A75', // fuchsia-800
    '#7C2D12', // orange-900
  ].map(color => ({
    id: color,
    url: color,
    isBlob: false,
    type: 'color' as const
  })), []);

  useEffect(() => {
    const loadSavedBackgrounds = () => {
      const savedBgs = localStorage.getItem('savedBackgrounds');
      if (savedBgs) {
        try {
          const parsed = JSON.parse(savedBgs);
          if (Array.isArray(parsed)) {
            const validBackgrounds = parsed.filter(bg => 
              typeof bg === 'object' && bg.url && 
              (!bg.isBlob || bg.url.startsWith('data:')) &&
              (bg.type === 'image' || bg.type === 'color')
            );
            setSavedBackgrounds(validBackgrounds);
          }
        } catch {
          setSavedBackgrounds([]);
        }
      }
    };

    loadSavedBackgrounds();
  }, []);

  useEffect(() => {
    const lastSelected = localStorage.getItem(storageKey);
    if (lastSelected) {
      try {
        const parsed = JSON.parse(lastSelected);
        if (!parsed.isBlob || parsed.url.startsWith('data:')) {
          onSelectBackground(parsed.url);
        }
      } catch {
        onSelectBackground(lastSelected);
      }
    }
  }, [storageKey, onSelectBackground]);

  const handleSelectBackground = useCallback((background: { url: string; isBlob: boolean; type: 'image' | 'color' }) => {
    const finalUrl = background.type === 'image' && !isDataUrl(background.url) ? 
      processImageUrl(background.url) : 
      background.url;
      
    onSelectBackground(finalUrl);
    localStorage.setItem(storageKey, JSON.stringify({
      ...background,
      url: finalUrl
    }));
    setIsOpen(false);
  }, [onSelectBackground, storageKey]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          const newBackground = {
            id: `bg-${Date.now()}`,
            url: dataUrl,
            isBlob: true,
            type: 'image' as const
          };
          
          const updatedBackgrounds = [...savedBackgrounds, newBackground];
          setSavedBackgrounds(updatedBackgrounds);
          localStorage.setItem('savedBackgrounds', JSON.stringify(updatedBackgrounds));
          handleSelectBackground(newBackground);
        }
      };
      reader.readAsDataURL(file);
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      alert('Error uploading image');
    } finally {
      setIsUploading(false);
    }
  }, [savedBackgrounds, handleSelectBackground]);

  const handleUrlSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    try {
      new URL(urlInput);
      if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(urlInput)) {
        alert('Please enter a valid image URL');
        return;
      }

      const newBackground = {
        id: `bg-${Date.now()}`,
        url: urlInput,
        isBlob: false,
        type: 'image' as const
      };
      
      const updatedBackgrounds = [...savedBackgrounds, newBackground];
      setSavedBackgrounds(updatedBackgrounds);
      localStorage.setItem('savedBackgrounds', JSON.stringify(updatedBackgrounds));
      handleSelectBackground(newBackground);
      setUrlInput('');
    } catch {
      alert('Please enter a valid URL');
    }
  }, [urlInput, savedBackgrounds, handleSelectBackground]);

  const handleRemoveBackground = useCallback((backgroundToRemove: typeof savedBackgrounds[0]) => {
    const updatedBackgrounds = savedBackgrounds.filter(bg => bg.id !== backgroundToRemove.id);
    setSavedBackgrounds(updatedBackgrounds);
    localStorage.setItem('savedBackgrounds', JSON.stringify(updatedBackgrounds));

    const currentBackground = localStorage.getItem(storageKey);
    if (currentBackground === backgroundToRemove.url) {
      handleSelectBackground(defaultBackgrounds[0]);
    }
  }, [savedBackgrounds, defaultBackgrounds, storageKey, handleSelectBackground]);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/30 transition-colors shadow-lg"
      >
        <Image className="w-5 h-5 text-white" />
      </button>

      {isOpen && (
        <div className="mt-2 bg-white/20 backdrop-blur-md rounded-xl p-4 w-72 shadow-lg">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('images')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 ${
                activeTab === 'images' ? 'bg-white/30' : 'hover:bg-white/20'
              } transition-colors text-white`}
            >
              <Image className="w-4 h-4" />
              Images
            </button>
            <button
              onClick={() => setActiveTab('colors')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 ${
                activeTab === 'colors' ? 'bg-white/30' : 'hover:bg-white/20'
              } transition-colors text-white`}
            >
              <Palette className="w-4 h-4" />
              Colors
            </button>
          </div>

          {activeTab === 'images' ? (
            <>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[...defaultBackgrounds, ...savedBackgrounds.filter(bg => bg.type === 'image')].map((bg) => (
                  <BackgroundThumbnail
                    key={bg.id}
                    bg={bg}
                    onSelect={() => handleSelectBackground(bg)}
                    onRemove={bg.isBlob ? () => handleRemoveBackground(bg) : undefined}
                  />
                ))}
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-white/30 hover:bg-white/40 transition-colors px-4 py-2 rounded-lg text-sm text-white flex items-center justify-center gap-2"
                  disabled={isUploading}
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.gif"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <form onSubmit={handleUrlSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Enter image URL"
                    className="flex-1 bg-white/20 text-white placeholder-white/60 px-3 py-2 rounded-lg text-sm"
                  />
                  <button
                    type="submit"
                    className="bg-white/30 hover:bg-white/40 transition-colors p-2 rounded-lg"
                  >
                    <Link className="w-4 h-4 text-white" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {colorOptions.map((color) => (
                <BackgroundThumbnail
                  key={color.id}
                  bg={color}
                  onSelect={() => handleSelectBackground(color)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BackgroundSelector;

