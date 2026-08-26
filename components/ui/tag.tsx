import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const tagVariants = cva("tag", {
  variants: {
    variant: {
      accent: "tag-accent",
      accent2: "tag-accent-2",
      neutral: "tag-neutral",
      outline: "tag-outline",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export function Tag({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof tagVariants>) {
  return <span className={cn(tagVariants({ variant }), className)} {...props} />;
}
