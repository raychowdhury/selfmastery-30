import { z } from "zod";

import { apiOk, handler, parseBody, requireUser } from "@/lib/api/http";
import { setMinimumDay } from "@/lib/services/challenge-service";

const bodySchema = z.object({ isMinimumDay: z.boolean() });

export const PUT = handler(
  async (request, context: { params: Promise<{ dayId: string }> }) => {
    const userId = await requireUser(request);
    const { dayId } = await context.params;
    const { isMinimumDay } = await parseBody(request, bodySchema);

    await setMinimumDay(userId, dayId, isMinimumDay);
    return apiOk({ ok: true });
  }
);
