import bcrypt from "bcryptjs";
import { z } from "zod";

import { toUserDTO } from "@/lib/api/dto";
import { ApiFailure, apiOk, deviceName, handler, parseBody } from "@/lib/api/http";
import { issueDeviceSession } from "@/lib/api/tokens";
import { prisma } from "@/lib/db";
import { describeRetry, limitSignIn } from "@/lib/security/rate-limit";
import { credentialsSchema } from "@/lib/validations/auth";

const bodySchema = credentialsSchema.extend({
  deviceName: z.string().max(120).optional(),
});

export const POST = handler(async (request) => {
  const body = await parseBody(request, bodySchema);

  const limit = await limitSignIn(body.email);
  if (!limit.ok) {
    throw new ApiFailure(
      "rate_limited",
      `Too many sign-in attempts. Try again in ${describeRetry(limit.retryAfterSeconds)}.`
    );
  }

  const user = await prisma.user.findUnique({ where: { email: body.email } });

  // Hash even when the account is missing, so response time does not reveal
  // whether an address is registered.
  const hash = user?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin";
  const valid = await bcrypt.compare(body.password, hash);

  if (!user?.passwordHash || !valid) {
    throw new ApiFailure("unauthorized", "That email and password don't match.");
  }

  const session = await issueDeviceSession(
    user.id,
    body.deviceName ?? deviceName(request)
  );

  return apiOk({
    token: session.token,
    expiresAt: session.expiresAt.toISOString(),
    user: toUserDTO(user),
  });
});
