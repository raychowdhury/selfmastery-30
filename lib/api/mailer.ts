/**
 * Transactional email.
 *
 * Resend is used when configured. When it is not, sending is skipped and logged
 * rather than faked — a password-reset flow that silently drops mail is worse
 * than one that visibly is not set up yet.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type MailResult = "sent" | "not-configured" | "failed";

/**
 * Whether transactional email can actually be delivered.
 *
 * Callers check this *before* offering a flow that depends on email. A password
 * reset that silently drops the message is worse than one that admits it is
 * unavailable: the person waits for a mail that will never arrive, and is
 * locked out of their account.
 */
export function isMailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000")
  );
}

async function send(
  to: string,
  subject: string,
  text: string
): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!apiKey || !from) {
    console.warn(
      `[mail] RESEND_API_KEY/MAIL_FROM not set — skipping "${subject}". See DEPLOY.md.`
    );
    return "not-configured";
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, text }),
    });

    if (!response.ok) {
      // Never log the body: it echoes the recipient address.
      console.error(`[mail] send failed with status ${response.status}`);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("[mail] send threw", error);
    return "failed";
  }
}

export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<MailResult> {
  const link = `${siteUrl()}/reset-password?token=${encodeURIComponent(token)}`;

  return send(
    to,
    "Reset your SelfMastery password",
    [
      "Someone asked to reset the password on your SelfMastery account.",
      "",
      "Open this link to choose a new one. It expires in 30 minutes:",
      link,
      "",
      "If this wasn't you, you can ignore this email — nothing has changed.",
    ].join("\n")
  );
}
