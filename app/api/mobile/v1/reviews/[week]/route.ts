import { z } from "zod";

import { ApiFailure, apiOk, handler, parseBody, requireUser } from "@/lib/api/http";
import { buildReviewsPayload } from "@/lib/api/payloads";
import { summariseWeek } from "@/lib/challenge/adjustment";
import { getChallengeContext } from "@/lib/services/context";
import { saveWeeklyReview } from "@/lib/services/review-service";

const bodySchema = z.object({
  wentWell: z.string().trim().max(1000).optional(),
  struggledWith: z.string().trim().max(1000).optional(),
  mainObstacle: z.array(z.string().max(40)).max(10).default([]),
  difficultyFeedback: z.enum(["TOO_EASY", "ABOUT_RIGHT", "TOO_DIFFICULT"]),
  nextWeekChange: z.string().trim().max(1000).optional(),
});

/**
 * Saving a review is what adjusts the days ahead. The decision itself is made
 * server-side so the phone cannot talk the plan into being easier.
 */
export const PUT = handler(
  async (request, context: { params: Promise<{ week: string }> }) => {
    const userId = await requireUser(request);
    const weekNumber = Number((await context.params).week);
    if (!Number.isInteger(weekNumber) || weekNumber < 1) {
      throw new ApiFailure("bad_request", "Invalid week.");
    }

    const body = await parseBody(request, bodySchema);
    const challengeContext = await getChallengeContext(userId);
    if (!challengeContext) {
      throw new ApiFailure("not_found", "No active challenge.");
    }

    const summary = summariseWeek(
      challengeContext.snapshots,
      weekNumber,
      challengeContext.challenge.lengthDays
    );

    const decision = await saveWeeklyReview(
      userId,
      {
        challengeId: challengeContext.challenge.id,
        weekNumber,
        wentWell: body.wentWell,
        struggledWith: body.struggledWith,
        mainObstacle: body.mainObstacle,
        difficultyFeedback: body.difficultyFeedback,
        nextWeekChange: body.nextWeekChange,
      },
      summary.completionRate,
      challengeContext.dayNumber
    );

    return apiOk({
      adjustment: {
        direction: decision.direction,
        summary: decision.summary,
        rationale: decision.rationale,
      },
      reviews: (await buildReviewsPayload(userId)) ?? [],
    });
  }
);
