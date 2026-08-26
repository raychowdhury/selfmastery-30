import * as React from "react";

import { cn } from "@/lib/utils/cn";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("input", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn("input", className)} {...props} />
));
Textarea.displayName = "Textarea";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("field", className)}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? (
        <p className="mt-1.5 mb-0 text-[12.5px] text-[#d38b80]">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 mb-0 text-[12.5px] text-[var(--color-neutral-500)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
