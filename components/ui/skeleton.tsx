import * as React from "react";

import { cn } from "@/lib/utils/cn";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface)]",
        className
      )}
      {...props}
    />
  );
}
