import { z } from "zod";

import { apiOk, handler, parseBody, requireUser } from "@/lib/api/http";
import { saveReflection } from "@/lib/services/challenge-service";

/**
 * Optional text is `nullish`, not merely `optional`: a JSON client that has no
 * value naturally sends `null` rather than omitting the key, and rejecting that
 * would be a needless client-side special case.
 */
const bodySchema = z.object({
  dayFeeling: z.enum(["EASY", "GOOD", "DIFFICULT"]).nullish(),
  note: z.string().trim().max(1000).nullish(),
  whatHelped: z.string().trim().max(1000).nullish(),
  whatGotInWay: z.string().trim().max(1000).nullish(),
});

export const PUT = handler(
  async (request, context: { params: Promise<{ dayId: string }> }) => {
    const userId = await requireUser(request);
    const { dayId } = await context.params;
    const body = await parseBody(request, bodySchema);

    await saveReflection(userId, dayId, {
      dayFeeling: body.dayFeeling ?? null,
      note: body.note ?? undefined,
      whatHelped: body.whatHelped ?? undefined,
      whatGotInWay: body.whatGotInWay ?? undefined,
    });

    return apiOk({ ok: true });
  }
);
