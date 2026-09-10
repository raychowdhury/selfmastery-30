"use client";

import * as React from "react";

import { toggleActionAction } from "@/actions/challenge";
import { CalmRule } from "@/components/layout/calm-shell";

export interface ActionRowData {
  id: string;
  title: string;
  minutes: number;
  optional: boolean;
  completed: boolean;
}

/**
 * The most important control in the product, at the Calm design's density:
 * a title, a time, and a circle. Done actions dim to the muted colour —
 * no strikethrough, no badges.
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
      <div className="flex items-center gap-4 py-[22px]">
        <div className="min-w-0 flex-1">
          <div
            className="text-[17px] leading-[1.3] transition-colors duration-200"
            style={{
              color: completed
                ? "color-mix(in srgb, var(--color-text) 60%, transparent)"
                : "inherit",
            }}
          >
            {action.title}
          </div>
          <div className="text-muted mt-1 text-[13px]">
            {action.minutes} min
            {action.optional ? " · optional" : ""}
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
          className="grid size-11 shrink-0 cursor-pointer place-items-center border-none bg-transparent p-0 disabled:cursor-default"
        >
          {completed ? (
            <span className="calm-pop grid size-7 place-items-center rounded-full border-[1.5px] border-[var(--color-accent)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          ) : (
            <span className="block size-7 rounded-full border-[1.5px] border-[color-mix(in_srgb,var(--color-text)_35%,transparent)]" />
          )}
        </button>
      </div>
      <CalmRule />
    </li>
  );
}
