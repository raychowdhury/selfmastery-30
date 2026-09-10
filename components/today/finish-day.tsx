"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { finishDayAction } from "@/actions/challenge";
import { Button } from "@/components/ui/button";

interface FinishDayProps {
  dayId: string;
  dayNumber: number;
}

/**
 * The Calm flow ends the day in one tap. Finishing marks the day done and moves
 * to the completion screen; the day's story is told there and, once a week, on
 * the review — Today stays a checklist, not a journal.
 */
export function FinishDay({ dayId, dayNumber }: FinishDayProps) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function finish() {
    startTransition(async () => {
      await finishDayAction(dayId);
      router.push(`/today/complete?day=${dayNumber}`);
    });
  }

  return (
    <Button onClick={finish} disabled={pending} block className="mt-4">
      {pending ? "Finishing…" : "Finish day"}
    </Button>
  );
}
