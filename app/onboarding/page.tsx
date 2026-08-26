import { format } from "date-fns";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { requireUserId } from "@/lib/auth";
import { STRATEGIES } from "@/lib/plan/strategies";
import { getTemplate } from "@/lib/plan/templates";
import { getActiveChallenge } from "@/lib/services/challenge-service";

export const metadata: Metadata = { title: "Set up your 30 days" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; restart?: string }>;
}) {
  const userId = await requireUserId();
  const { template: templateSlug, restart } = await searchParams;

  // One active challenge at a time. Send people back rather than silently
  // replacing the one they are in the middle of.
  const active = await getActiveChallenge(userId);
  if (active && restart !== "1") {
    redirect("/challenge");
  }

  const template = templateSlug ? getTemplate(templateSlug) : undefined;

  const hints = Object.fromEntries(
    STRATEGIES.map((strategy) => [
      strategy.slug,
      {
        slug: strategy.slug,
        goalExamples: strategy.goalExamples,
        safetyNote: strategy.safetyNote,
      },
    ])
  );

  return (
    <div className="flex min-h-dvh flex-col items-center px-5 py-8 sm:py-10">
      <div className="wordmark text-[13px]">
        SELFMASTERY <span className="text-[var(--color-accent)]">30</span>
      </div>
      <main className="mt-10 flex w-full justify-center sm:mt-14">
        <OnboardingWizard
          hints={hints}
          todayIso={format(new Date(), "yyyy-MM-dd")}
          initial={
            template
              ? {
                  category: template.category,
                  goal: template.goal,
                  availableMinutes: template.suggestedMinutes,
                  difficulty: template.suggestedDifficulty,
                }
              : undefined
          }
        />
      </main>
    </div>
  );
}
