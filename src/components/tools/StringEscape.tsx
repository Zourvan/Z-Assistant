import { useState, useMemo } from "react";
import { useI18n } from "../../i18n/LanguageProvider";
import { ToolPanel, ToolWorkspace, ToolToolbar, ToolColumn, ToolTextarea } from "./shared";

type Mode = "escape" | "unescape";

const escapeString = (text: string): string =>
  text
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");

const unescapeString = (text: string): string => {
  try {
    return JSON.parse(`"${text.replace(/"/g, '\\"')}"`);
  } catch {
    return text
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
};

export function StringEscape() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("escape");
  const [input, setInput] = useState("");

  const output = useMemo(() => {
    if (!input) return "";
    return mode === "escape" ? escapeString(input) : unescapeString(input);
  }, [input, mode]);

  return (
    <ToolPanel>
      <ToolToolbar>
        <div className="tools-toggle">
          <button
            type="button"
            className={`tools-toggle__btn ${mode === "escape" ? "tools-toggle__btn--active" : ""}`}
            onClick={() => setMode("escape")}
          >
            {t("tools.escape.escape")}
          </button>
          <button
            type="button"
            className={`tools-toggle__btn ${mode === "unescape" ? "tools-toggle__btn--active" : ""}`}
            onClick={() => setMode("unescape")}
          >
            {t("tools.escape.unescape")}
          </button>
        </div>
      </ToolToolbar>

      <ToolWorkspace layout="split">
        <ToolColumn>
          <ToolTextarea label={t("tools.escape.input")} value={input} onChange={setInput} fill dir="ltr" />
        </ToolColumn>
        <ToolColumn>
          <ToolTextarea label={t("tools.escape.output")} value={output} readOnly fill dir="ltr" />
        </ToolColumn>
      </ToolWorkspace>
    </ToolPanel>
  );
}
