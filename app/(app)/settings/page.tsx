import Link from "next/link";
import type { Metadata } from "next";

import { signOutAction } from "@/actions/auth";
import { archiveChallengeAction } from "@/actions/challenge";
import {
  ChallengeForm,
  ProfileForm,
  ThemePicker,
} from "@/components/settings/settings-forms";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { Rule } from "@/components/ui/rule";
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
    <div className="max-w-[640px]">
      <h1 className="text-[27px] sm:text-[36px]">Settings</h1>

      <section className="mt-9" aria-labelledby="profile-heading">
        <h2 id="profile-heading" className="text-[17px] sm:text-[18px]">
          Profile
        </h2>
        <div className="mt-4">
          <ProfileForm name={user?.name ?? ""} email={user?.email ?? ""} />
        </div>
      </section>

      <Rule className="my-9" />

      <section aria-labelledby="appearance-heading">
        <h2 id="appearance-heading" className="text-[17px] sm:text-[18px]">
          Appearance
        </h2>
        <div className="mt-4">
          <ThemePicker />
        </div>
      </section>

      <Rule className="my-9" />

      <section aria-labelledby="reminders-heading">
        <h2 id="reminders-heading" className="text-[17px] sm:text-[18px]">
          Reminders
        </h2>
        <Panel className="mt-4 flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="mb-0 text-[14.5px]">Daily reminder</p>
            <p className="text-muted mt-0.5 mb-0 text-[12.5px]">
              A single quiet nudge. Never guilt.
            </p>
          </div>
          <span className="text-[12.5px] text-[var(--color-neutral-500)]">
            Coming soon
          </span>
        </Panel>
      </section>

      <Rule className="my-9" />

      <section aria-labelledby="challenge-heading">
        <h2 id="challenge-heading" className="text-[17px] sm:text-[18px]">
          Challenge
        </h2>

        {context ? (
          <>
            <Panel className="mt-4 flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="mb-0 text-[14.5px]">{context.challenge.goal}</p>
                <p className="text-muted mt-0.5 mb-0 text-[12.5px]">
                  Day {context.dayNumber} of {context.challenge.lengthDays} ·{" "}
                  {context.challenge.difficulty.toLowerCase()} approach
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/challenge">View</Link>
              </Button>
            </Panel>

            <div className="mt-6">
              <ChallengeForm
                challengeId={context.challenge.id}
                title={context.challenge.title}
                goal={context.challenge.goal}
                whyItMatters={context.challenge.whyItMatters ?? ""}
                successDefinition={context.challenge.successDefinition ?? ""}
              />
            </div>

            <form
              action={archiveChallengeAction.bind(null, context.challenge.id)}
              className="mt-8"
            >
              <Button type="submit" variant="secondary">
                Start a different challenge…
              </Button>
              <p className="text-muted mt-2 mb-0 text-[12.5px]">
                Your current challenge is archived, not deleted. Everything you
                have completed stays in your history.
              </p>
            </form>
          </>
        ) : (
          <Panel className="mt-4 flex flex-wrap items-center gap-3">
            <p className="mb-0 flex-1 text-sm">No challenge running.</p>
            <Button asChild size="sm">
              <Link href="/onboarding">Start My 30 Days</Link>
            </Button>
          </Panel>
        )}
      </section>

      <Rule className="my-9" />

      <form action={signOutAction}>
        <Button type="submit" variant="quiet">
          Sign out
        </Button>
      </form>
    </div>
  );
}
