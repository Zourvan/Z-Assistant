import type { ReactNode } from "react";
import { ToolWorkspace, ToolColumn, ToolTextarea, ToolError } from "../shared";

interface SplitEditorProps {
  inputLabel: string;
  outputLabel: string;
  input: string;
  onInputChange: (v: string) => void;
  output: string;
  error?: string;
  toolbar?: ReactNode;
  inputRows?: number;
}

export function SplitEditor({
  inputLabel,
  outputLabel,
  input,
  onInputChange,
  output,
  error,
  toolbar,
  inputRows,
}: SplitEditorProps) {
  return (
    <>
      {toolbar}
      <ToolWorkspace layout="split">
        <ToolColumn>
          <ToolTextarea label={inputLabel} value={input} onChange={onInputChange} fill dir="ltr" rows={inputRows} />
        </ToolColumn>
        <ToolColumn>
          {error ? (
            <ToolError message={error} />
          ) : (
            <ToolTextarea label={outputLabel} value={output} readOnly fill dir="ltr" />
          )}
        </ToolColumn>
      </ToolWorkspace>
    </>
  );
}
