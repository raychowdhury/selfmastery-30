import type { Phase } from "@/lib/generated/prisma/enums";

export const DEFAULT_CHALLENGE_LENGTH = 30;

interface PhaseDefinition {
  phase: Phase;
  startDay: number;
  endDay: number;
  label: string;
  objective: string;
  /** Multiplier applied to the daily time budget. Effort ramps, it never spikes. */
  effortFactor: number;
}

export const PHASES: PhaseDefinition[] = [
  {
    phase: "CONSISTENCY",
    startDay: 1,
    endDay: 7,
    label: "Consistency",
    objective: "Show up. Keep it small enough that you actually do it.",
    effortFactor: 0.7,
  },
  {
    phase: "BUILD",
    startDay: 8,
    endDay: 14,
    label: "Build",
    objective: "Add structure now that the habit exists.",
    effortFactor: 0.88,
  },
  {
    phase: "DEPTH",
    startDay: 15,
    endDay: 21,
    label: "Depth",
    objective: "Move from showing up to making real progress.",
    effortFactor: 1,
  },
  {
    phase: "FINISH",
    startDay: 22,
    endDay: 30,
    label: "Finish",
    objective: "Finish something you can point at on Day 30.",
    effortFactor: 1,
  },
];

export function phaseForDay(dayNumber: number): Phase {
  const definition = PHASES.find(
    (candidate) =>
      dayNumber >= candidate.startDay && dayNumber <= candidate.endDay
  );
  // Challenges longer than 30 days simply stay in the finishing phase.
  return definition?.phase ?? "FINISH";
}

export function phaseDefinition(phase: Phase): PhaseDefinition {
  const definition = PHASES.find((candidate) => candidate.phase === phase);
  if (!definition) {
    throw new Error(`Unknown phase: ${phase}`);
  }
  return definition;
}

export function phaseLabel(phase: Phase): string {
  return phaseDefinition(phase).label;
}

/**
 * 1-indexed week number. The trailing days of a 30-day challenge belong to
 * week 4 rather than starting a two-day week 5.
 */
export function weekForDay(dayNumber: number, lengthDays = DEFAULT_CHALLENGE_LENGTH): number {
  const totalWeeks = Math.max(1, Math.floor(lengthDays / 7));
  return Math.min(Math.ceil(dayNumber / 7), totalWeeks);
}

/**
 * Day numbers that close a week and therefore trigger a review: 7, 14, 21 and
 * then the final day. A 28th-day review two days before the end would be one
 * review too many.
 */
export function reviewDays(lengthDays = DEFAULT_CHALLENGE_LENGTH): number[] {
  const days: number[] = [];
  for (let day = 7; day < lengthDays; day += 7) {
    // Skip a week boundary that sits within a week of the finish line.
    if (day + 7 > lengthDays) continue;
    days.push(day);
  }
  days.push(lengthDays);
  return days;
}

export function isReviewDay(dayNumber: number, lengthDays = DEFAULT_CHALLENGE_LENGTH): boolean {
  return reviewDays(lengthDays).includes(dayNumber);
}

export const MILESTONE_DAYS = [7, 14, 21, 30];
