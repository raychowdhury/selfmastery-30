import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="wordmark text-[13px]">
        SELFMASTERY <span className="text-[var(--color-accent)]">30</span>
      </div>
      <h1 className="mt-8 text-[26px] sm:text-[32px]">
        There&apos;s nothing here.
      </h1>
      <p className="text-muted mt-2 max-w-[40ch] text-sm">
        The page you were looking for doesn&apos;t exist.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/today">Go to Today</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">Back to the start</Link>
        </Button>
      </div>
    </div>
  );
}
