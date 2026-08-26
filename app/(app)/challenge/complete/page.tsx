import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { FinalReflectionForm } from "@/components/challenge/final-reflection-form";
import { Button } from "@/components/ui/button";
import { calculateDailyCompletion } from "@/lib/analytics/calculations";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getChallengeContext } from "@/lib/services/context";
import { pluralise } from "@/lib/utils/format";

export const metadata: Metadata = { title: "You finished what you started" };

export default async function ChallengeCompletePage() {
  const userId = await requireUserId();
  const context = await getChallengeContext(userId);
  if (!context) redirect("/onboarding");

  const { challenge, snapshots, stats, dayNumber } = context;

  const existing = await prisma.finalReflection.findUnique({
    where: { challengeId: challenge.id },
  });

  const bars = snapshots.map((snapshot) => ({
    day: snapshot.dayNumber,
    percent:
      snapshot.dayNumber > dayNumber
        ? -1
        : calculateDailyCompletion(snapshot).percent,
  }));

  const figures: Array<[string, string]> = [
    [String(stats.activeDays), "Active days"],
    [`${stats.overallCompletion}%`, "Overall consistency"],
    [String(stats.actionsCompleted), "Actions completed"],
    [String(stats.perfectDays), "Perfect days"],
    [pluralise(stats.longestStreak, "day"), "Longest streak"],
  ];

  return (
    <div className="celebration -mx-5 -mt-1 rounded-none px-5 py-14 text-center sm:-mx-8 sm:rounded-[var(--radius-lg)] sm:px-10 sm:py-20 lg:-mx-16">
      <div className="heading text-[13px] tracking-[0.14em] text-[var(--color-accent-300)] sm:text-[15px]">
        {dayNumber} / {challenge.lengthDays}
      </div>

      <h1 className="mx-auto mt-4 max-w-[15ch] text-pretty text-[36px] sm:mt-5 sm:text-[54px]">
        You finished what you started.
      </h1>

      <p className="mt-4 mb-0 text-[15px] text-[var(--color-accent-2-300)] sm:text-[16px]">
        Thirty days ago you decided to {lowerFirst(challenge.goal)}.
      </p>

      <dl className="mx-auto mt-11 grid max-w-[640px] grid-cols-2 gap-x-8 gap-y-6 sm:mt-16 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-14">
        {figures.map(([value, label]) => (
          <div key={label}>
            <dt className="sr-only">{label}</dt>
            <dd className="heading m-0 text-[27px] sm:text-[34px]">{value}</dd>
            <p className="mt-1 mb-0 text-[11.5px] text-[var(--color-accent-2-300)] sm:text-[12.5px]">
              {label}
            </p>
          </div>
        ))}
      </dl>

      <div className="mx-auto mt-12 w-full max-w-[640px] sm:mt-16">
        <div className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.1em] text-[var(--color-accent-2-400)] sm:text-[11px]">
          <span>Day 1</span>
          <span>Day {challenge.lengthDays}</span>
        </div>
        <div className="mt-2.5 flex gap-[3px] sm:gap-1" aria-hidden>
          {bars.map((bar) => (
            <div
              key={bar.day}
              className="h-[26px] flex-1 rounded-[3px]"
              style={{
                background:
                  bar.percent < 0 || bar.percent === 0
                    ? "var(--color-section-ghost)"
                    : bar.percent === 100
                      ? "var(--color-accent)"
                      : "var(--color-accent-600)",
              }}
            />
          ))}
        </div>
        <p className="sr-only">
          {stats.activeDays} of {challenge.lengthDays} days were active.
        </p>
      </div>

      <section className="mx-auto mt-12 w-full max-w-[640px] rounded-[var(--radius-lg)] border border-[color-mix(in_srgb,var(--color-accent)_25%,transparent)] bg-[color-mix(in_srgb,var(--color-bg)_55%,transparent)] p-5 text-left sm:mt-16 sm:p-7">
        <h2 className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-accent-300)]">
          What changed?
        </h2>

        {challenge.whyItMatters ? (
          <div className="mt-3.5">
            <div className="text-[12px] text-[var(--color-accent-2-400)]">
              Day 1 — why it mattered
            </div>
            <p className="mt-1.5 mb-0 text-sm">“{challenge.whyItMatters}”</p>
          </div>
        ) : null}

        {challenge.successDefinition ? (
          <div className="mt-4">
            <div className="text-[12px] text-[var(--color-accent-2-400)]">
              Day 1 — what success looked like
            </div>
            <p className="mt-1.5 mb-0 text-sm">{challenge.successDefinition}</p>
          </div>
        ) : null}

        <div className="mt-6">
          <FinalReflectionForm
            challengeId={challenge.id}
            saved={Boolean(existing)}
            initial={
              existing
                ? {
                    reflection: existing.reflection ?? "",
                    biggestChange: existing.biggestChange ?? "",
                    nextGoal: existing.nextGoal ?? "",
                  }
                : undefined
            }
          />
        </div>
      </section>

      <div className="mt-11 flex flex-col items-center gap-3 sm:mt-14 sm:flex-row sm:justify-center sm:gap-4">
        <Button asChild size="lg" className="max-sm:w-full">
          <Link href="/onboarding?restart=1">Start My Next 30 Days</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/calendar">Review my journey</Link>
        </Button>
      </div>
    </div>
  );
}

/** Lowercases the first letter so a sentence can follow "Because ".
 *  Left alone for acronyms and for a single-letter first word, which is almost
 *  always "I" — "Because i want more energy" reads as a typo. */
function lowerFirst(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (trimmed[0] !== trimmed[0].toUpperCase()) return trimmed;
  if (trimmed[1] === trimmed[1]?.toUpperCase() && trimmed[1] !== " ") return trimmed;
  if (trimmed[1] === " " || trimmed.length === 1) return trimmed;
  return trimmed[0].toLowerCase() + trimmed.slice(1);
}
