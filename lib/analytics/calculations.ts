import { weekForDay } from "@/lib/challenge/phases";
import { renderCopy } from "@/lib/challenge/render";

import type {
  ActionSnapshot,
  DailyCompletion,
  DaySnapshot,
  DayState,
  PillarCompletion,
} from "@/lib/analytics/types";

/** A day counts as "active" once at least half its required actions are done. */
export const ACTIVE_DAY_THRESHOLD = 50;

/**
 * How an action reads today. On a Minimum Day the reduced version is what the
 * user is being asked for, so that is what we display and measure against.
 * The original is never overwritten.
 */
export function effectiveAction(action: ActionSnapshot, isMinimumDay: boolean) {
  if (isMinimumDay && action.minimumVersionTitle) {
    const minutes = action.minimumVersionMinutes ?? action.estimatedMinutes;
    return {
      ...action,
      title: renderCopy(action.minimumVersionTitle, minutes),
      estimatedMinutes: minutes,
    };
  }
  return {
    ...action,
    title: renderCopy(action.title, action.estimatedMinutes),
  };
}

/**
 * Actions the user is actually being asked to do. Optional extras drop away on
 * a Minimum Day — that is the entire point of one.
 */
export function visibleActions(day: DaySnapshot): ActionSnapshot[] {
  const actions = day.isMinimumDay
    ? day.actions.filter((action) => !action.optional)
    : day.actions;
  return actions.map((action) => effectiveAction(action, day.isMinimumDay));
}

function requiredActions(day: DaySnapshot): ActionSnapshot[] {
  return visibleActions(day).filter((action) => !action.optional);
}

export function calculateDailyCompletion(day: DaySnapshot): DailyCompletion {
  const required = requiredActions(day);
  const completed = required.filter((action) => action.completed).length;
  return {
    required: required.length,
    completed,
    percent:
      required.length === 0
        ? 0
        : Math.round((completed / required.length) * 100),
  };
}

export function isActiveDay(day: DaySnapshot): boolean {
  const { percent, required } = calculateDailyCompletion(day);
  return required > 0 && percent >= ACTIVE_DAY_THRESHOLD;
}

export function isPerfectDay(day: DaySnapshot): boolean {
  const { percent, required } = calculateDailyCompletion(day);
  return required > 0 && percent === 100;
}

/**
 * Classification used by the calendar. `todayDayNumber` is the day the user is
 * currently on; anything after it is untouched future, not a failure.
 */
export function classifyDay(day: DaySnapshot, todayDayNumber: number): DayState {
  if (day.dayNumber > todayDayNumber) return "FUTURE";

  const { percent } = calculateDailyCompletion(day);

  if (day.isMinimumDay && percent > 0) return "MINIMUM";
  if (percent === 100) return "PERFECT";
  if (percent >= ACTIVE_DAY_THRESHOLD) return "COMPLETE";
  if (percent > 0) return "PARTIAL";
  if (day.dayNumber === todayDayNumber) return "TODAY";
  return "MISSED";
}

/**
 * Overall consistency, measured only against days that have already happened.
 * Future days are not counted as failures.
 */
export function calculateOverallCompletion(
  days: DaySnapshot[],
  todayDayNumber: number
): number {
  const elapsed = days.filter((day) => day.dayNumber <= todayDayNumber);
  let required = 0;
  let completed = 0;

  for (const day of elapsed) {
    const daily = calculateDailyCompletion(day);
    required += daily.required;
    completed += daily.completed;
  }

  return required === 0 ? 0 : Math.round((completed / required) * 100);
}

export function calculateActiveDays(days: DaySnapshot[]): number {
  return days.filter(isActiveDay).length;
}

export function calculatePerfectDays(days: DaySnapshot[]): number {
  return days.filter(isPerfectDay).length;
}

export function calculateMinimumDays(days: DaySnapshot[]): number {
  return days.filter((day) => day.isMinimumDay).length;
}

export function calculateTotalActionsCompleted(days: DaySnapshot[]): number {
  return days.reduce(
    (total, day) =>
      total + visibleActions(day).filter((action) => action.completed).length,
    0
  );
}

export function calculateMinutesCompleted(days: DaySnapshot[]): number {
  return days.reduce(
    (total, day) =>
      total +
      visibleActions(day)
        .filter((action) => action.completed)
        .reduce((sum, action) => sum + action.estimatedMinutes, 0),
    0
  );
}

/**
 * Consecutive active days ending at today. Today is not yet a broken day — if
 * it is still unfinished the streak is measured up to yesterday, so opening the
 * app in the morning never shows a streak that just collapsed.
 */
export function calculateCurrentStreak(
  days: DaySnapshot[],
  todayDayNumber: number
): number {
  const byNumber = new Map(days.map((day) => [day.dayNumber, day]));
  const today = byNumber.get(todayDayNumber);

  let cursor = today && isActiveDay(today) ? todayDayNumber : todayDayNumber - 1;
  let streak = 0;

  while (cursor >= 1) {
    const day = byNumber.get(cursor);
    if (!day || !isActiveDay(day)) break;
    streak += 1;
    cursor -= 1;
  }

  return streak;
}

export function calculateLongestStreak(days: DaySnapshot[]): number {
  const ordered = [...days].sort((a, b) => a.dayNumber - b.dayNumber);
  let longest = 0;
  let running = 0;
  let previousDayNumber: number | null = null;

  for (const day of ordered) {
    const contiguous =
      previousDayNumber === null || day.dayNumber === previousDayNumber + 1;
    running = isActiveDay(day) ? (contiguous ? running + 1 : 1) : 0;
    longest = Math.max(longest, running);
    previousDayNumber = day.dayNumber;
  }

  return longest;
}

export function calculatePillarCompletion(
  days: DaySnapshot[],
  pillars: Array<{ id: string; name: string }>,
  todayDayNumber: number
): PillarCompletion[] {
  const totals = new Map<string, { scheduled: number; completed: number }>();
  for (const pillar of pillars) {
    totals.set(pillar.id, { scheduled: 0, completed: 0 });
  }

  for (const day of days) {
    if (day.dayNumber > todayDayNumber) continue;
    for (const action of visibleActions(day)) {
      if (action.optional || !action.pillarId) continue;
      const bucket = totals.get(action.pillarId);
      if (!bucket) continue;
      bucket.scheduled += 1;
      if (action.completed) bucket.completed += 1;
    }
  }

  return pillars.map((pillar) => {
    const bucket = totals.get(pillar.id) ?? { scheduled: 0, completed: 0 };
    return {
      pillarId: pillar.id,
      name: pillar.name,
      scheduled: bucket.scheduled,
      completed: bucket.completed,
      percent:
        bucket.scheduled === 0
          ? 0
          : Math.round((bucket.completed / bucket.scheduled) * 100),
    };
  });
}

export function calculateWeeklyCompletion(
  days: DaySnapshot[],
  weekNumber: number,
  lengthDays = 30
): number {
  const inWeek = days.filter(
    (day) => weekForDay(day.dayNumber, lengthDays) === weekNumber
  );
  let required = 0;
  let completed = 0;

  for (const day of inWeek) {
    const daily = calculateDailyCompletion(day);
    required += daily.required;
    completed += daily.completed;
  }

  return required === 0 ? 0 : Math.round((completed / required) * 100);
}

export interface ChallengeStats {
  overallCompletion: number;
  activeDays: number;
  perfectDays: number;
  minimumDays: number;
  currentStreak: number;
  longestStreak: number;
  actionsCompleted: number;
  minutesCompleted: number;
}

export function calculateChallengeStats(
  days: DaySnapshot[],
  todayDayNumber: number
): ChallengeStats {
  const elapsed = days.filter((day) => day.dayNumber <= todayDayNumber);

  return {
    overallCompletion: calculateOverallCompletion(days, todayDayNumber),
    activeDays: calculateActiveDays(elapsed),
    perfectDays: calculatePerfectDays(elapsed),
    minimumDays: calculateMinimumDays(elapsed),
    currentStreak: calculateCurrentStreak(days, todayDayNumber),
    longestStreak: calculateLongestStreak(elapsed),
    actionsCompleted: calculateTotalActionsCompleted(elapsed),
    minutesCompleted: calculateMinutesCompleted(elapsed),
  };
}
