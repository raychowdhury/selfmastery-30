import { apiOk, handler, requireUser } from "@/lib/api/http";
import { finishDay } from "@/lib/services/challenge-service";

export const POST = handler(
  async (request, context: { params: Promise<{ dayId: string }> }) => {
    const userId = await requireUser(request);
    const { dayId } = await context.params;

    await finishDay(userId, dayId);
    return apiOk({ ok: true });
  }
);
