import type { AlarmItem, AlarmRepeat } from "./types";

export const ACTIVE_TIMER_KEY = "nexx-active-timer";

export const TIMER_PRESETS_MIN = [5, 10, 15, 25, 30] as const;

export const toLocalizedDigits = (value: string | number, usePersian: boolean): string => {
  const str = String(value);
  if (!usePersian) return str;
  return str.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d, 10)]);
};

export const formatDuration = (totalMs: number, usePersian: boolean): string => {
  const totalSec = Math.max(0, Math.ceil(totalMs / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const parts = [hours, minutes, seconds].map((n) => String(n).padStart(2, "0"));
  return toLocalizedDigits(parts.join(":"), usePersian);
};

export const formatAlarmTime = (hour: number, minute: number, usePersian: boolean): string => {
  const text = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return toLocalizedDigits(text, usePersian);
};

export const parseTimeInput = (value: string): { hour: number; minute: number } | null => {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
};

export const msFromHms = (hours: number, minutes: number, seconds: number): number =>
  (hours * 3600 + minutes * 60 + seconds) * 1000;

export const shouldAlarmRing = (alarm: AlarmItem, now: Date): boolean => {
  if (!alarm.enabled) return false;

  const hour = now.getHours();
  const minute = now.getMinutes();
  if (alarm.hour !== hour || alarm.minute !== minute) return false;

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (alarm.lastTriggeredAt && alarm.lastTriggeredAt >= todayStart + hour * 3600000 + minute * 60000) {
    return false;
  }

  const day = now.getDay();
  switch (alarm.repeat) {
    case "once":
      return true;
    case "daily":
      return true;
    case "weekdays":
      return day >= 1 && day <= 5;
    case "weekends":
      return day === 0 || day === 6;
    case "custom":
      return alarm.repeatDays?.includes(day) ?? false;
    default:
      return false;
  }
};

export const getRepeatLabelKey = (repeat: AlarmRepeat): string => `timerAlarm.repeat.${repeat}`;

export const playAlertSound = () => {
  try {
    const ctx = new AudioContext();
    const tones = [
      { freq: 880, start: 0, duration: 0.18 },
      { freq: 1100, start: 0.22, duration: 0.18 },
      { freq: 880, start: 0.44, duration: 0.18 },
      { freq: 1100, start: 0.66, duration: 0.35 },
    ];

    for (const tone of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = tone.freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.28, ctx.currentTime + tone.start);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + tone.start + tone.duration);
      osc.start(ctx.currentTime + tone.start);
      osc.stop(ctx.currentTime + tone.start + tone.duration);
    }
  } catch {
    /* audio unavailable */
  }
};

export const requestNotificationPermission = async () => {
  if (!("Notification" in window) || Notification.permission !== "default") return;
  try {
    await Notification.requestPermission();
  } catch {
    /* ignore */
  }
};

export const showAlertNotification = (title: string, body: string) => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body });
  } catch {
    /* ignore */
  }
};
