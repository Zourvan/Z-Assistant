import { useState, useEffect, useMemo } from "react";
import * as dateFns from "date-fns";
import * as dateFnsJalali from "date-fns-jalali";
import { useCalendar, DayOfWeek } from "./Settings";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Persian week days mapping (0 = Saturday, 1 = Sunday, etc.)
const persianDayMap: Record<string, string> = {
  Saturday: "ش",
  Sunday: "ی",
  Monday: "د",
  Tuesday: "س",
  Wednesday: "چ",
  Thursday: "پ",
  Friday: "ج",
};

export function Calendar() {
  const { calendarType, weekendDays, weekendColor, firstDayOfWeek, textColor, backgroundColor } = useCalendar();
  const [currentDate, setCurrentDate] = useState(new Date());


  const dateLib = calendarType === "gregorian" ? dateFns : dateFnsJalali;

  const daysInMonth = dateLib.getDaysInMonth(currentDate);
  const firstDayOfMonth = dateLib.startOfMonth(currentDate);

  // Map day name to index (0-6), using standard Sunday=0 to Saturday=6
  const dayNameToIndex: Record<DayOfWeek, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  // Map day index (0-6) to day name
  const dayIndexToName: Record<number, DayOfWeek> = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
  };

  // Get the index of the first day of week setting
  const firstDayIndex = dayNameToIndex[firstDayOfWeek];

  // Helper function to convert between date-fns weekday and our representation
  // date-fns: 0 = Sunday, 6 = Saturday (for both Gregorian and Jalali)
  // Our standard: 0 = Sunday, 6 = Saturday
  const getStandardWeekdayIndex = (date: Date): number => {
    return dateLib.getDay(date); // Already in our standard format
  };

  // Get weekday for first day of month in standard format
  const firstDayOfMonthWeekday = getStandardWeekdayIndex(firstDayOfMonth);

  // Calculate empty cells needed before first day of month
  const emptyDayCount = useMemo(() => {
    // How many cells to skip before the 1st day of month
    const emptyCells = (7 + firstDayOfMonthWeekday - firstDayIndex) % 7;

    return emptyCells;
  }, [firstDayOfMonthWeekday, firstDayIndex, firstDayOfWeek]);

  // Generate ordered list of day names based on firstDayOfWeek
  const orderedDayNames = useMemo(() => {
    const days: DayOfWeek[] = [];
    for (let i = 0; i < 7; i++) {
      const index = (firstDayIndex + i) % 7;
      days.push(dayIndexToName[index]);
    }
    return days;
  }, [firstDayIndex]);

  // Create weekday labels based on the ordered day names
  const weekDayLabels = useMemo(() => {
    return orderedDayNames.map((day) => {
      if (calendarType === "gregorian") {
        return day.slice(0, 2); // "Su", "Mo", etc.
      } else {
        // Use Persian day abbreviations
        return persianDayMap[day];
      }
    });
  }, [calendarType, orderedDayNames]);

  // Generate calendar days data with all needed properties
  const calendarDaysData = useMemo(() => {
    const days = [];

    // Add empty cells at the beginning
    for (let i = 0; i < emptyDayCount; i++) {
      days.push({ type: "empty", id: `empty-${i}` });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = dateLib.setDate(firstDayOfMonth, day);
      const weekdayIndex = getStandardWeekdayIndex(date);
      const dayName = dayIndexToName[weekdayIndex];

      // Check if it's a weekend
      const isWeekendDay = weekendDays.includes(dayName);

      // Check if it's today
      const today = new Date();
      const isCurrentDay = dateLib.isSameDay(date, today);

      days.push({
        type: "day",
        day,
        dayName,
        isWeekendDay,
        isCurrentDay,
        displayText: calendarType === "persian" ? day.toLocaleString("fa-IR") : day,
      });
    }

    return days;
  }, [daysInMonth, firstDayOfMonth, emptyDayCount, calendarType, weekendDays, dateLib]);

  function convertToPersianNumbers(input: string): string {
    return input.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d, 10)]);
  }

  const formatMonth = () => {
    if (calendarType === "gregorian") {
      return dateFns.format(currentDate, "dd MMMM yyyy");
    } else {
      return convertToPersianNumbers(dateFnsJalali.format(currentDate, "dd MMMM yyyy"));
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(dateLib.subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(dateLib.addMonths(currentDate, 1));
  };

  return (
    <div
      className={`backdrop-blur-md rounded-xl p-4 shadow-lg ${calendarType === "persian" ? "rtl" : ""}`}
      style={{ backgroundColor, color: textColor }}
    >
      <div className={`flex justify-between items-center mb-4 ${calendarType === "persian" ? "flex-row-reverse" : ""}`}>
        <button onClick={handlePreviousMonth} className="p-2 rounded-full hover:bg-black/10" style={{ color: textColor }} aria-label="Previous month">
          {calendarType === "persian" ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>

        <h2 className="text-base sm:text-lg md:text-xl font-medium text-center" style={{ color: textColor }}>
          {formatMonth()}
        </h2>

        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-black/10" style={{ color: textColor }} aria-label="Next month">
          {calendarType === "persian" ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
        {weekDayLabels.map((label, index) => {
          const dayName = orderedDayNames[index];
          const isWeekendDay = weekendDays.includes(dayName);

          return (
            <div
              key={`header-${index}`}
              className="text-center text-xs sm:text-sm md:text-base font-extrabold p-1 sm:p-2"
              style={{ color: isWeekendDay ? weekendColor : textColor }}
            >
              {label}
            </div>
          );
        })}

        {/* Calendar days - both empty cells and day cells */}
        {calendarDaysData.map((item, index) => {
          if (item.type === "empty") {
            return <div key={item.id} className="p-1 sm:p-2" />;
          } else {
            return (
              <div
                key={`day-${item.day}`}
                className={`text-center p-1 sm:p-1.5 md:p-2 aspect-square flex items-center justify-center text-xs sm:text-sm md:text-base font-semibold ${
                  item.isCurrentDay ? "rounded-full" : item.isWeekendDay ? "hover:bg-opacity-50 rounded-full" : "hover:bg-white/0 rounded-full"
                }`}
                style={{
                  color: item.isWeekendDay ? weekendColor : textColor,
                  backgroundColor: item.isCurrentDay
                    ? "#8B5CF6" // Purple color for current day
                    : item.isWeekendDay
                      ? `${weekendColor}33`
                      : "transparent",
                }}
              >
                {item.displayText}
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}

export default Calendar;
