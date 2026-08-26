import { z } from "zod";

import { toUserDTO } from "@/lib/api/dto";
import { ApiFailure, apiOk, handler, parseBody, requireUser } from "@/lib/api/http";
import { prisma } from "@/lib/db";

const patchSchema = z.object({
  name: z.string().trim().min(1, "Tell us what to call you.").max(80),
});

export const GET = handler(async (request) => {
  const userId = await requireUser(request);

  const [user, activeChallenge] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.challenge.findFirst({
      where: { userId, status: "ACTIVE" },
      select: { id: true },
    }),
  ]);

  if (!user) throw new ApiFailure("unauthorized", "Your session has expired.");

  return apiOk({
    user: toUserDTO(user),
    hasActiveChallenge: Boolean(activeChallenge),
  });
});

export const PATCH = handler(async (request) => {
  const userId = await requireUser(request);
  const body = await parseBody(request, patchSchema);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name: body.name },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return apiOk({ user: toUserDTO(user) });
});
