import { useState, useEffect, useCallback, useRef, useMemo, useImperativeHandle, forwardRef } from "react";
import { Play, Pause, RotateCcw, SkipForward, Coffee, Brain, Armchair, X } from "lucide-react";
import type { ActivePomodoro, PomodoroPhase } from "./types";
import {
  createPomodoroSession,
  getNextPhase,
  getPomodoroRemaining,
  loadActivePomodoro,
  loadPomodoroSettings,
  saveActivePomodoro,
  savePomodoroSettings,
  DEFAULT_POMODORO_SETTINGS,
} from "./pomodoroUtils";
import { formatDuration, playAlertSound, showAlertNotification } from "./utils";

export interface PomodoroCompletion {
  label: string;
  pendingNext: { phase: PomodoroPhase; completedRounds: number };
}

interface PomodoroPanelProps {
  usePersian: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
  onCompletionChange?: (completion: PomodoroCompletion | null) => void;
}

export interface PomodoroPanelHandle {
  startNextPhase: () => void;
  dismissCompletion: () => void;
}

const PHASES: PomodoroPhase[] = ["work", "shortBreak", "longBreak"];

const PHASE_ICONS = {
  work: Brain,
  shortBreak: Coffee,
  longBreak: Armchair,
} as const;

export const PomodoroPanel = forwardRef<PomodoroPanelHandle, PomodoroPanelProps>(function PomodoroPanel(
  { usePersian, t, onCompletionChange },
  ref,
) {
  const [settings, setSettings] = useState(loadPomodoroSettings);
  const [selectedPhase, setSelectedPhase] = useState<PomodoroPhase>("work");
  const [active, setActive] = useState<ActivePomodoro | null>(() => loadActivePomodoro());
  const [now, setNow] = useState(Date.now());
  const [showSettings, setShowSettings] = useState(false);
  const [pendingNext, setPendingNext] = useState<{ phase: PomodoroPhase; completedRounds: number } | null>(null);
  const soundIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const remainingMs = getPomodoroRemaining(active, now);
  const isRunning = active?.status === "running";
  const isActive = active !== null && remainingMs > 0;
  const isFinished = active !== null && remainingMs <= 0 && active.status === "running";
  const currentPhase = active?.phase ?? selectedPhase;
  const completedRounds = active?.completedRounds ?? 0;
  const totalRounds = settings.roundsBeforeLong;

  const progress = useMemo(() => {
    if (!active || active.totalMs <= 0) return 0;
    const elapsed = active.totalMs - remainingMs;
    return Math.min(1, Math.max(0, elapsed / active.totalMs));
  }, [active, remainingMs]);

  const displayTime = isActive
    ? formatDuration(remainingMs, usePersian)
    : formatDuration(
        (currentPhase === "work"
          ? settings.workMin
          : currentPhase === "shortBreak"
            ? settings.shortBreakMin
            : settings.longBreakMin) * 60_000,
        usePersian,
      );

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    saveActivePomodoro(active);
  }, [active]);

  useEffect(() => {
    savePomodoroSettings(settings);
  }, [settings]);

  const stopSound = () => {
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
  };

  const triggerCompletion = useCallback(
    (label: string, next: { phase: PomodoroPhase; completedRounds: number }) => {
      onCompletionChange?.({ label, pendingNext: next });
      playAlertSound();
      stopSound();
      soundIntervalRef.current = setInterval(playAlertSound, 2500);
      showAlertNotification(t("timerAlarm.pomodoro.done"), label);
    },
    [t, onCompletionChange],
  );

  useEffect(() => {
    if (!isFinished || !active) return;

    const label = t(`timerAlarm.pomodoro.phaseDone.${active.phase}`);
    const next = getNextPhase(active);
    setPendingNext(next);
    setActive(null);
    triggerCompletion(label, next);
  }, [isFinished, active, triggerCompletion, t]);

  const startSession = (phase: PomodoroPhase, completedRounds = active?.completedRounds ?? 0) => {
    stopSound();
    onCompletionChange?.(null);
    setPendingNext(null);
    setActive(createPomodoroSession(phase, settings, completedRounds));
    setSelectedPhase(phase);
  };

  const startOrResume = () => {
    if (active?.status === "paused") {
      setActive({
        ...active,
        endAt: Date.now() + (active.pausedRemainingMs ?? 0),
        status: "running",
        pausedRemainingMs: undefined,
      });
      return;
    }

    if (isActive) return;
    startSession(selectedPhase, completedRounds);
  };

  const pauseSession = () => {
    if (!active || active.status !== "running") return;
    setActive({
      ...active,
      status: "paused",
      pausedRemainingMs: remainingMs,
    });
  };

  const resetSession = () => {
    stopSound();
    onCompletionChange?.(null);
    setPendingNext(null);
    setActive(null);
  };

  const skipSession = () => {
    if (!active) return;
    const next = getNextPhase(active);
    startSession(next.phase, next.completedRounds);
  };

  const dismissCompletion = () => {
    stopSound();
    onCompletionChange?.(null);
    setPendingNext(null);
  };

  const startNextPhase = () => {
    if (!pendingNext) return;
    const next = pendingNext;
    dismissCompletion();
    startSession(next.phase, next.completedRounds);
  };

  useImperativeHandle(ref, () => ({
    startNextPhase,
    dismissCompletion,
  }));

  const updateSetting = (key: keyof typeof settings, value: number) => {
    const clamped = Math.min(120, Math.max(1, value));
    setSettings((prev) => ({ ...prev, [key]: clamped }));
    if (!isActive) resetSession();
  };

  const ringRadius = 42;
  const circumference = 2 * Math.PI * ringRadius;

  return (
    <div className="pomodoro">
      <div className="pomodoro__phases" role="tablist">
        {PHASES.map((phase) => {
          const Icon = PHASE_ICONS[phase];
          const isSelected = currentPhase === phase;
          return (
            <button
              key={phase}
              type="button"
              role="tab"
              aria-selected={isSelected}
              disabled={isActive}
              className={`pomodoro__phase pomodoro__phase--${phase} ${isSelected ? "pomodoro__phase--active" : ""}`}
              onClick={() => setSelectedPhase(phase)}
            >
              <Icon className="w-3 h-3" />
              <span>{t(`timerAlarm.pomodoro.phases.${phase}`)}</span>
            </button>
          );
        })}
      </div>

      <div className={`pomodoro__ring-wrap pomodoro__ring-wrap--${currentPhase}`}>
        <svg className="pomodoro__ring" viewBox="0 0 100 100" aria-hidden>
          <circle className="pomodoro__ring-track" cx="50" cy="50" r={ringRadius} />
          <circle
            className="pomodoro__ring-progress"
            cx="50"
            cy="50"
            r={ringRadius}
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${circumference * (1 - progress)}`}
          />
        </svg>
        <div className="pomodoro__time">{displayTime}</div>
      </div>

      <div className="pomodoro__rounds" aria-label={t("timerAlarm.pomodoro.rounds")}>
        {Array.from({ length: totalRounds }, (_, i) => (
          <span
            key={i}
            className={`pomodoro__round-dot ${i < completedRounds ? "pomodoro__round-dot--done" : ""} ${
              isActive && currentPhase === "work" && i === completedRounds ? "pomodoro__round-dot--current" : ""
            }`}
          />
        ))}
        <span className="pomodoro__round-label">
          {t("timerAlarm.pomodoro.roundCount", {
            current: usePersian ? String(completedRounds).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]) : completedRounds,
            total: usePersian
              ? String(totalRounds).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d])
              : totalRounds,
          })}
        </span>
      </div>

      <div className="timer-alarm__actions pomodoro__actions">
        {!isRunning ? (
          <button type="button" className="timer-alarm__btn timer-alarm__btn--primary" onClick={startOrResume}>
            <Play className="w-3.5 h-3.5" />
            {t("timerAlarm.start")}
          </button>
        ) : (
          <button type="button" className="timer-alarm__btn timer-alarm__btn--primary" onClick={pauseSession}>
            <Pause className="w-3.5 h-3.5" />
            {t("timerAlarm.pause")}
          </button>
        )}
        <button type="button" className="timer-alarm__btn" onClick={resetSession} disabled={!isActive}>
          <RotateCcw className="w-3.5 h-3.5" />
          {t("timerAlarm.reset")}
        </button>
        {isActive && (
          <button type="button" className="timer-alarm__btn" onClick={skipSession}>
            <SkipForward className="w-3.5 h-3.5" />
            {t("timerAlarm.pomodoro.skip")}
          </button>
        )}
      </div>

      <button type="button" className="pomodoro__settings-toggle" onClick={() => setShowSettings(true)}>
        {t("timerAlarm.pomodoro.settings")}
      </button>

      {showSettings && (
        <div className="pomodoro__settings" role="dialog" aria-label={t("timerAlarm.pomodoro.settings")}>
          <div className="pomodoro__settings-header">
            <span className="pomodoro__settings-title">{t("timerAlarm.pomodoro.settings")}</span>
            <button
              type="button"
              className="pomodoro__settings-close"
              onClick={() => setShowSettings(false)}
              aria-label={t("timerAlarm.cancel")}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="pomodoro__setting-row">
            <label>{t("timerAlarm.pomodoro.phases.work")}</label>
            <input
              type="number"
              min={1}
              max={120}
              value={settings.workMin}
              disabled={isActive}
              onChange={(e) => updateSetting("workMin", Number(e.target.value))}
              dir="ltr"
            />
            <span>{t("timerAlarm.pomodoro.min")}</span>
          </div>
          <div className="pomodoro__setting-row">
            <label>{t("timerAlarm.pomodoro.phases.shortBreak")}</label>
            <input
              type="number"
              min={1}
              max={60}
              value={settings.shortBreakMin}
              disabled={isActive}
              onChange={(e) => updateSetting("shortBreakMin", Number(e.target.value))}
              dir="ltr"
            />
            <span>{t("timerAlarm.pomodoro.min")}</span>
          </div>
          <div className="pomodoro__setting-row">
            <label>{t("timerAlarm.pomodoro.phases.longBreak")}</label>
            <input
              type="number"
              min={1}
              max={120}
              value={settings.longBreakMin}
              disabled={isActive}
              onChange={(e) => updateSetting("longBreakMin", Number(e.target.value))}
              dir="ltr"
            />
            <span>{t("timerAlarm.pomodoro.min")}</span>
          </div>
          <div className="pomodoro__setting-row">
            <label>{t("timerAlarm.pomodoro.rounds")}</label>
            <input
              type="number"
              min={2}
              max={12}
              value={settings.roundsBeforeLong}
              disabled={isActive}
              onChange={(e) => updateSetting("roundsBeforeLong", Number(e.target.value))}
              dir="ltr"
            />
          </div>
          <button
            type="button"
            className="pomodoro__settings-reset"
            disabled={isActive}
            onClick={() => {
              setSettings(DEFAULT_POMODORO_SETTINGS);
              resetSession();
            }}
          >
            {t("timerAlarm.pomodoro.resetDefaults")}
          </button>
        </div>
      )}
    </div>
  );
});
