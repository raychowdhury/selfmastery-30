"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import type { FormState } from "@/actions/auth";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" block size="lg" disabled={pending} className="mt-2">
      {pending ? "One moment…" : label}
    </Button>
  );
}

interface AuthFormProps {
  mode: "sign-in" | "sign-up";
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  next?: string;
}

export function AuthForm({ mode, action, next }: AuthFormProps) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const isSignUp = mode === "sign-up";

  return (
    <div>
      <h1 className="text-[30px]">
        {isSignUp ? "Start your 30 days" : "Welcome back"}
      </h1>
      <p className="text-muted mt-2 text-sm">
        {isSignUp
          ? "One goal, thirty days. Setup takes under two minutes."
          : "Pick up where you left off."}
      </p>

      <form action={formAction} className="mt-7 flex flex-col gap-4">
        {next ? <input type="hidden" name="next" value={next} /> : null}

        {isSignUp ? (
          <Field label="Your name" htmlFor="name" error={state.fieldErrors?.name}>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              required
              aria-invalid={state.fieldErrors?.name ? true : undefined}
            />
          </Field>
        ) : null}

        <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={state.fieldErrors?.email ? true : undefined}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          hint={isSignUp ? "At least 8 characters." : undefined}
          error={state.fieldErrors?.password}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
            aria-invalid={state.fieldErrors?.password ? true : undefined}
          />
        </Field>

        {state.error ? (
          <p role="alert" className="mb-0 text-[13px] text-[#d38b80]">
            {state.error}
          </p>
        ) : null}

        <SubmitButton label={isSignUp ? "Create my account" : "Sign in"} />
      </form>

      {isSignUp ? null : (
        <p className="text-muted mt-4 mb-0 text-center text-[13px]">
          <Link href="/forgot-password">Forgotten your password?</Link>
        </p>
      )}

      <p className="text-muted mt-6 mb-0 text-center text-[13px]">
        {isSignUp ? "Already have an account? " : "New here? "}
        <Link href={isSignUp ? "/sign-in" : "/sign-up"}>
          {isSignUp ? "Sign in" : "Start your 30 days"}
        </Link>
      </p>
    </div>
  );
}
