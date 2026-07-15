import { CalendarArrowUp, Shield, Code2 } from "lucide-react";
import type { ToolCategory, ToolDefinition } from "./types";
import { DateConverter } from "./DateConverter";
import { EncodingCrypto } from "./EncodingCrypto";
import { DeveloperToolkit } from "./DeveloperTools";

export const TOOL_CATEGORIES: ToolCategory[] = ["general", "devops", "programming"];

export const TOOLS: ToolDefinition[] = [
  { id: "dateConverter", category: "general", icon: CalendarArrowUp, component: DateConverter },
  { id: "encodingCrypto", category: "general", icon: Shield, component: EncodingCrypto },

  { id: "developerTools", category: "devops", icon: Code2, component: DeveloperToolkit },
];

export const getToolsByCategory = (category: ToolCategory) => TOOLS.filter((t) => t.category === category);

export const getDefaultToolId = (category: ToolCategory) => getToolsByCategory(category)[0]?.id ?? "";
