import {
  calculateDailyCompletion,
  visibleActions,
} from "@/lib/analytics/calculations";
import type { DaySnapshot, PillarCompletion } from "@/lib/analytics/types";

export interface Insight {
  id: string;
  text: string;
  /** Rendered in a heavier weight inside the sentence. */
  emphasis?: string;
}

/**
 * Deterministic, evidence-based observations. Every one of these is a count
 * taken from the user's own rows — nothing is invented, and nothing appears
 * until there is enough data to make it true.
 */
export function buildInsights(
  days: DaySnapshot[],
  pillars: PillarCompletion[],
  todayDayNumber: number
): Insight[] {
  const elapsed = days.filter((day) => day.dayNumber <= todayDayNumber);
  const insights: Insight[] = [];

  // Not enough has happened yet to say anything honest.
  if (elapsed.length < 3) return insights;

  const lastSeven = elapsed.slice(-7);
  const activeInLastSeven = lastSeven.filter(
    (day) => calculateDailyCompletion(day).percent >= 50
  ).length;

  if (lastSeven.length >= 5) {
    insights.push({
      id: "recent-consistency",
      text: `You completed your plan on ${activeInLastSeven} of the last ${lastSeven.length} days.`,
      emphasis: `${activeInLastSeven} of the last ${lastSeven.length} days`,
    });
  }

  const minutes = elapsed.reduce(
    (total, day) =>
      total +
      visibleActions(day)
        .filter((action) => action.completed)
        .reduce((sum, action) => sum + action.estimatedMinutes, 0),
    0
  );
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    const label =
      hours > 0 && remainder > 0
        ? `${hours}h ${remainder}m`
        : hours > 0
          ? `${hours}h`
          : `${minutes} minutes`;
    insights.push({
      id: "minutes",
      text: `You have put ${label} into this goal so far.`,
      emphasis: label,
    });
  }

  // The single action completed most often — usually the one that stuck.
  const completions = new Map<string, { done: number; total: number }>();
  for (const day of elapsed) {
    for (const action of visibleActions(day)) {
      if (action.optional) continue;
      const entry = completions.get(action.title) ?? { done: 0, total: 0 };
      entry.total += 1;
      if (action.completed) entry.done += 1;
      completions.set(action.title, entry);
    }
  }

  const ranked = [...completions.entries()]
    .filter(([, entry]) => entry.total >= 4)
    .sort((a, b) => b[1].done / b[1].total - a[1].done / a[1].total);

  if (ranked.length > 0) {
    const [title, entry] = ranked[0];
    if (entry.done >= 3) {
      insights.push({
        id: "best-action",
        text: `You have completed "${title}" ${entry.done} of ${entry.total} times.`,
        emphasis: `${entry.done} of ${entry.total} times`,
      });
    }
  }

  if (ranked.length > 1) {
    const [title, entry] = ranked[ranked.length - 1];
    const rate = entry.done / entry.total;
    if (rate < 0.5) {
      insights.push({
        id: "skipped-action",
        text: `"${title}" is the action you skip most. It may be too long, or in the wrong part of the day.`,
        emphasis: "the action you skip most",
      });
    }
  }

  const measured = pillars.filter((pillar) => pillar.scheduled >= 3);
  if (measured.length >= 2) {
    const sorted = [...measured].sort((a, b) => b.percent - a.percent);
    const best = sorted[0];
    const weakest = sorted[sorted.length - 1];
    if (best.percent - weakest.percent >= 15) {
      insights.push({
        id: "pillar-gap",
        text: `${best.name} is where you show up most consistently. ${weakest.name} is where you show up least.`,
        emphasis: best.name,
      });
    }
  }

  const minimumDays = elapsed.filter((day) => day.isMinimumDay).length;
  if (minimumDays >= 2) {
    insights.push({
      id: "minimum-days",
      text: `You used a Minimum Day ${minimumDays} times — days you could have skipped entirely and didn't.`,
      emphasis: `${minimumDays} times`,
    });
  }

  return insights.slice(0, 4);
}
