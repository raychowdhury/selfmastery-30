import { z } from "zod";

import { ApiFailure, apiOk, handler, parseBody, requireUser } from "@/lib/api/http";
import { prisma } from "@/lib/db";
import { completeChallenge } from "@/lib/services/challenge-service";

const bodySchema = z.object({
  reflection: z.string().trim().max(2000).nullish(),
  biggestChange: z.string().trim().max(500).nullish(),
  nextGoal: z.string().trim().max(300).nullish(),
});

export const PUT = handler(
  async (request, context: { params: Promise<{ challengeId: string }> }) => {
    const userId = await requireUser(request);
    const { challengeId } = await context.params;
    const body = await parseBody(request, bodySchema);

    const challenge = await prisma.challenge.findFirst({
      where: { id: challengeId, userId },
      select: { id: true },
    });
    if (!challenge) throw new ApiFailure("not_found", "Challenge not found.");

    await prisma.finalReflection.upsert({
      where: { challengeId: challenge.id },
      create: {
        challengeId: challenge.id,
        reflection: body.reflection || null,
        biggestChange: body.biggestChange || null,
        nextGoal: body.nextGoal || null,
      },
      update: {
        reflection: body.reflection || null,
        biggestChange: body.biggestChange || null,
        nextGoal: body.nextGoal || null,
      },
    });

    await completeChallenge(userId, challenge.id);
    return apiOk({ ok: true });
  }
);
