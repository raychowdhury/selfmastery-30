import { apiOk, handler, requireUser } from "@/lib/api/http";
import { buildTodayPayload } from "@/lib/api/payloads";

export const GET = handler(async (request) => {
  const userId = await requireUser(request);
  const payload = await buildTodayPayload(userId);

  if (!payload) {
    // Not an error: a signed-in user with no active challenge is a valid state
    // the client routes on.
    return apiOk({ challenge: null });
  }
  return apiOk(payload);
});
