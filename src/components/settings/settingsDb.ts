import createDatabase from "../IndexedDatabase/IndexedDatabase";
import type { StoredBackground } from "./types";

export const backgroundsDB = createDatabase({
  dbName: "backgroundSelectorDB",
  storeName: "backgrounds",
  version: 1,
  keyPath: "id",
  indexes: [
    { name: "type", keyPath: "type", unique: false },
    { name: "createdAt", keyPath: "createdAt", unique: false },
  ],
});

export const bookmarksDB = createDatabase({
  dbName: "bookmarkManagerDB",
  storeName: "tiles",
  version: 1,
  keyPath: "id",
  indexes: [{ name: "createdAt", keyPath: "createdAt", unique: false }],
});

export const tasksDB = createDatabase({
  dbName: "unifiedTasksDB",
  storeName: "tasks",
  version: 1,
  keyPath: "id",
  indexes: [
    { name: "taskType", keyPath: "taskType", unique: false },
    { name: "completed", keyPath: "completed", unique: false },
    { name: "createdAt", keyPath: "createdAt", unique: false },
  ],
});

export type { StoredBackground };
