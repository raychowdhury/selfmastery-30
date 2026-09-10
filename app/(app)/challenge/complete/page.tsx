import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { FinalReflectionForm } from "@/components/challenge/final-reflection-form";
import { CalmRule, GlassBar } from "@/components/layout/calm-shell";
import { Button } from "@/components/ui/button";
import { calculateDailyCompletion } from "@/lib/analytics/calculations";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getChallengeContext } from "@/lib/services/context";

export const metadata: Metadata = { title: "You finished what you started" };

export default async function ChallengeCompletePage() {
  const userId = await requireUserId();
  const context = await getChallengeContext(userId);
  if (!context) redirect("/onboarding");

  const { challenge, snapshots, stats, dayNumber } = context;

  const existing = await prisma.finalReflection.findUnique({
    where: { challengeId: challenge.id },
  });

  // One dot per day: filled when anything was done, outlined otherwise.
  const record = snapshots.map((snapshot) => ({
    day: snapshot.dayNumber,
    active:
      snapshot.dayNumber <= dayNumber &&
      calculateDailyCompletion(snapshot).percent > 0,
  }));

  return (
    <div className="calm-in">
      <p className="text-muted mb-0 text-[12px] tracking-[0.12em] uppercase">
        {Math.min(dayNumber, challenge.lengthDays)} of {challenge.lengthDays}
      </p>

      <h1 className="mt-4 mb-0 text-pretty text-[32px] leading-[1.15]">
        You finished what you started.
      </h1>

      <p className="text-muted mt-3 mb-0 text-[15px] leading-normal">
        Thirty days ago you decided to {lowerFirst(challenge.goal)}.
      </p>

      <div
        className="mt-10 grid grid-cols-10 gap-2.5"
        role="img"
        aria-label={`${stats.activeDays} of ${challenge.lengthDays} days were active.`}
      >
        {record.map((dot) => (
          <span
            key={dot.day}
            className="block size-2.5 rounded-full"
            style={{
              background: dot.active ? "var(--color-accent)" : "transparent",
              border: `1px solid ${
                dot.active
                  ? "var(--color-accent)"
                  : "color-mix(in srgb, var(--color-text) 30%, transparent)"
              }`,
            }}
          />
        ))}
      </div>
      <p className="text-muted mt-3 mb-0 text-[13px]">
        {stats.activeDays} active days · {stats.longestStreak} in a row at most
      </p>

      <div className="mt-10 flex flex-col">
        {challenge.whyItMatters ? (
          <>
            <div className="py-4">
              <div className="text-muted text-[12px] tracking-[0.08em] uppercase">
                Day 1
              </div>
              <p className="mt-1.5 mb-0 text-[15px] leading-normal">
                “{challenge.whyItMatters}”
              </p>
            </div>
            <CalmRule />
          </>
        ) : null}

        <div className="py-4">
          <div className="text-muted text-[12px] tracking-[0.08em] uppercase">
            Day {challenge.lengthDays}
          </div>
          <div className="mt-2">
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
        </div>
      </div>

      <GlassBar>
        <Button asChild block>
          <Link href="/onboarding?restart=1">Start my next 30 days</Link>
        </Button>
        <Button asChild block variant="ghost">
          <Link href="/progress">Review my journey</Link>
        </Button>
      </GlassBar>
    </div>
  );
}

/** Lowercases the first letter so a sentence can follow "decided to ".
 *  Left alone for acronyms and for a single-letter first word, which is almost
 *  always "I" — "decided to i want more energy" reads as a typo. */
function lowerFirst(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (trimmed[0] !== trimmed[0].toUpperCase()) return trimmed;
  if (trimmed[1] === trimmed[1]?.toUpperCase() && trimmed[1] !== " ") return trimmed;
  if (trimmed[1] === " " || trimmed.length === 1) return trimmed;
  return trimmed[0].toLowerCase() + trimmed.slice(1);
}
