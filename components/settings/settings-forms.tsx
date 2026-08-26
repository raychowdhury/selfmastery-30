"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { updateChallengeAction, updateProfileAction } from "@/actions/challenge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useTheme, type ThemePreference } from "@/components/layout/theme-provider";

const THEMES: Array<{ value: ThemePreference; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function ProfileForm({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState(name);
  const [status, setStatus] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function save() {
    setStatus(null);
    startTransition(async () => {
      const result = await updateProfileAction({ name: value });
      setStatus(result.ok ? "Saved." : result.error);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label="Name" htmlFor="profile-name">
          <Input
            id="profile-name"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </Field>
        <Field
          label="Email"
          htmlFor="profile-email"
          hint="Changing your email isn't supported yet."
        >
          <Input id="profile-email" value={email} readOnly disabled />
        </Field>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button variant="secondary" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {status ? (
          <span className="text-[13px] text-[var(--color-neutral-400)]">
            {status}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function ThemePicker() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="field">
      <label id="theme-label">Theme</label>
      <div className="seg" role="radiogroup" aria-labelledby="theme-label">
        {THEMES.map((option) => (
          <label key={option.value} className="seg-opt">
            <input
              type="radio"
              name="theme"
              checked={theme === option.value}
              onChange={() => setTheme(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export function ChallengeForm({
  challengeId,
  title,
  goal,
  whyItMatters,
  successDefinition,
}: {
  challengeId: string;
  title: string;
  goal: string;
  whyItMatters: string;
  successDefinition: string;
}) {
  const router = useRouter();
  const [values, setValues] = React.useState({
    title,
    goal,
    whyItMatters,
    successDefinition,
  });
  const [status, setStatus] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function save() {
    setStatus(null);
    startTransition(async () => {
      const result = await updateChallengeAction({ challengeId, ...values });
      setStatus(result.ok ? "Saved." : result.error);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="max-w-[560px]">
      <Field label="Your goal" htmlFor="challenge-goal">
        <Input
          id="challenge-goal"
          value={values.goal}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              goal: event.target.value,
              title: event.target.value.slice(0, 120),
            }))
          }
        />
      </Field>

      <Field
        label="Why it matters"
        htmlFor="challenge-why"
        hint="Shown back to you when completion drops."
        className="mt-4"
      >
        <Textarea
          id="challenge-why"
          rows={3}
          value={values.whyItMatters}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              whyItMatters: event.target.value,
            }))
          }
        />
      </Field>

      <Field
        label="What would make Day 30 successful?"
        htmlFor="challenge-success"
        className="mt-4"
      >
        <Textarea
          id="challenge-success"
          rows={2}
          value={values.successDefinition}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              successDefinition: event.target.value,
            }))
          }
        />
      </Field>

      <div className="mt-4 flex items-center gap-3">
        <Button variant="secondary" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {status ? (
          <span className="text-[13px] text-[var(--color-neutral-400)]">
            {status}
          </span>
        ) : null}
      </div>
    </div>
  );
}
