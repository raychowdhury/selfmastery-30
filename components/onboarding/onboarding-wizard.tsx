"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { createChallengeAction } from "@/actions/challenge";
import { Button } from "@/components/ui/button";
import { Pill, PillRow, Tile, TileGrid } from "@/components/ui/choice";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Rule } from "@/components/ui/rule";
import { Track } from "@/components/ui/track";
import { ONBOARDING_CATEGORIES } from "@/lib/plan/strategies";
import { OBSTACLES } from "@/lib/plan/strategies/shared";
import type { OnboardingInput } from "@/lib/validations/challenge";

const TIME_OPTIONS = [10, 20, 30, 60, 120];

const PREFERRED_TIMES = [
  { value: "MORNING", label: "Morning" },
  { value: "AFTERNOON", label: "Afternoon" },
  { value: "EVENING", label: "Evening" },
  { value: "FLEXIBLE", label: "Flexible" },
] as const;

const DIFFICULTIES = [
  {
    value: "GENTLE",
    label: "Gentle",
    description: "Small actions with low pressure.",
  },
  {
    value: "BALANCED",
    label: "Balanced",
    description: "Meaningful progress without overwhelming you.",
  },
  {
    value: "CHALLENGING",
    label: "Challenging",
    description: "More demanding daily actions.",
  },
] as const;

const TOTAL_STEPS = 7;

interface StrategyHints {
  slug: string;
  goalExamples: string[];
  safetyNote?: string;
}

interface OnboardingWizardProps {
  hints: Record<string, StrategyHints>;
  /** Pre-fill when the user arrived from a template card. */
  initial?: Partial<OnboardingInput>;
  todayIso: string;
}

type Draft = OnboardingInput;

export function OnboardingWizard({
  hints,
  initial,
  todayIso,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  const [draft, setDraft] = React.useState<Draft>({
    category: initial?.category ?? "",
    goal: initial?.goal ?? "",
    whyItMatters: "",
    successDefinition: "",
    availableMinutes: initial?.availableMinutes ?? 30,
    obstacles: [],
    preferredTime: "FLEXIBLE",
    difficulty: initial?.difficulty ?? "BALANCED",
    startDate: todayIso,
  });

  const [customMinutes, setCustomMinutes] = React.useState("");
  const [ownWords, setOwnWords] = React.useState("");

  const patch = (values: Partial<Draft>) =>
    setDraft((current) => ({ ...current, ...values }));

  const hint = hints[draft.category];

  // Move focus to the new question so the flow works without a mouse.
  React.useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const canContinue = (() => {
    switch (step) {
      case 1:
        return draft.category !== "" || ownWords.trim().length > 2;
      case 2:
        return draft.goal.trim().length > 2;
      case 4:
        return draft.availableMinutes >= 5;
      default:
        return true;
    }
  })();

  function next() {
    setError(null);

    if (step === 1 && draft.category === "" && ownWords.trim()) {
      // Free text is a first-class answer, not a fallback: it becomes the goal
      // and routes to the generic strategy.
      patch({ category: "custom", goal: ownWords.trim() });
    }

    if (step === TOTAL_STEPS) {
      void submit();
      return;
    }
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  }

  function back() {
    setError(null);
    if (step === 1) {
      router.push("/");
      return;
    }
    setStep((current) => Math.max(1, current - 1));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await createChallengeAction(draft);
    } catch (thrown) {
      // A redirect from a server action surfaces as a thrown control-flow
      // signal; anything else is a real failure worth showing.
      if (
        thrown &&
        typeof thrown === "object" &&
        "digest" in thrown &&
        String((thrown as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
      ) {
        throw thrown;
      }
      setSubmitting(false);
      setError(
        thrown instanceof Error
          ? thrown.message
          : "Something went wrong building your plan."
      );
    }
  }

  const minutesLeft = Math.max(1, Math.ceil((TOTAL_STEPS - step + 1) / 5));

  return (
    <div className="w-full max-w-[660px]">
      <div className="flex items-center justify-between">
        <span className="text-muted text-[12px]">
          Step {step} of {TOTAL_STEPS}
        </span>
        <span className="text-[12px] text-[var(--color-neutral-600)]">
          About {minutesLeft} minute{minutesLeft === 1 ? "" : "s"} left
        </span>
      </div>

      <Track
        value={(step / TOTAL_STEPS) * 100}
        label={`Onboarding progress: step ${step} of ${TOTAL_STEPS}`}
        className="mt-2.5 h-[2px]"
      />

      <div className="mt-9 sm:mt-11">
        {step === 1 ? (
          <Step
            headingRef={headingRef}
            title="What would make the next 30 days meaningful for you?"
            subtitle="Pick one area. You can always change it later."
          >
            <TileGrid columns={4}>
              {ONBOARDING_CATEGORIES.map((category) => (
                <Tile
                  key={category.slug}
                  name="category"
                  label={category.label}
                  description={category.description}
                  checked={draft.category === category.slug}
                  onChange={() => {
                    setOwnWords("");
                    patch({ category: category.slug });
                  }}
                />
              ))}
            </TileGrid>

            <Rule className="my-8" />

            <Field label="Or describe it yourself" htmlFor="own-words">
              <Input
                id="own-words"
                value={ownWords}
                placeholder="I want to feel less tired in the afternoons…"
                className="min-h-[44px]"
                onChange={(event) => {
                  setOwnWords(event.target.value);
                  if (event.target.value) patch({ category: "" });
                }}
              />
            </Field>
          </Step>
        ) : null}

        {step === 2 ? (
          <Step
            headingRef={headingRef}
            title="What specifically do you want to accomplish?"
            subtitle="One sentence in your own words. Specific beats impressive."
          >
            <Field label="Your goal" htmlFor="goal">
              <Input
                id="goal"
                value={draft.goal}
                placeholder={hint?.goalExamples[0] ?? "Describe your goal"}
                className="min-h-[44px]"
                onChange={(event) => patch({ goal: event.target.value })}
              />
            </Field>

            {hint?.goalExamples.length ? (
              <div className="mt-5">
                <p className="text-muted mb-2 text-[12.5px]">For example:</p>
                <PillRow>
                  {hint.goalExamples.map((example) => (
                    <button
                      key={example}
                      type="button"
                      className="pill text-left"
                      onClick={() => patch({ goal: example })}
                    >
                      {example}
                    </button>
                  ))}
                </PillRow>
              </div>
            ) : null}

            {hint?.safetyNote ? <SafetyNote note={hint.safetyNote} /> : null}
          </Step>
        ) : null}

        {step === 3 ? (
          <Step
            headingRef={headingRef}
            title="Why does this matter to you?"
            subtitle="Optional — but we'll show this back to you on the days it gets hard."
          >
            <Field label="In your own words" htmlFor="why">
              <Textarea
                id="why"
                rows={4}
                value={draft.whyItMatters}
                placeholder="I want more energy and to feel better about myself."
                onChange={(event) => patch({ whyItMatters: event.target.value })}
              />
            </Field>
          </Step>
        ) : null}

        {step === 4 ? (
          <Step
            headingRef={headingRef}
            title="How much time can you realistically give this each day?"
            subtitle="Realistically. Pick the amount you could still manage on a bad day."
          >
            <TileGrid columns={3}>
              {TIME_OPTIONS.map((minutes) => (
                <Tile
                  key={minutes}
                  name="minutes"
                  label={minutes >= 60 ? `${minutes / 60} hour${minutes > 60 ? "s" : ""}` : `${minutes} minutes`}
                  checked={draft.availableMinutes === minutes && customMinutes === ""}
                  onChange={() => {
                    setCustomMinutes("");
                    patch({ availableMinutes: minutes });
                  }}
                />
              ))}
            </TileGrid>

            <Field label="Or set your own (minutes)" htmlFor="custom-minutes" className="mt-6 max-w-[220px]">
              <Input
                id="custom-minutes"
                type="number"
                min={5}
                max={240}
                value={customMinutes}
                placeholder="45"
                onChange={(event) => {
                  setCustomMinutes(event.target.value);
                  const parsed = Number(event.target.value);
                  if (Number.isFinite(parsed) && parsed >= 5) {
                    patch({ availableMinutes: Math.min(240, Math.round(parsed)) });
                  }
                }}
              />
            </Field>
          </Step>
        ) : null}

        {step === 5 ? (
          <Step
            headingRef={headingRef}
            title="What usually gets in your way?"
            subtitle="Pick as many as apply. We'll build around them, not pretend they don't exist."
          >
            <PillRow>
              {OBSTACLES.map((obstacle) => (
                <Pill
                  key={obstacle.slug}
                  control="checkbox"
                  name="obstacles"
                  label={obstacle.label}
                  checked={draft.obstacles.includes(obstacle.slug)}
                  onChange={(event) =>
                    patch({
                      obstacles: event.target.checked
                        ? [...draft.obstacles, obstacle.slug]
                        : draft.obstacles.filter((slug) => slug !== obstacle.slug),
                    })
                  }
                />
              ))}
            </PillRow>
          </Step>
        ) : null}

        {step === 6 ? (
          <Step
            headingRef={headingRef}
            title="When will you do it, and how hard should it feel?"
            subtitle="Both of these shape the plan you get."
          >
            <fieldset className="border-0 p-0">
              <legend className="label-caps mb-3">When are you most likely to work on this?</legend>
              <PillRow>
                {PREFERRED_TIMES.map((option) => (
                  <Pill
                    key={option.value}
                    name="preferred-time"
                    label={option.label}
                    checked={draft.preferredTime === option.value}
                    onChange={() => patch({ preferredTime: option.value })}
                  />
                ))}
              </PillRow>
            </fieldset>

            <Rule className="my-8" />

            <fieldset className="border-0 p-0">
              <legend className="label-caps mb-3">How challenging should your plan feel?</legend>
              <TileGrid columns={3}>
                {DIFFICULTIES.map((option) => (
                  <Tile
                    key={option.value}
                    name="difficulty"
                    label={option.label}
                    description={option.description}
                    checked={draft.difficulty === option.value}
                    onChange={() => patch({ difficulty: option.value })}
                  />
                ))}
              </TileGrid>
            </fieldset>
          </Step>
        ) : null}

        {step === 7 ? (
          <Step
            headingRef={headingRef}
            title="What would make Day 30 feel successful?"
            subtitle="Something you could actually check. Vague goals are the ones that quietly disappear."
          >
            <Field label="Day 30 looks like…" htmlFor="success">
              <Textarea
                id="success"
                rows={3}
                value={draft.successDefinition}
                placeholder="I can consistently walk 30 minutes, five days a week."
                onChange={(event) =>
                  patch({ successDefinition: event.target.value })
                }
              />
            </Field>

            <Field
              label="Start date"
              htmlFor="start-date"
              hint="Today is usually the right answer."
              className="mt-6 max-w-[220px]"
            >
              <Input
                id="start-date"
                type="date"
                value={draft.startDate}
                min={todayIso}
                onChange={(event) => patch({ startDate: event.target.value })}
              />
            </Field>
          </Step>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mt-6 mb-0 text-[13px] text-[#d38b80]">
          {error}
        </p>
      ) : null}

      <div className="mt-9 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="quiet" onClick={back} disabled={submitting}>
          ← Back
        </Button>
        <Button
          onClick={next}
          disabled={!canContinue || submitting}
          className="px-6 max-sm:w-full"
        >
          {submitting
            ? "Building your plan…"
            : step === TOTAL_STEPS
              ? "Build my plan"
              : "Continue"}
          {submitting ? null : <ArrowRight className="size-3.5" />}
        </Button>
      </div>
    </div>
  );
}

function Step({
  title,
  subtitle,
  children,
  headingRef,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <div className="animate-fade-up">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-pretty text-[25px] outline-none sm:text-[32px]"
      >
        {title}
      </h1>
      {subtitle ? (
        <p className="text-muted mt-2.5 text-sm">{subtitle}</p>
      ) : null}
      <div className="mt-7">{children}</div>
    </div>
  );
}

function SafetyNote({ note }: { note: string }) {
  return (
    <p className="mt-6 mb-0 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4 text-[12.5px] leading-relaxed text-[var(--color-neutral-400)]">
      {note}
    </p>
  );
}
