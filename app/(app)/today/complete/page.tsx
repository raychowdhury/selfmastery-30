import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { CalmRule, GlassBar } from "@/components/layout/calm-shell";
import { Button } from "@/components/ui/button";
import {
  calculateCurrentStreak,
  calculateDailyCompletion,
  visibleActions,
} from "@/lib/analytics/calculations";
import { requireUserId } from "@/lib/auth";
import { getChallengeContext } from "@/lib/services/context";
import { formatDayDate } from "@/lib/utils/format";

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

  return (
    <div className="calm-in">
      <p className="text-muted mb-0 text-[13px]">
        {formatDayDate(snapshot.date)}
      </p>

      <span className="calm-pop mt-24 grid size-14 place-items-center rounded-full border-[1.5px] border-[var(--color-accent)]">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>

      <h1 className="mt-7 mb-0 text-[32px] leading-[1.15]">
        Day {dayNumber} complete.
      </h1>
      <p className="text-muted mt-3 mb-0 text-[15px] leading-normal">
        {completion.completed} of {completion.required} actions · {minutes}{" "}
        minutes
      </p>

      <div className="mt-12">
        <div className="py-4">
          <div className="heading text-[30px] leading-none">{streak}</div>
          <div className="text-muted mt-2 text-[13px]">
            {streak === 1 ? "day showing up" : "days in a row"}
          </div>
        </div>
        <CalmRule />
      </div>

      <p className="text-muted mt-7 mb-0 text-[14px]">
        {completion.percent === 100
          ? "Come back tomorrow."
          : "Something is better than nothing. Come back tomorrow."}
      </p>

      <GlassBar>
        <Button asChild block>
          <Link href="/progress">Done</Link>
        </Button>
      </GlassBar>
    </div>
  );
}
