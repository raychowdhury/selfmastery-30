"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { toggleActionAction } from "@/actions/challenge";
import { Rule } from "@/components/ui/rule";
import { Tag } from "@/components/ui/tag";

export interface ActionRowData {
  id: string;
  title: string;
  description: string | null;
  minutes: number;
  pillarName: string | null;
  optional: boolean;
  completed: boolean;
}

/**
 * The most important control in the product. A 44px hit area, an immediate
 * optimistic state change, and a single 200ms pop — no confetti.
 */
export function ActionRow({
  action,
  readOnly = false,
}: {
  action: ActionRowData;
  readOnly?: boolean;
}) {
  // useOptimistic flips instantly and snaps back to server truth once the
  // revalidation lands — including when the write fails.
  const [completed, setCompleted] = React.useOptimistic(action.completed);
  const [pending, startTransition] = React.useTransition();

  function toggle() {
    if (readOnly) return;
    startTransition(async () => {
      const next = !action.completed;
      setCompleted(next);
      await toggleActionAction(action.id, next);
    });
  }

  return (
    <li className="list-none">
      <div className="flex items-center gap-4 py-4 sm:gap-5 sm:py-5">
        {/* The fade applies to the text, not the whole row: dimming the tick
            itself makes it hard to see that the action is done. */}
        <div
          className="min-w-0 flex-1 transition-opacity duration-200"
          style={{ opacity: completed ? 0.55 : 1 }}
        >
          <div
            className="heading text-[15px] sm:text-[17px]"
            style={{
              textDecorationLine: completed ? "line-through" : "none",
              textDecorationColor: "var(--color-neutral-600)",
            }}
          >
            {action.title}
          </div>

          {action.description ? (
            <p className="text-muted mt-1 mb-0 hidden text-[13px] sm:block">
              {action.description}
            </p>
          ) : null}

          <div className="mt-2 flex flex-wrap gap-1.5">
            <Tag variant="neutral">{action.minutes} min</Tag>
            {action.pillarName ? (
              <Tag variant="outline">{action.pillarName}</Tag>
            ) : null}
            {action.optional ? <Tag variant="neutral">Optional</Tag> : null}
          </div>
        </div>

        <button
          type="button"
          onClick={toggle}
          disabled={readOnly || pending}
          aria-pressed={completed}
          aria-label={
            completed
              ? `Mark "${action.title}" as not done`
              : `Mark "${action.title}" as done`
          }
          className="grid size-11 shrink-0 place-items-center rounded-full border-none bg-transparent p-0 disabled:cursor-default"
        >
          {completed ? (
            <span className="animate-pop grid size-[30px] place-items-center rounded-full bg-[var(--color-accent)]">
              <Check
                className="size-[15px]"
                strokeWidth={3}
                color="var(--color-on-accent)"
              />
            </span>
          ) : (
            <span className="block size-[30px] rounded-full border-[1.5px] border-[var(--color-neutral-600)]" />
          )}
        </button>
      </div>
      <Rule className="m-0" />
    </li>
  );
}
