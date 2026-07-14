import { useState, useMemo } from "react";
import { useI18n } from "../../i18n/LanguageProvider";
import { ToolPanel, ToolWorkspace, ToolToolbar, ToolColumn, ToolTextarea, ToolError } from "./shared";

export function JsonFormatter() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [minify, setMinify] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      const parsed = JSON.parse(input);
      const output = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
      return { output, error: "" };
    } catch {
      return { output: "", error: t("tools.json.errors.invalid") };
    }
  }, [input, minify, t]);

  return (
    <ToolPanel>
      <ToolToolbar>
        <div className="tools-toggle">
          <button
            type="button"
            className={`tools-toggle__btn ${!minify ? "tools-toggle__btn--active" : ""}`}
            onClick={() => setMinify(false)}
          >
            {t("tools.json.format")}
          </button>
          <button
            type="button"
            className={`tools-toggle__btn ${minify ? "tools-toggle__btn--active" : ""}`}
            onClick={() => setMinify(true)}
          >
            {t("tools.json.minify")}
          </button>
        </div>
      </ToolToolbar>

      <ToolWorkspace layout="split">
        <ToolColumn>
          <ToolTextarea label={t("tools.json.input")} value={input} onChange={setInput} fill dir="ltr" />
        </ToolColumn>
        <ToolColumn>
          {result.error ? (
            <ToolError message={result.error} />
          ) : (
            <ToolTextarea label={t("tools.json.output")} value={result.output} readOnly fill dir="ltr" />
          )}
        </ToolColumn>
      </ToolWorkspace>
    </ToolPanel>
  );
}
