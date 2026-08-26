import { ApiFailure, apiOk, handler, requireUser } from "@/lib/api/http";
import { buildDayPayload } from "@/lib/api/payloads";

/**
 * A single day by its number within the challenge. Kept as a query parameter so
 * it does not collide with the id-keyed mutation routes below it.
 */
export const GET = handler(async (request) => {
  const userId = await requireUser(request);

  const raw = new URL(request.url).searchParams.get("dayNumber");
  const dayNumber = Number(raw);
  if (!Number.isInteger(dayNumber) || dayNumber < 1) {
    throw new ApiFailure("bad_request", "dayNumber must be a positive integer.");
  }

  const day = await buildDayPayload(userId, dayNumber);
  if (!day) throw new ApiFailure("not_found", "That day doesn't exist.");

  return apiOk(day);
});
