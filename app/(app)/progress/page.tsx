import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";

import { CalmRule, GlassBar } from "@/components/layout/calm-shell";
import { ActionRow } from "@/components/today/action-row";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  calculateDailyCompletion,
  classifyDay,
  effectiveAction,
  visibleActions,
} from "@/lib/analytics/calculations";
import type { DayState } from "@/lib/analytics/types";
import { requireUserId } from "@/lib/auth";
import { isReviewDay, weekForDay } from "@/lib/challenge/phases";
import { getDayByNumber } from "@/lib/services/challenge-service";
import { getChallengeContext } from "@/lib/services/context";
import { listReviews } from "@/lib/services/review-service";

export const metadata: Metadata = { title: "Your 30 days" };

/**
 * The merged 30-days screen from the Calm design: the calendar grid, the
 * selected day, and the two numbers that matter — one screen, one story.
 */

const GLYPHS: Record<
  DayState,
  { glyph: string; color: string; label: string }
> = {
  PERFECT: { glyph: "●", color: "var(--color-accent)", label: "Complete" },
  COMPLETE: { glyph: "●", color: "var(--color-accent)", label: "Complete" },
  PARTIAL: { glyph: "◐", color: "var(--color-accent)", label: "Partial" },
  MINIMUM: { glyph: "○", color: "var(--color-accent)", label: "Minimum day" },
  MISSED: {
    glyph: "–",
    color: "color-mix(in srgb, var(--color-text) 60%, transparent)",
    label: "Missed",
  },
  TODAY: { glyph: "", color: "transparent", label: "Today" },
  FUTURE: { glyph: "", color: "transparent", label: "Upcoming" },
};

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const userId = await requireUserId();
  const context = await getChallengeContext(userId);

  if (!context) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Your 30 days will appear here"
        description="One goal, thirty days. Start and this screen fills in."
        actionLabel="Start My 30 Days"
        actionHref="/onboarding"
        className="mt-10"
      />
    );
  }

  const { challenge, snapshots, stats, dayNumber } = context;

  const requested = Number((await searchParams).day);
  const selectedNumber =
    Number.isFinite(requested) &&
    requested >= 1 &&
    requested <= challenge.lengthDays
      ? requested
      : Math.min(dayNumber, challenge.lengthDays);

  const selected = await getDayByNumber(userId, challenge.id, selectedNumber);
  const selectedSnapshot = snapshots.find(
    (snapshot) => snapshot.dayNumber === selectedNumber
  );

  const selectedState: DayState = selectedSnapshot
    ? classifyDay(selectedSnapshot, dayNumber)
    : "FUTURE";
  const selectedCompletion = selectedSnapshot
    ? calculateDailyCompletion(selectedSnapshot)
    : null;
  const selectedMinutes = selectedSnapshot
    ? visibleActions(selectedSnapshot)
        .filter((action) => action.completed)
        .reduce((total, action) => total + action.estimatedMinutes, 0)
    : 0;
  const isFuture = selectedNumber > dayNumber;
  const isToday = selectedNumber === dayNumber;

  const selectedLabel = isToday
    ? "Today"
    : GLYPHS[selectedState].label;
  const selectedSub = isFuture
    ? `${selectedSnapshot?.actions.filter((a) => !a.optional).length ?? 0} actions planned`
    : selectedState === "MISSED"
      ? "Nothing logged. You came back."
      : isToday && selectedCompletion
        ? `${selectedCompletion.completed} of ${selectedCompletion.required} actions so far`
        : selectedCompletion
          ? `${selectedCompletion.completed} of ${selectedCompletion.required} actions · ${selectedMinutes} minutes`
          : "";

  // The latest finished-but-unreviewed week, for the bar.
  const reviews = await listReviews(userId, challenge.id);
  const written = new Set(reviews.map((review) => review.weekNumber));
  let reviewDue: number | null = null;
  for (let n = 1; n <= dayNumber; n += 1) {
    if (!isReviewDay(n, challenge.lengthDays)) continue;
    const week = weekForDay(n, challenge.lengthDays);
    if (!written.has(week)) reviewDue = week;
  }

  const selectedActions = selected
    ? (selected.isMinimumDay
        ? selected.actions.filter((action) => !action.optional)
        : selected.actions
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
          selected.isMinimumDay
        );
        return {
          id: action.id,
          title: shown.title,
          minutes: shown.estimatedMinutes,
          optional: action.optional,
          completed: action.completed,
        };
      })
    : [];

  return (
    <div className="calm-in">
      <h1 className="mb-0 text-[26px] leading-[1.2]">Your 30 days</h1>
      <p className="text-muted mt-2 mb-0 text-[14px]">
        Progress is about returning, not perfection.
      </p>

      <div className="mt-9 grid grid-cols-6 gap-1.5">
        {snapshots.map((snapshot) => {
          const state = classifyDay(snapshot, dayNumber);
          const { glyph, color } = GLYPHS[state];
          const isSelected = snapshot.dayNumber === selectedNumber;
          const cellIsToday = snapshot.dayNumber === dayNumber;
          const faded = snapshot.dayNumber > dayNumber;

          return (
            <Link
              key={snapshot.dayNumber}
              href={`/progress?day=${snapshot.dayNumber}`}
              scroll={false}
              aria-current={isSelected ? "true" : undefined}
              aria-label={`Day ${snapshot.dayNumber}, ${
                cellIsToday ? "Today" : GLYPHS[state].label
              }`}
              className="flex h-12 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] text-[13px] no-underline"
              style={{
                background: isSelected ? "var(--color-surface)" : "transparent",
                border: `1px solid ${cellIsToday ? "var(--color-accent)" : "transparent"}`,
                color: faded
                  ? "color-mix(in srgb, var(--color-text) 30%, transparent)"
                  : state === "MISSED"
                    ? "color-mix(in srgb, var(--color-text) 60%, transparent)"
                    : "var(--color-text)",
              }}
            >
              <span>{snapshot.dayNumber}</span>
              <span
                aria-hidden
                className="grid h-2.5 place-items-center text-[10px] leading-[10px]"
                style={{ color: glyph ? color : "transparent" }}
              >
                {glyph || "·"}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-7" aria-live="polite">
        <div className="text-[16px]">
          Day {selectedNumber} · {selectedLabel}
        </div>
        <div className="text-muted mt-1 text-[13.5px]">{selectedSub}</div>
      </div>

      <CalmRule className="mt-9" />

      <div className="mt-7 grid grid-cols-2 gap-6">
        <div>
          <div className="heading text-[30px] leading-none">
            {stats.activeDays}
          </div>
          <div className="text-muted mt-2 text-[13px]">days completed</div>
        </div>
        <div>
          <div className="heading text-[30px] leading-none">
            {stats.currentStreak}
          </div>
          <div className="text-muted mt-2 text-[13px]">days in a row</div>
        </div>
      </div>

      {selected && selectedActions.length > 0 ? (
        <>
          <CalmRule className="mt-9" />
          <ul className="m-0 mt-2 list-none p-0">
            {selectedActions.map((action) => (
              <ActionRow key={action.id} action={action} readOnly={isFuture} />
            ))}
          </ul>
          {selected.reflection?.note ? (
            <p className="text-muted mt-5 mb-0 text-[14px] leading-normal">
              &ldquo;{selected.reflection.note}&rdquo;
            </p>
          ) : null}
        </>
      ) : null}

      {reviewDue ? (
        <GlassBar>
          <div className="text-muted text-[13.5px]">
            Week {reviewDue} is done.
          </div>
          <Button asChild block variant="ghost">
            <Link href={`/reviews/${reviewDue}`}>Reflect on it</Link>
          </Button>
        </GlassBar>
      ) : null}
    </div>
  );
}
