import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { tasksDB } from "../settings/settingsDb";
import type { Task, TaskInput } from "./types";
import { getDateKeysWithTasks, getTasksForDate } from "./taskUtils";

interface TasksContextValue {
  tasks: Task[];
  isLoading: boolean;
  addTask: (input: TaskInput) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  getTasksForDate: (dateKey: string) => Task[];
  dateKeysWithTasks: Set<string>;
}

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    try {
      const storedTasks = await tasksDB.getAllItems<Task>();
      setTasks(storedTasks.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const addTask = useCallback(async (input: TaskInput) => {
    if (!input.text.trim()) return null;

    const newTask: Task = {
      id: crypto.randomUUID(),
      text: input.text.trim(),
      taskType: input.taskType,
      createdAt: Date.now(),
      color: input.color,
      emoji: input.emoji,
      dueDate: input.dueDate || undefined,
      completed: input.taskType === "todo" ? false : undefined,
    };

    await tasksDB.saveItem(newTask);
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    setTasks((prev) => {
      const task = prev.find((item) => item.id === id);
      if (!task) return prev;

      const updatedTask = { ...task, ...updates };
      tasksDB.saveItem(updatedTask).catch((error) => console.error("Failed to update task:", error));
      return prev.map((item) => (item.id === id ? updatedTask : item));
    });
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await tasksDB.deleteItem(id);
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  const toggleTodo = useCallback(async (id: string) => {
    const task = tasks.find((item) => item.id === id);
    if (!task || task.taskType !== "todo") return;

    await updateTask(id, { completed: !task.completed });
  }, [tasks, updateTask]);

  const dateKeysWithTasks = useMemo(() => getDateKeysWithTasks(tasks), [tasks]);

  const value = useMemo<TasksContextValue>(
    () => ({
      tasks,
      isLoading,
      addTask,
      updateTask,
      deleteTask,
      toggleTodo,
      getTasksForDate: (dateKey: string) => getTasksForDate(tasks, dateKey),
      dateKeysWithTasks,
    }),
    [tasks, isLoading, addTask, updateTask, deleteTask, toggleTodo, dateKeysWithTasks],
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasks must be used within TasksProvider");
  }
  return context;
}
