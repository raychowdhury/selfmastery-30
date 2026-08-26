import { OPERATOR_CONFIGURED } from "@/lib/content/legal";

/**
 * Shown while operator details are still placeholders.
 *
 * A half-finished privacy policy that looks finished is worse than one that
 * says so: it can be linked from an App Store listing and read as binding.
 */
export function DraftNotice() {
  if (OPERATOR_CONFIGURED) return null;

  return (
    <div className="mb-8 rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-4">
      <p className="mb-0 text-[13px] leading-relaxed text-[var(--color-neutral-400)]">
        <strong className="text-[var(--color-text)]">Draft.</strong> The
        highlighted values below have not been filled in, and this document has
        not been reviewed by a lawyer. Complete{" "}
        <code className="text-[var(--color-accent-200)]">lib/content/legal.ts</code>{" "}
        and obtain legal review before linking this page from an App Store
        listing.
      </p>
    </div>
  );
}
