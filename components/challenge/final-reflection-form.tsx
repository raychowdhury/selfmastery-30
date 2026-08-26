"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { saveFinalReflectionAction } from "@/actions/challenge";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";

interface FinalReflectionFormProps {
  challengeId: string;
  initial?: { reflection: string; biggestChange: string; nextGoal: string };
  saved: boolean;
}

export function FinalReflectionForm({
  challengeId,
  initial,
  saved,
}: FinalReflectionFormProps) {
  const router = useRouter();
  const [reflection, setReflection] = React.useState(initial?.reflection ?? "");
  const [biggestChange, setBiggestChange] = React.useState(
    initial?.biggestChange ?? ""
  );
  const [nextGoal, setNextGoal] = React.useState(initial?.nextGoal ?? "");
  const [done, setDone] = React.useState(saved);
  const [pending, startTransition] = React.useTransition();

  function submit() {
    startTransition(async () => {
      const result = await saveFinalReflectionAction({
        challengeId,
        reflection,
        biggestChange,
        nextGoal,
      });
      if (result.ok) {
        setDone(true);
        router.refresh();
      }
    });
  }

  return (
    <div className="text-left">
      <Field label="What changed over these 30 days?" htmlFor="final-reflection">
        <Textarea
          id="final-reflection"
          rows={4}
          value={reflection}
          placeholder="The walks are just part of my day now. I don't negotiate with myself anymore."
          onChange={(event) => setReflection(event.target.value)}
        />
      </Field>

      <Field
        label="The single biggest difference"
        htmlFor="biggest-change"
        className="mt-5"
      >
        <Textarea
          id="biggest-change"
          rows={2}
          value={biggestChange}
          onChange={(event) => setBiggestChange(event.target.value)}
        />
      </Field>

      <Field
        label="What comes next?"
        htmlFor="next-goal"
        hint="Optional — it becomes the starting point for your next 30 days."
        className="mt-5"
      >
        <Textarea
          id="next-goal"
          rows={2}
          value={nextGoal}
          onChange={(event) => setNextGoal(event.target.value)}
        />
      </Field>

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={submit} disabled={pending}>
          {pending ? "Saving…" : done ? "Save changes" : "Save my reflection"}
        </Button>
        {done ? (
          <span className="text-[13px] text-[var(--color-neutral-400)]">
            Saved.
          </span>
        ) : null}
      </div>
    </div>
  );
}
