import  { useState, useEffect } from 'react';
import { useCalendar } from './BackgroundSelector';


export function Clock() {
  const { calendarType } = useCalendar();
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = () => {
    if (calendarType === 'persian') {
      const hour = time.getHours().toString().padStart(2, '0');
      const minute = time.getMinutes().toString().padStart(2, '0');
      return `${hour}:${minute}`.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
    }
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = () => {
    if (calendarType === 'persian') {
      return time.toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    return time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  };

  return (
    <div className="text-white text-center" style={{ 
      fontFamily: calendarType === 'persian' ? 'Vazirmatn, sans-serif' : 'inherit'
    }}>
      <div className="text-6xl font-light mb-2">
        {formatTime()}
      </div>
      <div className="text-xl opacity-80">
        {formatDate()}
      </div>
    </div>
  );
}