import * as dateFns from "date-fns";
import * as dateFnsJalali from "date-fns-jalali";
import type { Task } from "./types";

export function toDateKey(date: Date): string {
  return dateFns.format(date, "yyyy-MM-dd");
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function isPersianText(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

export function convertToPersianNumbers(input: string): string {
  return input.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d, 10)]);
}

export function formatTaskDate(timestamp: number, calendarType: "gregorian" | "persian"): string {
  const date = new Date(timestamp);
  if (calendarType === "persian") {
    return convertToPersianNumbers(dateFnsJalali.format(date, "dd MMMM yyyy"));
  }
  return dateFns.format(date, "dd MMMM yyyy");
}

export function formatDueDate(dateKey: string, calendarType: "gregorian" | "persian"): string {
  const date = parseDateKey(dateKey);
  if (calendarType === "persian") {
    return convertToPersianNumbers(dateFnsJalali.format(date, "dd MMMM yyyy"));
  }
  return dateFns.format(date, "dd MMMM yyyy");
}

export function getTasksForDate(tasks: Task[], dateKey: string): Task[] {
  return tasks
    .filter((task) => task.dueDate === dateKey)
    .sort((a, b) => {
      if (a.taskType !== b.taskType) return a.taskType === "todo" ? -1 : 1;
      return b.createdAt - a.createdAt;
    });
}

export function getDateKeysWithTasks(tasks: Task[]): Set<string> {
  const keys = new Set<string>();
  for (const task of tasks) {
    if (task.dueDate) keys.add(task.dueDate);
  }
  return keys;
}

export function getDayTaskSummary(tasks: Task[], dateKey: string) {
  const dayTasks = getTasksForDate(tasks, dateKey);
  const todos = dayTasks.filter((t) => t.taskType === "todo");
  const notes = dayTasks.filter((t) => t.taskType === "note");
  const pendingTodos = todos.filter((t) => !t.completed);
  return { dayTasks, todos, notes, pendingTodos, hasItems: dayTasks.length > 0 };
}

export const NOTE_COLORS = [
  { value: "rgba(255, 255, 255, 0.2)", label: "White" },
  { value: "rgba(34, 197, 94, 0.2)", label: "Green" },
  { value: "rgba(59, 130, 246, 0.2)", label: "Blue" },
  { value: "rgba(168, 85, 247, 0.2)", label: "Purple" },
  { value: "rgba(251, 191, 36, 0.2)", label: "Yellow" },
] as const;

export const TODO_EMOJIS = ["🚀", "🔥", "🧩", "✨", "📅", "⭐", "💡", "📌"] as const;
