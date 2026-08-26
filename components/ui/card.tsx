import * as React from "react";

import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card-title", className)} {...props} />;
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("card-body", className)} {...props} />;
}

export function CardMeta({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card-meta", className)} {...props} />;
}

export function CardKicker({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card-kicker", className)} {...props} />;
}

/** A panel is a card without the flex-column list semantics — used for the
 *  goal reminder, progress summary and insight blocks. */
export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] bg-[var(--color-surface)] p-[18px]",
        className
      )}
      {...props}
    />
  );
}
