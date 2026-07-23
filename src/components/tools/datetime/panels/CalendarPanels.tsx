import { useState, useMemo } from "react";
import { format as formatGregorian } from "date-fns";
import { format as formatJalali } from "date-fns-jalali";
import { useI18n } from "../../../../i18n/LanguageProvider";
import {
  ToolWorkspace,
  ToolToolbar,
  ToolField,
  ToolError,
  ToolOutputList,
  ToolActionButton,
} from "../../shared";
import { ToolDatePicker } from "../ToolDatePicker";
import {
  parseDateTime,
  formatAllCalendars,
  detectCalendarSystem,
  type CalendarSystem,
} from "../utils/calendars";
import type { CalendarSystem as CalSys } from "../types";

function useCalendarInput(defaultSystem: CalSys = "jalali") {
  const [input, setInput] = useState("");
  const [system, setSystem] = useState<CalSys>(defaultSystem);
  const parsed = useMemo(() => parseDateTime(input, system), [input, system]);
  return { input, setInput, system, setSystem, parsed };
}

export function CalendarConverterPanel() {
  const { t } = useI18n();
  const { input, setInput, system, setSystem, parsed } = useCalendarInput("jalali");
  const withTime = input.includes(":");

  const outputs = useMemo(() => {
    if (!parsed) return null;
    return formatAllCalendars(parsed.date, parsed.hasTime || withTime);
  }, [parsed, withTime]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          {(["jalali", "gregorian", "hijri"] as CalendarSystem[]).map((s) => (
            <button
              key={s}
              type="button"
              className={`tools-toggle__btn ${system === s ? "tools-toggle__btn--active" : ""}`}
              onClick={() => setSystem(s)}
            >
              {t(`tools.dateTimeToolkit.calendars.${s}`)}
            </button>
          ))}
        </div>
      </ToolToolbar>
      <ToolWorkspace layout="stack">
        <ToolDatePicker
          label={t("tools.dateTimeToolkit.common.input")}
          value={input}
          onChange={setInput}
          calendarSystem={system}
          showTime
          placeholder={t(`tools.dateTimeToolkit.placeholders.${system}`)}
          hint={t("tools.dateTimeToolkit.calendarConverter.hint")}
        />
        {!input.trim() ? null : !parsed ? (
          <ToolError message={t("tools.dateTimeToolkit.errors.invalidDate")} />
        ) : (
          <ToolOutputList
            items={[
              { label: t("tools.dateTimeToolkit.calendars.jalali"), value: outputs!.jalali },
              { label: t("tools.dateTimeToolkit.calendars.gregorian"), value: outputs!.gregorian },
              { label: t("tools.dateTimeToolkit.calendars.hijri"), value: outputs!.hijri },
            ]}
          />
        )}
      </ToolWorkspace>
    </>
  );
}

export function DateFormatPanel() {
  const { t, language } = useI18n();
  const { input, setInput, parsed } = useCalendarInput("gregorian");

  const formats = useMemo(() => {
    if (!parsed) return null;
    const d = parsed.date;
    const locale = language === "fa" ? "fa-IR" : "en-US";
    return [
      { label: "ISO", value: formatGregorian(d, "yyyy-MM-dd") },
      { label: "Compact", value: formatGregorian(d, "yyyyMMdd") },
      { label: "Slash", value: formatGregorian(d, "dd/MM/yyyy") },
      { label: "Long", value: new Intl.DateTimeFormat(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(d) },
      { label: "Short", value: new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(d) },
      { label: t("tools.dateTimeToolkit.calendars.jalali"), value: formatJalali(d, "yyyy/MM/dd") },
    ];
  }, [parsed, language, t]);

  return (
    <ToolWorkspace layout="stack">
      <ToolDatePicker
        label={t("tools.dateTimeToolkit.common.input")}
        value={input}
        onChange={setInput}
        calendarSystem="gregorian"
        placeholder="2026-07-15"
      />
      {!input.trim() ? null : !parsed ? (
        <ToolError message={t("tools.dateTimeToolkit.errors.invalidDate")} />
      ) : (
        <ToolOutputList items={formats!} columns={2} />
      )}
    </ToolWorkspace>
  );
}

export function UnixTimestampPanel() {
  const { t } = useI18n();
  const [mode, setMode] = useState<"toDate" | "fromDate">("toDate");
  const [input, setInput] = useState("");
  const [unit, setUnit] = useState<"seconds" | "milliseconds">("seconds");

  const result = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return { items: [], error: "" };

    if (mode === "toDate") {
      const num = Number(trimmed);
      if (!Number.isFinite(num)) return { items: [], error: t("tools.dateTimeToolkit.errors.invalidTimestamp") };
      const ms = unit === "seconds" ? num * 1000 : num;
      const date = new Date(ms);
      if (Number.isNaN(date.getTime())) return { items: [], error: t("tools.dateTimeToolkit.errors.invalidTimestamp") };
      const cals = formatAllCalendars(date, true);
      return {
        items: [
          { label: "UTC", value: date.toISOString().replace("T", " ").slice(0, 19) },
          { label: t("tools.dateTimeToolkit.calendars.gregorian"), value: cals.gregorian },
          { label: t("tools.dateTimeToolkit.calendars.jalali"), value: cals.jalali },
          { label: unit === "seconds" ? "ms" : "s", value: unit === "seconds" ? String(ms) : String(Math.floor(ms / 1000)) },
        ],
        error: "",
      };
    }

    const detected = detectCalendarSystem(trimmed) ?? "gregorian";
    const parsed = parseDateTime(trimmed, detected);
    if (!parsed) return { items: [], error: t("tools.dateTimeToolkit.errors.invalidDate") };
    const ms = parsed.date.getTime();
    return {
      items: [
        { label: t("tools.dateTimeToolkit.unix.seconds"), value: String(Math.floor(ms / 1000)) },
        { label: t("tools.dateTimeToolkit.unix.milliseconds"), value: String(ms) },
      ],
      error: "",
    };
  }, [input, mode, unit, t]);

  const nowVal = unit === "seconds" ? String(Math.floor(Date.now() / 1000)) : String(Date.now());

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          <button type="button" className={`tools-toggle__btn ${mode === "toDate" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("toDate")}>
            {t("tools.dateTimeToolkit.unix.toDate")}
          </button>
          <button type="button" className={`tools-toggle__btn ${mode === "fromDate" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("fromDate")}>
            {t("tools.dateTimeToolkit.unix.fromDate")}
          </button>
        </div>
        {mode === "toDate" && (
          <>
            <div className="tools-toggle">
              <button type="button" className={`tools-toggle__btn ${unit === "seconds" ? "tools-toggle__btn--active" : ""}`} onClick={() => setUnit("seconds")}>
                {t("tools.dateTimeToolkit.unix.seconds")}
              </button>
              <button type="button" className={`tools-toggle__btn ${unit === "milliseconds" ? "tools-toggle__btn--active" : ""}`} onClick={() => setUnit("milliseconds")}>
                {t("tools.dateTimeToolkit.unix.milliseconds")}
              </button>
            </div>
            <ToolActionButton onClick={() => setInput(nowVal)}>{t("tools.dateTimeToolkit.common.now")}</ToolActionButton>
          </>
        )}
      </ToolToolbar>
      <ToolWorkspace layout="stack">
        {mode === "fromDate" ? (
          <ToolDatePicker
            label={t("tools.dateTimeToolkit.common.input")}
            value={input}
            onChange={setInput}
            calendarSystem="gregorian"
            showTime
            placeholder="2026-07-15"
          />
        ) : (
          <ToolField label={t("tools.dateTimeToolkit.common.input")} value={input} onChange={setInput} placeholder="1752595200" dir="ltr" />
        )}
        {result.error ? <ToolError message={result.error} /> : result.items.length > 0 ? <ToolOutputList items={result.items} columns={2} /> : null}
      </ToolWorkspace>
    </>
  );
}
