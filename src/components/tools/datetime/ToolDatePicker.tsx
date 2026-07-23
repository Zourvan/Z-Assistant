import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import ReactDOM from "react-dom";
import * as dateFns from "date-fns";
import * as dateFnsJalali from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale/fa-IR";
import { toGregorian, toHijri } from "hijri-converter";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../../../i18n/LanguageProvider";
import { useCalendar } from "../../Settings";
import { buildThemeCssVars } from "../../settings/themeUtils";
import type { DayOfWeek } from "../../settings/types";
import {
  parseDateTime,
  formatDateBySystem,
  extractTimePart,
  applyTimeToDate,
  toGregorianInputValue,
  fromGregorianInputValue,
} from "./utils/calendars";
import type { CalendarSystem } from "./types";

const INDEX_TO_DAY: DayOfWeek[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_NAME_TO_INDEX: Record<DayOfWeek, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

function toFaDigits(n: number | string) {
  return String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

interface MiniCalendarProps {
  viewDate: Date;
  selectedDate: Date | null;
  calendarSystem: CalendarSystem;
  firstDayOfWeek: DayOfWeek;
  onSelect: (date: Date) => void;
  onViewChange: (date: Date) => void;
}

function MiniCalendar({ viewDate, selectedDate, calendarSystem, firstDayOfWeek, onSelect, onViewChange }: MiniCalendarProps) {
  const { t, dir, language } = useI18n();
  const firstDayIndex = DAY_NAME_TO_INDEX[firstDayOfWeek];

  const monthLabel = useMemo(() => {
    if (calendarSystem === "jalali") {
      // Always use fa-IR so Jalali months stay Persian (avoids mixed "May 1405").
      const label = dateFnsJalali.format(viewDate, "MMMM yyyy", { locale: faIR });
      return language === "fa" ? toFaDigits(label) : label;
    }
    if (calendarSystem === "hijri") {
      const h = toHijri(viewDate.getFullYear(), viewDate.getMonth() + 1, viewDate.getDate());
      const label = `${h.hy}-${String(h.hm).padStart(2, "0")}`;
      return language === "fa" ? toFaDigits(label) : label;
    }
    return dateFns.format(viewDate, "MMMM yyyy");
  }, [viewDate, calendarSystem, language]);

  const weekLabels = useMemo(() => {
    const labels: string[] = [];
    for (let i = 0; i < 7; i++) {
      const day = INDEX_TO_DAY[(firstDayIndex + i) % 7];
      labels.push(t(`daysShort.${day}`));
    }
    return labels;
  }, [firstDayIndex, t]);

  const days = useMemo(() => {
    type DayCell = { key: string; day: number; date: Date; isToday: boolean; isSelected: boolean };
    const cells: Array<DayCell | null> = [];

    if (calendarSystem === "hijri") {
      const anchor = toHijri(viewDate.getFullYear(), viewDate.getMonth() + 1, viewDate.getDate());
      const hy = anchor.hy;
      const hm = anchor.hm;
      const monthDays: DayCell[] = [];
      for (let d = 1; d <= 30; d++) {
        const g = toGregorian(hy, hm, d);
        const date = new Date(g.gy, g.gm - 1, g.gd);
        const back = toHijri(g.gy, g.gm, g.gd);
        if (back.hy !== hy || back.hm !== hm) break;
        monthDays.push({
          key: `h-${hy}-${hm}-${d}`,
          day: d,
          date,
          isToday: dateFns.isSameDay(date, new Date()),
          isSelected: selectedDate ? dateFns.isSameDay(date, selectedDate) : false,
        });
      }
      const startWeekday = dateFns.getDay(monthDays[0]?.date ?? viewDate);
      const offset = (7 + startWeekday - firstDayIndex) % 7;
      for (let i = 0; i < offset; i++) cells.push(null);
      monthDays.forEach((d) => cells.push(d));
      return cells;
    }

    const lib = calendarSystem === "jalali" ? dateFnsJalali : dateFns;
    const monthStart = lib.startOfMonth(viewDate);
    const daysInMonth = lib.getDaysInMonth(viewDate);
    const startWeekday = lib.getDay(monthStart);
    const offset = (7 + startWeekday - firstDayIndex) % 7;
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = lib.setDate(monthStart, d);
      cells.push({
        key: `${calendarSystem}-${d}`,
        day: d,
        date,
        isToday: lib.isSameDay(date, new Date()),
        isSelected: selectedDate ? lib.isSameDay(date, selectedDate) : false,
      });
    }
    return cells;
  }, [viewDate, calendarSystem, firstDayIndex, selectedDate]);

  const shiftMonth = (delta: number) => {
    if (calendarSystem === "hijri") {
      const h = toHijri(viewDate.getFullYear(), viewDate.getMonth() + 1, viewDate.getDate());
      let nm = h.hm + delta;
      let ny = h.hy;
      while (nm < 1) {
        nm += 12;
        ny -= 1;
      }
      while (nm > 12) {
        nm -= 12;
        ny += 1;
      }
      const g = toGregorian(ny, nm, 1);
      onViewChange(new Date(g.gy, g.gm - 1, g.gd));
      return;
    }
    const lib = calendarSystem === "jalali" ? dateFnsJalali : dateFns;
    onViewChange(delta < 0 ? lib.subMonths(viewDate, 1) : lib.addMonths(viewDate, 1));
  };

  const PrevIcon = dir === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <div className="tools-date-picker__calendar">
      <div className="tools-date-picker__nav">
        <button type="button" className="tools-date-picker__nav-btn" onClick={() => shiftMonth(-1)} aria-label={t("calendar.previousMonth")}>
          <PrevIcon size={14} />
        </button>
        <span className="tools-date-picker__month">{monthLabel}</span>
        <button type="button" className="tools-date-picker__nav-btn" onClick={() => shiftMonth(1)} aria-label={t("calendar.nextMonth")}>
          <NextIcon size={14} />
        </button>
      </div>
      <div className="tools-date-picker__weekdays">
        {weekLabels.map((label) => (
          <span key={label} className="tools-date-picker__weekday">
            {label}
          </span>
        ))}
      </div>
      <div className="tools-date-picker__days">
        {days.map((cell, i) =>
          cell ? (
            <button
              key={cell.key}
              type="button"
              className={`tools-date-picker__day ${cell.isToday ? "tools-date-picker__day--today" : ""} ${cell.isSelected ? "tools-date-picker__day--selected" : ""}`}
              onClick={() => onSelect(cell.date)}
            >
              {language === "fa" && calendarSystem !== "gregorian" ? toFaDigits(cell.day) : cell.day}
            </button>
          ) : (
            <span key={`empty-${i}`} className="tools-date-picker__day tools-date-picker__day--empty" />
          ),
        )}
      </div>
    </div>
  );
}

export interface ToolDatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  calendarSystem?: CalendarSystem;
  showTime?: boolean;
  placeholder?: string;
  hint?: string;
  compact?: boolean;
}

export function ToolDatePicker({
  label,
  value,
  onChange,
  calendarSystem: calendarSystemProp,
  showTime = false,
  placeholder,
  hint,
  compact,
}: ToolDatePickerProps) {
  const { t, dir } = useI18n();
  const { calendarType, firstDayOfWeek, textColor, backgroundColor } = useCalendar();
  const defaultSystem: CalendarSystem = calendarType === "persian" ? "jalali" : "gregorian";
  const calendarSystem = calendarSystemProp ?? defaultSystem;
  const themeStyle = useMemo(() => buildThemeCssVars(textColor, backgroundColor), [textColor, backgroundColor]);

  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const nativeRef = useRef<HTMLInputElement>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, width: 0 });

  const parsed = useMemo(() => parseDateTime(value, calendarSystem), [value, calendarSystem]);
  const [viewDate, setViewDate] = useState<Date>(() => parsed?.date ?? new Date());

  useEffect(() => {
    if (parsed?.date) setViewDate(parsed.date);
  }, [parsed?.date]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverHeight = 320;
    const popoverWidth = Math.max(rect.width, 260);
    let top = rect.bottom + 4;
    let left = rect.left;

    if (top + popoverHeight > window.innerHeight - 8) {
      top = Math.max(8, rect.top - popoverHeight - 4);
    }
    if (left + popoverWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - popoverWidth - 8);
    }

    setPopoverPos({ top, left, width: rect.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      const popover = document.querySelector(".tools-date-picker__popover");
      if (popover?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const commitDate = (date: Date, time?: string) => {
    const timeStr = time ?? (showTime ? extractTimePart(value) : "00:00:00");
    const withTimeDate = showTime ? applyTimeToDate(date, timeStr) : date;
    onChange(formatDateBySystem(withTimeDate, calendarSystem, showTime));
    setOpen(false);
  };

  const handleNativeDate = (nativeValue: string) => {
    const date = fromGregorianInputValue(nativeValue);
    if (!date) return;
    commitDate(date);
  };

  const handleTimeChange = (time: string) => {
    const base = parsed?.date ?? new Date();
    const withTime = applyTimeToDate(base, time.length === 5 ? `${time}:00` : time);
    onChange(formatDateBySystem(withTime, calendarSystem, true));
  };

  const openPicker = () => {
    if (calendarSystem === "gregorian" && !showTime && nativeRef.current) {
      try {
        nativeRef.current.showPicker();
        return;
      } catch {
        // fallback to custom popover
      }
    }
    updatePosition();
    setOpen(true);
  };

  const nativeValue = parsed ? toGregorianInputValue(parsed.date) : "";

  const popover =
    open &&
    ReactDOM.createPortal(
      <div
        className="tools-date-picker__popover"
        style={{
          ...themeStyle,
          top: popoverPos.top,
          left: popoverPos.left,
          minWidth: Math.max(popoverPos.width, 260),
        }}
        dir={dir}
        role="dialog"
        aria-label={t("tools.dateTimeToolkit.picker.pickDate")}
      >
        <MiniCalendar
          viewDate={viewDate}
          selectedDate={parsed?.date ?? null}
          calendarSystem={calendarSystem}
          firstDayOfWeek={firstDayOfWeek}
          onSelect={(date) => commitDate(date)}
          onViewChange={setViewDate}
        />
        <div className="tools-date-picker__footer">
          <button type="button" className="tools-date-picker__today-btn" onClick={() => commitDate(new Date())}>
            {t("tools.dateTimeToolkit.picker.today")}
          </button>
          {showTime && (
            <input
              type="time"
              className="tools-date-picker__time-input"
              value={extractTimePart(value).slice(0, 5)}
              onChange={(e) => handleTimeChange(e.target.value)}
              step={1}
            />
          )}
        </div>
      </div>,
      document.body,
    );

  return (
    <label className={`tools-field ${compact ? "tools-field--compact" : ""}`}>
      <span className="tools-field__label">{label}</span>
      <div className="tools-field__row tools-date-picker" ref={triggerRef}>
        <input
          className="tools-field__input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          dir="ltr"
        />
        {calendarSystem === "gregorian" && !showTime && (
          <input
            ref={nativeRef}
            type="date"
            className="tools-date-picker__native"
            value={nativeValue}
            onChange={(e) => handleNativeDate(e.target.value)}
            tabIndex={-1}
            aria-hidden
          />
        )}
        <button
          type="button"
          className="tools-date-picker__trigger"
          onClick={openPicker}
          aria-label={t("tools.dateTimeToolkit.picker.pickDate")}
          aria-expanded={open}
        >
          <CalendarDays size={14} />
        </button>
      </div>
      {hint && <span className="tools-field__hint">{hint}</span>}
      {popover}
    </label>
  );
}

export interface ToolTimePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  compact?: boolean;
}

export function ToolTimePicker({ label, value, onChange, placeholder, compact }: ToolTimePickerProps) {
  const { t } = useI18n();
  const normalized = value.match(/^\d{1,2}:\d{2}/) ? value.slice(0, 5) : "";

  return (
    <label className={`tools-field ${compact ? "tools-field--compact" : ""}`}>
      <span className="tools-field__label">{label}</span>
      <div className="tools-field__row tools-time-picker">
        <input
          className="tools-field__input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "08:30"}
          dir="ltr"
        />
        <input
          type="time"
          className="tools-time-picker__native"
          value={normalized}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v.length === 5 && value.includes(":") && value.split(":").length === 3 ? `${v}:00` : v);
          }}
          step={1}
          aria-label={t("tools.dateTimeToolkit.picker.pickTime")}
        />
      </div>
    </label>
  );
}
