import Link from "next/link";
import type { Metadata } from "next";

import { ActionRow } from "@/components/today/action-row";
import { FinishDay } from "@/components/today/finish-day";
import { MinimumDayDialog } from "@/components/today/minimum-day-dialog";
import { Priorities } from "@/components/today/priorities";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/card";
import { Rule } from "@/components/ui/rule";
import { Tag } from "@/components/ui/tag";
import { Track } from "@/components/ui/track";
import {
  calculateDailyCompletion,
  effectiveAction,
} from "@/lib/analytics/calculations";
import { requireUserId } from "@/lib/auth";
import { isReviewDay, phaseLabel } from "@/lib/challenge/phases";
import { renderCopy } from "@/lib/challenge/render";
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

  const { challenge, day, dayNumber, pillarNames, isOver, reviewDue } = context;

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
      description: day.isMinimumDay || !action.description
        ? null
        : renderCopy(action.description, action.estimatedMinutes),
      minutes: shown.estimatedMinutes,
      pillarName: action.pillarId
        ? (pillarNames.get(action.pillarId) ?? null)
        : null,
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
      ? "You showed up."
      : remaining === 1
        ? "One more action to complete today."
        : `${remaining} more actions to complete today.`;

  // The biggest action of the day, shown as the before/after in the dialog.
  const heaviest = [...day.actions]
    .filter((action) => !action.optional && action.minimumVersionTitle)
    .sort((a, b) => b.estimatedMinutes - a.estimatedMinutes)[0];

  const topPriority = day.priorities.find((priority) => !priority.completed);

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
        </p>

        <div className="mt-2 flex flex-wrap items-end gap-3">
          <h1 className="mb-0 text-[30px] sm:text-[40px]">
            Day {dayNumber} of {challenge.lengthDays}
          </h1>
          <Tag variant="accent" className="mb-1.5">
            {phaseLabel(day.phase)} Phase
          </Tag>
          {day.isMinimumDay ? (
            <Tag variant="neutral" className="mb-1.5">
              Minimum Day
            </Tag>
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Track
            value={(dayNumber / challenge.lengthDays) * 100}
            label={`Day ${dayNumber} of ${challenge.lengthDays}`}
            className="flex-1"
          />
          <span className="text-muted shrink-0 text-[12px]">
            {dayNumber} / {challenge.lengthDays}
          </span>
        </div>
      </header>

      <Panel className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="eyebrow">Your 30-day goal</div>
          <div className="heading mt-1 text-[15px] sm:text-[16px]">
            {challenge.goal}
          </div>
          {challenge.whyItMatters ? (
            <p className="text-muted mt-0.5 mb-0 text-[12.5px]">
              Because {lowerFirst(challenge.whyItMatters)}
            </p>
          ) : null}
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0 self-start">
          <Link href="/challenge">View my goal</Link>
        </Button>
      </Panel>

      <section className="mt-10" aria-labelledby="today-heading">
        <h2 id="today-heading" className="text-[22px] sm:text-[26px]">
          Today
        </h2>
        <p className="text-muted mt-0 mb-1 text-sm">
          Keep it simple. Just show up.
        </p>

        <Rule className="m-0" />

        <ul className="m-0 list-none p-0">
          {actions.map((action) => (
            <ActionRow key={action.id} action={action} />
          ))}
        </ul>

        {topPriority ? (
          <Panel className="mt-7">
            <div className="eyebrow">Top priority</div>
            <p className="heading mt-1.5 mb-0 text-[16px]">
              {topPriority.text}
            </p>
          </Panel>
        ) : null}

        <Panel className="mt-7 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <div className="label-caps">Today&apos;s progress</div>
            <div className="heading text-[17px] sm:text-[20px]">
              {completion.percent === 100
                ? "Today's plan is complete."
                : `${completion.completed} of ${completion.required}`}
            </div>
          </div>
          <Track
            value={completion.percent}
            label="Today's completion"
            className="mt-3 h-1"
          />
          <p className="mt-2.5 mb-0 text-[13px] text-[var(--color-neutral-400)]">
            {progressLabel}
          </p>
        </Panel>

        <MinimumDayDialog
          dayId={day.id}
          isMinimumDay={day.isMinimumDay}
          preview={
            heaviest?.minimumVersionTitle
              ? { from: heaviest.title, to: heaviest.minimumVersionTitle }
              : null
          }
        />

        <Priorities
          dayId={day.id}
          initial={day.priorities.map((priority) => ({
            position: priority.position,
            text: priority.text,
            completed: priority.completed,
          }))}
        />
      </section>

      <Rule className="mt-10 mb-8" />

      <FinishDay
        dayId={day.id}
        dayNumber={dayNumber}
        initialFeeling={day.reflection?.dayFeeling ?? null}
        initialNote={day.reflection?.note ?? ""}
        deepReflection={isReviewDay(dayNumber, challenge.lengthDays)}
      />
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
