"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-[24px] sm:text-[30px]">That didn&apos;t load.</h1>
      <p className="text-muted mt-2 max-w-[42ch] text-sm">
        Something went wrong on our side, not yours. Your progress is saved.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="secondary">
          <a href="/today">Go to Today</a>
        </Button>
      </div>
      {error.digest ? (
        <p className="mt-6 mb-0 text-[12px] text-[var(--color-neutral-600)]">
          Reference: {error.digest}
        </p>
      ) : null}
    </div>
  );
}
