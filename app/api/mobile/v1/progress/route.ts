import { apiOk, handler, requireUser } from "@/lib/api/http";
import { buildProgressPayload } from "@/lib/api/payloads";

export const GET = handler(async (request) => {
  const userId = await requireUser(request);
  const payload = await buildProgressPayload(userId);
  if (!payload) return apiOk({ stats: null });
  return apiOk(payload);
});
