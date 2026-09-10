import Link from "next/link";
import type { Metadata } from "next";
import { Target } from "lucide-react";

import { CalmRule, GlassBar } from "@/components/layout/calm-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUserId } from "@/lib/auth";
import { listChallenges } from "@/lib/services/challenge-service";
import { getChallengeContext } from "@/lib/services/context";
import { formatShortDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "My goal" };

const DIFFICULTY_LABEL = {
  GENTLE: "Gentle. Small actions with low pressure.",
  BALANCED: "Balanced. Steady progress without overload.",
  CHALLENGING: "Challenging. More demanding daily actions.",
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
      <div className="calm-in">
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
    ["Goal", <span key="g" className="text-[17px]">{challenge.goal}</span>],
    challenge.whyItMatters
      ? ["Why it matters", `“${challenge.whyItMatters}”`]
      : null,
    challenge.successDefinition
      ? ["Day 30 success", challenge.successDefinition]
      : null,
    ["Time", `${challenge.availableMinutes} minutes a day`],
    ["Approach", DIFFICULTY_LABEL[challenge.difficulty]],
    ["Usual time", TIME_LABEL[challenge.preferredTime]],
    [
      "Dates",
      `${formatShortDate(challenge.startDate)} — ${formatShortDate(challenge.endDate)}`,
    ],
    [
      "Built from",
      challenge.pillars.map((pillar) => pillar.name).join(" · "),
    ],
    [
      "So far",
      `${stats.activeDays} active days · ${stats.actionsCompleted} actions · ${stats.overallCompletion}% consistency`,
    ],
  ].filter(Boolean) as Array<[string, React.ReactNode]>;

  return (
    <div className="calm-in">
      <p className="text-muted mb-0 text-[13px]">
        Day {dayNumber} of {challenge.lengthDays}
      </p>
      <h1 className="mt-2.5 mb-0 text-[26px] leading-[1.2]">My goal</h1>

      <div className="mt-9 flex flex-col">
        {rows.map(([label, value], index) => (
          <div key={label}>
            {index > 0 ? <CalmRule /> : null}
            <div className="py-[18px]">
              <div className="text-muted text-[12px] tracking-[0.08em] uppercase">
                {label}
              </div>
              <div className="mt-1.5 text-[15px] leading-normal">{value}</div>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-9" aria-labelledby="milestones-heading">
        <h2
          id="milestones-heading"
          className="text-muted mb-0 text-[12px] font-normal tracking-[0.08em] uppercase"
        >
          Milestones
        </h2>
        <div className="mt-2 flex flex-col">
          {challenge.milestones.map((milestone, index) => {
            const reached = dayNumber >= milestone.dayNumber;
            return (
              <div key={milestone.id}>
                {index > 0 ? <CalmRule /> : null}
                <div className="flex items-baseline justify-between gap-3 py-3.5">
                  <div className="min-w-0">
                    <span
                      className="text-[15px]"
                      style={{
                        color: reached
                          ? "var(--color-text)"
                          : "color-mix(in srgb, var(--color-text) 60%, transparent)",
                      }}
                    >
                      {milestone.title}
                    </span>
                    {milestone.description ? (
                      <p className="text-muted mt-0.5 mb-0 text-[13px]">
                        {milestone.description}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-muted shrink-0 text-[13px]">
                    Day {milestone.dayNumber}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {past.length > 0 ? <PastChallenges challenges={past} /> : null}

      <GlassBar>
        <Button asChild block variant="ghost">
          <Link href="/progress">See all 30 days</Link>
        </Button>
      </GlassBar>
    </div>
  );
}

function PastChallenges({
  challenges,
}: {
  challenges: Array<{
    id: string;
    goal: string;
    status: string;
    startDate: Date;
    endDate: Date;
  }>;
}) {
  return (
    <section className="mt-10" aria-labelledby="history-heading">
      <h2
        id="history-heading"
        className="text-muted mb-0 text-[12px] font-normal tracking-[0.08em] uppercase"
      >
        Previous challenges
      </h2>
      <div className="mt-2 flex flex-col">
        {challenges.map((challenge, index) => (
          <div key={challenge.id}>
            {index > 0 ? <CalmRule /> : null}
            <div className="flex items-baseline justify-between gap-3 py-3.5">
              <div className="min-w-0">
                <p className="mb-0 text-[15px]">{challenge.goal}</p>
                <p className="text-muted mt-0.5 mb-0 text-[13px]">
                  {formatShortDate(challenge.startDate)} —{" "}
                  {formatShortDate(challenge.endDate)}
                </p>
              </div>
              <span className="text-muted shrink-0 text-[13px]">
                {challenge.status === "COMPLETED" ? "Completed" : "Archived"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
