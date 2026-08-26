import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import {
  calculateCurrentStreak,
  calculateDailyCompletion,
  visibleActions,
} from "@/lib/analytics/calculations";
import { requireUserId } from "@/lib/auth";
import { getChallengeContext } from "@/lib/services/context";
import { pluralise } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Day complete" };

export default async function DayCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const userId = await requireUserId();
  const context = await getChallengeContext(userId);
  if (!context) redirect("/today");

  const { day: dayParam } = await searchParams;
  const dayNumber = Number(dayParam) || context.dayNumber;

  const snapshot = context.snapshots.find(
    (candidate) => candidate.dayNumber === dayNumber
  );
  if (!snapshot) redirect("/today");

  const completion = calculateDailyCompletion(snapshot);
  const minutes = visibleActions(snapshot)
    .filter((action) => action.completed)
    .reduce((total, action) => total + action.estimatedMinutes, 0);
  const streak = calculateCurrentStreak(context.snapshots, context.dayNumber);

  const stats: Array<[string, string]> = [
    [`${completion.completed} / ${completion.required}`, "actions completed"],
    [String(minutes), "focused minutes"],
    [pluralise(streak, "day"), "consistency streak"],
  ];

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center py-10 text-center">
      <span className="animate-pop grid size-16 place-items-center rounded-full bg-[var(--color-accent)] sm:size-[72px]">
        <Check
          className="size-8 sm:size-[34px]"
          strokeWidth={2.5}
          color="var(--color-on-accent)"
        />
      </span>

      <h1 className="mt-7 text-[33px] sm:text-[44px]">Day {dayNumber} complete.</h1>

      <dl className="mt-9 flex flex-col gap-5 sm:mt-11 sm:flex-row sm:gap-12">
        {stats.map(([value, label]) => (
          <div key={label}>
            <dt className="sr-only">{label}</dt>
            <dd className="heading m-0 text-[24px] sm:text-[26px]">{value}</dd>
            <p className="mt-1 mb-0 text-[12.5px] text-[var(--color-neutral-500)]">
              {label}
            </p>
          </div>
        ))}
      </dl>

      <p className="text-muted mt-9 mb-0 text-sm sm:mt-10">
        {completion.percent === 100
          ? "You showed up. Come back tomorrow and continue."
          : "Something is better than nothing. Come back tomorrow and continue."}
      </p>

      <Button asChild className="mt-5 px-10 max-sm:w-full">
        <Link href="/today">Done</Link>
      </Button>
    </div>
  );
}
