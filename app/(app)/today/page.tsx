import Link from "next/link";
import type { Metadata } from "next";

import { ActionRow } from "@/components/today/action-row";
import { FinishDay } from "@/components/today/finish-day";
import { MinimumDayDialog } from "@/components/today/minimum-day-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/card";
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
      description: null,
      minutes: shown.estimatedMinutes,
      pillarName: null,
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

  // The biggest action of the day, shown as the before/after in the dialog.
  const heaviest = [...day.actions]
    .filter((action) => !action.optional && action.minimumVersionTitle)
    .sort((a, b) => b.estimatedMinutes - a.estimatedMinutes)[0];

  return (
    <div>
      {isOver ? (
        <Panel className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="mb-0 flex-1 text-sm">
            Your 30 days are complete. There is one last thing worth doing.
          </p>
          <Button asChild size="sm">
            <Link href="/challenge/complete">See how it went</Link>
          </Button>
        </Panel>
      ) : null}

      {reviewDue ? (
        <Panel className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="mb-0 flex-1 text-sm">
            Week {reviewDue} is done. Two minutes of looking back shapes next
            week&apos;s plan.
          </p>
          <Button asChild size="sm">
            <Link href={`/reviews/${reviewDue}`}>Start the review</Link>
          </Button>
        </Panel>
      ) : null}

      <header>
        <p className="text-muted mb-0 text-[12.5px] sm:text-[13px]">
          {formatDayDate(day.date)}
          {day.isMinimumDay ? " · Minimum day" : null}
        </p>

        <h1 className="mt-2.5 mb-0 text-[30px] leading-[1.15]">
          Day {dayNumber} of {challenge.lengthDays}
        </h1>

        <p className="text-muted mt-2 mb-0 text-[14px]">{challenge.goal}</p>
      </header>

      <section className="mt-12" aria-label="Today's actions">
        <ul className="m-0 list-none p-0">
          {actions.map((action) => (
            <ActionRow key={action.id} action={action} />
          ))}
        </ul>

        <p className="text-muted mt-7 mb-0 text-[13px]">{progressLabel}</p>
      </section>

      {/* The two closing actions the prototype pins to the bottom of the frame:
          the minimum-day escape hatch, then finishing the day. */}
      <div className="mt-12">
        <MinimumDayDialog
          dayId={day.id}
          isMinimumDay={day.isMinimumDay}
          preview={
            heaviest?.minimumVersionTitle
              ? { from: heaviest.title, to: heaviest.minimumVersionTitle }
              : null
          }
        />

        <FinishDay dayId={day.id} dayNumber={dayNumber} />
      </div>
    </div>
  );
}
