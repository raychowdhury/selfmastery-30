"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/mobile/v1/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (response.ok) {
        setDone(true);
      } else {
        const body = await response.json().catch(() => null);
        setError(body?.error?.message ?? "That didn't work. Try again.");
      }
    } catch {
      setError("Couldn't reach the server. Check your connection.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div>
        <h1 className="text-[30px]">Password changed.</h1>
        <p className="text-muted mt-2 text-sm">
          You&apos;ve been signed out everywhere else. Sign in with your new
          password — in the app or here.
        </p>
        <Button asChild block size="lg" className="mt-6">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[30px]">Choose a new password</h1>
      <p className="text-muted mt-2 text-sm">
        Pick something you haven&apos;t used elsewhere.
      </p>

      <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
        <Field
          label="New password"
          htmlFor="new-password"
          hint="At least 8 characters."
          error={error ?? undefined}
        >
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>

        <Button type="submit" block size="lg" disabled={pending} className="mt-2">
          {pending ? "Saving…" : "Set new password"}
        </Button>
      </form>
    </div>
  );
}
