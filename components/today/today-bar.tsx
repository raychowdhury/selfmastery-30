"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  finishDayAction,
  saveReflectionAction,
  setMinimumDayAction,
} from "@/actions/challenge";
import { GlassBar } from "@/components/layout/calm-shell";
import { Button } from "@/components/ui/button";
import { CalmSheet } from "@/components/ui/sheet";
import { CalmRule } from "@/components/layout/calm-shell";

type Feeling = "EASY" | "GOOD" | "DIFFICULT";

const FEELINGS: Array<{ value: Feeling; label: string }> = [
  { value: "EASY", label: "Easy" },
  { value: "GOOD", label: "Good" },
  { value: "DIFFICULT", label: "Difficult" },
];

/** Quiet underlined text button — the Calm bar's secondary affordance. */
function UnderlineButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-11 cursor-pointer items-center self-start border-none bg-transparent p-0 text-left text-[14px] text-inherit underline decoration-[color-mix(in_srgb,var(--color-text)_35%,transparent)] underline-offset-4"
    >
      {children}
    </button>
  );
}

/**
 * The fixed action bar under the Today screen, and the two bottom sheets it
 * opens: Minimum Day (life happens — reduce, don't skip) and Finish Day
 * (one-tap feeling, optional note).
 */
export function TodayBar({
  dayId,
  dayNumber,
  isMinimumDay,
  reductions,
  initialFeeling,
  initialNote,
}: {
  dayId: string;
  dayNumber: number;
  isMinimumDay: boolean;
  /** Original → reduced title for every action that has a smaller version. */
  reductions: Array<{ from: string; to: string }>;
  initialFeeling: Feeling | null;
  initialNote: string;
}) {
  const router = useRouter();
  const [sheet, setSheet] = React.useState<"none" | "minimum" | "finish">(
    "none"
  );
  const [feeling, setFeeling] = React.useState<Feeling | null>(initialFeeling);
  const [note, setNote] = React.useState(initialNote);
  const [pending, startTransition] = React.useTransition();

  function setMinimum(minimum: boolean) {
    startTransition(async () => {
      await setMinimumDayAction(dayId, minimum);
      setSheet("none");
    });
  }

  function finish() {
    startTransition(async () => {
      await saveReflectionAction({
        dayId,
        dayFeeling: feeling,
        note,
        whatHelped: "",
        whatGotInWay: "",
      });
      await finishDayAction(dayId);
      router.push(`/today/complete?day=${dayNumber}`);
    });
  }

  return (
    <>
      <GlassBar>
        {isMinimumDay ? (
          <UnderlineButton onClick={() => setMinimum(false)} disabled={pending}>
            Restore the full plan
          </UnderlineButton>
        ) : (
          <UnderlineButton onClick={() => setSheet("minimum")}>
            Having a difficult day? Use a minimum day
          </UnderlineButton>
        )}
        <Button block onClick={() => setSheet("finish")}>
          Finish day
        </Button>
      </GlassBar>

      <CalmSheet
        open={sheet === "minimum"}
        onClose={() => setSheet("none")}
        label="Switch to a minimum day"
      >
        <div className="heading text-[20px] leading-[1.25]">
          Keep the commitment.
          <br />
          Reduce the requirement.
        </div>
        <p className="text-muted mt-3 mb-0 text-[14px] leading-normal">
          Today&apos;s plan shrinks to its smallest meaningful version. Showing
          up small still counts.
        </p>

        {reductions.length > 0 ? (
          <div className="mt-6 flex flex-col">
            {reductions.map((reduction, index) => (
              <React.Fragment key={reduction.from}>
                {index > 0 ? <CalmRule /> : null}
                <div className="flex justify-between gap-3 py-3 text-[14px]">
                  <span className="text-muted">{reduction.from}</span>
                  <span className="text-right">{reduction.to}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        ) : null}

        <div className="mt-7 flex flex-col gap-2">
          <Button block onClick={() => setMinimum(true)} disabled={pending}>
            {pending ? "Switching…" : "Switch to a minimum day"}
          </Button>
          <Button
            block
            variant="ghost"
            onClick={() => setSheet("none")}
            disabled={pending}
          >
            Keep the original plan
          </Button>
        </div>
      </CalmSheet>

      <CalmSheet
        open={sheet === "finish"}
        onClose={() => setSheet("none")}
        label="Finish the day"
      >
        <div className="heading text-[20px] leading-[1.25]">
          How did today feel?
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {FEELINGS.map((option) => {
            const on = feeling === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFeeling(option.value)}
                aria-pressed={on}
                className="min-h-11 cursor-pointer rounded-[14px] border bg-transparent px-4 py-2 text-[14px] transition-colors"
                style={{
                  borderColor: on
                    ? "var(--color-text)"
                    : "var(--color-divider)",
                  color: on
                    ? "var(--color-text)"
                    : "color-mix(in srgb, var(--color-text) 60%, transparent)",
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <textarea
          className="input mt-5"
          rows={3}
          value={note}
          placeholder="Anything you want to remember? Optional."
          aria-label="Anything you want to remember about today?"
          onChange={(event) => setNote(event.target.value)}
        />

        <div className="mt-6 flex flex-col gap-2">
          <Button block onClick={finish} disabled={pending}>
            {pending ? "Saving…" : "Finish day"}
          </Button>
          <Button
            block
            variant="ghost"
            onClick={() => setSheet("none")}
            disabled={pending}
          >
            Not yet
          </Button>
        </div>
      </CalmSheet>
    </>
  );
}
