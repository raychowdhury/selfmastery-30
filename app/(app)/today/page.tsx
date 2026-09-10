import Link from "next/link";
import type { Metadata } from "next";

import { CalmRule } from "@/components/layout/calm-shell";
import { ActionRow } from "@/components/today/action-row";
import { TodayBar } from "@/components/today/today-bar";
import { EmptyState } from "@/components/ui/empty-state";
import {
  calculateDailyCompletion,
  effectiveAction,
} from "@/lib/analytics/calculations";
import { requireUserId } from "@/lib/auth";
import { getTodayContext } from "@/lib/services/context";
import { formatDayDate } from "@/lib/utils/format";
import { Target } from "lucide-react";

export const metadata: Metadata = { title: "Today" };

export default async function TodayPage() {
  const userId = await requireUserId();
  const context = await getTodayContext(userId);

  if (!context) {
    return (
      <EmptyState
        icon={Target}
        title="What would you like to change over the next 30 days?"
        description="One goal, thirty days, a few small actions each day. Setup takes about two minutes."
        actionLabel="Start My 30 Days"
        actionHref="/onboarding"
        className="mt-10"
      />
    );
  }

  const { challenge, day, dayNumber, isOver, reviewDue } = context;

  // The plan the user is actually being asked for today: on a Minimum Day the
  // reduced versions replace the originals and optional extras drop away.
  const actions = (
    day.isMinimumDay
      ? day.actions.filter((action) => !action.optional)
      : day.actions
  ).map((action) => {
    const shown = effectiveAction(
      {
        id: action.id,
        pillarId: action.pillarId,
        title: action.title,
        completed: action.completed,
        optional: action.optional,
        estimatedMinutes: action.estimatedMinutes,
        minimumVersionTitle: action.minimumVersionTitle,
        minimumVersionMinutes: action.minimumVersionMinutes,
      },
      day.isMinimumDay
    );

    return {
      id: action.id,
      title: shown.title,
      minutes: shown.estimatedMinutes,
      optional: action.optional,
      completed: action.completed,
    };
  });

  const completion = calculateDailyCompletion({
    dayNumber: day.dayNumber,
    date: day.date,
    isMinimumDay: day.isMinimumDay,
    completedAt: day.completedAt,
    actions: day.actions.map((action) => ({
      id: action.id,
      pillarId: action.pillarId,
      title: action.title,
      completed: action.completed,
      optional: action.optional,
      estimatedMinutes: action.estimatedMinutes,
      minimumVersionTitle: action.minimumVersionTitle,
      minimumVersionMinutes: action.minimumVersionMinutes,
    })),
  });

  const remaining = completion.required - completion.completed;
  const progressLabel =
    remaining === 0
      ? "You showed up today."
      : remaining === 1
        ? "One more to go."
        : `${remaining} left for today.`;

  // Original → reduced pairs for the Minimum Day sheet.
  const reductions = day.actions
    .filter((action) => !action.optional && action.minimumVersionTitle)
    .map((action) => ({
      from: action.title,
      to: action.minimumVersionTitle as string,
    }));

  return (
    <div className="calm-in">
      {isOver ? (
        <p className="mb-6 text-[14px]">
          Your 30 days are complete.{" "}
          <Link href="/challenge/complete">See how it went</Link>
        </p>
      ) : reviewDue ? (
        <p className="mb-6 text-[14px]">
          Week {reviewDue} is done.{" "}
          <Link href={`/reviews/${reviewDue}`}>Reflect on it</Link>
        </p>
      ) : null}

      <p className="text-muted mb-0 text-[13px]">
        {formatDayDate(day.date)}
        {day.isMinimumDay ? " · Minimum day" : ""}
      </p>
      <h1 className="mt-2.5 mb-0 text-[30px] leading-[1.15]">
        Day {dayNumber} of {challenge.lengthDays}
      </h1>
      <p className="text-muted mt-2 mb-0 text-[14px]">
        <Link
          href="/challenge"
          className="text-inherit no-underline hover:underline"
        >
          {challenge.goal}
        </Link>
      </p>

      <ul className="m-0 mt-12 list-none p-0">
        {actions.map((action) => (
          <ActionRow key={action.id} action={action} />
        ))}
      </ul>

      <p className="text-muted mt-7 mb-0 text-[13px]">{progressLabel}</p>

      <TodayBar
        dayId={day.id}
        dayNumber={dayNumber}
        isMinimumDay={day.isMinimumDay}
        reductions={reductions}
        initialFeeling={day.reflection?.dayFeeling ?? null}
        initialNote={day.reflection?.note ?? ""}
      />
    </div>
  );
}
