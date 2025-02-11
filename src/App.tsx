import  { useState, useEffect } from 'react';
import { Clock } from './components/Clock';
import { Calendar } from './components/Calendar';
import { Bookmarks } from './components/Bookmarks';
import {BackgroundSelector,CalendarProvider} from './components/BackgroundSelector';
import { TodoList } from './components/TodoList';
import { Notes } from './components/Notes';
import SocialLinks from './components/SocialLinks';
import './App.css'

// Helper function to get image from IndexedDB
const getImageFromIndexedDB = async (id: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('backgroundsDB', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => resolve(getRequest.result?.data);
      getRequest.onerror = () => reject(getRequest.error);
    };
  });
};

function App() {
  const [background, setBackground] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleBackgroundChange = async (newBackground: string) => {
    try {
      setIsLoading(true);
      
      // If it's a color
      if (newBackground.startsWith('#')) {
        setBackground('none');
        document.documentElement.style.backgroundColor = newBackground;
        document.documentElement.style.backgroundImage = 'none';
      }
      // If it's a gradient
      else if (newBackground.startsWith('linear-gradient')) {
        setBackground('none');
        document.documentElement.style.backgroundImage = newBackground;
        document.documentElement.style.backgroundColor = 'transparent';
      }
      // If it's an IndexedDB image ID (starts with 'bg-')
      else if (newBackground.startsWith('bg-')) {
        try {
          const imageUrl = await getImageFromIndexedDB(newBackground);
          setBackground(imageUrl);
          document.documentElement.style.backgroundImage = 'none';
          document.documentElement.style.backgroundColor = 'transparent';
        } catch (error) {
          console.error('Error loading background from IndexedDB:', error);
          // Fallback to default background
          // setBackground('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b');
        }
      }
      // If it's a regular image URL
      else {
        setBackground(newBackground);
        document.documentElement.style.backgroundImage = 'none';
        document.documentElement.style.backgroundColor = 'transparent';
      }
    } catch (error) {
      console.error('Error changing background:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load saved background on initial render
  useEffect(() => {
    const loadSavedBackground = async () => {
      const savedBackground = localStorage.getItem('selectedBackground');
      if (savedBackground) {
        await handleBackgroundChange(savedBackground);
      }
    };
    
    loadSavedBackground();
  }, []);

  return (
    <CalendarProvider>
      <div 
        className={`min-h-screen bg-cover bg-center transition-all duration-700 ease-in-out relative ${
          isLoading ? 'opacity-50' : 'opacity-100'
        }`}
        style={{ 
          backgroundImage: background !== 'none' ? `url(${background})` : 'none',
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        )}
        
        <div className="min-h-screen backdrop-blur-[2px] bg-black/50 p-4 md:p-8 transition-all duration-300 overflow-x-hidden">
          <div   className="max-w-[80vw] mx-auto box-border grid 
                  grid-cols-1 gap-4 sm:gap-8 
                  md:grid-cols-[25%_25%_45%]" >
            {/* بخش 1: Clock */}
          <div className="space-y-8 order-1 ">
            <Clock />
            <Calendar />
          </div>
            {/* Left side */}
            <div className="space-y-8 order-2">
              <TodoList />
            <Notes calendarType={'gregorian'} />
            </div>

            {/* Right side */}
            <div className="space-y-8 order-3">
              <Bookmarks />
            </div>
          </div>

          <BackgroundSelector 
            onSelectBackground={handleBackgroundChange}
            storageKey="selectedBackground" calendarType={'gregorian'}          
            />
             <SocialLinks />
        </div>
      </div>
    </CalendarProvider>
  );
}

export default App;

