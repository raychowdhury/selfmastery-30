"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/auth";
import { summariseWeek } from "@/lib/challenge/adjustment";
import { prisma } from "@/lib/db";
import {
  completeChallenge,
  createChallenge,
  finishDay,
  savePriorities,
  saveReflection,
  setActionCompleted,
  setMinimumDay,
} from "@/lib/services/challenge-service";
import { getChallengeContext } from "@/lib/services/context";
import { saveWeeklyReview } from "@/lib/services/review-service";
import {
  challengeSettingsSchema,
  finalReflectionSchema,
  onboardingSchema,
  prioritiesSchema,
  profileSchema,
  reflectionSchema,
  toggleActionSchema,
  weeklyReviewSchema,
} from "@/lib/validations/challenge";

/**
 * Every action below re-derives the user from the session. Ids arriving from
 * the client are only ever used inside a query that also filters on that user.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createChallengeAction(input: unknown): Promise<never> {
  const userId = await requireUserId();
  const parsed = onboardingSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid plan input.");
  }

  await createChallenge(userId, parsed.data);
  revalidatePath("/today", "layout");
  redirect("/challenge/ready");
}

export async function toggleActionAction(
  actionId: string,
  completed: boolean
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = toggleActionSchema.safeParse({ actionId, completed });
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  await setActionCompleted(userId, parsed.data.actionId, parsed.data.completed);
  revalidatePath("/today");
  revalidatePath("/calendar");
  revalidatePath("/progress");
  return { ok: true };
}

export async function setMinimumDayAction(
  dayId: string,
  isMinimumDay: boolean
): Promise<ActionResult> {
  const userId = await requireUserId();
  await setMinimumDay(userId, dayId, isMinimumDay);
  revalidatePath("/today");
  revalidatePath("/calendar");
  return { ok: true };
}

export async function saveReflectionAction(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = reflectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid reflection." };

  await saveReflection(userId, parsed.data.dayId, {
    dayFeeling: parsed.data.dayFeeling ?? null,
    note: parsed.data.note || undefined,
    whatHelped: parsed.data.whatHelped || undefined,
    whatGotInWay: parsed.data.whatGotInWay || undefined,
  });
  revalidatePath("/today");
  return { ok: true };
}

export async function savePrioritiesAction(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = prioritiesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid priorities." };

  await savePriorities(userId, parsed.data.dayId, parsed.data.priorities);
  revalidatePath("/today");
  return { ok: true };
}

export async function finishDayAction(dayId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await finishDay(userId, dayId);
  revalidatePath("/today");
  revalidatePath("/calendar");
  revalidatePath("/progress");
  return { ok: true };
}

export async function saveWeeklyReviewAction(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = weeklyReviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid review." };

  const context = await getChallengeContext(userId);
  if (!context || context.challenge.id !== parsed.data.challengeId) {
    return { ok: false, error: "Challenge not found." };
  }

  const summary = summariseWeek(
    context.snapshots,
    parsed.data.weekNumber,
    context.challenge.lengthDays
  );

  await saveWeeklyReview(
    userId,
    {
      challengeId: parsed.data.challengeId,
      weekNumber: parsed.data.weekNumber,
      wentWell: parsed.data.wentWell || undefined,
      struggledWith: parsed.data.struggledWith || undefined,
      mainObstacle: parsed.data.mainObstacle,
      difficultyFeedback: parsed.data.difficultyFeedback,
      nextWeekChange: parsed.data.nextWeekChange || undefined,
    },
    summary.completionRate,
    context.dayNumber
  );

  revalidatePath("/reviews");
  revalidatePath("/today");
  return { ok: true };
}

export async function saveFinalReflectionAction(
  input: unknown
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = finalReflectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid reflection." };

  const challenge = await prisma.challenge.findFirst({
    where: { id: parsed.data.challengeId, userId },
    select: { id: true },
  });
  if (!challenge) return { ok: false, error: "Challenge not found." };

  await prisma.finalReflection.upsert({
    where: { challengeId: challenge.id },
    create: {
      challengeId: challenge.id,
      reflection: parsed.data.reflection || null,
      biggestChange: parsed.data.biggestChange || null,
      nextGoal: parsed.data.nextGoal || null,
    },
    update: {
      reflection: parsed.data.reflection || null,
      biggestChange: parsed.data.biggestChange || null,
      nextGoal: parsed.data.nextGoal || null,
    },
  });

  await completeChallenge(userId, challenge.id);
  revalidatePath("/challenge/complete");
  return { ok: true };
}

export async function updateChallengeAction(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = challengeSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  }

  const challenge = await prisma.challenge.findFirst({
    where: { id: parsed.data.challengeId, userId },
    select: { id: true },
  });
  if (!challenge) return { ok: false, error: "Challenge not found." };

  await prisma.challenge.update({
    where: { id: challenge.id },
    data: {
      title: parsed.data.title,
      goal: parsed.data.goal,
      whyItMatters: parsed.data.whyItMatters || null,
      successDefinition: parsed.data.successDefinition || null,
    },
  });

  revalidatePath("/challenge");
  revalidatePath("/today");
  return { ok: true };
}

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { name: parsed.data.name },
  });

  revalidatePath("/settings", "layout");
  return { ok: true };
}

/** Archives the current challenge so a new one can be started. */
export async function archiveChallengeAction(challengeId: string): Promise<never> {
  const userId = await requireUserId();
  await prisma.challenge.updateMany({
    where: { id: challengeId, userId, status: "ACTIVE" },
    data: { status: "ARCHIVED" },
  });
  revalidatePath("/", "layout");
  redirect("/onboarding");
}
