"use client";

import * as React from "react";
import { Check, Plus } from "lucide-react";

import { savePrioritiesAction } from "@/actions/challenge";
import { Input } from "@/components/ui/input";

export interface PriorityData {
  position: number;
  text: string;
  completed: boolean;
}

/**
 * The optional top three. Separate from the generated plan — this is the user's
 * own list, and it saves itself rather than asking to be submitted.
 */
export function Priorities({
  dayId,
  initial,
}: {
  dayId: string;
  initial: PriorityData[];
}) {
  const [rows, setRows] = React.useState<PriorityData[]>(() =>
    [1, 2, 3].map(
      (position) =>
        initial.find((row) => row.position === position) ?? {
          position,
          text: "",
          completed: false,
        }
    )
  );
  const [open, setOpen] = React.useState(initial.length > 0);
  const [, startTransition] = React.useTransition();
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = React.useCallback(
    (next: PriorityData[]) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        startTransition(async () => {
          await savePrioritiesAction({ dayId, priorities: next });
        });
      }, 600);
    },
    [dayId]
  );

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  function update(position: number, patch: Partial<PriorityData>) {
    setRows((current) => {
      const next = current.map((row) =>
        row.position === position ? { ...row, ...patch } : row
      );
      persist(next);
      return next;
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-[13px] text-[var(--color-accent)]"
      >
        <Plus className="size-3.5" aria-hidden />
        Add your own top three for today
      </button>
    );
  }

  return (
    <section className="mt-8" aria-labelledby="priorities-heading">
      <h2 id="priorities-heading" className="label-caps">
        Your top three
      </h2>
      <p className="text-muted mt-1.5 mb-0 text-[13px]">
        Optional. These are yours, not part of the generated plan.
      </p>

      <ol className="mt-3 flex list-none flex-col gap-2 p-0">
        {rows.map((row) => (
          <li key={row.position} className="flex items-center gap-2.5">
            <span className="w-4 shrink-0 text-[13px] text-[var(--color-neutral-600)]">
              {row.position}
            </span>
            <Input
              value={row.text}
              placeholder={row.position === 1 ? "The one that matters most" : ""}
              aria-label={`Priority ${row.position}`}
              onChange={(event) =>
                update(row.position, { text: event.target.value })
              }
              style={{
                textDecorationLine: row.completed ? "line-through" : "none",
              }}
            />
            <button
              type="button"
              disabled={row.text.trim() === ""}
              onClick={() =>
                update(row.position, { completed: !row.completed })
              }
              aria-pressed={row.completed}
              aria-label={`Mark priority ${row.position} done`}
              className="grid size-11 shrink-0 place-items-center rounded-full border-none bg-transparent p-0 disabled:opacity-40"
            >
              {row.completed ? (
                <span className="animate-pop grid size-6 place-items-center rounded-full bg-[var(--color-accent)]">
                  <Check
                    className="size-3"
                    strokeWidth={3}
                    color="var(--color-on-accent)"
                  />
                </span>
              ) : (
                <span className="block size-6 rounded-full border-[1.5px] border-[var(--color-neutral-700)]" />
              )}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
