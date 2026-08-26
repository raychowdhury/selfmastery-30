import { Check } from "lucide-react";

import { Tag } from "@/components/ui/tag";

const PREVIEW_ACTIONS = [
  { title: "Walk for 20 minutes", done: true },
  { title: "10 minutes without your phone", done: false },
  { title: "Prepare tomorrow's walking time", done: false },
];

/**
 * The hero's product preview. A still of the Today screen rather than a stock
 * photograph — the product is the argument.
 */
export function TodayPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div
      aria-hidden
      className="w-full rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 text-left shadow-[var(--shadow-md)] sm:p-[26px]"
    >
      <div className="text-muted text-[12px]">Tuesday, August 25</div>
      <div className="mt-1 flex items-baseline justify-between gap-3">
        <div className="heading text-[18px] sm:text-[22px]">Day 8 of 30</div>
        <Tag variant="accent">Consistency Phase</Tag>
      </div>

      <div className="track mt-3.5">
        <div className="track-fill" style={{ width: "27%" }} />
      </div>

      <ul className="mt-5 list-none space-y-3.5 p-0">
        {PREVIEW_ACTIONS.slice(0, compact ? 2 : 3).map((action) => (
          <li
            key={action.title}
            className="flex items-center gap-3.5"
            style={{ opacity: action.done ? 0.55 : 1 }}
          >
            <span
              className="flex-1 text-[13px] sm:text-sm"
              style={{
                textDecorationLine: action.done ? "line-through" : "none",
                textDecorationColor: "var(--color-neutral-600)",
              }}
            >
              {action.title}
            </span>
            {action.done ? (
              <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-[var(--color-accent)]">
                <Check
                  className="size-3"
                  strokeWidth={3}
                  color="var(--color-on-accent)"
                />
              </span>
            ) : (
              <span className="size-[22px] shrink-0 rounded-full border-[1.5px] border-[var(--color-neutral-600)]" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
