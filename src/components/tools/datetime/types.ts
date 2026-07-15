import type { ComponentType } from "react";

export type CalendarSystem = "jalali" | "gregorian" | "hijri";

export type DateTimeToolkitGroup = "calendar" | "calculator" | "time" | "developer" | "occasions";

export interface ParsedDateTime {
  date: Date;
  hasTime: boolean;
}

export interface SubToolDefinition {
  id: string;
  group: DateTimeToolkitGroup;
  keywords: string[];
  component: ComponentType;
}
