import * as React from "react";

import { cn } from "@/lib/utils/cn";

type NativeInput = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
>;

interface ChoiceProps extends NativeInput {
  label: string;
  description?: string;
  /** Radio for one-of-many, checkbox for multi-select. */
  control?: "radio" | "checkbox";
}

/**
 * The onboarding category tile. Backed by a real input so keyboard navigation,
 * screen readers and form submission all behave natively. Selection reads
 * through border, tint and text colour together — never colour alone.
 */
export const Tile = React.forwardRef<HTMLInputElement, ChoiceProps>(
  ({ label, description, control = "radio", className, ...props }, ref) => (
    <label className={cn("tile", className)}>
      <input ref={ref} type={control} {...props} />
      <span className="block">{label}</span>
      {description ? <span className="tile-sub">{description}</span> : null}
    </label>
  )
);
Tile.displayName = "Tile";

/** The rounded chip used for moods, obstacles and difficulty. */
export const Pill = React.forwardRef<HTMLInputElement, ChoiceProps>(
  ({ label, control = "radio", className, ...props }, ref) => (
    <label className={cn("pill", className)}>
      <input ref={ref} type={control} {...props} />
      <span>{label}</span>
    </label>
  )
);
Pill.displayName = "Pill";

export function TileGrid({
  className,
  columns = 4,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { columns?: 2 | 3 | 4 }) {
  return (
    <div
      className={cn(
        "grid gap-2.5",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-2 sm:grid-cols-3",
        columns === 4 && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
        className
      )}
      {...props}
    />
  );
}

export function PillRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-wrap gap-2", className)} {...props} />;
}
