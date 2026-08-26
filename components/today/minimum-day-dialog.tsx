"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";

import { setMinimumDayAction } from "@/actions/challenge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

interface MinimumDayDialogProps {
  dayId: string;
  isMinimumDay: boolean;
  /** Original → reduced, for the most substantial action of the day. */
  preview: { from: string; to: string } | null;
}

/**
 * Life Happens. No reason is required, nothing is logged as a failure, and the
 * original plan is never destroyed — the day can be switched back.
 */
export function MinimumDayDialog({
  dayId,
  isMinimumDay,
  preview,
}: MinimumDayDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function apply(minimum: boolean) {
    startTransition(async () => {
      await setMinimumDayAction(dayId, minimum);
      setOpen(false);
    });
  }

  if (isMinimumDay) {
    return (
      <p className="mt-4 mb-0 flex flex-wrap items-center gap-1.5 text-[13px] text-[var(--color-neutral-500)]">
        Today is a Minimum Day — the smallest version still counts.
        <button
          type="button"
          onClick={() => apply(false)}
          disabled={pending}
          className="cursor-pointer border-none bg-transparent p-0 text-[13px] text-[var(--color-accent)] underline underline-offset-[3px]"
        >
          Restore full plan
        </button>
      </p>
    );
  }

  return (
    <>
      <p className="mt-4 mb-0 flex flex-wrap items-center gap-1.5 text-[13px] text-[var(--color-neutral-500)]">
        Having a difficult day?
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="cursor-pointer border-none bg-transparent p-0 text-[13px] text-[var(--color-accent)] underline underline-offset-[3px]"
        >
          Use Minimum Day →
        </button>
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Keep the commitment. Reduce the requirement.</DialogTitle>
          <DialogDescription>
            Today&apos;s plan can be reduced to the smallest meaningful actions.
            Showing up small still counts as showing up, and it keeps your
            consistency intact.
          </DialogDescription>

          {preview ? (
            <div className="flex flex-wrap items-center gap-2.5 rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)] px-3.5 py-3 text-[13.5px]">
              <span className="text-[var(--color-neutral-500)] line-through">
                {preview.from}
              </span>
              <ArrowRight
                className="size-3.5 shrink-0"
                color="var(--color-accent)"
                aria-hidden
              />
              <span className="text-[var(--color-accent-on-tint)]">{preview.to}</span>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Keep original plan
            </Button>
            <Button onClick={() => apply(true)} disabled={pending}>
              {pending ? "Switching…" : "Switch to Minimum Day"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
