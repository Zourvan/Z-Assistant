import { useState, useMemo, useEffect } from "react";
import { formatDistance } from "date-fns";
import { faIR, enUS } from "date-fns/locale";
import { useI18n } from "../../../../i18n/LanguageProvider";
import { ToolWorkspace, ToolToolbar, ToolColumn, ToolField, ToolError, ToolOutputList } from "../../shared";
import {
  parseTime,
  formatTime,
  timeToSeconds,
  convertTimeUnits,
  formatDurationBreakdown,
  parseDateTime,
  formatInTimezone,
  COMMON_TIMEZONES,
  zonedTimeToUtc,
  addToDate,
} from "../utils/calendars";
import { interpretCron, buildCron } from "../utils/cron";

export function TimeCalculatorPanel() {
  const { t } = useI18n();
  const [time1, setTime1] = useState("08:45");
  const [time2, setTime2] = useState("03:20");
  const [mode, setMode] = useState<"add" | "subtract" | "diff">("add");

  const result = useMemo(() => {
    const a = parseTime(time1);
    const b = parseTime(time2);
    if (!a || !b) return null;
    const s1 = timeToSeconds(a.hours, a.minutes, a.seconds);
    const s2 = timeToSeconds(b.hours, b.minutes, b.seconds);
    if (mode === "diff") return formatTime(Math.abs(s1 - s2));
    return formatTime(mode === "add" ? s1 + s2 : s1 - s2);
  }, [time1, time2, mode]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          {(["add", "subtract", "diff"] as const).map((m) => (
            <button key={m} type="button" className={`tools-toggle__btn ${mode === m ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode(m)}>
              {t(`tools.dateTimeToolkit.timeCalc.${m}`)}
            </button>
          ))}
        </div>
      </ToolToolbar>
      <ToolWorkspace layout="split">
        <ToolColumn>
          <ToolField label={t("tools.dateTimeToolkit.timeCalc.timeA")} value={time1} onChange={setTime1} placeholder="08:45" dir="ltr" />
          <ToolField label={t("tools.dateTimeToolkit.timeCalc.timeB")} value={time2} onChange={setTime2} placeholder="03:20" dir="ltr" />
        </ToolColumn>
        <ToolColumn>
          {!time1.trim() && !time2.trim() ? null : !result ? (
            <ToolError message={t("tools.dateTimeToolkit.errors.invalidTime")} />
          ) : (
            <ToolOutputList items={[{ label: t("tools.dateTimeToolkit.common.result"), value: result }]} />
          )}
        </ToolColumn>
      </ToolWorkspace>
    </>
  );
}

export function DurationPanel() {
  const { t } = useI18n();
  const [days, setDays] = useState("2");
  const [hours, setHours] = useState("4");
  const [minutes, setMinutes] = useState("20");

  const result = useMemo(() => {
    const d = Number(days) || 0;
    const h = Number(hours) || 0;
    const m = Number(minutes) || 0;
    const totalMinutes = d * 1440 + h * 60 + m;
    const totalSeconds = totalMinutes * 60;
    const totalHours = Math.floor(totalMinutes / 60);
    const remMinutes = totalMinutes % 60;
    return {
      hoursMinutes: `${totalHours}h ${remMinutes}m`,
      minutes: String(totalMinutes),
      seconds: String(totalSeconds),
    };
  }, [days, hours, minutes]);

  return (
    <ToolWorkspace layout="stack">
      <ToolWorkspace layout="split-3">
        <ToolField label={t("tools.dateTimeToolkit.units.days")} value={days} onChange={setDays} dir="ltr" compact />
        <ToolField label={t("tools.dateTimeToolkit.units.hours")} value={hours} onChange={setHours} dir="ltr" compact />
        <ToolField label={t("tools.dateTimeToolkit.units.minutes")} value={minutes} onChange={setMinutes} dir="ltr" compact />
      </ToolWorkspace>
      <ToolOutputList
        items={[
          { label: t("tools.dateTimeToolkit.duration.hoursMinutes"), value: result.hoursMinutes },
          { label: t("tools.dateTimeToolkit.units.minutes"), value: result.minutes },
          { label: t("tools.dateTimeToolkit.units.seconds"), value: result.seconds },
        ]}
        columns={2}
      />
    </ToolWorkspace>
  );
}

const TIME_UNITS = ["ms", "seconds", "minutes", "hours", "days", "weeks", "months", "years"] as const;

export function TimeUnitPanel() {
  const { t } = useI18n();
  const [value, setValue] = useState("100000");
  const [from, setFrom] = useState<(typeof TIME_UNITS)[number]>("seconds");

  const outputs = useMemo(() => {
    const num = Number(value);
    if (!Number.isFinite(num)) return null;
    if (from === "seconds") {
      const b = formatDurationBreakdown(num);
      return [
        { label: t("tools.dateTimeToolkit.timeUnit.human"), value: `${b.days ? `${b.days}d ` : ""}${b.hours}h ${b.minutes}m ${b.seconds}s`.trim() },
        ...TIME_UNITS.filter((u) => u !== from).map((u) => ({
          label: t(`tools.dateTimeToolkit.units.${u}`),
          value: String(Math.round(convertTimeUnits(num, from, u) * 1000) / 1000),
        })),
      ];
    }
    return TIME_UNITS.filter((u) => u !== from).map((u) => ({
      label: t(`tools.dateTimeToolkit.units.${u}`),
      value: String(Math.round(convertTimeUnits(num, from, u) * 1000) / 1000),
    }));
  }, [value, from, t]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle tools-toggle--wrap">
          {TIME_UNITS.map((u) => (
            <button key={u} type="button" className={`tools-toggle__btn ${from === u ? "tools-toggle__btn--active" : ""}`} onClick={() => setFrom(u)}>
              {t(`tools.dateTimeToolkit.units.${u}`)}
            </button>
          ))}
        </div>
      </ToolToolbar>
      <ToolWorkspace layout="stack">
        <ToolField label={t("tools.dateTimeToolkit.common.input")} value={value} onChange={setValue} dir="ltr" />
        {outputs ? <ToolOutputList items={outputs} columns={2} /> : value.trim() ? <ToolError message={t("tools.dateTimeToolkit.errors.invalidNumber")} /> : null}
      </ToolWorkspace>
    </>
  );
}

export function TimezonePanel() {
  const { t } = useI18n();
  const [time, setTime] = useState("08:30");
  const [date, setDate] = useState("");
  const [sourceTz, setSourceTz] = useState("Asia/Tehran");

  const outputs = useMemo(() => {
    const tm = parseTime(time);
    if (!tm) return null;
    const baseDate = date.trim() ? parseDateTime(date.trim())?.date : new Date();
    if (!baseDate) return null;
    const instant = zonedTimeToUtc(
      baseDate.getFullYear(),
      baseDate.getMonth() + 1,
      baseDate.getDate(),
      tm.hours,
      tm.minutes,
      tm.seconds,
      sourceTz,
    );
    return COMMON_TIMEZONES.map((tz) => ({
      label: tz,
      value: formatInTimezone(instant, tz),
    }));
  }, [time, date, sourceTz]);

  return (
    <ToolWorkspace layout="stack">
      <ToolWorkspace layout="split">
        <ToolField label={t("tools.dateTimeToolkit.timezone.time")} value={time} onChange={setTime} placeholder="08:30" dir="ltr" />
        <ToolField label={t("tools.dateTimeToolkit.common.date")} value={date} onChange={setDate} placeholder="2026-07-15" dir="ltr" hint={t("tools.dateTimeToolkit.timezone.dateHint")} />
      </ToolWorkspace>
      <ToolToolbar>
        <span className="tools-section__title" style={{ margin: 0 }}>{t("tools.dateTimeToolkit.timezone.source")}</span>
        <div className="tools-toggle tools-toggle--wrap">
          {COMMON_TIMEZONES.map((tz) => (
            <button key={tz} type="button" className={`tools-toggle__btn ${sourceTz === tz ? "tools-toggle__btn--active" : ""}`} onClick={() => setSourceTz(tz)}>
              {tz.replace("_", " ")}
            </button>
          ))}
        </div>
      </ToolToolbar>
      {time && !outputs ? <ToolError message={t("tools.dateTimeToolkit.errors.invalidTime")} /> : outputs ? <ToolOutputList items={outputs} columns={1} /> : null}
    </ToolWorkspace>
  );
}

export function CountdownPanel() {
  const { t, language } = useI18n();
  const [target, setTarget] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = useMemo(() => {
    const parsed = parseDateTime(target);
    if (!parsed) return null;
    const diffMs = parsed.date.getTime() - now;
    const abs = Math.abs(diffMs);
    const b = formatDurationBreakdown(abs / 1000);
    const locale = language === "fa" ? faIR : enUS;
    const label = diffMs >= 0 ? t("tools.dateTimeToolkit.countdown.remaining") : t("tools.dateTimeToolkit.countdown.ago");
    return {
      label,
      text: `${b.days}d ${b.hours}h ${b.minutes}m ${b.seconds}s`,
      relative: formatDistance(parsed.date, new Date(now), { addSuffix: true, locale }),
    };
  }, [target, now, t, language]);

  return (
    <ToolWorkspace layout="stack">
      <ToolField label={t("tools.dateTimeToolkit.countdown.target")} value={target} onChange={setTarget} placeholder="1405/01/01" dir="ltr" />
      {target && !remaining ? (
        <ToolError message={t("tools.dateTimeToolkit.errors.invalidDate")} />
      ) : remaining ? (
        <ToolOutputList
          items={[
            { label: remaining.label, value: remaining.text },
            { label: t("tools.dateTimeToolkit.relativeTime.title"), value: remaining.relative },
          ]}
        />
      ) : null}
    </ToolWorkspace>
  );
}

export function RelativeTimePanel() {
  const { t, language } = useI18n();
  const [input, setInput] = useState("");
  const [reference, setReference] = useState<"now" | "custom">("now");
  const [refDate, setRefDate] = useState("");

  const text = useMemo(() => {
    const parsed = parseDateTime(input);
    if (!parsed) return null;
    const locale = language === "fa" ? faIR : enUS;
    const ref = reference === "now" ? new Date() : parseDateTime(refDate)?.date;
    if (!ref) return null;
    return formatDistance(parsed.date, ref, { addSuffix: true, locale });
  }, [input, reference, refDate, language]);

  return (
    <ToolWorkspace layout="stack">
      <ToolField label={t("tools.dateTimeToolkit.common.input")} value={input} onChange={setInput} placeholder="2026-07-12" dir="ltr" />
      <ToolToolbar>
        <div className="tools-toggle">
          <button type="button" className={`tools-toggle__btn ${reference === "now" ? "tools-toggle__btn--active" : ""}`} onClick={() => setReference("now")}>
            {t("tools.dateTimeToolkit.common.now")}
          </button>
          <button type="button" className={`tools-toggle__btn ${reference === "custom" ? "tools-toggle__btn--active" : ""}`} onClick={() => setReference("custom")}>
            {t("tools.dateTimeToolkit.relativeTime.customRef")}
          </button>
        </div>
      </ToolToolbar>
      {reference === "custom" && <ToolField label={t("tools.dateTimeToolkit.relativeTime.reference")} value={refDate} onChange={setRefDate} dir="ltr" />}
      {input && !text ? (
        <ToolError message={t("tools.dateTimeToolkit.errors.invalidDate")} />
      ) : text ? (
        <ToolOutputList items={[{ label: t("tools.dateTimeToolkit.relativeTime.title"), value: text }]} />
      ) : null}
    </ToolWorkspace>
  );
}

export function CronPanel() {
  const { t } = useI18n();
  const [mode, setMode] = useState<"interpret" | "build">("interpret");
  const [expression, setExpression] = useState("0 3 * * *");
  const [fields, setFields] = useState({ minute: "0", hour: "3", dom: "*", month: "*", dow: "*" });

  const output = useMemo(() => {
    if (mode === "interpret") return interpretCron(expression).join("\n");
    return buildCron(fields);
  }, [mode, expression, fields]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          <button type="button" className={`tools-toggle__btn ${mode === "interpret" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("interpret")}>
            {t("tools.dateTimeToolkit.cron.interpret")}
          </button>
          <button type="button" className={`tools-toggle__btn ${mode === "build" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("build")}>
            {t("tools.dateTimeToolkit.cron.build")}
          </button>
        </div>
      </ToolToolbar>
      <ToolWorkspace layout="stack">
        {mode === "interpret" ? (
          <ToolField label={t("tools.dateTimeToolkit.cron.expression")} value={expression} onChange={setExpression} placeholder="0 3 * * *" dir="ltr" />
        ) : (
          <ToolWorkspace layout="split-3">
            {(["minute", "hour", "dom", "month", "dow"] as const).map((f) => (
              <ToolField
                key={f}
                label={t(`tools.dateTimeToolkit.cron.${f}`)}
                value={fields[f]}
                onChange={(v) => setFields((prev) => ({ ...prev, [f]: v }))}
                dir="ltr"
                compact
              />
            ))}
          </ToolWorkspace>
        )}
        <ToolField label={t("tools.dateTimeToolkit.common.result")} value={output} readOnly dir="ltr" />
      </ToolWorkspace>
    </>
  );
}

export function AddTimeToClockPanel() {
  const { t } = useI18n();
  const [time, setTime] = useState("08:30");
  const [hours, setHours] = useState("3");
  const [minutes, setMinutes] = useState("20");

  const result = useMemo(() => {
    const tm = parseTime(time);
    if (!tm) return null;
    const base = new Date(2000, 0, 1, tm.hours, tm.minutes, tm.seconds);
    const added = addToDate(addToDate(base, Number(hours) || 0, "hours"), Number(minutes) || 0, "minutes");
    return formatTime(timeToSeconds(added.getHours(), added.getMinutes(), added.getSeconds()));
  }, [time, hours, minutes]);

  return (
    <ToolWorkspace layout="stack">
      <ToolField label={t("tools.dateTimeToolkit.timeCalc.baseTime")} value={time} onChange={setTime} dir="ltr" />
      <ToolWorkspace layout="split">
        <ToolField label={t("tools.dateTimeToolkit.units.hours")} value={hours} onChange={setHours} dir="ltr" compact />
        <ToolField label={t("tools.dateTimeToolkit.units.minutes")} value={minutes} onChange={setMinutes} dir="ltr" compact />
      </ToolWorkspace>
      {time.trim() && !result ? <ToolError message={t("tools.dateTimeToolkit.errors.invalidTime")} /> : result ? <ToolOutputList items={[{ label: t("tools.dateTimeToolkit.common.result"), value: result }]} /> : null}
    </ToolWorkspace>
  );
}
