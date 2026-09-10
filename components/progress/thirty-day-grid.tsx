"use client";

import * as React from "react";

export type DayStatus =
  | "done"
  | "partial"
  | "miss"
  | "minimum"
  | "today"
  | "future";

export interface GridDay {
  n: number;
  status: DayStatus;
  /** Short status word shown after the day number, e.g. "Complete". */
  statusLabel: string;
  /** The line beneath, e.g. "3 of 3 actions · 35 minutes". */
  detail: string;
}

const GLYPH: Record<DayStatus, string> = {
  done: "●",
  partial: "◐",
  miss: "–",
  minimum: "○",
  today: "",
  future: "",
};

/**
 * The prototype's thirty-day rail: a six-column grid of days, each carrying a
 * status glyph, with the selected day's detail shown below. Returning is the
 * story, so a missed day is a quiet dash rather than an alarm.
 */
export function ThirtyDayGrid({
  days,
  initialSelected,
}: {
  days: GridDay[];
  initialSelected: number;
}) {
  const [selected, setSelected] = React.useState(initialSelected);
  const current = days.find((d) => d.n === selected) ?? days[0];

  return (
    <div>
      <div className="grid grid-cols-6 gap-1.5">
        {days.map((day) => {
          const isSelected = day.n === selected;
          const isToday = day.status === "today";
          const faint = day.status === "future";
          const glyph = GLYPH[day.status];
          const glyphColor =
            day.status === "miss"
              ? "var(--color-neutral-500)"
              : "var(--color-accent)";
          return (
            <button
              key={day.n}
              type="button"
              onClick={() => setSelected(day.n)}
              aria-label={`Day ${day.n}, ${day.statusLabel}`}
              aria-pressed={isSelected}
              className="flex h-12 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border p-0"
              style={{
                background: isSelected ? "var(--color-surface)" : "transparent",
                borderColor: isToday ? "var(--color-accent)" : "transparent",
                color: faint
                  ? "color-mix(in srgb, var(--color-text) 30%, transparent)"
                  : "var(--color-text)",
              }}
            >
              <span className="text-[13px]">{day.n}</span>
              <span
                className="h-2.5 text-[10px] leading-[10px]"
                style={{ color: glyph ? glyphColor : "transparent" }}
              >
                {glyph || "·"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-7" aria-live="polite">
        <div className="text-[16px]">
          Day {current.n} · {current.statusLabel}
        </div>
        {current.detail ? (
          <div className="text-muted mt-1 text-[13.5px]">{current.detail}</div>
        ) : null}
      </div>
    </div>
  );
}
