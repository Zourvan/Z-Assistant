import { useState, useMemo } from "react";
import * as dateFns from "date-fns";
import * as dateFnsJalali from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale/fa-IR";
import { useCalendar, DayOfWeek } from "./Settings";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../i18n/LanguageProvider";
import { useTasks } from "./tasks/TasksContext";
import { useReminders } from "./bookmarks/reminders/RemindersContext";
import { DayDetailModal } from "./tasks/DayDetailModal";
import { getDayTaskSummary, toDateKey } from "./tasks/taskUtils";

const DAY_INDEX_TO_NAME: Record<number, DayOfWeek> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export function Calendar({ embedded = false }: { embedded?: boolean }) {
  const { calendarType, weekendDays, weekendColor, firstDayOfWeek, textColor, backgroundColor } = useCalendar();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { t, dir } = useI18n();
  const { tasks } = useTasks();
  const { dateKeysWithReminders } = useReminders();

  const dateLib = calendarType === "gregorian" ? dateFns : dateFnsJalali;

  const daysInMonth = dateLib.getDaysInMonth(currentDate);
  const firstDayOfMonth = dateLib.startOfMonth(currentDate);

  const dayNameToIndex: Record<DayOfWeek, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const firstDayIndex = dayNameToIndex[firstDayOfWeek];

  const firstDayOfMonthWeekday = dateLib.getDay(firstDayOfMonth);

  const emptyDayCount = useMemo(() => {
    return (7 + firstDayOfMonthWeekday - firstDayIndex) % 7;
  }, [firstDayOfMonthWeekday, firstDayIndex]);

  const orderedDayNames = useMemo(() => {
    const days: DayOfWeek[] = [];
    for (let i = 0; i < 7; i++) {
      const index = (firstDayIndex + i) % 7;
      days.push(DAY_INDEX_TO_NAME[index]);
    }
    return days;
  }, [firstDayIndex]);

  const weekDayLabels = useMemo(() => {
    return orderedDayNames.map((day) => t(`daysShort.${day}`));
  }, [orderedDayNames, t]);

  const calendarDaysData = useMemo(() => {
    const days: Array<
      | { type: "empty"; id: string }
      | {
          type: "day";
          day: number;
          date: Date;
          dateKey: string;
          dayName: DayOfWeek;
          isWeekendDay: boolean;
          isCurrentDay: boolean;
          displayText: string | number;
          hasTasks: boolean;
          hasPendingTodos: boolean;
          hasNotes: boolean;
          hasReminders: boolean;
        }
    > = [];

    for (let i = 0; i < emptyDayCount; i++) {
      days.push({ type: "empty", id: `empty-${i}` });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = dateLib.setDate(firstDayOfMonth, day);
      const weekdayIndex = dateLib.getDay(date);
      const dayName = DAY_INDEX_TO_NAME[weekdayIndex];
      const isWeekendDay = weekendDays.includes(dayName);
      const today = new Date();
      const isCurrentDay = dateLib.isSameDay(date, today);
      const dateKey = toDateKey(date);
      const summary = getDayTaskSummary(tasks, dateKey);
      const hasReminders = dateKeysWithReminders.has(dateKey);

      days.push({
        type: "day",
        day,
        date,
        dateKey,
        dayName,
        isWeekendDay,
        isCurrentDay,
        displayText: calendarType === "persian" ? day.toLocaleString("fa-IR") : day,
        hasTasks: summary.hasItems,
        hasPendingTodos: summary.pendingTodos.length > 0,
        hasNotes: summary.notes.length > 0,
        hasReminders,
      });
    }

    return days;
  }, [daysInMonth, firstDayOfMonth, emptyDayCount, calendarType, weekendDays, dateLib, tasks, dateKeysWithReminders]);

  function convertToPersianNumbers(input: string): string {
    return input.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d, 10)]);
  }

  const formatMonth = () => {
    if (calendarType === "gregorian") {
      return dateFns.format(currentDate, "dd MMMM yyyy");
    }
    return convertToPersianNumbers(dateFnsJalali.format(currentDate, "dd MMMM yyyy", { locale: faIR }));
  };

  const handlePreviousMonth = () => {
    setCurrentDate(dateLib.subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(dateLib.addMonths(currentDate, 1));
  };

  const calendarContent = (
    <>
      <div className={`flex justify-between items-center ${embedded ? "mb-1.5" : "mb-4"}`}>
        <button onClick={handlePreviousMonth} className="p-1.5 rounded-full hover:bg-black/10" style={{ color: textColor }} aria-label={t("calendar.previousMonth")}>
          {dir === "rtl" ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <h2
          className={`font-medium text-center ${embedded ? "text-xs sm:text-sm" : "text-base sm:text-lg md:text-xl"}`}
          style={{ color: textColor }}
        >
          {formatMonth()}
        </h2>

        <button onClick={handleNextMonth} className="p-1.5 rounded-full hover:bg-black/10" style={{ color: textColor }} aria-label={t("calendar.nextMonth")}>
          {dir === "rtl" ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      <div className={`grid grid-cols-7 ${embedded ? "gap-0.5" : "gap-1"}`}>
        {weekDayLabels.map((label, index) => {
          const dayName = orderedDayNames[index];
          const isWeekendDay = weekendDays.includes(dayName);

          return (
            <div
              key={`header-${index}`}
              className={`text-center font-extrabold ${embedded ? "text-[1.1rem] sm:text-xs py-0.5" : "text-xs sm:text-sm md:text-base p-1 sm:p-2"}`}
              style={{ color: isWeekendDay ? weekendColor : textColor }}
            >
              {label}
            </div>
          );
        })}

        {calendarDaysData.map((item) => {
          if (item.type === "empty") {
            return <div key={item.id} className={embedded ? "py-0.5" : "p-1 sm:p-2"} />;
          }

          const hasAnyMarker = item.hasTasks || item.hasReminders;
          const markerTitle = hasAnyMarker
            ? [
                item.hasTasks ? t("calendar.hasTasks") : null,
                item.hasReminders ? t("calendar.hasReminders") : null,
              ]
                .filter(Boolean)
                .join(" · ")
            : undefined;

          return (
            <button
              key={`day-${item.dateKey}`}
              type="button"
              className={`calendar-day text-center flex flex-col items-center justify-center font-semibold cursor-pointer transition-colors ${
                embedded
                  ? "text-xs sm:text-sm h-8 w-8 sm:h-9 sm:w-9 mx-auto"
                  : "text-xs sm:text-sm md:text-base p-1 sm:p-1.5 md:p-2 aspect-square"
              } ${item.isCurrentDay ? "rounded-full" : "rounded-full hover:bg-white/10"}`}
              style={{
                color: item.isWeekendDay ? weekendColor : textColor,
                backgroundColor: item.isCurrentDay
                  ? "#8B5CF6"
                  : item.isWeekendDay
                    ? `${weekendColor}33`
                    : "transparent",
              }}
              onClick={() => setSelectedDate(item.date)}
              aria-label={markerTitle}
              title={markerTitle}
            >
              <span className="calendar-day__number leading-none">{item.displayText}</span>
              {hasAnyMarker && (
                <span className="calendar-day__markers" aria-hidden="true">
                  {item.hasPendingTodos && <span className="calendar-day__dot calendar-day__dot--todo" />}
                  {item.hasNotes && <span className="calendar-day__dot calendar-day__dot--note" />}
                  {item.hasReminders && <span className="calendar-day__dot calendar-day__dot--reminder" />}
                  {!item.hasPendingTodos && !item.hasNotes && !item.hasReminders && item.hasTasks && (
                    <span className="calendar-day__dot calendar-day__dot--done" />
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );

  const calendarNode = embedded ? (
    <div className="px-2.5 pb-2.5 pt-1.5 calendar-embedded" style={{ direction: dir }}>
      {calendarContent}
      {selectedDate && <DayDetailModal date={selectedDate} onClose={() => setSelectedDate(null)} />}
    </div>
  ) : (
    <div className={`backdrop-blur-md rounded-xl p-4 shadow-lg calendar-standalone`} style={{ backgroundColor, color: textColor, direction: dir }}>
      {calendarContent}
      {selectedDate && <DayDetailModal date={selectedDate} onClose={() => setSelectedDate(null)} />}
    </div>
  );

  return calendarNode;
}

export default Calendar;
