// IndexedDB Utility for Generic Use
interface DatabaseConfig {
  dbName: string;
  storeName: string;
  version: number;
  keyPath: string;
  indexes?: { name: string; keyPath: string; unique?: boolean }[]; // Optional indexes
}

const createDatabase = (config: DatabaseConfig) => {
  const initializeDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(config.dbName, config.version);

      request.onerror = () => {
        console.error("Failed to open database:", request.error);
        reject(request.error);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(config.storeName)) {
          const store = db.createObjectStore(config.storeName, { keyPath: config.keyPath });

          // Add optional indexes if provided
          if (config.indexes) {
            for (const index of config.indexes) {
              store.createIndex(index.name, index.keyPath, { unique: index.unique || false });
            }
          }
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };
    });
  };

  const createDBOperations = () => {
    let db: IDBDatabase | null = null;

    const getDB = async (): Promise<IDBDatabase> => {
      if (!db) {
        db = await initializeDB();
      }
      return db;
    };

    const saveItem = async <T,>(item: T): Promise<IDBValidKey> => {
      const database = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(config.storeName, "readwrite");
        const store = transaction.objectStore(config.storeName);
        const request = store.put(item);

        transaction.oncomplete = () => resolve(request.result);
        transaction.onerror = () => reject(transaction.error);
      });
    };

    const saveItems = async <T,>(items: T[]): Promise<IDBValidKey[]> => {
      const database = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(config.storeName, "readwrite");
        const store = transaction.objectStore(config.storeName);

        const results: IDBValidKey[] = [];

        transaction.oncomplete = () => resolve(results);
        transaction.onerror = () => reject(transaction.error);

        items.forEach((item) => {
          const request = store.put(item);
          request.onsuccess = () => {
            if (request.result) {
              results.push(request.result); // Collect valid keys
            }
          };
        });
      });
    };

    const getAllItems = async <T,>(): Promise<T[]> => {
      const database = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(config.storeName, "readonly");
        const store = transaction.objectStore(config.storeName);
        const request = store.getAll();

        transaction.oncomplete = () => resolve(request.result || []);
        transaction.onerror = () => reject(transaction.error);
      });
    };

    const getItem = async <T,>(id: IDBValidKey): Promise<T | null> => {
      const database = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(config.storeName, "readonly");
        const store = transaction.objectStore(config.storeName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    };

    const deleteItem = async (id: IDBValidKey): Promise<IDBValidKey | undefined> => {
      const database = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(config.storeName, "readwrite");
        const store = transaction.objectStore(config.storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);

        transaction.oncomplete = () => {
          // In case deleting doesn't provide a result, we resolve with undefined
          resolve(request.result);
        };
        transaction.onerror = () => reject(transaction.error);
      });
    };

    const savePreferences = async <T,>(preferences: T): Promise<IDBValidKey> => {
      const database = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(config.storeName, "readwrite");
        const store = transaction.objectStore(config.storeName);

        const preferencesWithId = {
          ...preferences,
          id: "preferences" // یک مقدار یکتا به عنوان کلید اصلی
        };

        const request = store.put(preferencesWithId);

        transaction.oncomplete = () => resolve(request.result);
        transaction.onerror = () => reject(transaction.error);
      });
    };

    const getPreferences = async <T,>(): Promise<T | null> => {
      const database = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(config.storeName, "readonly");
        const store = transaction.objectStore(config.storeName);
        const request = store.get("preferences"); // مقدار یکتای ذخیره‌شده

        transaction.oncomplete = () => resolve(request.result || null);
        transaction.onerror = () => reject(transaction.error);
      });
    };

    return { savePreferences, getPreferences, saveItem, saveItems, getAllItems, getItem, deleteItem };
  };

  return createDBOperations();
};

export default createDatabase;
