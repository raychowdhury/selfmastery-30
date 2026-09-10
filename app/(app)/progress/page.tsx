import Link from "next/link";
import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

import {
  ThirtyDayGrid,
  type DayStatus,
  type GridDay,
} from "@/components/progress/thirty-day-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { Rule } from "@/components/ui/rule";
import { calculateDailyCompletion } from "@/lib/analytics/calculations";
import { requireUserId } from "@/lib/auth";
import { getChallengeContext } from "@/lib/services/context";

export const metadata: Metadata = { title: "Your 30 days" };

export default async function ProgressPage() {
  const userId = await requireUserId();
  const context = await getChallengeContext(userId);

  if (!context) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Your progress will appear here"
        description="Complete your first few days and we'll start showing patterns."
        actionLabel="Start My 30 Days"
        actionHref="/onboarding"
        className="mt-10"
      />
    );
  }

  const { challenge, snapshots, stats, dayNumber } = context;

  const byDay = new Map(snapshots.map((s) => [s.dayNumber, s]));

  const days: GridDay[] = Array.from(
    { length: challenge.lengthDays },
    (_, i) => {
      const n = i + 1;
      const snapshot = byDay.get(n);

      if (n > dayNumber || !snapshot) {
        return { n, status: "future", statusLabel: "Upcoming", detail: "3 actions planned" };
      }

      const completion = calculateDailyCompletion(snapshot);
      const minutes = snapshot.actions
        .filter((a) => a.completed)
        .reduce((total, a) => total + a.estimatedMinutes, 0);

      if (n === dayNumber) {
        return {
          n,
          status: "today",
          statusLabel: "Today",
          detail: `${completion.completed} of ${completion.required} actions so far`,
        };
      }

      const actionsLine = `${completion.completed} of ${completion.required} actions · ${minutes} min`;
      let status: DayStatus;
      let statusLabel: string;
      let detail: string;

      if (snapshot.isMinimumDay) {
        status = "minimum";
        statusLabel = "Minimum day";
        detail = actionsLine;
      } else if (completion.percent === 100) {
        status = "done";
        statusLabel = "Complete";
        detail = actionsLine;
      } else if (completion.percent > 0) {
        status = "partial";
        statusLabel = "Partial";
        detail = actionsLine;
      } else {
        status = "miss";
        statusLabel = "Missed";
        detail = "Nothing logged. You came back.";
      }

      return { n, status, statusLabel, detail };
    }
  );

  // Week 1 is done once day 8 begins; point at the review, as the prototype does.
  const completedWeek = Math.min(Math.floor((dayNumber - 1) / 7), 4);

  return (
    <div>
      <h1 className="text-[26px] leading-[1.2]">Your 30 days</h1>
      <p className="text-muted mt-2 mb-0 text-[14px]">
        Progress is about returning, not perfection.
      </p>

      <div className="mt-9">
        <ThirtyDayGrid days={days} initialSelected={dayNumber} />
      </div>

      <Rule className="mt-9 mb-0" />

      <dl className="mt-7 grid grid-cols-2 gap-6">
        <div className="m-0">
          <dd className="heading m-0 text-[30px] leading-none">
            {stats.activeDays}
          </dd>
          <dt className="text-muted mt-2 text-[13px]">days completed</dt>
        </div>
        <div className="m-0">
          <dd className="heading m-0 text-[30px] leading-none">
            {stats.currentStreak}
          </dd>
          <dt className="text-muted mt-2 text-[13px]">days in a row</dt>
        </div>
      </dl>

      {completedWeek >= 1 ? (
        <div className="mt-10 flex items-center justify-between gap-3">
          <span className="text-muted text-[13.5px]">
            Week {completedWeek} is done.
          </span>
          <Link
            href={`/reviews/${completedWeek}`}
            className="text-[14px] no-underline hover:underline"
          >
            Reflect on it
          </Link>
        </div>
      ) : null}
    </div>
  );
}
