import bcrypt from "bcryptjs";
import { z } from "zod";

import { ApiFailure, apiOk, handler, parseBody, requireUser } from "@/lib/api/http";
import { prisma } from "@/lib/db";

const bodySchema = z.object({
  /** Re-authentication. Deleting everything should not be one stray tap away. */
  password: z.string().min(1, "Enter your password to confirm."),
});

/**
 * Permanent account deletion, required by App Store Review Guideline 5.1.1(v)
 * for any app that lets people create an account.
 *
 * Every row belonging to the user cascades from `User` — challenges, days,
 * actions, priorities, reflections, reviews, adjustments, device sessions and
 * reset tokens. Nothing is retained, and nothing is merely deactivated.
 */
export const DELETE = handler(async (request) => {
  const userId = await requireUser(request);
  const body = await parseBody(request, bodySchema);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });
  if (!user?.passwordHash) {
    throw new ApiFailure("unauthorized", "Your session has expired.");
  }

  const valid = await bcrypt.compare(body.password, user.passwordHash);
  if (!valid) {
    throw new ApiFailure("forbidden", "That password isn't right.", {
      password: "That password isn't right.",
    });
  }

  await prisma.user.delete({ where: { id: userId } });

  return apiOk({ ok: true });
});
