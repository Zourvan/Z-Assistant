import { ToolkitShell } from "../ToolkitShell";
import { SUB_TOOLS, TOOLKIT_GROUPS, matchDeveloperSearch } from "./registry";

export function DeveloperToolkit() {
  return (
    <ToolkitShell
      className="tools-toolkit"
      parentToolId="developerTools"
      i18nPrefix="tools.developerToolkit"
      groups={TOOLKIT_GROUPS}
      subTools={SUB_TOOLS}
      matchSearch={matchDeveloperSearch}
    />
  );
}
