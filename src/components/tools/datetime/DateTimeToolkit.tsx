import { ToolkitShell } from "../ToolkitShell";
import { SUB_TOOLS, TOOLKIT_GROUPS, matchSubToolSearch } from "./registry";

export function DateTimeToolkit() {
  return (
    <ToolkitShell
      className="tools-toolkit"
      i18nPrefix="tools.dateTimeToolkit"
      groups={TOOLKIT_GROUPS}
      subTools={SUB_TOOLS}
      matchSearch={matchSubToolSearch}
    />
  );
}
