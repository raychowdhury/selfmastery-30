/**
 * Plain shapes the analytics layer works on. Keeping these free of Prisma types
 * means every calculation is a pure function that can be tested without a
 * database.
 */
export interface ActionSnapshot {
  id: string;
  pillarId: string | null;
  title: string;
  completed: boolean;
  optional: boolean;
  estimatedMinutes: number;
  minimumVersionTitle: string | null;
  minimumVersionMinutes: number | null;
}

export interface DaySnapshot {
  dayNumber: number;
  date: Date;
  isMinimumDay: boolean;
  completedAt: Date | null;
  actions: ActionSnapshot[];
}

export type DayState =
  | "FUTURE"
  | "TODAY"
  | "PERFECT"
  | "COMPLETE"
  | "PARTIAL"
  | "MINIMUM"
  | "MISSED";

export interface DailyCompletion {
  required: number;
  completed: number;
  /** 0–100. A day with no required actions counts as 0. */
  percent: number;
}

export interface PillarCompletion {
  pillarId: string;
  name: string;
  scheduled: number;
  completed: number;
  percent: number;
}
