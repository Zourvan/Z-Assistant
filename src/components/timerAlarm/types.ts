export type AlarmRepeat = "once" | "daily" | "weekdays" | "weekends" | "custom";

export interface AlarmItem {
  id: string;
  label: string;
  hour: number;
  minute: number;
  enabled: boolean;
  repeat: AlarmRepeat;
  repeatDays?: number[];
  createdAt: number;
  lastTriggeredAt?: number;
}

export interface ActiveTimer {
  totalMs: number;
  endAt: number;
  status: "running" | "paused";
  pausedRemainingMs?: number;
  label?: string;
}

export interface RingingAlert {
  kind: "timer" | "alarm" | "pomodoro";
  id: string;
  label: string;
}

export type PomodoroPhase = "work" | "shortBreak" | "longBreak";

export interface PomodoroSettings {
  workMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  roundsBeforeLong: number;
}

export interface ActivePomodoro {
  phase: PomodoroPhase;
  totalMs: number;
  endAt: number;
  status: "running" | "paused";
  pausedRemainingMs?: number;
  completedRounds: number;
  settings: PomodoroSettings;
}
