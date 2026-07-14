import { useState, useMemo } from "react";
import { useI18n } from "../../i18n/LanguageProvider";
import { ToolPanel, ToolWorkspace, ToolToolbar, ToolColumn, ToolTextarea, ToolField, ToolError } from "./shared";

export function RegexTester() {
  const { t } = useI18n();
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("");

  const result = useMemo(() => {
    if (!pattern) return { matches: "", error: "" };
    try {
      const regex = new RegExp(pattern, flags);
      const found = [...text.matchAll(regex)].map((m) => m[0]);
      return { matches: found.length ? found.join("\n") : t("tools.regex.noMatch"), error: "" };
    } catch {
      return { matches: "", error: t("tools.regex.errors.invalid") };
    }
  }, [pattern, flags, text, t]);

  return (
    <ToolPanel>
      <ToolToolbar className="tools-toolbar--fields">
        <ToolField
          label={t("tools.regex.pattern")}
          value={pattern}
          onChange={setPattern}
          placeholder="/pattern/"
          dir="ltr"
          compact
        />
        <ToolField label={t("tools.regex.flags")} value={flags} onChange={setFlags} placeholder="gim" dir="ltr" compact />
      </ToolToolbar>

      <ToolWorkspace layout="split">
        <ToolColumn>
          <ToolTextarea label={t("tools.regex.text")} value={text} onChange={setText} fill dir="ltr" />
        </ToolColumn>
        <ToolColumn>
          {result.error ? (
            <ToolError message={result.error} />
          ) : (
            <ToolTextarea label={t("tools.regex.matches")} value={result.matches} readOnly fill dir="ltr" />
          )}
        </ToolColumn>
      </ToolWorkspace>
    </ToolPanel>
  );
}
