import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

import { ConsistencyChart } from "@/components/progress/consistency-chart";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/card";
import { Rule } from "@/components/ui/rule";
import { Track } from "@/components/ui/track";
import {
  calculateDailyCompletion,
  calculatePillarCompletion,
} from "@/lib/analytics/calculations";
import { buildInsights } from "@/lib/analytics/insights";
import { requireUserId } from "@/lib/auth";
import { getChallengeContext } from "@/lib/services/context";
import { formatMinutes } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Your progress" };

const PILLAR_FILLS = [
  "var(--color-accent)",
  "var(--color-accent-600)",
  "var(--color-accent-700)",
  "var(--color-accent-2-600)",
];

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

  const pillars = calculatePillarCompletion(
    snapshots,
    challenge.pillars.map((pillar) => ({ id: pillar.id, name: pillar.name })),
    dayNumber
  );

  const insights = buildInsights(snapshots, pillars, dayNumber);

  const chartData = snapshots.map((snapshot) => {
    const completion = calculateDailyCompletion(snapshot);
    return {
      day: snapshot.dayNumber,
      percent: snapshot.dayNumber > dayNumber ? 0 : completion.percent,
      label: `Day ${snapshot.dayNumber}`,
      minimum: snapshot.isMinimumDay,
      future: snapshot.dayNumber > dayNumber,
    };
  });

  const tiles: Array<[string, string]> = [
    [String(stats.activeDays), "Active days"],
    [String(stats.currentStreak), "Current streak"],
    [String(stats.perfectDays), "Perfect days"],
    [String(stats.actionsCompleted), "Actions completed"],
  ];

  const enoughData = dayNumber >= 3;

  return (
    <div>
      <h1 className="text-[27px] sm:text-[36px]">Your Progress</h1>

      <div className="mt-7 flex items-baseline gap-3.5 sm:mt-9">
        <div className="heading text-[48px] leading-none sm:text-[64px]">
          {stats.overallCompletion}%
        </div>
        <div className="text-muted text-[12.5px] sm:text-sm">
          Overall consistency
        </div>
      </div>

      <dl className="mt-6 grid max-w-[640px] grid-cols-2 gap-2.5 sm:mt-8 sm:grid-cols-4 sm:gap-3">
        {tiles.map(([value, label]) => (
          <Card key={label} className="p-4">
            <dt className="sr-only">{label}</dt>
            <dd className="heading m-0 text-[22px] sm:text-[26px]">{value}</dd>
            <p className="mb-0 text-[11.5px] text-[var(--color-neutral-500)] sm:text-[12px]">
              {label}
            </p>
          </Card>
        ))}
      </dl>

      {stats.minimumDays > 0 ? (
        <p className="text-muted mt-3 mb-0 max-w-[640px] text-[13px]">
          Including {stats.minimumDays} Minimum{" "}
          {stats.minimumDays === 1 ? "Day" : "Days"} — days you could have
          skipped entirely and didn&apos;t.
        </p>
      ) : null}

      <section className="mt-11" aria-labelledby="chart-heading">
        <h2 id="chart-heading" className="text-[17px] sm:text-[20px]">
          Your {challenge.lengthDays} days
        </h2>
        <p className="text-muted mt-1 mb-4 text-[13px]">
          Each bar is one day. Height is how much of the plan you completed.
        </p>
        <ConsistencyChart data={chartData} />
      </section>

      {pillars.some((pillar) => pillar.scheduled > 0) ? (
        <section className="mt-11" aria-labelledby="pillars-heading">
          <h2 id="pillars-heading" className="text-[17px] sm:text-[20px]">
            Where you&apos;re showing up
          </h2>
          <div className="mt-4 flex max-w-[560px] flex-col gap-4">
            {pillars.map((pillar, index) => (
              <div key={pillar.pillarId}>
                <div className="mb-2 flex justify-between text-[13.5px]">
                  <span>{pillar.name}</span>
                  <span className="text-muted">{pillar.percent}%</span>
                </div>
                <Track
                  value={pillar.percent}
                  label={`${pillar.name}: ${pillar.percent}% complete`}
                  className="h-1"
                  fillColor={PILLAR_FILLS[index % PILLAR_FILLS.length]}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-11" aria-labelledby="insights-heading">
        <h2 id="insights-heading" className="text-[17px] sm:text-[20px]">
          What we&apos;re noticing
        </h2>

        {enoughData && insights.length > 0 ? (
          <Panel className="mt-4 max-w-[640px] p-5 sm:p-6">
            {insights.map((insight, index) => (
              <div key={insight.id}>
                {index > 0 ? <Rule className="my-3.5" /> : null}
                <p className="mb-0 text-sm sm:text-[14.5px]">{insight.text}</p>
              </div>
            ))}
          </Panel>
        ) : (
          <p className="text-muted mt-3 mb-0 max-w-[560px] text-sm">
            Complete a few more days and patterns will start showing up here —
            which actions stick, which ones keep getting skipped, and what that
            suggests about next week.
          </p>
        )}
      </section>

      <p className="text-muted mt-11 mb-0 text-[13px]">
        {formatMinutes(stats.minutesCompleted)} spent on this goal so far ·
        longest streak {stats.longestStreak}{" "}
        {stats.longestStreak === 1 ? "day" : "days"}
      </p>
    </div>
  );
}
