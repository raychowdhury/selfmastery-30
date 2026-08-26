import type { DifficultyFeedback } from "@/lib/generated/prisma/enums";

import type { AdjustmentDirection } from "@/lib/challenge/adjustment";
import { decideAdjustment, scaleMinutes } from "@/lib/challenge/adjustment";
import { prisma } from "@/lib/db";

export async function applyAdjustment(
  challengeId: string,
  direction: AdjustmentDirection,
  fromDay: number
): Promise<number> {
  if (direction === "HOLD") return 0;

  const days = await prisma.challengeDay.findMany({
    where: { challengeId, dayNumber: { gt: fromDay } },
    include: { actions: { orderBy: { sortOrder: "asc" } } },
  });

  if (days.length === 0) return 0;

  await prisma.$transaction(
    days.flatMap((day) => {
      const required = day.actions.filter((action) => !action.optional);

      return day.actions.map((action, index) => {
        const isLastRequired =
          !action.optional &&
          required.length >= 3 &&
          action.id === required[required.length - 1].id;

        return prisma.dailyAction.update({
          where: { id: action.id },
          data: {
            estimatedMinutes: scaleMinutes(action.estimatedMinutes, direction),
            // Reducing sheds the least important required action; increasing
            // promotes one optional extra back into the plan.
            optional:
              direction === "REDUCE"
                ? isLastRequired || action.optional
                : index === 0
                  ? false
                  : action.optional && index > 2,
          },
        });
      });
    })
  );

  return days.length;
}

export async function saveWeeklyReview(
  userId: string,
  input: {
    challengeId: string;
    weekNumber: number;
    wentWell?: string;
    struggledWith?: string;
    mainObstacle: string[];
    difficultyFeedback: DifficultyFeedback;
    nextWeekChange?: string;
  },
  completionRate: number,
  currentDay: number
) {
  const challenge = await prisma.challenge.findFirst({
    where: { id: input.challengeId, userId },
    select: { id: true },
  });
  if (!challenge) throw new Error("NOT_FOUND");

  const decision = decideAdjustment(completionRate, input.difficultyFeedback);

  await prisma.weeklyReview.upsert({
    where: {
      challengeId_weekNumber: {
        challengeId: challenge.id,
        weekNumber: input.weekNumber,
      },
    },
    create: {
      challengeId: challenge.id,
      weekNumber: input.weekNumber,
      wentWell: input.wentWell || null,
      struggledWith: input.struggledWith || null,
      mainObstacle: input.mainObstacle,
      difficultyFeedback: input.difficultyFeedback,
      nextWeekChange: input.nextWeekChange || null,
      completionRate,
    },
    update: {
      wentWell: input.wentWell || null,
      struggledWith: input.struggledWith || null,
      mainObstacle: input.mainObstacle,
      difficultyFeedback: input.difficultyFeedback,
      nextWeekChange: input.nextWeekChange || null,
      completionRate,
    },
  });

  // Never touch a day the user has already lived through.
  const fromDay = Math.max(currentDay, input.weekNumber * 7);
  const daysAffected = await applyAdjustment(
    challenge.id,
    decision.direction,
    fromDay
  );

  await prisma.planAdjustment.create({
    data: {
      challengeId: challenge.id,
      source: "WEEKLY_REVIEW",
      rationale: decision.rationale,
      summary: decision.summary,
      appliedFromDay: fromDay + 1,
      daysAffected,
    },
  });

  return decision;
}

export async function listReviews(userId: string, challengeId: string) {
  return prisma.weeklyReview.findMany({
    where: { challengeId, challenge: { userId } },
    orderBy: { weekNumber: "asc" },
  });
}

export async function listAdjustments(userId: string, challengeId: string) {
  return prisma.planAdjustment.findMany({
    where: { challengeId, challenge: { userId } },
    orderBy: { createdAt: "desc" },
  });
}
