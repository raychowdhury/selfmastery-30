import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";

import { ActionRow } from "@/components/today/action-row";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Rule } from "@/components/ui/rule";
import { Tag } from "@/components/ui/tag";
import {
  calculateDailyCompletion,
  classifyDay,
  effectiveAction,
  visibleActions,
} from "@/lib/analytics/calculations";
import { CALENDAR_LEGEND, dayVisual } from "@/lib/analytics/day-state";
import { requireUserId } from "@/lib/auth";
import { getDayByNumber } from "@/lib/services/challenge-service";
import { getChallengeContext } from "@/lib/services/context";
import { renderCopy } from "@/lib/challenge/render";
import { formatDayDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Your 30 days" };

export default async function CalendarPage({
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
        title="No challenge yet"
        description="Your 30 days will appear here once you start."
        actionLabel="Start My 30 Days"
        actionHref="/onboarding"
        className="mt-10"
      />
    );
  }

  const { challenge, snapshots, dayNumber } = context;
  const requested = Number((await searchParams).day);
  const selectedNumber =
    Number.isFinite(requested) &&
    requested >= 1 &&
    requested <= challenge.lengthDays
      ? requested
      : dayNumber;

  const selected = await getDayByNumber(userId, challenge.id, selectedNumber);
  const selectedSnapshot = snapshots.find(
    (snapshot) => snapshot.dayNumber === selectedNumber
  );

  const pillarNames = new Map(
    challenge.pillars.map((pillar) => [pillar.id, pillar.name])
  );

  const selectedCompletion = selectedSnapshot
    ? calculateDailyCompletion(selectedSnapshot)
    : null;
  const selectedState = selectedSnapshot
    ? classifyDay(selectedSnapshot, dayNumber)
    : "FUTURE";
  const selectedVisual = dayVisual(
    selectedState,
    selectedCompletion?.percent ?? 0
  );
  const selectedMinutes = selectedSnapshot
    ? visibleActions(selectedSnapshot)
        .filter((action) => action.completed)
        .reduce((total, action) => total + action.estimatedMinutes, 0)
    : 0;

  const isFuture = selectedNumber > dayNumber;

  return (
    <div>
      <h1 className="text-[27px] sm:text-[36px]">Your 30 Days</h1>
      <p className="text-muted mt-1.5 text-[13px] sm:text-[15px]">
        Progress isn&apos;t about perfection. It&apos;s about returning.
      </p>

      <div className="mt-7 grid max-w-[560px] grid-cols-5 gap-2 sm:mt-9 sm:grid-cols-6">
        {snapshots.map((snapshot) => {
          const state = classifyDay(snapshot, dayNumber);
          const completion = calculateDailyCompletion(snapshot);
          const visual = dayVisual(state, completion.percent);
          const isSelected = snapshot.dayNumber === selectedNumber;

          return (
            <Link
              key={snapshot.dayNumber}
              href={`/calendar?day=${snapshot.dayNumber}`}
              scroll={false}
              aria-current={isSelected ? "true" : undefined}
              aria-label={`Day ${snapshot.dayNumber}: ${visual.label}`}
              className="flex h-14 flex-col items-center justify-center gap-px rounded-lg text-[13px] font-medium no-underline transition-colors"
              style={{
                background: visual.background,
                border: `1px solid ${isSelected ? "var(--color-accent)" : visual.border}`,
                boxShadow: isSelected ? "0 0 0 1px var(--color-accent)" : "none",
                color: visual.color,
              }}
            >
              <span>{String(snapshot.dayNumber).padStart(2, "0")}</span>
              <span
                className="min-h-[13px] text-[10.5px] leading-tight"
                style={{ color: visual.markColor }}
              >
                {visual.mark}
              </span>
            </Link>
          );
        })}
      </div>

      <ul className="mt-5 flex max-w-[560px] list-none flex-wrap gap-x-4 gap-y-2 p-0 text-[11.5px] text-[var(--color-neutral-500)]">
        {CALENDAR_LEGEND.map((entry) => (
          <li key={entry.label} className="flex items-center gap-1.5">
            <span style={{ color: entry.color }}>{entry.mark}</span>
            {entry.label}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-[3px] border border-[var(--color-accent)]" />
          Today
        </li>
      </ul>

      <section className="mt-8" aria-live="polite">
        <Panel className="max-w-[560px] p-5">
          <div className="flex flex-wrap items-baseline gap-2.5">
            <h2 className="heading mb-0 text-[17px]">
              Day {String(selectedNumber).padStart(2, "0")}
            </h2>
            <Tag variant="neutral">{selectedVisual.label}</Tag>
          </div>
          <p className="text-muted mt-1.5 mb-0 text-[13px]">
            {selected ? formatDayDate(selected.date) : null}
            {selectedCompletion && !isFuture
              ? ` · ${selectedCompletion.completed} of ${selectedCompletion.required} actions · ${selectedMinutes} focused minutes`
              : selectedSnapshot
                ? ` · ${selectedSnapshot.actions.filter((a) => !a.optional).length} actions planned`
                : null}
          </p>
          {selectedState === "MISSED" ? (
            <p className="text-muted mt-2 mb-0 text-[13px]">
              Nothing was logged. That&apos;s okay — one difficult day
              doesn&apos;t erase your progress.
            </p>
          ) : null}
        </Panel>
      </section>

      {selected ? (
        <section className="mt-8" aria-labelledby="day-detail-heading">
          <h3 id="day-detail-heading" className="label-caps">
            {isFuture ? "Planned for this day" : "Actions"}
          </h3>
          {isFuture ? (
            <p className="text-muted mt-1.5 text-[13px]">
              You can look ahead, but there is nothing to do yet. The plan for
              future days can still change based on your weekly reviews.
            </p>
          ) : (
            <p className="text-muted mt-1.5 text-[13px]">
              Past days stay editable — tick something off if you forgot to at
              the time.
            </p>
          )}

          <Rule className="m-0 mt-2" />

          <ul className="m-0 list-none p-0">
            {(selected.isMinimumDay
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

              return (
                <ActionRow
                  key={action.id}
                  readOnly={isFuture}
                  action={{
                    id: action.id,
                    title: shown.title,
                    description: action.description
                      ? renderCopy(action.description, action.estimatedMinutes)
                      : null,
                    minutes: shown.estimatedMinutes,
                    pillarName: action.pillarId
                      ? (pillarNames.get(action.pillarId) ?? null)
                      : null,
                    optional: action.optional,
                    completed: action.completed,
                  }}
                />
              );
            })}
          </ul>

          {selected.reflection?.note ? (
            <Panel className="mt-6">
              <div className="label-caps">What you wrote</div>
              <p className="mt-2 mb-0 text-sm">{selected.reflection.note}</p>
            </Panel>
          ) : null}

          {selectedNumber === dayNumber ? (
            <Button asChild className="mt-6">
              <Link href="/today">Go to Today</Link>
            </Button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
