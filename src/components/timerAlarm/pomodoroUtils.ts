import type { ActivePomodoro, PomodoroPhase, PomodoroSettings } from "./types";
import { scheduleSyncPush } from "../settings/settingsSync";

export const ACTIVE_POMODORO_KEY = "nexx-active-pomodoro";
export const POMODORO_SETTINGS_KEY = "nexx-pomodoro-settings";

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  workMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  roundsBeforeLong: 4,
};

export const loadPomodoroSettings = (): PomodoroSettings => {
  try {
    const raw = localStorage.getItem(POMODORO_SETTINGS_KEY);
    if (!raw) return DEFAULT_POMODORO_SETTINGS;
    return { ...DEFAULT_POMODORO_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_POMODORO_SETTINGS;
  }
};

export const savePomodoroSettings = (settings: PomodoroSettings) => {
  localStorage.setItem(POMODORO_SETTINGS_KEY, JSON.stringify(settings));
  scheduleSyncPush();
};

export const loadActivePomodoro = (): ActivePomodoro | null => {
  try {
    const raw = localStorage.getItem(ACTIVE_POMODORO_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActivePomodoro;
  } catch {
    return null;
  }
};

export const saveActivePomodoro = (pomodoro: ActivePomodoro | null) => {
  if (pomodoro) {
    localStorage.setItem(ACTIVE_POMODORO_KEY, JSON.stringify(pomodoro));
  } else {
    localStorage.removeItem(ACTIVE_POMODORO_KEY);
  }
};

export const phaseDurationMs = (phase: PomodoroPhase, settings: PomodoroSettings): number => {
  switch (phase) {
    case "work":
      return settings.workMin * 60_000;
    case "shortBreak":
      return settings.shortBreakMin * 60_000;
    case "longBreak":
      return settings.longBreakMin * 60_000;
  }
};

export const getPomodoroRemaining = (pomodoro: ActivePomodoro | null, now: number): number => {
  if (!pomodoro) return 0;
  if (pomodoro.status === "paused") return pomodoro.pausedRemainingMs ?? 0;
  return Math.max(0, pomodoro.endAt - now);
};

export const getNextPhase = (current: ActivePomodoro): { phase: PomodoroPhase; completedRounds: number } => {
  if (current.phase === "work") {
    const completedRounds = current.completedRounds + 1;
    if (completedRounds >= current.settings.roundsBeforeLong) {
      return { phase: "longBreak", completedRounds };
    }
    return { phase: "shortBreak", completedRounds };
  }

  if (current.phase === "longBreak") {
    return { phase: "work", completedRounds: 0 };
  }

  return { phase: "work", completedRounds: current.completedRounds };
};

export const createPomodoroSession = (
  phase: PomodoroPhase,
  settings: PomodoroSettings,
  completedRounds = 0,
): ActivePomodoro => {
  const totalMs = phaseDurationMs(phase, settings);
  return {
    phase,
    totalMs,
    endAt: Date.now() + totalMs,
    status: "running",
    completedRounds,
    settings,
  };
};
