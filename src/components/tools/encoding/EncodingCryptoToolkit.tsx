import { ToolkitShell } from "../ToolkitShell";
import { SUB_TOOLS, TOOLKIT_GROUPS, matchEncodingSearch } from "./registry";

export function EncodingCryptoToolkit() {
  return (
    <ToolkitShell
      className="tools-toolkit"
      parentToolId="encodingCrypto"
      i18nPrefix="tools.encodingToolkit"
      groups={TOOLKIT_GROUPS}
      subTools={SUB_TOOLS}
      matchSearch={matchEncodingSearch}
    />
  );
}
