import  { useState } from "react";
import * as dateFns from "date-fns";
import * as dateFnsJalali from "date-fns-jalali";
import { useCalendar } from "./BackgroundSelector";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Calendar() {
  const { calendarType } = useCalendar();
  const [currentDate, setCurrentDate] = useState(new Date());

  const dateLib = calendarType === "gregorian" ? dateFns : dateFnsJalali;

  const daysInMonth = dateLib.getDaysInMonth(currentDate);
  const firstDayOfMonth = dateLib.startOfMonth(currentDate);

  // Adjust start day calculation for Persian calendar
  const getAdjustedStartDay = () => {
    const dayOfWeek = dateLib.getDay(firstDayOfMonth);
    if (calendarType === "gregorian") {
      return dayOfWeek;
    } else {
      // Convert Sunday-based index (0-6) to Saturday-based index (0-6)
      return (dayOfWeek + 1) % 7;
    }
  };

  const startDay = getAdjustedStartDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weekDays = calendarType === "gregorian" ? ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] : ["ش", "ی", "د", "س", "چ", "پ", "ج"];

  const isWeekend = (dayIndex: number) => {
    if (calendarType === "gregorian") {
      // Saturday (6) and Sunday (0)
      return dayIndex === 0 || dayIndex === 6;
    } else {
      // Thursday (4) and Friday (5) for Persian calendar
      return dayIndex === 5 || dayIndex === 6;
    }
  };

  const getDayIndex = (day: number) => {
    const date = dateLib.setDate(firstDayOfMonth, day);
    const dayOfWeek = dateLib.getDay(date);
    if (calendarType === "gregorian") {
      return dayOfWeek;
    } else {
      // Convert Sunday-based index to Saturday-based index for Persian calendar
      return (dayOfWeek + 1) % 7;
    }
  };

  const formatMonth = () => {
    if (calendarType === "gregorian") {
      return dateFns.format(currentDate, "MMMM yyyy");
    } else {
      return dateFnsJalali.format(currentDate, "MMMM yyyy");
    }
  };

  const currentDay = calendarType === "gregorian" ? dateFns.getDate(currentDate) : dateFnsJalali.getDate(currentDate);

  const handlePreviousMonth = () => {
    setCurrentDate(dateLib.subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(dateLib.addMonths(currentDate, 1));
  };

  return (
    <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePreviousMonth} className="p-2 rounded-full hover:bg-white/10 text-white" aria-label="Previous month">
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h2 className="text-white text-lg font-medium text-center">{formatMonth()}</h2>

        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-white/10 text-white" aria-label="Next month">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-white">
        {weekDays.map((day, index) => (
          <div key={day} className={`text-center text-[1vw] font-bold p-2 ${isWeekend(index) ? "text-green-400" : ""}`}>
            {day}
          </div>
        ))}
        {Array(startDay)
          .fill(null)
          .map((_, i) => (
            <div key={`empty-${i}`} className="p-2" />
          ))}
        {days.map((day) => {
          const dayIndex = getDayIndex(day);
          return (
            <div
              key={day}
              className={`text-center p-[0.5vw] rounded-full ${
                day === currentDay ? "bg-white/30 font-bold" : isWeekend(dayIndex) ? "bg-green-500/20 hover:bg-green-500/30" : "hover:bg-white/10"
              }`}
            >
              {calendarType === "persian" ? day.toLocaleString("fa-IR") : day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;
