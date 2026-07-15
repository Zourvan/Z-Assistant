import { Palette, CalendarArrowUp, Braces, Regex, Shield } from "lucide-react";
import type { ToolCategory, ToolDefinition } from "./types";
import { DateConverter } from "./DateConverter";
import { EncodingCrypto } from "./EncodingCrypto";
import { JsonFormatter } from "./JsonFormatter";
import { RegexTester } from "./RegexTester";
import { ColorConverter } from "./ColorConverter";

export const TOOL_CATEGORIES: ToolCategory[] = ["general", "devops", "programming"];

export const TOOLS: ToolDefinition[] = [
  { id: "dateConverter", category: "general", icon: CalendarArrowUp, component: DateConverter },
  { id: "encodingCrypto", category: "general", icon: Shield, component: EncodingCrypto },

  { id: "json", category: "devops", icon: Braces, component: JsonFormatter },

  { id: "color", category: "programming", icon: Palette, component: ColorConverter },
  { id: "regex", category: "programming", icon: Regex, component: RegexTester },
];

export const getToolsByCategory = (category: ToolCategory) => TOOLS.filter((t) => t.category === category);

export const getDefaultToolId = (category: ToolCategory) => getToolsByCategory(category)[0]?.id ?? "";
