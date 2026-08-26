import { apiOk, handler, requireUser } from "@/lib/api/http";
import { buildReviewsPayload } from "@/lib/api/payloads";

export const GET = handler(async (request) => {
  const userId = await requireUser(request);
  const reviews = await buildReviewsPayload(userId);
  return apiOk({ reviews: reviews ?? [] });
});
