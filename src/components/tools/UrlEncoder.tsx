import { useState, useMemo } from "react";
import { useI18n } from "../../i18n/LanguageProvider";
import { ToolPanel, ToolWorkspace, ToolToolbar, ToolColumn, ToolTextarea } from "./shared";

type Mode = "encode" | "decode";

export function UrlEncoder() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");

  const output = useMemo(() => {
    if (!input) return "";
    try {
      return mode === "encode" ? encodeURIComponent(input) : decodeURIComponent(input);
    } catch {
      return "";
    }
  }, [input, mode]);

  return (
    <ToolPanel>
      <ToolToolbar>
        <div className="tools-toggle">
          <button
            type="button"
            className={`tools-toggle__btn ${mode === "encode" ? "tools-toggle__btn--active" : ""}`}
            onClick={() => setMode("encode")}
          >
            {t("tools.url.encode")}
          </button>
          <button
            type="button"
            className={`tools-toggle__btn ${mode === "decode" ? "tools-toggle__btn--active" : ""}`}
            onClick={() => setMode("decode")}
          >
            {t("tools.url.decode")}
          </button>
        </div>
      </ToolToolbar>

      <ToolWorkspace layout="split">
        <ToolColumn>
          <ToolTextarea label={t("tools.url.input")} value={input} onChange={setInput} fill dir="ltr" />
        </ToolColumn>
        <ToolColumn>
          <ToolTextarea label={t("tools.url.output")} value={output} readOnly fill dir="ltr" />
        </ToolColumn>
      </ToolWorkspace>
    </ToolPanel>
  );
}
