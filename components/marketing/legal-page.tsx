import Link from "next/link";

import { Rule } from "@/components/ui/rule";

/**
 * Shared shell for the privacy policy, terms and support pages.
 *
 * These three URLs have to be publicly reachable and load without signing in —
 * Apple checks the privacy policy URL during review — so they live in the
 * marketing route group with no auth in front of them.
 */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated?: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="pb-10 pt-6 sm:pt-10">
      <div className="mx-auto max-w-[70ch]">
        <h1 className="text-[30px] sm:text-[38px]">{title}</h1>
        {updated ? (
          <p className="text-muted mt-2 mb-0 text-[13px]">Last updated: {updated}</p>
        ) : null}
        {intro ? (
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-neutral-300)]">
            {intro}
          </p>
        ) : null}

        <Rule className="my-8" />

        <div className="legal-body">{children}</div>

        <Rule className="my-10" />

        <p className="text-muted mb-0 text-[13px]">
          <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link> ·{" "}
          <Link href="/support">Support</Link> · <Link href="/">Home</Link>
        </p>
      </div>
    </main>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="text-[20px] sm:text-[22px]">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 text-[15px] leading-relaxed text-[var(--color-neutral-300)]">
        {children}
      </div>
    </section>
  );
}

/**
 * Marks a value the operator must supply. Rendered visibly rather than silently
 * substituted, so an unfilled placeholder cannot ship unnoticed.
 */
export function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <mark className="rounded bg-[var(--color-warning-soft,#3a2f14)] px-1.5 py-0.5 text-[var(--color-accent-200)]">
      {children}
    </mark>
  );
}
