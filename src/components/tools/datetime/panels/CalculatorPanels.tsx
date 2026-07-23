import { useState, useMemo } from "react";
import { intervalToDuration } from "date-fns";
import { useI18n } from "../../../../i18n/LanguageProvider";
import { ToolWorkspace, ToolToolbar, ToolColumn, ToolField, ToolError, ToolOutputList } from "../../shared";
import { ToolDatePicker } from "../ToolDatePicker";
import {
  parseDateTime,
  addToDate,
  diffDateParts,
  countBusinessDays,
  getWeekdayIndex,
  getIsoWeekInfo,
  checkLeapYear,
  formatAllCalendars,
  formatGregorianDate,
  formatJalaliDate,
  getDayOfYear,
  WEEKDAY_KEYS,
} from "../utils/calendars";
import type { CalendarSystem } from "../types";

type AddUnit = "years" | "months" | "weeks" | "days" | "hours" | "minutes" | "seconds";

export function DateAddSubtractPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [amount, setAmount] = useState("45");
  const [unit, setUnit] = useState<AddUnit>("days");
  const [operation, setOperation] = useState<"add" | "subtract">("add");
  const [system, setSystem] = useState<CalendarSystem>("gregorian");

  const result = useMemo(() => {
    const parsed = parseDateTime(input, system);
    const num = Number(amount);
    if (!parsed || !Number.isFinite(num)) return null;
    const delta = operation === "add" ? num : -num;
    const resultDate = addToDate(parsed.date, delta, unit);
    return formatAllCalendars(resultDate, parsed.hasTime);
  }, [input, amount, unit, operation, system]);

  const units: AddUnit[] = ["years", "months", "weeks", "days", "hours", "minutes", "seconds"];

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          <button type="button" className={`tools-toggle__btn ${operation === "add" ? "tools-toggle__btn--active" : ""}`} onClick={() => setOperation("add")}>
            {t("tools.dateTimeToolkit.dateCalc.add")}
          </button>
          <button type="button" className={`tools-toggle__btn ${operation === "subtract" ? "tools-toggle__btn--active" : ""}`} onClick={() => setOperation("subtract")}>
            {t("tools.dateTimeToolkit.dateCalc.subtract")}
          </button>
        </div>
        <div className="tools-toggle">
          {(["jalali", "gregorian"] as CalendarSystem[]).map((s) => (
            <button key={s} type="button" className={`tools-toggle__btn ${system === s ? "tools-toggle__btn--active" : ""}`} onClick={() => setSystem(s)}>
              {t(`tools.dateTimeToolkit.calendars.${s}`)}
            </button>
          ))}
        </div>
      </ToolToolbar>
      <ToolWorkspace layout="split">
        <ToolColumn>
          <ToolDatePicker
            label={t("tools.dateTimeToolkit.common.date")}
            value={input}
            onChange={setInput}
            calendarSystem={system}
            placeholder={system === "jalali" ? "1405/04/25" : "2026-07-15"}
          />
          <div className="tools-toolbar tools-toolbar--fields">
            <ToolField label={t("tools.dateTimeToolkit.common.amount")} value={amount} onChange={setAmount} dir="ltr" compact />
          </div>
          <div className="tools-toggle tools-toggle--wrap">
            {units.map((u) => (
              <button key={u} type="button" className={`tools-toggle__btn ${unit === u ? "tools-toggle__btn--active" : ""}`} onClick={() => setUnit(u)}>
                {t(`tools.dateTimeToolkit.units.${u}`)}
              </button>
            ))}
          </div>
        </ToolColumn>
        <ToolColumn>
          {!input.trim() ? null : !result ? (
            <ToolError message={t("tools.dateTimeToolkit.errors.invalidDate")} />
          ) : (
            <ToolOutputList
              items={[
                { label: t("tools.dateTimeToolkit.calendars.jalali"), value: result.jalali },
                { label: t("tools.dateTimeToolkit.calendars.gregorian"), value: result.gregorian },
                { label: t("tools.dateTimeToolkit.calendars.hijri"), value: result.hijri },
              ]}
            />
          )}
        </ToolColumn>
      </ToolWorkspace>
    </>
  );
}

export function DateDifferencePanel() {
  const { t } = useI18n();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [system, setSystem] = useState<CalendarSystem>("jalali");

  const diff = useMemo(() => {
    const a = parseDateTime(from, system);
    const b = parseDateTime(to, system);
    if (!a || !b) return null;
    const parts = diffDateParts(a.date, b.date);
    const weeks = Math.floor(Math.abs(parts.days) / 7);
    const remDays = Math.abs(parts.days) % 7;
    return { ...parts, weeks, remDays };
  }, [from, to, system]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          {(["jalali", "gregorian"] as CalendarSystem[]).map((s) => (
            <button key={s} type="button" className={`tools-toggle__btn ${system === s ? "tools-toggle__btn--active" : ""}`} onClick={() => setSystem(s)}>
              {t(`tools.dateTimeToolkit.calendars.${s}`)}
            </button>
          ))}
        </div>
      </ToolToolbar>
      <ToolWorkspace layout="stack">
        <ToolWorkspace layout="split">
          <ToolDatePicker label={t("tools.dateTimeToolkit.common.from")} value={from} onChange={setFrom} calendarSystem={system} placeholder={system === "jalali" ? "1405/01/01" : "2026-01-01"} />
          <ToolDatePicker label={t("tools.dateTimeToolkit.common.to")} value={to} onChange={setTo} calendarSystem={system} placeholder={system === "jalali" ? "1405/04/25" : "2026-04-25"} />
        </ToolWorkspace>
        {from && to && !diff ? (
          <ToolError message={t("tools.dateTimeToolkit.errors.invalidDate")} />
        ) : diff ? (
          <ToolOutputList
            items={[
              { label: t("tools.dateTimeToolkit.units.days"), value: `${Math.abs(diff.days)}` },
              { label: t("tools.dateTimeToolkit.dateCalc.weeksBreakdown"), value: `${diff.weeks} + ${diff.remDays}` },
              { label: t("tools.dateTimeToolkit.units.weeks"), value: `${Math.abs(diff.weeks)}` },
              { label: t("tools.dateTimeToolkit.units.months"), value: `${Math.abs(diff.months)}` },
              { label: t("tools.dateTimeToolkit.units.years"), value: `${Math.abs(diff.years)}` },
              { label: t("tools.dateTimeToolkit.units.hours"), value: `${Math.abs(diff.hours)}` },
            ]}
            columns={2}
          />
        ) : null}
      </ToolWorkspace>
    </>
  );
}

export function BusinessDaysPanel() {
  const { t } = useI18n();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mode, setMode] = useState<"weekdays" | "excludeThuFri" | "excludeSatSun">("excludeThuFri");
  const [system, setSystem] = useState<CalendarSystem>("jalali");

  const count = useMemo(() => {
    const a = parseDateTime(from, system);
    const b = parseDateTime(to, system);
    if (!a || !b) return null;
    return countBusinessDays(a.date, b.date, mode);
  }, [from, to, mode, system]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          {(["jalali", "gregorian"] as CalendarSystem[]).map((s) => (
            <button key={s} type="button" className={`tools-toggle__btn ${system === s ? "tools-toggle__btn--active" : ""}`} onClick={() => setSystem(s)}>
              {t(`tools.dateTimeToolkit.calendars.${s}`)}
            </button>
          ))}
        </div>
        <div className="tools-toggle">
          {(["excludeThuFri", "excludeSatSun", "weekdays"] as const).map((m) => (
            <button key={m} type="button" className={`tools-toggle__btn ${mode === m ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode(m)}>
              {t(`tools.dateTimeToolkit.businessDays.${m}`)}
            </button>
          ))}
        </div>
      </ToolToolbar>
      <ToolWorkspace layout="stack">
        <ToolWorkspace layout="split">
          <ToolDatePicker label={t("tools.dateTimeToolkit.common.from")} value={from} onChange={setFrom} calendarSystem={system} />
          <ToolDatePicker label={t("tools.dateTimeToolkit.common.to")} value={to} onChange={setTo} calendarSystem={system} />
        </ToolWorkspace>
        {from && to && count === null ? (
          <ToolError message={t("tools.dateTimeToolkit.errors.invalidDate")} />
        ) : count !== null ? (
          <ToolOutputList items={[{ label: t("tools.dateTimeToolkit.businessDays.result"), value: String(count) }]} />
        ) : null}
      </ToolWorkspace>
    </>
  );
}

export function WeekdayPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [system, setSystem] = useState<CalendarSystem>("jalali");

  const info = useMemo(() => {
    const parsed = parseDateTime(input, system);
    if (!parsed) return null;
    const idx = getWeekdayIndex(parsed.date);
    const weekdayFa = new Intl.DateTimeFormat("fa-IR", { weekday: "long" }).format(parsed.date);
    const weekdayEn = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(parsed.date);
    const iso = getIsoWeekInfo(parsed.date);
    return {
      weekdayKey: WEEKDAY_KEYS[idx],
      weekdayFa,
      weekdayEn,
      dayOfYear: getDayOfYear(parsed.date),
      isoWeek: iso.week,
      isoDay: iso.day,
    };
  }, [input, system]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          {(["jalali", "gregorian"] as CalendarSystem[]).map((s) => (
            <button key={s} type="button" className={`tools-toggle__btn ${system === s ? "tools-toggle__btn--active" : ""}`} onClick={() => setSystem(s)}>
              {t(`tools.dateTimeToolkit.calendars.${s}`)}
            </button>
          ))}
        </div>
      </ToolToolbar>
      <ToolWorkspace layout="stack">
        <ToolDatePicker label={t("tools.dateTimeToolkit.common.input")} value={input} onChange={setInput} calendarSystem={system} />
        {input && !info ? (
          <ToolError message={t("tools.dateTimeToolkit.errors.invalidDate")} />
        ) : info ? (
          <ToolOutputList
            items={[
              { label: t("tools.dateTimeToolkit.weekday.name"), value: language === "fa" ? info.weekdayFa : info.weekdayEn },
              { label: t("tools.dateTimeToolkit.weekday.alt"), value: language === "fa" ? info.weekdayEn : info.weekdayFa },
              { label: t("tools.dateTimeToolkit.weekday.dayOfYear"), value: String(info.dayOfYear) },
              { label: t("tools.dateTimeToolkit.weekday.weekNumber"), value: String(info.isoWeek) },
            ]}
            columns={2}
          />
        ) : null}
      </ToolWorkspace>
    </>
  );
}

export function AgeCalculatorPanel() {
  const { t } = useI18n();
  const [birth, setBirth] = useState("");
  const [system, setSystem] = useState<CalendarSystem>("jalali");

  const age = useMemo(() => {
    const parsed = parseDateTime(birth, system);
    if (!parsed) return null;
    const now = new Date();
    const duration = intervalToDuration({ start: parsed.date, end: now });
    const parts = diffDateParts(parsed.date, now);
    return {
      years: duration.years ?? 0,
      months: duration.months ?? 0,
      days: duration.days ?? 0,
      totalDays: Math.abs(parts.days),
      totalHours: Math.abs(parts.hours),
      totalMinutes: Math.abs(parts.minutes),
    };
  }, [birth, system]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          {(["jalali", "gregorian"] as CalendarSystem[]).map((s) => (
            <button key={s} type="button" className={`tools-toggle__btn ${system === s ? "tools-toggle__btn--active" : ""}`} onClick={() => setSystem(s)}>
              {t(`tools.dateTimeToolkit.calendars.${s}`)}
            </button>
          ))}
        </div>
      </ToolToolbar>
      <ToolWorkspace layout="stack">
        <ToolDatePicker label={t("tools.dateTimeToolkit.age.birthDate")} value={birth} onChange={setBirth} calendarSystem={system} placeholder="1378/02/12" />
        {birth && !age ? (
          <ToolError message={t("tools.dateTimeToolkit.errors.invalidDate")} />
        ) : age ? (
          <ToolOutputList
            items={[
              { label: t("tools.dateTimeToolkit.age.summary"), value: `${age.years}y ${age.months}m ${age.days}d` },
              { label: t("tools.dateTimeToolkit.units.days"), value: String(age.totalDays) },
              { label: t("tools.dateTimeToolkit.units.hours"), value: String(age.totalHours) },
              { label: t("tools.dateTimeToolkit.units.minutes"), value: String(age.totalMinutes) },
            ]}
            columns={2}
          />
        ) : null}
      </ToolWorkspace>
    </>
  );
}

export function LeapYearPanel() {
  const { t } = useI18n();
  const [year, setYear] = useState("2028");
  const [system, setSystem] = useState<CalendarSystem>("gregorian");

  const isLeap = useMemo(() => {
    const y = Number(year);
    if (!Number.isFinite(y) || y < 1) return null;
    return checkLeapYear(y, system);
  }, [year, system]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          {(["gregorian", "jalali", "hijri"] as CalendarSystem[]).map((s) => (
            <button key={s} type="button" className={`tools-toggle__btn ${system === s ? "tools-toggle__btn--active" : ""}`} onClick={() => setSystem(s)}>
              {t(`tools.dateTimeToolkit.calendars.${s}`)}
            </button>
          ))}
        </div>
      </ToolToolbar>
      <ToolWorkspace layout="stack">
        <ToolField label={t("tools.dateTimeToolkit.leapYear.year")} value={year} onChange={setYear} dir="ltr" />
        {isLeap !== null && (
          <ToolOutputList
            items={[
              {
                label: t("tools.dateTimeToolkit.leapYear.result"),
                value: isLeap ? t("tools.dateTimeToolkit.leapYear.yes") : t("tools.dateTimeToolkit.leapYear.no"),
              },
            ]}
          />
        )}
      </ToolWorkspace>
    </>
  );
}

export function IsoWeekPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");

  const info = useMemo(() => {
    const parsed = parseDateTime(input);
    if (!parsed) return null;
    return getIsoWeekInfo(parsed.date);
  }, [input]);

  return (
    <ToolWorkspace layout="stack">
      <ToolDatePicker label={t("tools.dateTimeToolkit.common.input")} value={input} onChange={setInput} calendarSystem="gregorian" placeholder="2026-07-15" />
      {input && !info ? (
        <ToolError message={t("tools.dateTimeToolkit.errors.invalidDate")} />
      ) : info ? (
        <ToolOutputList
          items={[
            { label: t("tools.dateTimeToolkit.isoWeek.week"), value: `Week ${info.week}` },
            { label: t("tools.dateTimeToolkit.isoWeek.weekYear"), value: String(info.weekYear) },
            { label: t("tools.dateTimeToolkit.isoWeek.day"), value: `Day ${info.day}` },
          ]}
        />
      ) : null}
    </ToolWorkspace>
  );
}

export function DateRangePanel() {
  const { t } = useI18n();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [system, setSystem] = useState<CalendarSystem>("jalali");

  const range = useMemo(() => {
    const a = parseDateTime(from, system);
    const b = parseDateTime(to, system);
    if (!a || !b) return null;
    const start = a.date <= b.date ? a.date : b.date;
    const end = a.date <= b.date ? b.date : a.date;
    const dates: string[] = [];
    let cur = new Date(start);
    while (cur <= end && dates.length < 366) {
      dates.push(system === "jalali" ? formatJalaliDate(cur) : formatGregorianDate(cur));
      cur = addToDate(cur, 1, "days");
    }
    return dates.join("\n");
  }, [from, to, system]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          {(["jalali", "gregorian"] as CalendarSystem[]).map((s) => (
            <button key={s} type="button" className={`tools-toggle__btn ${system === s ? "tools-toggle__btn--active" : ""}`} onClick={() => setSystem(s)}>
              {t(`tools.dateTimeToolkit.calendars.${s}`)}
            </button>
          ))}
        </div>
      </ToolToolbar>
      <ToolWorkspace layout="stack">
        <ToolWorkspace layout="split">
          <ToolDatePicker label={t("tools.dateTimeToolkit.common.from")} value={from} onChange={setFrom} calendarSystem={system} />
          <ToolDatePicker label={t("tools.dateTimeToolkit.common.to")} value={to} onChange={setTo} calendarSystem={system} />
        </ToolWorkspace>
        {from && to && !range ? (
          <ToolError message={t("tools.dateTimeToolkit.errors.invalidDate")} />
        ) : range ? (
          <ToolField label={t("tools.dateTimeToolkit.dateRange.result")} value={range} readOnly dir="ltr" />
        ) : null}
      </ToolWorkspace>
    </>
  );
}
