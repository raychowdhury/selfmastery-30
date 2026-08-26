import { z } from "zod";

import { apiOk, handler, parseBody, requireUser } from "@/lib/api/http";
import { savePriorities } from "@/lib/services/challenge-service";

const bodySchema = z.object({
  priorities: z
    .array(
      z.object({
        position: z.number().int().min(1).max(3),
        text: z.string().trim().max(160),
        completed: z.boolean(),
      })
    )
    .max(3),
});

export const PUT = handler(
  async (request, context: { params: Promise<{ dayId: string }> }) => {
    const userId = await requireUser(request);
    const { dayId } = await context.params;
    const { priorities } = await parseBody(request, bodySchema);

    await savePriorities(userId, dayId, priorities);
    return apiOk({ ok: true });
  }
);
