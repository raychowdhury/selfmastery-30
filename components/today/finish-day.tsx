"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { finishDayAction, saveReflectionAction } from "@/actions/challenge";
import { Button } from "@/components/ui/button";
import { Pill, PillRow } from "@/components/ui/choice";
import { Field, Textarea } from "@/components/ui/input";

type Feeling = "EASY" | "GOOD" | "DIFFICULT";

const FEELINGS: Array<{ value: Feeling; label: string }> = [
  { value: "EASY", label: "Easy" },
  { value: "GOOD", label: "Good" },
  { value: "DIFFICULT", label: "Difficult" },
];

interface FinishDayProps {
  dayId: string;
  dayNumber: number;
  initialFeeling: Feeling | null;
  initialNote: string;
  /** Deeper prompts appear once a week rather than every day. */
  deepReflection: boolean;
}

/**
 * Reflection is one tap by default. The longer prompts only appear at the end
 * of a week, because daily journaling is the fastest way to lose someone.
 */
export function FinishDay({
  dayId,
  dayNumber,
  initialFeeling,
  initialNote,
  deepReflection,
}: FinishDayProps) {
  const router = useRouter();
  const [feeling, setFeeling] = React.useState<Feeling | null>(initialFeeling);
  const [note, setNote] = React.useState(initialNote);
  const [helped, setHelped] = React.useState("");
  const [inWay, setInWay] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function finish() {
    startTransition(async () => {
      await saveReflectionAction({
        dayId,
        dayFeeling: feeling,
        note,
        whatHelped: helped,
        whatGotInWay: inWay,
      });
      await finishDayAction(dayId);
      router.push(`/today/complete?day=${dayNumber}`);
    });
  }

  return (
    <section className="mt-8" aria-labelledby="finish-heading">
      <h2 id="finish-heading" className="text-[19px] sm:text-[20px]">
        Before you finish…
      </h2>
      <p className="text-muted mt-1 mb-3.5 text-sm">How did today feel?</p>

      <PillRow>
        {FEELINGS.map((option) => (
          <Pill
            key={option.value}
            name="feeling"
            label={option.label}
            checked={feeling === option.value}
            onChange={() => setFeeling(option.value)}
          />
        ))}
      </PillRow>

      <Field
        label="Anything you want to remember about today?"
        htmlFor="reflection-note"
        className="mt-6"
      >
        <Textarea
          id="reflection-note"
          rows={3}
          value={note}
          placeholder="What helped? What got in the way?"
          onChange={(event) => setNote(event.target.value)}
        />
      </Field>

      {deepReflection ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="What worked this week?" htmlFor="what-helped">
            <Textarea
              id="what-helped"
              rows={3}
              value={helped}
              onChange={(event) => setHelped(event.target.value)}
            />
          </Field>
          <Field label="What kept getting in the way?" htmlFor="what-in-way">
            <Textarea
              id="what-in-way"
              rows={3}
              value={inWay}
              onChange={(event) => setInWay(event.target.value)}
            />
          </Field>
        </div>
      ) : null}

      <div className="mt-5 flex justify-end">
        <Button onClick={finish} disabled={pending} className="max-sm:w-full">
          {pending ? "Saving…" : "Finish Day"}
          {pending ? null : <ArrowRight className="size-3.5" />}
        </Button>
      </div>
    </section>
  );
}
