import { z } from "zod";

import { apiOk, handler, parseBody, requireUser } from "@/lib/api/http";
import { saveReflection } from "@/lib/services/challenge-service";

const bodySchema = z.object({
  dayFeeling: z.enum(["EASY", "GOOD", "DIFFICULT"]).nullable().optional(),
  note: z.string().trim().max(1000).optional(),
  whatHelped: z.string().trim().max(1000).optional(),
  whatGotInWay: z.string().trim().max(1000).optional(),
});

export const PUT = handler(
  async (request, context: { params: Promise<{ dayId: string }> }) => {
    const userId = await requireUser(request);
    const { dayId } = await context.params;
    const body = await parseBody(request, bodySchema);

    await saveReflection(userId, dayId, {
      dayFeeling: body.dayFeeling ?? null,
      note: body.note,
      whatHelped: body.whatHelped,
      whatGotInWay: body.whatGotInWay,
    });

    return apiOk({ ok: true });
  }
);
