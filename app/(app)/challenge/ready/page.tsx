import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { Rule } from "@/components/ui/rule";
import { Tag } from "@/components/ui/tag";
import { requireUserId } from "@/lib/auth";
import { getChallengeContext } from "@/lib/services/context";
import { getStrategy } from "@/lib/plan/strategies";
import { renderCopy } from "@/lib/challenge/render";
import { formatShortDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Your plan is ready" };

const DIFFICULTY_LABEL = {
  GENTLE: "Gentle — small actions with low pressure",
  BALANCED: "Balanced — steady progress without overload",
  CHALLENGING: "Challenging — more demanding daily actions",
} as const;

export default async function PlanReadyPage() {
  const userId = await requireUserId();
  const context = await getChallengeContext(userId);
  if (!context) redirect("/onboarding");

  const { challenge, snapshots } = context;
  const strategy = getStrategy(challenge.category);
  const firstDay = snapshots[0];

  const rows: Array<[string, React.ReactNode]> = [
    ["Goal", <span key="g" className="heading text-[16px] sm:text-[17px]">{challenge.goal}</span>],
    challenge.whyItMatters
      ? ["Why it matters", <span key="w" className="text-[var(--color-neutral-300)]">“{challenge.whyItMatters}”</span>]
      : null,
    challenge.successDefinition ? ["Day 30 success", challenge.successDefinition] : null,
    ["Available time", `${challenge.availableMinutes} minutes/day`],
    ["Approach", DIFFICULTY_LABEL[challenge.difficulty]],
    ["Start date", formatShortDate(challenge.startDate)],
  ].filter(Boolean) as Array<[string, React.ReactNode]>;

  return (
    <div className="mx-auto max-w-[620px] py-6 sm:py-12">
      <h1 className="text-[28px] sm:text-[34px]">Your next 30 days</h1>

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

      {strategy.safetyNote ? (
        <p className="mt-6 mb-0 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4 text-[12.5px] leading-relaxed text-[var(--color-neutral-400)]">
          {strategy.safetyNote}
        </p>
      ) : null}

      {firstDay ? (
        <Panel className="mt-9 p-5">
          <div className="label-caps">Day 1 looks like this</div>
          <ul className="mt-3 flex list-none flex-col gap-2 p-0">
            {firstDay.actions
              .filter((action) => !action.optional)
              .map((action) => (
                <li key={action.id} className="flex items-baseline gap-2.5">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                  <span className="flex-1 text-sm">
                    {renderCopy(action.title, action.estimatedMinutes)}
                  </span>
                  <Tag variant="neutral">{action.estimatedMinutes} min</Tag>
                </li>
              ))}
          </ul>
          <p className="text-muted mt-3.5 mb-0 text-[12.5px]">
            Week one is deliberately light. The plan grows once showing up has
            stopped being a decision.
          </p>
        </Panel>
      ) : null}

      <div className="mt-12 text-center">
        <h2 className="text-[21px] sm:text-[24px]">Your plan is ready.</h2>
        <p className="text-muted mt-2 text-sm">
          Thirty days of small actions, starting with today. One day at a time.
        </p>
        <Button asChild size="lg" className="mt-5 max-sm:w-full">
          <Link href="/today">
            Begin Day 1
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
        <p className="mt-4 mb-0 text-[12.5px] text-[var(--color-neutral-600)]">
          You can <Link href="/calendar">preview the whole plan</Link> if you
          want to — but you only ever need today.
        </p>
      </div>
    </div>
  );
}
