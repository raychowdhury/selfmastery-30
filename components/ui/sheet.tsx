"use client";

import * as React from "react";

import { cn } from "@/lib/utils/cn";

/**
 * The Calm bottom sheet: a dimmed ground and a blurred panel that rises from
 * the bottom edge. Escape and a click on the ground both close it.
 */
export function CalmSheet({
  open,
  onClose,
  label,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-bg)_55%,transparent)]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn(
          "calm-rise absolute inset-x-0 bottom-0",
          "border-t border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)]",
          "bg-[color-mix(in_srgb,var(--color-surface)_88%,transparent)]",
          "shadow-[var(--shadow-lg)] backdrop-blur-[18px]",
          "rounded-t-[var(--radius-lg)]",
          className
        )}
      >
        <div className="mx-auto w-full max-w-[430px] px-7 pt-8 pb-[max(36px,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
}
