import { cn } from "@/lib/utils/cn";

interface TrackProps {
  /** 0–100 */
  value: number;
  label: string;
  className?: string;
  /** Overrides the accent fill — used to distinguish pillars from each other. */
  fillColor?: string;
}

export function Track({ value, label, className, fillColor }: TrackProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("track", className)}
    >
      <div
        className="track-fill"
        style={{ width: `${clamped}%`, background: fillColor }}
      />
    </div>
  );
}
