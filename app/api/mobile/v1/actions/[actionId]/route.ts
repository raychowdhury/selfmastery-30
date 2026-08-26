import { z } from "zod";

import { apiOk, handler, parseBody, requireUser } from "@/lib/api/http";
import { setActionCompleted } from "@/lib/services/challenge-service";

const bodySchema = z.object({ completed: z.boolean() });

export const PATCH = handler(
  async (request, context: { params: Promise<{ actionId: string }> }) => {
    const userId = await requireUser(request);
    const { actionId } = await context.params;
    const { completed } = await parseBody(request, bodySchema);

    // Ownership is enforced inside the service: the update is scoped by userId,
    // so an id belonging to somebody else simply does not match.
    await setActionCompleted(userId, actionId, completed);

    return apiOk({ ok: true });
  }
);
