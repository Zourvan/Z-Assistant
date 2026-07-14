import {
  Palette,
  CalendarArrowUp,
  Clock,
  Lock,
  Binary,
  Braces,
  Link,
  Fingerprint,
  Hash,
  Regex,
  Calculator,
  Code,
  Shield,
} from "lucide-react";
import type { ToolCategory, ToolDefinition } from "./types";
import { DateConverter } from "./DateConverter";
import { TimestampConverter } from "./TimestampConverter";
import { Base64Tool } from "./Base64Tool";
import { PasswordGenerator } from "./PasswordGenerator";
import { JsonFormatter } from "./JsonFormatter";
import { UrlEncoder } from "./UrlEncoder";
import { UuidGenerator } from "./UuidGenerator";
import { HashGenerator } from "./HashGenerator";
import { RegexTester } from "./RegexTester";
import { BaseConverter } from "./BaseConverter";
import { StringEscape } from "./StringEscape";
import { JwtDecoder } from "./JwtDecoder";
import { ColorConverter } from "./ColorConverter";

export const TOOL_CATEGORIES: ToolCategory[] = ["general", "devops", "programming"];

export const TOOLS: ToolDefinition[] = [
  { id: "dateConverter", category: "general", icon: CalendarArrowUp, component: DateConverter },
  { id: "timestamp", category: "general", icon: Clock, component: TimestampConverter },
  { id: "base64", category: "general", icon: Binary, component: Base64Tool },
  { id: "password", category: "general", icon: Lock, component: PasswordGenerator },

  { id: "json", category: "devops", icon: Braces, component: JsonFormatter },
  { id: "url", category: "devops", icon: Link, component: UrlEncoder },
  { id: "uuid", category: "devops", icon: Fingerprint, component: UuidGenerator },
  { id: "hash", category: "devops", icon: Hash, component: HashGenerator },

  { id: "color", category: "programming", icon: Palette, component: ColorConverter },
  { id: "regex", category: "programming", icon: Regex, component: RegexTester },
  { id: "base", category: "programming", icon: Calculator, component: BaseConverter },
  { id: "escape", category: "programming", icon: Code, component: StringEscape },
  { id: "jwt", category: "programming", icon: Shield, component: JwtDecoder },
];

export const getToolsByCategory = (category: ToolCategory) => TOOLS.filter((t) => t.category === category);

export const getDefaultToolId = (category: ToolCategory) => getToolsByCategory(category)[0]?.id ?? "";
