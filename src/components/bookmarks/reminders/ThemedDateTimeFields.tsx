import { useEffect, useMemo, useRef, useState } from "react";
import * as dateFns from "date-fns";
import * as dateFnsJalali from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale/fa-IR";
import { useCalendar } from "../../Settings";
import { useI18n } from "../../../i18n/LanguageProvider";
import { convertToPersianNumbers } from "../../tasks/taskUtils";
import "./ThemedDateTimeFields.css";

interface ThemedDateTimeFieldsProps {
  value: Date;
  dateOnly?: boolean;
  onChange: (next: Date) => void;
}

const WEEKDAY_KEYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export function ThemedDateTimeFields({ value, dateOnly = false, onChange }: ThemedDateTimeFieldsProps) {
  const { calendarType } = useCalendar();
  const { t, language, dir } = useI18n();
  const useJalali = calendarType === "persian" || language === "fa";
  const dateLib = useJalali ? dateFnsJalali : dateFns;
  const weekStartsOn = useJalali ? 6 : 0;

  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setViewDate(value);
  }, [value]);

  useEffect(() => {
    if (dateOnly) setTimeOpen(false);
  }, [dateOnly]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setDateOpen(false);
        setTimeOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const localize = (text: string | number) =>
    language === "fa" ? convertToPersianNumbers(String(text)) : String(text);

  const dateLabel = useMemo(() => {
    if (useJalali) {
      const formatted = dateFnsJalali.format(value, "dd MMMM yyyy", { locale: faIR });
      return language === "fa" ? convertToPersianNumbers(formatted) : formatted;
    }
    return dateFns.format(value, "dd MMMM yyyy");
  }, [value, useJalali, language]);

  const timeLabel = useMemo(() => {
    const formatted = dateFns.format(value, "HH:mm");
    return language === "fa" ? convertToPersianNumbers(formatted) : formatted;
  }, [value, language]);

  const monthTitle = useMemo(() => {
    if (useJalali) {
      const formatted = dateFnsJalali.format(viewDate, "MMMM yyyy", { locale: faIR });
      return language === "fa" ? convertToPersianNumbers(formatted) : formatted;
    }
    return dateFns.format(viewDate, "MMMM yyyy");
  }, [viewDate, useJalali, language]);

  const daysInMonth = dateLib.getDaysInMonth(viewDate);
  const monthStart = dateLib.startOfMonth(viewDate);
  const startWeekday = dateLib.getDay(monthStart);
  const leadingEmpty = (startWeekday - weekStartsOn + 7) % 7;

  const weekdayLabels = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const idx = (weekStartsOn + i) % 7;
      return t(`daysShort.${WEEKDAY_KEYS[idx]}`);
    });
  }, [weekStartsOn, t]);

  const pickDay = (day: number) => {
    const next = dateLib.setDate(dateLib.startOfMonth(viewDate), day);
    next.setHours(value.getHours(), value.getMinutes(), 0, 0);
    onChange(next);
    setDateOpen(false);
  };

  const setHour = (hour: number) => {
    const next = new Date(value.getTime());
    next.setHours(hour);
    onChange(next);
  };

  const setMinute = (minute: number) => {
    const next = new Date(value.getTime());
    next.setMinutes(minute);
    onChange(next);
    setTimeOpen(false);
  };

  return (
    <div className="themed-dt" ref={rootRef} dir={dir}>
      <div className={`themed-dt__row${dateOnly ? " themed-dt__row--single" : ""}`}>
        <div className="themed-dt__field">
          <span className="themed-dt__label">{t("bookmarks.reminder.date")}</span>
          <button
            type="button"
            className="themed-dt__trigger"
            aria-expanded={dateOpen}
            onClick={() => {
              setTimeOpen(false);
              setDateOpen((open) => !open);
            }}
          >
            <span>{dateLabel}</span>
            <span className="themed-dt__chevron">▾</span>
          </button>
          {dateOpen && (
            <div className="themed-dt__panel themed-dt__panel--cal">
              <div className="themed-dt__nav">
                <button type="button" onClick={() => setViewDate(dateLib.subMonths(viewDate, 1))}>
                  ‹
                </button>
                <span>{monthTitle}</span>
                <button type="button" onClick={() => setViewDate(dateLib.addMonths(viewDate, 1))}>
                  ›
                </button>
              </div>
              <div className="themed-dt__weekdays">
                {weekdayLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="themed-dt__grid">
                {Array.from({ length: leadingEmpty }, (_, i) => (
                  <span key={`e-${i}`} className="themed-dt__day themed-dt__day--empty" />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const cellDate = dateLib.setDate(monthStart, day);
                  const selected = dateLib.isSameDay(cellDate, value);
                  const today = dateLib.isSameDay(cellDate, new Date());
                  return (
                    <button
                      key={day}
                      type="button"
                      className={`themed-dt__day${selected ? " is-selected" : ""}${today ? " is-today" : ""}`}
                      onClick={() => pickDay(day)}
                    >
                      {localize(day)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {!dateOnly && (
          <div className="themed-dt__field">
            <span className="themed-dt__label">{t("bookmarks.reminder.time")}</span>
            <button
              type="button"
              className="themed-dt__trigger"
              aria-expanded={timeOpen}
              onClick={() => {
                setDateOpen(false);
                setTimeOpen((open) => !open);
              }}
            >
              <span>{timeLabel}</span>
              <span className="themed-dt__chevron">▾</span>
            </button>
            {timeOpen && (
              <div className="themed-dt__panel themed-dt__panel--time">
                <div className="themed-dt__time-cols">
                  <div className="themed-dt__time-col">
                    <span>{t("bookmarks.reminder.hour")}</span>
                    <div className="themed-dt__time-list">
                      {Array.from({ length: 24 }, (_, hour) => (
                        <button
                          key={hour}
                          type="button"
                          className={hour === value.getHours() ? "is-selected" : ""}
                          onClick={() => setHour(hour)}
                        >
                          {localize(String(hour).padStart(2, "0"))}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="themed-dt__time-col">
                    <span>{t("bookmarks.reminder.minute")}</span>
                    <div className="themed-dt__time-list">
                      {Array.from({ length: 60 }, (_, minute) => (
                        <button
                          key={minute}
                          type="button"
                          className={minute === value.getMinutes() ? "is-selected" : ""}
                          onClick={() => setMinute(minute)}
                        >
                          {localize(String(minute).padStart(2, "0"))}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
