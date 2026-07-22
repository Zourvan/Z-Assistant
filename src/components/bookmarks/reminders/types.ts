export type ReminderStatus =
  | "pending"
  | "upcoming"
  | "today"
  | "overdue"
  | "completed"
  | "dismissed"
  | "snoozed";

export type ReminderPriority = "low" | "medium" | "high";

export type ReminderCategory =
  | "read_later"
  | "documentation"
  | "research"
  | "ai"
  | "programming"
  | "shopping"
  | "work"
  | "personal";

export type RepeatType = "none" | "daily" | "weekly" | "monthly" | "every_x_days" | "custom";

export interface RepeatRule {
  type: RepeatType;
  days?: number;
  weekdays?: number[];
}

export interface BookmarkReminder {
  id: string;
  bookmarkId: string;
  bookmarkTitle: string;
  bookmarkUrl?: string;
  favicon?: string;
  note?: string;
  reminderAt: number;
  dateOnly: boolean;
  category?: ReminderCategory;
  priority: ReminderPriority;
  repeat: RepeatRule;
  snoozeUntil?: number;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  dismissedAt?: number;
  lastTriggeredAt?: number;
}

export interface ReminderInput {
  bookmarkId: string;
  bookmarkTitle: string;
  bookmarkUrl?: string;
  note?: string;
  reminderAt: number;
  dateOnly: boolean;
  category?: ReminderCategory;
  priority: ReminderPriority;
  repeat: RepeatRule;
}

export type ReminderFilter =
  | "all"
  | "today"
  | "upcoming"
  | "overdue"
  | "completed"
  | "snoozed";

export type ReminderSort =
  | "reminderDate"
  | "createdAt"
  | "title"
  | "updatedAt"
  | "priority";

export type ReminderManagerView = "list" | "timeline";

export type SnoozePreset = "10m" | "30m" | "1h" | "tomorrow_morning" | "next_week" | "custom";

export type QuickPreset =
  | "later_today"
  | "tomorrow"
  | "this_weekend"
  | "next_week"
  | "next_month"
  | "custom";
