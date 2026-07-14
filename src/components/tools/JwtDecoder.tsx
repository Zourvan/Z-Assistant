import { useState, useMemo } from "react";
import { useI18n } from "../../i18n/LanguageProvider";
import { ToolPanel, ToolWorkspace, ToolColumn, ToolTextarea, ToolError } from "./shared";

const decodePart = (part: string): string => {
  const padded = part.replace(/-/g, "+").replace(/_/g, "/");
  const json = atob(padded);
  return JSON.stringify(JSON.parse(json), null, 2);
};

export function JwtDecoder() {
  const { t } = useI18n();
  const [token, setToken] = useState("");

  const result = useMemo(() => {
    const trimmed = token.trim();
    if (!trimmed) return { header: "", payload: "", error: "" };

    const parts = trimmed.split(".");
    if (parts.length < 2) {
      return { header: "", payload: "", error: t("tools.jwt.errors.invalid") };
    }

    try {
      return {
        header: decodePart(parts[0]),
        payload: decodePart(parts[1]),
        error: "",
      };
    } catch {
      return { header: "", payload: "", error: t("tools.jwt.errors.invalid") };
    }
  }, [token, t]);

  return (
    <ToolPanel>
      <ToolWorkspace layout="stack">
        <ToolTextarea
          label={t("tools.jwt.input")}
          value={token}
          onChange={setToken}
          placeholder={t("tools.jwt.placeholder")}
          rows={2}
          dir="ltr"
        />

        {result.error ? (
          <ToolError message={result.error} />
        ) : (
          <ToolWorkspace layout="split">
            <ToolColumn>
              <ToolTextarea label={t("tools.jwt.header")} value={result.header} readOnly fill dir="ltr" />
            </ToolColumn>
            <ToolColumn>
              <ToolTextarea label={t("tools.jwt.payload")} value={result.payload} readOnly fill dir="ltr" />
            </ToolColumn>
          </ToolWorkspace>
        )}
      </ToolWorkspace>
    </ToolPanel>
  );
}
