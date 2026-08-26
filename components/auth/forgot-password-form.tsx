"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      await fetch("/api/mobile/v1/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      // The response is deliberately identical whether or not the address
      // exists, so there is nothing to branch on.
      setSent(true);
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div>
        <h1 className="text-[30px]">Check your email</h1>
        <p className="text-muted mt-2 text-sm">
          If that address has an account, a reset link is on its way. It expires
          in 30 minutes.
        </p>
        <p className="mt-6 mb-0 text-sm">
          <Link href="/sign-in">Back to sign in</Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[30px]">Reset your password</h1>
      <p className="text-muted mt-2 text-sm">
        We&apos;ll email you a link to choose a new one.
      </p>

      <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
        <Field label="Email" htmlFor="forgot-email">
          <Input
            id="forgot-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Button type="submit" block size="lg" disabled={pending} className="mt-2">
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="text-muted mt-6 mb-0 text-center text-[13px]">
        <Link href="/sign-in">Back to sign in</Link>
      </p>
    </div>
  );
}
