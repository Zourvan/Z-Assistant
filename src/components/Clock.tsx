import { useState, useEffect } from "react";
import { useCalendar } from "./Settings";

interface ClockProps {
  embedded?: boolean;
}

export function Clock({ embedded = false }: ClockProps) {
  const { calendarType, textColor, backgroundColor } = useCalendar();
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

  const content = (
    <>
      <div
        className={
          embedded
            ? "text-xl sm:text-2xl font-light"
            : "text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light"
        }
      >
        {formatTime()}
      </div>
      <div
        className={
          embedded
            ? "text-xs sm:text-sm opacity-80 mt-0.5"
            : "text-lg sm:text-xl md:text-2xl lg:text-3xl opacity-80"
        }
      >
        {formatDate()}
      </div>
      {!embedded && (
        <div className="text-base sm:text-lg md:text-xl lg:text-2xl opacity-80">{formatDateInvert()}</div>
      )}
    </>
  );

  if (embedded) {
    return <div className="text-center px-3 pt-2.5 pb-1.5">{content}</div>;
  }

  return (
    <div
      className="text-center backdrop-blur-md rounded-xl p-2 sm:p-3 md:p-4 shadow-lg w-full max-w-md mx-auto"
      style={{
        fontFamily: calendarType === "persian" ? "Vazirmatn, sans-serif" : "inherit",
        backgroundColor: backgroundColor,
        color: textColor,
      }}
    >
      {content}
    </div>
  );
}
