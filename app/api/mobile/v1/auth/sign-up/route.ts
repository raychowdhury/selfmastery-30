import bcrypt from "bcryptjs";
import { z } from "zod";

import { toUserDTO } from "@/lib/api/dto";
import { ApiFailure, apiOk, deviceName, handler, parseBody } from "@/lib/api/http";
import { issueDeviceSession } from "@/lib/api/tokens";
import { prisma } from "@/lib/db";
import { describeRetry, limitSignUp } from "@/lib/security/rate-limit";
import { signUpSchema } from "@/lib/validations/auth";

const bodySchema = signUpSchema.extend({
  deviceName: z.string().max(120).optional(),
});

export const POST = handler(async (request) => {
  const body = await parseBody(request, bodySchema);

  const limit = await limitSignUp();
  if (!limit.ok) {
    throw new ApiFailure(
      "rate_limited",
      `Too many accounts created from here. Try again in ${describeRetry(limit.retryAfterSeconds)}.`
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: body.email },
    select: { id: true },
  });
  if (existing) {
    throw new ApiFailure("conflict", "That email is already registered.", {
      email: "That email is already registered.",
    });
  }

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash: await bcrypt.hash(body.password, 10),
    },
  });

  const session = await issueDeviceSession(
    user.id,
    body.deviceName ?? deviceName(request)
  );

  return apiOk(
    {
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
      user: toUserDTO(user),
    },
    201
  );
});
