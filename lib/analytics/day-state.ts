import type { DayState } from "@/lib/analytics/types";

export interface DayVisual {
  mark: string;
  markColor: string;
  background: string;
  border: string;
  color: string;
  label: string;
}

/**
 * How each day state reads on the calendar. A missed day is a soft grey, never
 * red — the calendar is a record, not a scoreboard.
 */
export function dayVisual(state: DayState, percent: number): DayVisual {
  switch (state) {
    case "PERFECT":
      return {
        mark: "★",
        markColor: "var(--color-accent-200)",
        background: "var(--color-accent-800)",
        border: "transparent",
        color: "var(--color-accent-100)",
        label: "Perfect day",
      };
    case "COMPLETE":
      return {
        mark: "✓",
        markColor: "var(--color-accent)",
        background: "var(--color-surface)",
        border: "transparent",
        color: "var(--color-text)",
        label: "Complete",
      };
    case "PARTIAL":
      return {
        mark: `${percent}%`,
        markColor: "var(--color-neutral-400)",
        background: "var(--color-surface)",
        border: "transparent",
        color: "var(--color-text)",
        label: "Partial",
      };
    case "MINIMUM":
      return {
        mark: "M",
        markColor: "var(--color-accent-2-300)",
        background: "var(--color-surface)",
        border: "transparent",
        color: "var(--color-text)",
        label: "Minimum Day",
      };
    case "TODAY":
      return {
        mark: "·",
        markColor: "var(--color-accent)",
        background: "color-mix(in srgb, var(--color-accent) 10%, transparent)",
        border: "var(--color-accent)",
        color: "var(--color-accent-on-tint)",
        label: "Today",
      };
    case "MISSED":
      return {
        mark: "—",
        markColor: "var(--color-neutral-600)",
        background: "transparent",
        border: "var(--color-divider)",
        color: "var(--color-neutral-500)",
        label: "Missed",
      };
    case "FUTURE":
    default:
      return {
        mark: "",
        markColor: "transparent",
        background: "transparent",
        border: "color-mix(in srgb, var(--color-text) 6%, transparent)",
        color: "var(--color-neutral-700)",
        label: "Upcoming",
      };
  }
}

export const CALENDAR_LEGEND: Array<{ mark: string; color: string; label: string }> = [
  { mark: "✓", color: "var(--color-accent)", label: "Complete" },
  { mark: "★", color: "var(--color-accent-200)", label: "Perfect" },
  { mark: "%", color: "var(--color-neutral-400)", label: "Partial" },
  { mark: "M", color: "var(--color-accent-2-300)", label: "Minimum Day" },
  { mark: "—", color: "var(--color-neutral-600)", label: "Missed" },
];
