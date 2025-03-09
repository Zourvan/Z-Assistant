import { useState, useEffect } from "react";
import { useCalendar } from "./Settings";

export function Clock() {
  const { calendarType } = useCalendar();
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = () => {
    if (calendarType === "persian") {
      const hour = time.getHours().toString().padStart(2, "0");
      const minute = time.getMinutes().toString().padStart(2, "0");
      return `${hour}:${minute}`.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d, 10)]);
    }
    return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = () => {
    if (calendarType === "persian") {
      // تعریف interface برای اجزای تاریخ
      interface DateParts {
        weekday?: string;
        year?: string;
        month?: string;
        day?: string;
        literal?: string;
      }

      const formatter = new Intl.DateTimeFormat("fa-IR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // استفاده از interface تعریف شده
      const dateObj: DateParts = {};
      formatter.formatToParts(time).forEach((part) => {
        if (part.type === "weekday" || part.type === "year" || part.type === "month" || part.type === "day") {
          dateObj[part.type] = part.value;
        }
      });

      // استفاده از nullish coalescing برای مقادیر undefined احتمالی
      return `${dateObj.weekday ?? ""} - ${dateObj.day ?? ""} ${dateObj.month ?? ""} ${dateObj.year ?? ""}`;
    }
    return time.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };

  const formatDateInvert = () => {
    if (calendarType === "persian") {
      return time.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
    }
    return time.toLocaleDateString("fa-IR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <div
      className="text-white text-center"
      style={{
        fontFamily: calendarType === "persian" ? "Vazirmatn, sans-serif" : "inherit",
      }}
    >
      <div className="text-[6vh] font-light">{formatTime()}</div>
      <div className="text-[4.5vh] opacity-80 ">{formatDate()}</div>
      <div className="text-[3vh] opacity-80">{formatDateInvert()}</div>
    </div>
  );
}
