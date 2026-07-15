import { SUB_TOOLS as dateSubTools } from "./datetime/registry";
import { SUB_TOOLS as encodingSubTools } from "./encoding/registry";
import { SUB_TOOLS as developerSubTools } from "./developer/registry";
import { makeToolRefKey } from "./toolRefKey";

export interface ToolCatalogEntry {
  key: string;
  parentId: string;
  subToolId?: string;
  titleKey: string;
  parentTitleKey: string;
}

/** Top-level sidebar tools — kept in sync with registry.ts TOOLS ids */
const PARENT_TOOLS = [
  { id: "dateConverter", titleKey: "tools.items.dateConverter" },
  { id: "encodingCrypto", titleKey: "tools.items.encodingCrypto" },
  { id: "developerTools", titleKey: "tools.items.developerTools" },
] as const;

const TOOLKIT_ENTRIES = [
  { parentId: "dateConverter", i18nPrefix: "tools.dateTimeToolkit", subTools: dateSubTools },
  { parentId: "encodingCrypto", i18nPrefix: "tools.encodingToolkit", subTools: encodingSubTools },
  { parentId: "developerTools", i18nPrefix: "tools.developerToolkit", subTools: developerSubTools },
] as const;

function buildToolCatalog(): ToolCatalogEntry[] {
  const map = new Map<string, ToolCatalogEntry>();

  for (const tool of PARENT_TOOLS) {
    map.set(tool.id, {
      key: tool.id,
      parentId: tool.id,
      titleKey: tool.titleKey,
      parentTitleKey: tool.titleKey,
    });
  }

  for (const { parentId, i18nPrefix, subTools } of TOOLKIT_ENTRIES) {
    for (const subTool of subTools) {
      const key = makeToolRefKey(parentId, subTool.id);
      map.set(key, {
        key,
        parentId,
        subToolId: subTool.id,
        titleKey: `${i18nPrefix}.subTools.${subTool.id}.title`,
        parentTitleKey: `tools.items.${parentId}`,
      });
    }
  }

  return [...map.values()];
}

let catalogMap: Map<string, ToolCatalogEntry> | null = null;

export function getToolCatalogMap(): Map<string, ToolCatalogEntry> {
  if (!catalogMap) {
    catalogMap = new Map(buildToolCatalog().map((entry) => [entry.key, entry]));
  }
  return catalogMap;
}

export function getToolCatalogEntry(key: string): ToolCatalogEntry | undefined {
  return getToolCatalogMap().get(key);
}
