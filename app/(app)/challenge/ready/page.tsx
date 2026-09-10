import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { CalmRule, GlassBar } from "@/components/layout/calm-shell";
import { Button } from "@/components/ui/button";
import { requireUserId } from "@/lib/auth";
import { getChallengeContext } from "@/lib/services/context";
import { getStrategy } from "@/lib/plan/strategies";

export const metadata: Metadata = { title: "Your plan is ready" };

const DIFFICULTY_LABEL = {
  GENTLE: "Gentle. Small actions with low pressure.",
  BALANCED: "Balanced. Steady progress without overload.",
  CHALLENGING: "Challenging. More demanding daily actions.",
} as const;

/** Label-over-value rows separated by fading rules — the Calm plan summary. */
function PlanRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-[18px]">
      <div className="text-muted text-[12px] tracking-[0.08em] uppercase">
        {label}
      </div>
      <div className="mt-1.5 text-[15px] leading-normal">{value}</div>
    </div>
  );
}

export default async function PlanReadyPage() {
  const userId = await requireUserId();
  const context = await getChallengeContext(userId);
  if (!context) redirect("/onboarding");

  const { challenge } = context;
  const strategy = getStrategy(challenge.category);

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
  ].filter(Boolean) as Array<[string, React.ReactNode]>;

  return (
    <div className="calm-in">
      <h1 className="mb-0 text-[26px] leading-[1.2]">Your next 30 days</h1>

      <div className="mt-9 flex flex-col">
        {rows.map(([label, value], index) => (
          <div key={label}>
            {index > 0 ? <CalmRule /> : null}
            <PlanRow label={label} value={value} />
          </div>
        ))}
      </div>

      {strategy.safetyNote ? (
        <p className="text-muted mt-6 mb-0 text-[13px] leading-normal">
          {strategy.safetyNote}
        </p>
      ) : null}

      <GlassBar>
        <p className="text-muted mb-0 text-[14px]">
          Your plan is ready. One day at a time.
        </p>
        <Button asChild block>
          <Link href="/today">Begin Day 1</Link>
        </Button>
      </GlassBar>
    </div>
  );
}
