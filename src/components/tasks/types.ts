export type TaskType = "todo" | "note";

export interface Task {
  id: string;
  text: string;
  taskType: TaskType;
  createdAt: number;
  color: string;
  emoji: string;
  completed?: boolean;
  /** Gregorian ISO date key YYYY-MM-DD */
  dueDate?: string;
}

export type TaskFilter = "all" | "todo" | "note" | "scheduled";

export interface TaskInput {
  text: string;
  taskType: TaskType;
  color: string;
  emoji: string;
  dueDate?: string;
}
