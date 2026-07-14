import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Timer, Bell, Play, Pause, RotateCcw, Plus, Trash2, BellRing } from "lucide-react";
import { useCalendar } from "./Settings";
import { useI18n } from "../i18n/LanguageProvider";
import { alarmsDB } from "./settings/settingsDb";
import { buildThemeVars } from "./settings/themeUtils";
import type { AlarmItem, AlarmRepeat, ActiveTimer, RingingAlert } from "./timerAlarm/types";
import {
  ACTIVE_TIMER_KEY,
  TIMER_PRESETS_MIN,
  formatDuration,
  formatAlarmTime,
  msFromHms,
  shouldAlarmRing,
  playAlertSound,
  requestNotificationPermission,
  showAlertNotification,
} from "./timerAlarm/utils";
import "./TimerAlarm.css";

type Tab = "timer" | "alarm";

const REPEAT_OPTIONS: AlarmRepeat[] = ["once", "daily", "weekdays", "weekends"];

const loadActiveTimer = (): ActiveTimer | null => {
  try {
    const raw = localStorage.getItem(ACTIVE_TIMER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveTimer;
  } catch {
    return null;
  }
};

const saveActiveTimer = (timer: ActiveTimer | null) => {
  if (timer) {
    localStorage.setItem(ACTIVE_TIMER_KEY, JSON.stringify(timer));
  } else {
    localStorage.removeItem(ACTIVE_TIMER_KEY);
  }
};

const getTimerRemaining = (timer: ActiveTimer | null, now: number): number => {
  if (!timer) return 0;
  if (timer.status === "paused") return timer.pausedRemainingMs ?? 0;
  return Math.max(0, timer.endAt - now);
};

export function TimerAlarm() {
  const { textColor, backgroundColor, calendarType } = useCalendar();
  const { t, dir, language } = useI18n();
  const usePersian = calendarType === "persian" || language === "fa";

  const [tab, setTab] = useState<Tab>("timer");
  const [now, setNow] = useState(Date.now());

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(() => loadActiveTimer());

  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [showAlarmForm, setShowAlarmForm] = useState(false);
  const [alarmLabel, setAlarmLabel] = useState("");
  const [alarmTime, setAlarmTime] = useState("07:00");
  const [alarmRepeat, setAlarmRepeat] = useState<AlarmRepeat>("daily");

  const [ringing, setRinging] = useState<RingingAlert | null>(null);
  const soundIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const themeStyle = useMemo(() => buildThemeVars(textColor, backgroundColor), [textColor, backgroundColor]);

  const remainingMs = getTimerRemaining(activeTimer, now);
  const isTimerRunning = activeTimer?.status === "running";
  const isTimerActive = activeTimer !== null && remainingMs > 0;
  const isTimerFinished = activeTimer !== null && remainingMs <= 0 && activeTimer.status === "running";

  const clampInput = (value: string, max: number) => {
    const num = Math.min(max, Math.max(0, parseInt(value, 10) || 0));
    return num;
  };

  const loadAlarms = useCallback(async () => {
    const items = await alarmsDB.getAllItems<AlarmItem>();
    setAlarms(items.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)));
  }, []);

  useEffect(() => {
    loadAlarms();
    requestNotificationPermission();
  }, [loadAlarms]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    saveActiveTimer(activeTimer);
  }, [activeTimer]);

  const triggerAlert = useCallback(
    (alert: RingingAlert) => {
      setRinging(alert);
      playAlertSound();
      if (soundIntervalRef.current) clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = setInterval(playAlertSound, 2500);

      const title = alert.kind === "timer" ? t("timerAlarm.timerDone") : t("timerAlarm.alarmRinging");
      showAlertNotification(title, alert.label || t("timerAlarm.defaultLabel"));
    },
    [t],
  );

  useEffect(() => {
    if (isTimerFinished && !ringing) {
      setActiveTimer(null);
      triggerAlert({ kind: "timer", id: "timer", label: t("timerAlarm.timerDone") });
    }
  }, [isTimerFinished, ringing, triggerAlert, t]);

  useEffect(() => {
    const currentMinute = new Date(now);
    for (const alarm of alarms) {
      if (shouldAlarmRing(alarm, currentMinute)) {
        const updated = { ...alarm, lastTriggeredAt: now };
        alarmsDB.saveItem(updated);
        setAlarms((prev) => prev.map((a) => (a.id === alarm.id ? updated : a)));

        if (alarm.repeat === "once") {
          const disabled = { ...updated, enabled: false };
          alarmsDB.saveItem(disabled);
          setAlarms((prev) => prev.map((a) => (a.id === alarm.id ? disabled : a)));
        }

        triggerAlert({
          kind: "alarm",
          id: alarm.id,
          label: alarm.label || formatAlarmTime(alarm.hour, alarm.minute, usePersian),
        });
        break;
      }
    }
  }, [now, alarms, triggerAlert, usePersian]);

  const startTimer = () => {
    if (activeTimer?.status === "paused") {
      const rem = activeTimer.pausedRemainingMs ?? 0;
      if (rem <= 0) return;
      setActiveTimer({
        ...activeTimer,
        endAt: Date.now() + rem,
        status: "running",
        pausedRemainingMs: undefined,
      });
      return;
    }

    const duration = isTimerActive && activeTimer ? remainingMs : msFromHms(hours, minutes, seconds);

    if (duration <= 0) return;

    setActiveTimer({
      totalMs: duration,
      endAt: Date.now() + duration,
      status: "running",
    });
  };

  const pauseTimer = () => {
    if (!activeTimer || activeTimer.status !== "running") return;
    setActiveTimer({
      ...activeTimer,
      status: "paused",
      pausedRemainingMs: remainingMs,
    });
  };

  const resetTimer = () => {
    setActiveTimer(null);
  };

  const applyPreset = (mins: number) => {
    setHours(0);
    setMinutes(mins);
    setSeconds(0);
    setActiveTimer(null);
  };

  const dismissRinging = async () => {
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
    setRinging(null);
  };

  const snoozeRinging = async () => {
    await dismissRinging();
    const snoozeMs = 5 * 60 * 1000;
    setActiveTimer({
      totalMs: snoozeMs,
      endAt: Date.now() + snoozeMs,
      status: "running",
      label: ringing?.label,
    });
    setTab("timer");
  };

  const addAlarm = async () => {
    const [h, m] = alarmTime.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return;

    const item: AlarmItem = {
      id: crypto.randomUUID(),
      label: alarmLabel.trim() || t("timerAlarm.defaultLabel"),
      hour: h,
      minute: m,
      enabled: true,
      repeat: alarmRepeat,
      createdAt: Date.now(),
    };

    await alarmsDB.saveItem(item);
    setAlarms((prev) => [...prev, item].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)));
    setAlarmLabel("");
    setAlarmTime("07:00");
    setAlarmRepeat("daily");
    setShowAlarmForm(false);
  };

  const toggleAlarm = async (alarm: AlarmItem) => {
    const updated = { ...alarm, enabled: !alarm.enabled };
    await alarmsDB.saveItem(updated);
    setAlarms((prev) => prev.map((a) => (a.id === alarm.id ? updated : a)));
  };

  const deleteAlarm = async (id: string) => {
    await alarmsDB.deleteItem(id);
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  const displayTime = isTimerActive
    ? formatDuration(remainingMs, usePersian)
    : formatDuration(msFromHms(hours, minutes, seconds), usePersian);

  return (
    <div className="timer-alarm backdrop-blur-md shadow-lg" style={themeStyle} dir={dir}>
      <div className="timer-alarm__tabs">
        <button
          type="button"
          className={`timer-alarm__tab ${tab === "timer" ? "timer-alarm__tab--active" : ""}`}
          onClick={() => setTab("timer")}
        >
          <Timer className="w-4 h-4" />
          {t("timerAlarm.timer")}
        </button>
        <button
          type="button"
          className={`timer-alarm__tab ${tab === "alarm" ? "timer-alarm__tab--active" : ""}`}
          onClick={() => setTab("alarm")}
        >
          <Bell className="w-4 h-4" />
          {t("timerAlarm.alarm")}
          {alarms.filter((a) => a.enabled).length > 0 && (
            <span className="text-xs opacity-70">({alarms.filter((a) => a.enabled).length})</span>
          )}
        </button>
      </div>

      <div className="timer-alarm__body">
        {tab === "timer" && (
          <>
            <div
              className={`timer-alarm__display ${isTimerRunning ? "timer-alarm__display--running" : "timer-alarm__display--idle"}`}
            >
              {displayTime}
            </div>

            {!isTimerActive && (
              <>
                <div className="timer-alarm__inputs">
                  <div className="timer-alarm__input-group">
                    <label>{t("timerAlarm.hours")}</label>
                    <input
                      className="timer-alarm__input"
                      type="number"
                      min={0}
                      max={23}
                      value={hours}
                      onChange={(e) => setHours(clampInput(e.target.value, 23))}
                      dir="ltr"
                    />
                  </div>
                  <span className="timer-alarm__sep">:</span>
                  <div className="timer-alarm__input-group">
                    <label>{t("timerAlarm.minutes")}</label>
                    <input
                      className="timer-alarm__input"
                      type="number"
                      min={0}
                      max={59}
                      value={minutes}
                      onChange={(e) => setMinutes(clampInput(e.target.value, 59))}
                      dir="ltr"
                    />
                  </div>
                  <span className="timer-alarm__sep">:</span>
                  <div className="timer-alarm__input-group">
                    <label>{t("timerAlarm.seconds")}</label>
                    <input
                      className="timer-alarm__input"
                      type="number"
                      min={0}
                      max={59}
                      value={seconds}
                      onChange={(e) => setSeconds(clampInput(e.target.value, 59))}
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="timer-alarm__presets">
                  {TIMER_PRESETS_MIN.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      className="timer-alarm__preset"
                      onClick={() => applyPreset(mins)}
                    >
                      {usePersian ? `${mins}د` : `${mins}m`}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="timer-alarm__actions">
              {!isTimerRunning ? (
                <button type="button" className="timer-alarm__btn timer-alarm__btn--primary" onClick={startTimer}>
                  <Play className="w-4 h-4" />
                  {t("timerAlarm.start")}
                </button>
              ) : (
                <button type="button" className="timer-alarm__btn timer-alarm__btn--primary" onClick={pauseTimer}>
                  <Pause className="w-4 h-4" />
                  {t("timerAlarm.pause")}
                </button>
              )}
              <button
                type="button"
                className="timer-alarm__btn"
                onClick={resetTimer}
                disabled={!isTimerActive}
              >
                <RotateCcw className="w-4 h-4" />
                {t("timerAlarm.reset")}
              </button>
            </div>
          </>
        )}

        {tab === "alarm" && (
          <>
            <div className="timer-alarm__add-row">
              <button
                type="button"
                className="timer-alarm__btn timer-alarm__btn--primary"
                onClick={() => setShowAlarmForm((v) => !v)}
              >
                <Plus className="w-4 h-4" />
                {t("timerAlarm.addAlarm")}
              </button>
            </div>

            {showAlarmForm && (
              <div className="timer-alarm__form">
                <div className="timer-alarm__form-row">
                  <label>{t("timerAlarm.time")}</label>
                  <input
                    className="timer-alarm__time-input"
                    type="time"
                    value={alarmTime}
                    onChange={(e) => setAlarmTime(e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div className="timer-alarm__form-row">
                  <label>{t("timerAlarm.label")}</label>
                  <input
                    className="timer-alarm__text-input"
                    type="text"
                    value={alarmLabel}
                    onChange={(e) => setAlarmLabel(e.target.value)}
                    placeholder={t("timerAlarm.labelPlaceholder")}
                    maxLength={48}
                  />
                </div>
                <div className="timer-alarm__form-row">
                  <label>{t("timerAlarm.repeatLabel")}</label>
                  <select
                    className="timer-alarm__select"
                    value={alarmRepeat}
                    onChange={(e) => setAlarmRepeat(e.target.value as AlarmRepeat)}
                  >
                    {REPEAT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {t(`timerAlarm.repeat.${opt}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="timer-alarm__actions">
                  <button type="button" className="timer-alarm__btn timer-alarm__btn--primary" onClick={addAlarm}>
                    {t("timerAlarm.save")}
                  </button>
                  <button type="button" className="timer-alarm__btn" onClick={() => setShowAlarmForm(false)}>
                    {t("timerAlarm.cancel")}
                  </button>
                </div>
              </div>
            )}

            {alarms.length === 0 ? (
              <div className="timer-alarm__empty">{t("timerAlarm.noAlarms")}</div>
            ) : (
              <div className="timer-alarm__list">
                {alarms.map((alarm) => (
                  <div
                    key={alarm.id}
                    className={`timer-alarm__item ${!alarm.enabled ? "timer-alarm__item--disabled" : ""}`}
                  >
                    <span className="timer-alarm__item-time" dir="ltr">
                      {formatAlarmTime(alarm.hour, alarm.minute, usePersian)}
                    </span>
                    <div className="timer-alarm__item-info">
                      <span className="timer-alarm__item-label">{alarm.label}</span>
                      <span className="timer-alarm__item-repeat">{t(`timerAlarm.repeat.${alarm.repeat}`)}</span>
                    </div>
                    <button
                      type="button"
                      className={`timer-alarm__toggle ${alarm.enabled ? "timer-alarm__toggle--on" : ""}`}
                      onClick={() => toggleAlarm(alarm)}
                      aria-label={alarm.enabled ? t("timerAlarm.disable") : t("timerAlarm.enable")}
                    >
                      <span className="timer-alarm__toggle-thumb" />
                    </button>
                    <button
                      type="button"
                      className="timer-alarm__btn timer-alarm__btn--icon timer-alarm__btn--danger"
                      onClick={() => deleteAlarm(alarm.id)}
                      aria-label={t("timerAlarm.delete")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {ringing && (
        <div className="timer-alarm__ring-overlay">
          <BellRing className="timer-alarm__ring-icon" />
          <div className="timer-alarm__ring-title">
            {ringing.kind === "timer" ? t("timerAlarm.timerDone") : t("timerAlarm.alarmRinging")}
          </div>
          <div className="timer-alarm__ring-label">{ringing.label}</div>
          <div className="timer-alarm__ring-actions">
            <button type="button" className="timer-alarm__btn timer-alarm__btn--primary" onClick={dismissRinging}>
              {t("timerAlarm.dismiss")}
            </button>
            {ringing.kind === "alarm" && (
              <button type="button" className="timer-alarm__btn" onClick={snoozeRinging}>
                {t("timerAlarm.snooze")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
