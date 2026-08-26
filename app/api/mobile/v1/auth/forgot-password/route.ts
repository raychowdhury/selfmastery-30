import { z } from "zod";

import { ApiFailure, apiOk, handler, parseBody } from "@/lib/api/http";
import { isMailConfigured, sendPasswordResetEmail } from "@/lib/api/mailer";
import { issuePasswordResetToken } from "@/lib/api/tokens";
import { prisma } from "@/lib/db";
import { limitSignIn } from "@/lib/security/rate-limit";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

/**
 * Always answers the same way, whether or not the address exists. Telling a
 * caller which emails are registered is an account-enumeration hole.
 */
export const POST = handler(async (request) => {
  const { email } = await parseBody(request, bodySchema);

  // Fail loudly rather than pretending. Without a mail provider this endpoint
  // would return success and send nothing, which reads as working and leaves
  // the person locked out.
  if (!isMailConfigured()) {
    // 503, not 500: the service is correctly built but a dependency is not
    // configured. The distinction matters when reading production logs.
    throw new ApiFailure(
      "service_unavailable",
      "Password reset is temporarily unavailable. Please contact support."
    );
  }

  // Reuse the sign-in limiter: same abuse shape, same key.
  const limit = await limitSignIn(email);
  if (limit.ok) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });

    if (user?.passwordHash) {
      const reset = await issuePasswordResetToken(user.id);
      await sendPasswordResetEmail(email, reset.token);
    }
  }

  return apiOk({
    ok: true,
    message: "If that address has an account, a reset link is on its way.",
  });
});
