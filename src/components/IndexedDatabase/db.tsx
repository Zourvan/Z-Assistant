const DB_NAME = "bookmarkManagerDB";
const STORE_NAME = "tiles";
const DB_VERSION = 1;

// Initialize IndexedDB
const initializeDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("Failed to open IndexedDB:", request.error);
      reject(request.error);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
  });
};

// Methods for managing tiles
const createDBOperations = () => {
  let db: IDBDatabase | null = null;

  const getDB = async (): Promise<IDBDatabase> => {
    if (!db) {
      db = await initializeDB();
    }
    return db;
  };

  const saveTile = async (tile: TileConfig) => {
    const database = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(tile);

      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
    });
  };

  const getAllTiles = async (): Promise<TileConfig[]> => {
    const database = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      transaction.oncomplete = () => resolve(request.result || []);
      transaction.onerror = () => reject(transaction.error);
    });
  };

  const deleteTile = async (id: string) => {
    const database = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
    });
  };

  return { saveTile, getAllTiles, deleteTile };
};

// Export operations
const dbOps = createDBOperations();

export default dbOps;
