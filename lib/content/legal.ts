/**
 * Operator details used across the legal and support pages.
 *
 * Every value here must be replaced before submitting to the App Store. They
 * are collected in one place so filling them in is a single edit, and so an
 * unfilled value is obvious rather than buried in prose.
 *
 * `isConfigured` is false while any placeholder remains; the pages render a
 * visible notice in that case so a draft cannot be mistaken for a final policy.
 */
export const OPERATOR = {
  legalEntity: "[LEGAL ENTITY NAME]",
  address: "[REGISTERED ADDRESS]",
  privacyEmail: "[PRIVACY CONTACT EMAIL]",
  supportEmail: "[SUPPORT EMAIL]",
  jurisdiction: "[JURISDICTION]",
  supervisoryAuthority: "[RELEVANT DATA PROTECTION AUTHORITY]",
  backupRetention: "[BACKUP RETENTION PERIOD]",
  supportResponseTime: "[RESPONSE TIME]",
  effectiveDate: "[DATE]",
  minimumAge: 13,
} as const;

/** Processors the service actually uses. Keep accurate — an outdated list is a
 *  common compliance failure. */
export const PROCESSORS = [
  {
    name: "Vercel Inc.",
    purpose: "Runs the application",
    data: "Requests, IP addresses",
  },
  {
    name: "Neon Inc.",
    purpose: "Stores your account and challenges",
    data: "All account data",
  },
  {
    name: "Upstash Inc.",
    purpose: "Prevents sign-up and sign-in abuse",
    data: "IP address, email",
  },
  {
    // Depends on which transport DEPLOY.md section 6 ends up on:
    // "Google LLC (Gmail)" for the SMTP path, "Resend Inc." for the API path.
    name: "[EMAIL PROVIDER]",
    purpose: "Sends password reset emails",
    data: "Email address",
  },
] as const;

export function isPlaceholder(value: string): boolean {
  return value.startsWith("[") && value.endsWith("]");
}

/** True only once every operator detail has been filled in. */
export const OPERATOR_CONFIGURED = !Object.values(OPERATOR).some(
  (value) => typeof value === "string" && isPlaceholder(value)
);
