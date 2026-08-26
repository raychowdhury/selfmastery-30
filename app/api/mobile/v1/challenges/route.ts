import { toChallengeDTO } from "@/lib/api/dto";
import { apiOk, handler, parseBody, requireUser } from "@/lib/api/http";
import { buildHistoryPayload } from "@/lib/api/payloads";
import { createChallenge, getChallengeForUser } from "@/lib/services/challenge-service";
import { onboardingSchema } from "@/lib/validations/challenge";

/** Every challenge the user has ever run, newest first. */
export const GET = handler(async (request) => {
  const userId = await requireUser(request);
  return apiOk({ challenges: await buildHistoryPayload(userId) });
});

/**
 * Creates a challenge from the onboarding answers. Plan generation stays on the
 * server — the device never assembles a plan.
 */
export const POST = handler(async (request) => {
  const userId = await requireUser(request);
  const input = await parseBody(request, onboardingSchema);

  const { id } = await createChallenge(userId, input);
  const challenge = await getChallengeForUser(userId, id);

  return apiOk({ challenge: challenge ? toChallengeDTO(challenge) : null }, 201);
});
