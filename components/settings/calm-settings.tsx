"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { signOutAction } from "@/actions/auth";
import { archiveChallengeAction, updateProfileAction } from "@/actions/challenge";
import { CalmRule, GlassBar, ThemeToggle } from "@/components/layout/calm-shell";
import { useTheme } from "@/components/layout/theme-provider";
import { Button } from "@/components/ui/button";
import { CalmSheet } from "@/components/ui/sheet";

/**
 * The Calm settings list: quiet rows separated by fading rules, values on the
 * right. Anything that needs input opens a bottom sheet rather than exposing
 * a form on the page.
 */

function Row({
  label,
  value,
  onClick,
  href,
}: {
  label: string;
  value: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const className =
    "flex w-full items-center justify-between gap-3 border-none bg-transparent p-0 py-[17px] text-left text-[16px] text-inherit no-underline";
  const inner = (
    <>
      <span>{label}</span>
      <span className="text-muted text-[15px]">{value}</span>
    </>
  );

  return (
    <>
      {href ? (
        <Link href={href} className={`${className} hover:no-underline`}>
          {inner}
        </Link>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={`${className} cursor-pointer`}>
          {inner}
        </button>
      ) : (
        <div className={className}>{inner}</div>
      )}
      <CalmRule />
    </>
  );
}

export function CalmSettings({
  name,
  email,
  challenge,
}: {
  name: string;
  email: string;
  challenge: {
    id: string;
    goal: string;
    dayNumber: number;
    lengthDays: number;
    difficulty: string;
    minutes: number;
  } | null;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const resolvedDark = theme !== "light";

  const [sheet, setSheet] = React.useState<"none" | "name" | "reset">("none");
  const [draftName, setDraftName] = React.useState(name);
  const [pending, startTransition] = React.useTransition();

  function saveName() {
    startTransition(async () => {
      await updateProfileAction({ name: draftName });
      router.refresh();
      setSheet("none");
    });
  }

  function archive() {
    if (!challenge) return;
    startTransition(async () => {
      await archiveChallengeAction(challenge.id);
      router.refresh();
      setSheet("none");
    });
  }

  return (
    <>
      <div className="mt-9 flex flex-col">
        <Row
          label="Name"
          value={name || "Add your name"}
          onClick={() => {
            setDraftName(name);
            setSheet("name");
          }}
        />
        <Row label="Email" value={email} />
        <Row label="Daily reminder" value="Coming soon" />
        <Row
          label="Appearance"
          value={resolvedDark ? "Dark" : "Light"}
          onClick={() => setTheme(resolvedDark ? "light" : "dark")}
        />
        <Row label="Templates" value="Browse" href="/templates" />
        {challenge ? (
          <Row
            label="Challenge"
            value={`Day ${challenge.dayNumber} of ${challenge.lengthDays}`}
            href="/challenge"
          />
        ) : (
          <Row label="Challenge" value="Start one" href="/onboarding" />
        )}
        <Row label="Privacy" value="Read" href="/privacy" />
        <button
          type="button"
          onClick={() => signOutAction()}
          className="flex w-full cursor-pointer items-center justify-between gap-3 border-none bg-transparent p-0 py-[17px] text-left text-[16px] text-inherit"
        >
          <span>Sign out</span>
        </button>
        <CalmRule />
      </div>

      {challenge ? (
        <p className="text-muted mt-10 mb-0 text-[14px] leading-normal">
          {challenge.goal}. {challenge.difficulty.toLowerCase()} approach,{" "}
          {challenge.minutes} minutes a day.
        </p>
      ) : null}

      {challenge ? (
        <GlassBar>
          <Button block variant="ghost" onClick={() => setSheet("reset")}>
            Start a different challenge
          </Button>
        </GlassBar>
      ) : null}

      <CalmSheet
        open={sheet === "name"}
        onClose={() => setSheet("none")}
        label="Edit your name"
      >
        <div className="heading text-[20px]">Your name</div>
        <input
          className="input mt-5"
          value={draftName}
          aria-label="Name"
          onChange={(event) => setDraftName(event.target.value)}
        />
        <div className="mt-6 flex flex-col gap-2">
          <Button block onClick={saveName} disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
          <Button block variant="ghost" onClick={() => setSheet("none")}>
            Cancel
          </Button>
        </div>
      </CalmSheet>

      <CalmSheet
        open={sheet === "reset"}
        onClose={() => setSheet("none")}
        label="Start a different challenge"
      >
        <div className="heading text-[20px] leading-[1.3]">
          Start a different challenge?
        </div>
        <p className="text-muted mt-3 mb-0 text-[14px] leading-normal">
          Your current challenge is archived, not deleted. Everything you have
          completed stays in your history.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button block variant="ghost" onClick={archive} disabled={pending}>
            {pending ? "Archiving…" : "Archive and start over"}
          </Button>
          <Button block onClick={() => setSheet("none")} disabled={pending}>
            Keep going
          </Button>
        </div>
      </CalmSheet>
    </>
  );
}

// Re-exported so the server page can place the toggle without a second import.
export { ThemeToggle };
