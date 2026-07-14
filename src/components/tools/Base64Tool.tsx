import { useState, useMemo } from "react";
import { useI18n } from "../../i18n/LanguageProvider";
import { ToolPanel, ToolWorkspace, ToolToolbar, ToolColumn, ToolTextarea, ToolError } from "./shared";

type Mode = "encode" | "decode";

const encodeBase64 = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
};

const decodeBase64 = (text: string): string => {
  const binary = atob(text.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export function Base64Tool() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");

  const result = useMemo(() => {
    if (!input) return { output: "", error: "" };
    try {
      const output = mode === "encode" ? encodeBase64(input) : decodeBase64(input);
      return { output, error: "" };
    } catch {
      return { output: "", error: t("tools.base64.errors.invalid") };
    }
  }, [input, mode, t]);

  return (
    <ToolPanel>
      <ToolToolbar>
        <div className="tools-toggle">
          <button
            type="button"
            className={`tools-toggle__btn ${mode === "encode" ? "tools-toggle__btn--active" : ""}`}
            onClick={() => setMode("encode")}
          >
            {t("tools.base64.encode")}
          </button>
          <button
            type="button"
            className={`tools-toggle__btn ${mode === "decode" ? "tools-toggle__btn--active" : ""}`}
            onClick={() => setMode("decode")}
          >
            {t("tools.base64.decode")}
          </button>
        </div>
      </ToolToolbar>

      <ToolWorkspace layout="split">
        <ToolColumn>
          <ToolTextarea label={t("tools.base64.input")} value={input} onChange={setInput} fill dir="ltr" />
        </ToolColumn>
        <ToolColumn>
          {result.error ? (
            <ToolError message={result.error} />
          ) : (
            <ToolTextarea label={t("tools.base64.output")} value={result.output} readOnly fill dir="ltr" />
          )}
        </ToolColumn>
      </ToolWorkspace>
    </ToolPanel>
  );
}
