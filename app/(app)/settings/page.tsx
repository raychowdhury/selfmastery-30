import type { Metadata } from "next";

import { CalmSettings } from "@/components/settings/calm-settings";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getChallengeContext } from "@/lib/services/context";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const userId = await requireUserId();
  const [user, context] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    }),
    getChallengeContext(userId),
  ]);

  return (
    <div className="calm-in">
      <h1 className="mb-0 text-[26px] leading-[1.2]">Settings</h1>

      <CalmSettings
        name={user?.name ?? ""}
        email={user?.email ?? ""}
        challenge={
          context
            ? {
                id: context.challenge.id,
                goal: context.challenge.goal,
                dayNumber: context.dayNumber,
                lengthDays: context.challenge.lengthDays,
                difficulty: context.challenge.difficulty,
                minutes: context.challenge.availableMinutes,
              }
            : null
        }
      />
    </div>
  );
}
