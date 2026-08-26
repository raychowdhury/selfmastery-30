import { apiOk, handler } from "@/lib/api/http";
import { isMailConfigured, mailTransport } from "@/lib/api/mailer";
import { prisma } from "@/lib/db";

/**
 * Deployment readiness, for the release checklist rather than for the app.
 *
 * It reports whether the pieces a *release* depends on are actually wired up,
 * so a missing mail key is caught before submission instead of by a user who
 * cannot get back into their account.
 *
 * Deliberately exposes no counts, versions or configuration values — only
 * whether each dependency is reachable.
 */
export const GET = handler(async () => {
  let database = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = true;
  } catch {
    database = false;
  }

  const rateLimiting = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
  const email = isMailConfigured();
  const authSecret = Boolean(process.env.AUTH_SECRET);

  const ready = database && email && authSecret;

  return apiOk({
    ready,
    checks: {
      database,
      authSecret,
      email,
      rateLimiting,
    },
    // Named so the checklist can quote them directly.
    notes: {
      email: email
        ? `Password reset can be delivered (via ${mailTransport()}).`
        : "No mail transport is configured. Set MAIL_FROM plus either RESEND_API_KEY or SMTP_HOST/SMTP_USER/SMTP_PASSWORD. Password reset returns an error rather than failing silently.",
      rateLimiting: rateLimiting
        ? "Sign-up and sign-in are throttled."
        : "UPSTASH_REDIS_REST_URL / _TOKEN are not set. Sign-up is unthrottled.",
    },
  });
});
