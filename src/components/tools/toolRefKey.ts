export function makeToolRefKey(parentId: string, subToolId?: string): string {
  return subToolId ? `${parentId}:${subToolId}` : parentId;
}

export function parseToolRefKey(key: string): { parentId: string; subToolId?: string } {
  const idx = key.indexOf(":");
  if (idx === -1) return { parentId: key };
  return { parentId: key.slice(0, idx), subToolId: key.slice(idx + 1) };
}
