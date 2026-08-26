"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { saveWeeklyReviewAction } from "@/actions/challenge";
import { Button } from "@/components/ui/button";
import { Pill, PillRow } from "@/components/ui/choice";
import { Field, Textarea } from "@/components/ui/input";
import { Rule } from "@/components/ui/rule";

const OBSTACLE_CHIPS = [
  "Time",
  "Motivation",
  "Phone",
  "Work",
  "Family",
  "Energy",
  "Other",
];

const DIFFICULTIES = [
  { value: "TOO_EASY", label: "Too easy" },
  { value: "ABOUT_RIGHT", label: "About right" },
  { value: "TOO_DIFFICULT", label: "Too difficult" },
] as const;

type Feedback = (typeof DIFFICULTIES)[number]["value"];

interface WeeklyReviewFormProps {
  challengeId: string;
  weekNumber: number;
  isFinalWeek: boolean;
  initial?: {
    wentWell: string;
    struggledWith: string;
    mainObstacle: string[];
    difficultyFeedback: Feedback | null;
    nextWeekChange: string;
  };
}

export function WeeklyReviewForm({
  challengeId,
  weekNumber,
  isFinalWeek,
  initial,
}: WeeklyReviewFormProps) {
  const router = useRouter();
  const [wentWell, setWentWell] = React.useState(initial?.wentWell ?? "");
  const [struggledWith, setStruggledWith] = React.useState(
    initial?.struggledWith ?? ""
  );
  const [obstacles, setObstacles] = React.useState<string[]>(
    initial?.mainObstacle ?? []
  );
  const [difficulty, setDifficulty] = React.useState<Feedback>(
    initial?.difficultyFeedback ?? "ABOUT_RIGHT"
  );
  const [nextWeekChange, setNextWeekChange] = React.useState(
    initial?.nextWeekChange ?? ""
  );
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await saveWeeklyReviewAction({
        challengeId,
        weekNumber,
        wentWell,
        struggledWith,
        mainObstacle: obstacles,
        difficultyFeedback: difficulty,
        nextWeekChange,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(isFinalWeek ? "/challenge/complete" : "/reviews");
      router.refresh();
    });
  }

  return (
    <div>
      <Field label="What went well?" htmlFor="went-well" className="mt-9">
        <Textarea
          id="went-well"
          rows={3}
          value={wentWell}
          placeholder="Even small wins count here."
          onChange={(event) => setWentWell(event.target.value)}
        />
      </Field>

      <fieldset className="mt-8 border-0 p-0">
        <legend className="heading mb-3 text-[15px]">
          What got in your way?
        </legend>
        <PillRow>
          {OBSTACLE_CHIPS.map((chip) => (
            <Pill
              key={chip}
              control="checkbox"
              name="obstacles"
              label={chip}
              checked={obstacles.includes(chip)}
              onChange={(event) =>
                setObstacles((current) =>
                  event.target.checked
                    ? [...current, chip]
                    : current.filter((item) => item !== chip)
                )
              }
            />
          ))}
        </PillRow>
      </fieldset>

      <Field
        label="Anything else about what made it hard?"
        htmlFor="struggled"
        className="mt-6"
      >
        <Textarea
          id="struggled"
          rows={2}
          value={struggledWith}
          onChange={(event) => setStruggledWith(event.target.value)}
        />
      </Field>

      <fieldset className="mt-8 border-0 p-0">
        <legend className="heading mb-3 text-[15px]">
          How did this week&apos;s difficulty feel?
        </legend>
        <PillRow>
          {DIFFICULTIES.map((option) => (
            <Pill
              key={option.value}
              name="difficulty"
              label={option.label}
              checked={difficulty === option.value}
              onChange={() => setDifficulty(option.value)}
            />
          ))}
        </PillRow>
        <p className="text-muted mt-3 mb-0 text-[12.5px]">
          This is what adjusts next week&apos;s plan. Nothing already completed
          will change.
        </p>
      </fieldset>

      <Field
        label="What should change next week?"
        htmlFor="next-change"
        hint="One adjustment is enough."
        className="mt-8"
      >
        <Textarea
          id="next-change"
          rows={3}
          value={nextWeekChange}
          onChange={(event) => setNextWeekChange(event.target.value)}
        />
      </Field>

      {error ? (
        <p role="alert" className="mt-5 mb-0 text-[13px] text-[#d38b80]">
          {error}
        </p>
      ) : null}

      <Rule className="mt-9" />

      <div className="mt-6 flex justify-end">
        <Button onClick={submit} disabled={pending} className="max-sm:w-full">
          {pending
            ? "Adjusting your plan…"
            : isFinalWeek
              ? "Finish my 30 days"
              : `Prepare Week ${weekNumber + 1}`}
          {pending ? null : <ArrowRight className="size-3.5" />}
        </Button>
      </div>
    </div>
  );
}
