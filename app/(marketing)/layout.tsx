import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-dvh bg-[var(--color-page)]">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-10">
        <nav className="flex items-center gap-5 py-4 sm:gap-7 sm:py-[18px]">
          <Link
            href="/"
            className="wordmark mr-auto text-[13px] no-underline text-[var(--color-text)] sm:text-[15px]"
          >
            SELFMASTERY <span className="text-[var(--color-accent)]">30</span>
          </Link>

          <Link
            href="/#how"
            className="hidden text-sm no-underline text-[var(--color-neutral-300)] hover:text-[var(--color-text)] sm:block"
          >
            How it works
          </Link>
          <Link
            href="/templates"
            className="hidden text-sm no-underline text-[var(--color-neutral-300)] hover:text-[var(--color-text)] sm:block"
          >
            Templates
          </Link>
          <Link
            href="/#why"
            className="hidden text-sm no-underline text-[var(--color-neutral-300)] hover:text-[var(--color-text)] sm:block"
          >
            Why 30 Days
          </Link>

          {user ? (
            <Button asChild size="sm">
              <Link href="/today">Go to Today</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/sign-up">Start Your 30 Days</Link>
              </Button>
            </>
          )}
        </nav>

        {children}

        <footer className="flex flex-col items-start gap-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:py-16">
          <div>
            <p className="mb-0 text-[12.5px] text-[var(--color-neutral-600)]">
              SelfMastery — one meaningful change at a time.
            </p>
            <p className="mt-2 mb-0 text-[12.5px] text-[var(--color-neutral-600)]">
              <Link href="/privacy">Privacy</Link> ·{" "}
              <Link href="/terms">Terms</Link> ·{" "}
              <Link href="/support">Support</Link>
            </p>
          </div>
          <Button asChild>
            <Link href="/sign-up">Start My 30 Days</Link>
          </Button>
        </footer>
      </div>
    </div>
  );
}
