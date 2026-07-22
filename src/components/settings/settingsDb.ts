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

export const alarmsDB = createDatabase({
  dbName: "timerAlarmDB",
  storeName: "alarms",
  version: 1,
  keyPath: "id",
  indexes: [
    { name: "enabled", keyPath: "enabled", unique: false },
    { name: "createdAt", keyPath: "createdAt", unique: false },
  ],
});

export const bookmarkRemindersDB = createDatabase({
  dbName: "bookmarkRemindersDB",
  storeName: "reminders",
  version: 1,
  keyPath: "id",
  indexes: [
    { name: "bookmarkId", keyPath: "bookmarkId", unique: false },
    { name: "reminderAt", keyPath: "reminderAt", unique: false },
    { name: "enabled", keyPath: "enabled", unique: false },
    { name: "createdAt", keyPath: "createdAt", unique: false },
  ],
});

export type { StoredBackground };
