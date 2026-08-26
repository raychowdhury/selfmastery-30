import bcrypt from "bcryptjs";
import { z } from "zod";

import { ApiFailure, apiOk, handler, parseBody } from "@/lib/api/http";
import { consumePasswordResetToken, revokeAllDeviceSessions } from "@/lib/api/tokens";
import { prisma } from "@/lib/db";

const bodySchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Use at least 8 characters."),
});

export const POST = handler(async (request) => {
  const body = await parseBody(request, bodySchema);

  const userId = await consumePasswordResetToken(body.token);
  if (!userId) {
    throw new ApiFailure(
      "bad_request",
      "That reset link has expired or already been used."
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(body.password, 10) },
  });

  // A password change should end every existing session: if the reset was
  // prompted by a compromise, leaving old tokens alive defeats the point.
  await revokeAllDeviceSessions(userId);

  return apiOk({ ok: true });
});
