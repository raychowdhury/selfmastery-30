import { toChallengeDTO } from "@/lib/api/dto";
import { apiOk, handler, requireUser } from "@/lib/api/http";
import { getActiveChallenge } from "@/lib/services/challenge-service";

export const GET = handler(async (request) => {
  const userId = await requireUser(request);
  const challenge = await getActiveChallenge(userId);
  return apiOk({ challenge: challenge ? toChallengeDTO(challenge) : null });
});
