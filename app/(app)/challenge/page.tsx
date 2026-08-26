import Link from "next/link";
import type { Metadata } from "next";
import { Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Rule } from "@/components/ui/rule";
import { Tag } from "@/components/ui/tag";
import { requireUserId } from "@/lib/auth";
import { dateForDayNumber } from "@/lib/challenge/dates";
import { listChallenges } from "@/lib/services/challenge-service";
import { getChallengeContext } from "@/lib/services/context";
import { formatShortDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "My goal" };

const DIFFICULTY_LABEL = {
  GENTLE: "Gentle — small actions with low pressure",
  BALANCED: "Balanced — steady progress without overload",
  CHALLENGING: "Challenging — more demanding daily actions",
} as const;

const TIME_LABEL = {
  MORNING: "Mornings",
  AFTERNOON: "Afternoons",
  EVENING: "Evenings",
  FLEXIBLE: "Flexible",
} as const;

export default async function ChallengePage() {
  const userId = await requireUserId();
  const context = await getChallengeContext(userId);
  const all = await listChallenges(userId);
  const past = all.filter((challenge) => challenge.status !== "ACTIVE");

  if (!context) {
    return (
      <div>
        <EmptyState
          icon={Target}
          title="No challenge running"
          description="Pick one thing to change over the next 30 days."
          actionLabel="Start My 30 Days"
          actionHref="/onboarding"
          className="mt-10"
        />
        {past.length > 0 ? <PastChallenges challenges={past} /> : null}
      </div>
    );
  }

  const { challenge, dayNumber, stats } = context;

  const rows: Array<[string, React.ReactNode]> = [
    ["Goal", <span key="g" className="heading text-[16px] sm:text-[17px]">{challenge.goal}</span>],
    challenge.whyItMatters
      ? ["Why it matters", <span key="w" className="text-[var(--color-neutral-300)]">“{challenge.whyItMatters}”</span>]
      : null,
    challenge.successDefinition
      ? ["Day 30 success", challenge.successDefinition]
      : null,
    ["Available time", `${challenge.availableMinutes} minutes/day`],
    ["Approach", DIFFICULTY_LABEL[challenge.difficulty]],
    ["Usual time", TIME_LABEL[challenge.preferredTime]],
    [
      "Dates",
      `${formatShortDate(challenge.startDate)} — ${formatShortDate(challenge.endDate)}`,
    ],
  ].filter(Boolean) as Array<[string, React.ReactNode]>;

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="mb-0 text-[27px] sm:text-[36px]">My goal</h1>
        <Tag variant="accent">
          Day {dayNumber} of {challenge.lengthDays}
        </Tag>
      </div>

      <div className="mt-7 flex flex-col">
        {rows.map(([label, value], index) => (
          <div key={label}>
            {index > 0 ? <Rule className="m-0" /> : null}
            <div className="grid gap-1 px-1 py-4 sm:grid-cols-[150px_1fr] sm:gap-5">
              <div className="label-caps pt-1">{label}</div>
              <div className="text-[14px] sm:text-[15px]">{value}</div>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-9" aria-labelledby="pillars-heading">
        <h2 id="pillars-heading" className="label-caps">
          What this challenge is built from
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {challenge.pillars.map((pillar) => (
            <Tag key={pillar.id} variant="outline">
              {pillar.name}
            </Tag>
          ))}
        </div>
      </section>

      <section className="mt-9" aria-labelledby="milestones-heading">
        <h2 id="milestones-heading" className="label-caps">
          Milestones
        </h2>
        <div className="mt-3 flex flex-col gap-2.5">
          {challenge.milestones.map((milestone) => {
            const reached = dayNumber >= milestone.dayNumber;
            return (
              <Panel key={milestone.id} className="p-4">
                <div className="flex flex-wrap items-baseline gap-2.5">
                  <span className="label-caps">Day {milestone.dayNumber}</span>
                  <span className="heading text-[15px]">{milestone.title}</span>
                  {reached ? <Tag variant="accent">Reached</Tag> : null}
                </div>
                {milestone.description ? (
                  <p className="text-muted mt-1.5 mb-0 text-[13px]">
                    {milestone.description}
                  </p>
                ) : null}
                <p className="mt-1.5 mb-0 text-[12px] text-[var(--color-neutral-600)]">
                  {formatShortDate(
                    dateForDayNumber(challenge.startDate, milestone.dayNumber)
                  )}
                </p>
              </Panel>
            );
          })}
        </div>
      </section>

      <Panel className="mt-9 p-5">
        <div className="label-caps">So far</div>
        <p className="mt-2 mb-0 text-sm">
          {stats.activeDays} active days · {stats.actionsCompleted} actions
          completed · {stats.overallCompletion}% overall consistency
        </p>
      </Panel>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link href="/settings">Edit this challenge</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/calendar">See all 30 days</Link>
        </Button>
      </div>

      {past.length > 0 ? <PastChallenges challenges={past} /> : null}
    </div>
  );
}

function PastChallenges({
  challenges,
}: {
  challenges: Array<{ id: string; goal: string; status: string; startDate: Date; endDate: Date }>;
}) {
  return (
    <section className="mt-12" aria-labelledby="history-heading">
      <h2 id="history-heading" className="label-caps">
        Previous challenges
      </h2>
      <p className="text-muted mt-1.5 text-[13px]">
        Nothing is deleted when you start something new.
      </p>
      <div className="mt-3 flex flex-col gap-2.5">
        {challenges.map((challenge) => (
          <Panel key={challenge.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="heading mb-0 text-[15px]">{challenge.goal}</p>
              <p className="text-muted mt-0.5 mb-0 text-[12.5px]">
                {formatShortDate(challenge.startDate)} —{" "}
                {formatShortDate(challenge.endDate)}
              </p>
            </div>
            <Tag variant={challenge.status === "COMPLETED" ? "accent" : "neutral"}>
              {challenge.status === "COMPLETED" ? "Completed" : "Archived"}
            </Tag>
          </Panel>
        ))}
      </div>
    </section>
  );
}
