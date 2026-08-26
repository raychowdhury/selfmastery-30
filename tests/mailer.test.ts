import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { isMailConfigured, mailTransport } from "@/lib/api/mailer";

/**
 * These guard a release decision rather than a behaviour: `isMailConfigured`
 * is what stops the app offering a password reset it cannot deliver. Getting
 * it wrong in either direction is a bad day — a false positive locks someone
 * out silently, a false negative disables a feature that works.
 */

const KEYS = [
  "MAIL_FROM",
  "RESEND_API_KEY",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_PORT",
] as const;

let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));
  for (const key of KEYS) delete process.env[key];
});

afterEach(() => {
  for (const key of KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe("Mail transport selection", () => {
  it("Reports nothing configured on a bare environment", () => {
    expect(mailTransport()).toBe("none");
    expect(isMailConfigured()).toBe(false);
  });

  it("Uses Resend when its key and a sender are present", () => {
    process.env.MAIL_FROM = "SelfMastery <hello@example.com>";
    process.env.RESEND_API_KEY = "re_test";
    expect(mailTransport()).toBe("resend");
  });

  it("Falls back to SMTP when there is no Resend key", () => {
    process.env.MAIL_FROM = "SelfMastery <someone@gmail.com>";
    process.env.SMTP_HOST = "smtp.gmail.com";
    process.env.SMTP_USER = "someone@gmail.com";
    process.env.SMTP_PASSWORD = "app-password";
    expect(mailTransport()).toBe("smtp");
    expect(isMailConfigured()).toBe(true);
  });

  it("Prefers Resend when both are configured", () => {
    process.env.MAIL_FROM = "SelfMastery <hello@example.com>";
    process.env.RESEND_API_KEY = "re_test";
    process.env.SMTP_HOST = "smtp.gmail.com";
    process.env.SMTP_USER = "someone@gmail.com";
    process.env.SMTP_PASSWORD = "app-password";
    expect(mailTransport()).toBe("resend");
  });

  // A half-filled SMTP block is the likeliest deployment mistake, and the one
  // that would otherwise fail at send time in front of a locked-out person.
  it("Treats partial SMTP settings as unconfigured", () => {
    process.env.MAIL_FROM = "SelfMastery <someone@gmail.com>";
    process.env.SMTP_HOST = "smtp.gmail.com";
    process.env.SMTP_USER = "someone@gmail.com";
    expect(mailTransport()).toBe("none");
  });

  it("Requires a sender even with a working transport", () => {
    process.env.RESEND_API_KEY = "re_test";
    expect(mailTransport()).toBe("none");
  });
});
