import type { DifficultyFeedback } from "@/lib/generated/prisma/enums";

import { calculateWeeklyCompletion, visibleActions } from "@/lib/analytics/calculations";
import type { DaySnapshot } from "@/lib/analytics/types";
import { weekForDay } from "@/lib/challenge/phases";

export type AdjustmentDirection = "REDUCE" | "HOLD" | "INCREASE";

export interface AdjustmentDecision {
  direction: AdjustmentDirection;
  rationale: string;
  summary: string;
}

/**
 * Deterministic and deliberately conservative. The most important rule is the
 * first one: a hard week never earns a heavier plan. Increases require both
 * high completion and the user saying it felt too easy.
 *
 * Pure by design — no database, no clock — so the policy is testable on its own.
 */
export function decideAdjustment(
  completionRate: number,
  feedback: DifficultyFeedback
): AdjustmentDecision {
  if (completionRate < 50) {
    return {
      direction: "REDUCE",
      rationale: `You completed ${completionRate}% of this week's actions. When a week is hard, the plan is what changes — not the commitment.`,
      summary: "Next week's actions are shorter, and one becomes optional.",
    };
  }

  if (completionRate < 75) {
    if (feedback === "TOO_DIFFICULT") {
      return {
        direction: "REDUCE",
        rationale: `You completed ${completionRate}% and said the week felt too difficult. Let's take some weight off rather than push harder.`,
        summary: "Next week's actions are shorter.",
      };
    }
    return {
      direction: "HOLD",
      rationale: `You completed ${completionRate}%. That is a working plan — repeating it is more useful than changing it.`,
      summary: "Next week keeps the same shape.",
    };
  }

  if (completionRate < 90) {
    if (feedback === "TOO_DIFFICULT") {
      return {
        direction: "REDUCE",
        rationale: `You completed ${completionRate}%, but it cost you. Slightly shorter actions should make that easier to hold.`,
        summary: "Next week's actions are shorter.",
      };
    }
    return {
      direction: "HOLD",
      rationale: `You completed ${completionRate}% at a difficulty that is working. Steady progression from here.`,
      summary: "Next week continues the planned progression.",
    };
  }

  if (feedback === "TOO_EASY") {
    return {
      direction: "INCREASE",
      rationale: `You completed ${completionRate}% and said it felt too easy. One small step up — not a jump.`,
      summary: "Next week's actions get slightly longer.",
    };
  }

  return {
    direction: "HOLD",
    rationale: `You completed ${completionRate}% at about the right difficulty. That is the target state, so nothing changes.`,
    summary: "Next week keeps the same shape.",
  };
}

/** Rounds to a friendly number — nobody schedules 17 minutes. */
function roundMinutes(minutes: number): number {
  if (minutes <= 20) return Math.max(5, Math.round(minutes / 5) * 5);
  return Math.round(minutes / 10) * 10;
}

export function scaleMinutes(
  minutes: number,
  direction: AdjustmentDirection
): number {
  if (direction === "HOLD") return minutes;
  const factor = direction === "REDUCE" ? 0.75 : 1.2;
  return Math.max(5, roundMinutes(minutes * factor));
}

export interface WeekSummary {
  weekNumber: number;
  completionRate: number;
  /** Actions skipped three or more times this week — the ones worth changing. */
  frequentlySkipped: string[];
  minimumDays: number;
}

export function summariseWeek(
  snapshots: DaySnapshot[],
  weekNumber: number,
  lengthDays = 30
): WeekSummary {
  const inWeek = snapshots.filter(
    (day) => weekForDay(day.dayNumber, lengthDays) === weekNumber
  );

  const skipCounts = new Map<string, number>();
  for (const day of inWeek) {
    for (const action of visibleActions(day)) {
      if (action.optional || action.completed) continue;
      skipCounts.set(action.title, (skipCounts.get(action.title) ?? 0) + 1);
    }
  }

  return {
    weekNumber,
    completionRate: calculateWeeklyCompletion(snapshots, weekNumber, lengthDays),
    frequentlySkipped: [...skipCounts.entries()]
      .filter(([, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .map(([title]) => title),
    minimumDays: inWeek.filter((day) => day.isMinimumDay).length,
  };
}
