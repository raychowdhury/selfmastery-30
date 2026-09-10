"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { saveWeeklyReviewAction } from "@/actions/challenge";
import { GlassBar } from "@/components/layout/calm-shell";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";

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

/** Rounded outline chip — selection shows as ink, not accent shouting. */
function Chip({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className="min-h-11 cursor-pointer rounded-[14px] border bg-transparent px-4 py-2 text-[14px] transition-colors"
      style={{
        borderColor: checked ? "var(--color-text)" : "var(--color-divider)",
        color: checked
          ? "var(--color-text)"
          : "color-mix(in srgb, var(--color-text) 60%, transparent)",
      }}
    >
      {label}
    </button>
  );
}

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

      <fieldset className="mt-7 border-0 p-0">
        <legend className="mb-3 text-[15px]">What got in your way?</legend>
        <div className="flex flex-wrap gap-2">
          {OBSTACLE_CHIPS.map((chip) => (
            <Chip
              key={chip}
              label={chip}
              checked={obstacles.includes(chip)}
              onClick={() =>
                setObstacles((current) =>
                  current.includes(chip)
                    ? current.filter((item) => item !== chip)
                    : [...current, chip]
                )
              }
            />
          ))}
        </div>
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

      <fieldset className="mt-7 border-0 p-0">
        <legend className="mb-3 text-[15px]">
          How did the difficulty feel?
        </legend>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              checked={difficulty === option.value}
              onClick={() => setDifficulty(option.value)}
            />
          ))}
        </div>
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

      <GlassBar>
        <Button block onClick={submit} disabled={pending}>
          {pending
            ? "Adjusting your plan…"
            : isFinalWeek
              ? "Finish my 30 days"
              : `Prepare week ${weekNumber + 1}`}
        </Button>
      </GlassBar>
    </div>
  );
}
