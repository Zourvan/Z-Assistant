import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

export type ToolCategory = "general" | "programming";

export interface ToolDefinition {
  id: string;
  category: ToolCategory;
  icon: LucideIcon;
  component: ComponentType;
}
