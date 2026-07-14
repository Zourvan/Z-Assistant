import { Clock } from "./Clock";
import Calendar from "./Calendar";
import { useCalendar } from "./Settings";
import "./ClockCalendar.css";

export function ClockCalendar() {
  const { textColor, backgroundColor, calendarType } = useCalendar();

  return (
    <div
      className="clock-calendar backdrop-blur-md rounded-xl shadow-lg overflow-hidden"
      style={{
        fontFamily: calendarType === "persian" ? "Vazirmatn, sans-serif" : "inherit",
        backgroundColor,
        color: textColor,
      }}
    >
      <Clock embedded />
      <div
        className="clock-calendar__divider"
        style={{ borderTop: `1px solid color-mix(in srgb, ${textColor} 18%, transparent)` }}
      />
      <div className="clock-calendar__calendar">
        <Calendar embedded />
      </div>
    </div>
  );
}
