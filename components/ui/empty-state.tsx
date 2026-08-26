import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-divider)] px-6 py-14 text-center",
        className
      )}
    >
      {Icon ? (
        <span className="mb-4 grid size-11 place-items-center rounded-full bg-[var(--color-surface)]">
          <Icon className="size-5 text-[var(--color-neutral-500)]" />
        </span>
      ) : null}
      <h3 className="heading text-[19px]">{title}</h3>
      {description ? (
        <p className="mt-2 mb-0 max-w-sm text-sm leading-relaxed text-[var(--color-neutral-400)]">
          {description}
        </p>
      ) : null}
      {actionLabel && actionHref ? (
        <Button asChild className="mt-5">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
