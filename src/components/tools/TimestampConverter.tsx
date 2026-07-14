import { useState, useMemo } from "react";
import { format as formatGregorian } from "date-fns";
import { format as formatJalali } from "date-fns-jalali";
import { useI18n } from "../../i18n/LanguageProvider";
import { ToolPanel, ToolWorkspace, ToolToolbar, ToolColumn, ToolField, ToolError, ToolActionButton } from "./shared";

type Unit = "seconds" | "milliseconds";

export function TimestampConverter() {
  const { t } = useI18n();
  const [timestamp, setTimestamp] = useState("");
  const [unit, setUnit] = useState<Unit>("seconds");

  const result = useMemo(() => {
    const trimmed = timestamp.trim();
    if (!trimmed) return { gregorian: "", jalali: "", error: "" };

    const num = Number(trimmed);
    if (!Number.isFinite(num)) {
      return { gregorian: "", jalali: "", error: t("tools.timestamp.errors.invalid") };
    }

    const ms = unit === "seconds" ? num * 1000 : num;
    const date = new Date(ms);
    if (Number.isNaN(date.getTime())) {
      return { gregorian: "", jalali: "", error: t("tools.timestamp.errors.invalid") };
    }

    return {
      gregorian: formatGregorian(date, "yyyy-MM-dd HH:mm:ss"),
      jalali: formatJalali(date, "yyyy/MM/dd HH:mm:ss"),
      error: "",
    };
  }, [timestamp, unit, t]);

  const nowTimestamp = unit === "seconds" ? String(Math.floor(Date.now() / 1000)) : String(Date.now());

  return (
    <ToolPanel>
      <ToolToolbar>
        <div className="tools-toggle">
          <button
            type="button"
            className={`tools-toggle__btn ${unit === "seconds" ? "tools-toggle__btn--active" : ""}`}
            onClick={() => setUnit("seconds")}
          >
            {t("tools.timestamp.seconds")}
          </button>
          <button
            type="button"
            className={`tools-toggle__btn ${unit === "milliseconds" ? "tools-toggle__btn--active" : ""}`}
            onClick={() => setUnit("milliseconds")}
          >
            {t("tools.timestamp.milliseconds")}
          </button>
        </div>
        <ToolActionButton onClick={() => setTimestamp(nowTimestamp)}>{t("tools.timestamp.now")}</ToolActionButton>
      </ToolToolbar>

      <ToolWorkspace layout="stack">
        <ToolField
          label={t("tools.timestamp.input")}
          value={timestamp}
          onChange={setTimestamp}
          placeholder={t("tools.timestamp.placeholder")}
          dir="ltr"
        />
        {result.error ? (
          <ToolError message={result.error} />
        ) : (
          <ToolWorkspace layout="split">
            <ToolColumn>
              <ToolField label={t("tools.timestamp.gregorian")} value={result.gregorian} readOnly dir="ltr" compact />
            </ToolColumn>
            <ToolColumn>
              <ToolField label={t("tools.timestamp.jalali")} value={result.jalali} readOnly dir="ltr" compact />
            </ToolColumn>
          </ToolWorkspace>
        )}
      </ToolWorkspace>
    </ToolPanel>
  );
}
