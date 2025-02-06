import React, { createContext, useContext, useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import * as dateFns from 'date-fns';
import * as dateFnsJalali from 'date-fns-jalali';

// Create context
const CalendarContext = createContext({
  calendarType: 'gregorian' as 'gregorian' | 'persian',
  setCalendarType: (type: 'gregorian' | 'persian') => {},
});

// Create provider component
export function CalendarProvider({ children }) {
  const [calendarType, setCalendarType] = useState<'gregorian' | 'persian'>(() => {
    // Try to get saved preference from localStorage
    const saved = localStorage.getItem('calendarType');
    return (saved === 'persian' || saved === 'gregorian') ? saved : 'gregorian';
  });

  const updateCalendarType = (type: 'gregorian' | 'persian') => {
    setCalendarType(type);
    localStorage.setItem('calendarType', type);
  };

  return (
    <CalendarContext.Provider value={{ calendarType, setCalendarType: updateCalendarType }}>
      {children}
    </CalendarContext.Provider>
  );
}

// Custom hook for using calendar context
export function useCalendar() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}

// Updated Calendar component
export function Calendar() {
  const { calendarType, setCalendarType } = useCalendar();
  const currentDate = new Date();
  
  const dateLib = calendarType === 'gregorian' ? dateFns : dateFnsJalali;

  const daysInMonth = dateLib.getDaysInMonth(currentDate);
  const firstDayOfMonth = dateLib.startOfMonth(currentDate);
  const startDay = dateLib.getDay(firstDayOfMonth);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weekDays = calendarType === 'gregorian' 
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  const formatMonth = () => {
    if (calendarType === 'gregorian') {
      return dateFns.format(currentDate, 'MMMM yyyy');
    } else {
      return dateFnsJalali.format(currentDate, 'MMMM yyyy');
    }
  };

  const currentDay = calendarType === 'gregorian' 
    ? dateFns.getDate(currentDate)
    : dateFnsJalali.getDate(currentDate);

  return (
    <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white text-lg font-medium">{formatMonth()}</h2>
        <button
          onClick={() => setCalendarType(calendarType === 'gregorian' ? 'persian' : 'gregorian')}
          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-3 py-1.5 text-white text-sm"
        >
          <CalendarIcon className="w-4 h-4" />
          {calendarType === 'gregorian' ? 'Persian' : 'Gregorian'}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-white">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-medium p-2">
            {day}
          </div>
        ))}
        {Array(startDay).fill(null).map((_, i) => (
          <div key={`empty-${i}`} className="p-2" />
        ))}
        {days.map(day => (
          <div
            key={day}
            className={`text-center p-2 rounded-full ${
              day === currentDay
                ? 'bg-white/30 font-bold'
                : 'hover:bg-white/10'
            }`}
          >
            {calendarType === 'persian' 
              ? day.toLocaleString('fa-IR')
              : day}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Calendar;

