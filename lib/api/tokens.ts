import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { prisma } from "@/lib/db";

/**
 * Bearer tokens for the native client.
 *
 * The token is 32 bytes of CSPRNG output, so it has far more entropy than any
 * password. That means a fast hash (SHA-256) is the right choice rather than
 * bcrypt: there is nothing to brute-force, and every authenticated request has
 * to verify it.
 */

const TOKEN_BYTES = 32;
const SESSION_TTL_DAYS = 60;
/** Sliding expiry: only rewrite `expiresAt` when it has moved meaningfully. */
const REFRESH_THRESHOLD_DAYS = 1;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function constantTimeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export interface IssuedToken {
  token: string;
  expiresAt: Date;
}

export async function issueDeviceSession(
  userId: string,
  deviceName: string | null,
  platform = "ios"
): Promise<IssuedToken> {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  const expiresAt = new Date(
    Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
  );

  await prisma.deviceSession.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      deviceName: deviceName?.slice(0, 120) ?? null,
      platform,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export interface ResolvedSession {
  userId: string;
  sessionId: string;
}

/**
 * Resolves a bearer token to its owner, or null. Expired sessions are deleted
 * on sight so the table does not accumulate dead rows.
 */
export async function resolveDeviceSession(
  token: string
): Promise<ResolvedSession | null> {
  if (!token) return null;

  const session = await prisma.deviceSession.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, expiresAt: true, tokenHash: true },
  });
  if (!session) return null;

  if (!constantTimeEquals(session.tokenHash, hashToken(token))) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.deviceSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  const remainingMs = session.expiresAt.getTime() - Date.now();
  const fullTtlMs = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
  if (fullTtlMs - remainingMs > REFRESH_THRESHOLD_DAYS * 24 * 60 * 60 * 1000) {
    await prisma.deviceSession
      .update({
        where: { id: session.id },
        data: {
          lastUsedAt: new Date(),
          expiresAt: new Date(Date.now() + fullTtlMs),
        },
      })
      .catch(() => {});
  }

  return { userId: session.userId, sessionId: session.id };
}

export async function revokeDeviceSession(token: string): Promise<void> {
  await prisma.deviceSession
    .deleteMany({ where: { tokenHash: hashToken(token) } })
    .catch(() => {});
}

export async function revokeAllDeviceSessions(userId: string): Promise<void> {
  await prisma.deviceSession.deleteMany({ where: { userId } });
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

const RESET_TTL_MINUTES = 30;

export async function issuePasswordResetToken(
  userId: string
): Promise<IssuedToken> {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);

  // Only the newest reset link should work.
  await prisma.passwordResetToken.deleteMany({
    where: { userId, usedAt: null },
  });

  await prisma.passwordResetToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });

  return { token, expiresAt };
}

export async function consumePasswordResetToken(
  token: string
): Promise<string | null> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return record.userId;
}
