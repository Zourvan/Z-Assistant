import { useState, useMemo } from "react";
import { format as formatGregorian } from "date-fns";
import { format as formatJalali, parse as parseJalali, isValid as isValidJalali } from "date-fns-jalali";
import { useI18n } from "../../i18n/LanguageProvider";
import { ToolPanel, ToolWorkspace, ToolToolbar, ToolColumn, ToolField, ToolError } from "./shared";

type Direction = "jalaliToGregorian" | "gregorianToJalali";

const JALALI_PATTERN = /^\d{4}\/\d{1,2}\/\d{1,2}$/;
const GREGORIAN_PATTERN = /^\d{4}-\d{1,2}-\d{1,2}$/;

export function DateConverter() {
  const { t } = useI18n();
  const [direction, setDirection] = useState<Direction>("jalaliToGregorian");
  const [input, setInput] = useState("");

  const result = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return { output: "", error: "" };

    try {
      if (direction === "jalaliToGregorian") {
        if (!JALALI_PATTERN.test(trimmed)) {
          return { output: "", error: t("tools.dateConverter.errors.jalaliFormat") };
        }
        const date = parseJalali(trimmed, "yyyy/M/d", new Date());
        if (!isValidJalali(date)) {
          return { output: "", error: t("tools.dateConverter.errors.invalid") };
        }
        return { output: formatGregorian(date, "yyyy-MM-dd"), error: "" };
      }

      if (!GREGORIAN_PATTERN.test(trimmed)) {
        return { output: "", error: t("tools.dateConverter.errors.gregorianFormat") };
      }
      const [y, m, d] = trimmed.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
        return { output: "", error: t("tools.dateConverter.errors.invalid") };
      }
      return { output: formatJalali(date, "yyyy/MM/dd"), error: "" };
    } catch {
      return { output: "", error: t("tools.dateConverter.errors.invalid") };
    }
  }, [input, direction, t]);

  return (
    <ToolPanel>
      <ToolToolbar>
        <div className="tools-toggle">
          <button
            type="button"
            className={`tools-toggle__btn ${direction === "jalaliToGregorian" ? "tools-toggle__btn--active" : ""}`}
            onClick={() => setDirection("jalaliToGregorian")}
          >
            {t("tools.dateConverter.jalaliToGregorian")}
          </button>
          <button
            type="button"
            className={`tools-toggle__btn ${direction === "gregorianToJalali" ? "tools-toggle__btn--active" : ""}`}
            onClick={() => setDirection("gregorianToJalali")}
          >
            {t("tools.dateConverter.gregorianToJalali")}
          </button>
        </div>
      </ToolToolbar>

      <ToolWorkspace layout="split">
        <ToolColumn>
          <ToolField
            label={t("tools.dateConverter.input")}
            value={input}
            onChange={setInput}
            placeholder={
              direction === "jalaliToGregorian"
                ? t("tools.dateConverter.jalaliPlaceholder")
                : t("tools.dateConverter.gregorianPlaceholder")
            }
            dir="ltr"
          />
        </ToolColumn>
        <ToolColumn>
          {result.error ? (
            <ToolError message={result.error} />
          ) : (
            <ToolField label={t("tools.dateConverter.output")} value={result.output} readOnly dir="ltr" />
          )}
        </ToolColumn>
      </ToolWorkspace>
    </ToolPanel>
  );
}
