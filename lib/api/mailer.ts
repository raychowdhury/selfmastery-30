import nodemailer from "nodemailer";

/**
 * Transactional email.
 *
 * Two transports, so a domain is not a prerequisite for shipping:
 *
 *   - **Resend** (HTTP API) once you own a domain. Better deliverability, a
 *     sending address at your own domain, and no per-day ceiling worth caring
 *     about at this scale.
 *   - **SMTP** otherwise — in practice Gmail with an App Password, which needs
 *     no domain at all. Mail is sent through Google from a `@gmail.com`
 *     address, so SPF and DKIM align and DMARC passes. Roughly 500 recipients
 *     a day.
 *
 * Sending from a `@gmail.com` address through anyone *other* than Google is a
 * different thing entirely and is not supported here: the From header would not
 * align with the signing domain, and the mail would be filtered as spoofed.
 *
 * When neither is configured, sending is skipped and logged rather than faked —
 * a password-reset flow that silently drops mail is worse than one that visibly
 * is not set up yet.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type MailResult = "sent" | "not-configured" | "failed";

/** Which transport, if any, the current environment can actually send with. */
export type MailTransport = "resend" | "smtp" | "none";

/**
 * Resolves the transport from the environment.
 *
 * Resend wins when both are present: if someone has gone to the trouble of
 * verifying a domain, that is the one they mean to send from.
 *
 * Read on every call rather than cached at module load, so a serverless
 * instance that starts before the variables land does not stay stuck on "none".
 */
export function mailTransport(): MailTransport {
  if (!process.env.MAIL_FROM) return "none";
  if (process.env.RESEND_API_KEY) return "resend";
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
  ) {
    return "smtp";
  }
  return "none";
}

/**
 * Whether transactional email can actually be delivered.
 *
 * Callers check this *before* offering a flow that depends on email. A password
 * reset that silently drops the message is worse than one that admits it is
 * unavailable: the person waits for a mail that will never arrive, and is
 * locked out of their account.
 */
export function isMailConfigured(): boolean {
  return mailTransport() !== "none";
}

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000")
  );
}

async function sendViaResend(
  to: string,
  subject: string,
  text: string
): Promise<MailResult> {
  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to, subject, text }),
  });

  if (!response.ok) {
    // Never log the body: it echoes the recipient address.
    console.error(`[mail] resend rejected the send (${response.status})`);
    return "failed";
  }
  return "sent";
}

/**
 * Port decides the handshake, and getting it wrong hangs rather than errors:
 * 465 is TLS from the first byte, everything else starts plaintext and upgrades
 * with STARTTLS.
 */
function smtpPort(): number {
  const parsed = Number(process.env.SMTP_PORT);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 465;
}

async function sendViaSmtp(
  to: string,
  subject: string,
  text: string
): Promise<MailResult> {
  const port = smtpPort();

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    // A serverless invocation should not sit and wait on a stalled connection
    // until the platform kills it; failing at 10s leaves room to report back.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });

  await transport.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text,
  });
  return "sent";
}

async function send(
  to: string,
  subject: string,
  text: string
): Promise<MailResult> {
  const transport = mailTransport();

  if (transport === "none") {
    console.warn(
      `[mail] no transport configured — skipping "${subject}". See DEPLOY.md.`
    );
    return "not-configured";
  }

  try {
    return transport === "resend"
      ? await sendViaResend(to, subject, text)
      : await sendViaSmtp(to, subject, text);
  } catch (error) {
    // Only the message: SMTP errors quote the envelope, which is the recipient.
    console.error(
      `[mail] ${transport} send threw:`,
      error instanceof Error ? error.name : "unknown error"
    );
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
