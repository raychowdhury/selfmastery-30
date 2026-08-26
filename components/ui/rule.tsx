import { cn } from "@/lib/utils/cn";

/**
 * A freestanding rule. It fades to transparent over the last 48px at each end
 * — the design system's signature separator.
 */
export function Rule({ className }: { className?: string }) {
  return <div role="presentation" className={cn("hr", className)} />;
}
