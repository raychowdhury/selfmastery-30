import type { ChallengeStats } from "@/lib/analytics/calculations";
import { calculateChallengeStats } from "@/lib/analytics/calculations";
import type { DaySnapshot } from "@/lib/analytics/types";
import {
  challengeEndDate,
  currentDayNumber,
  parseCalendarDay,
} from "@/lib/challenge/dates";
import { DEFAULT_CHALLENGE_LENGTH } from "@/lib/challenge/phases";
import { prisma } from "@/lib/db";
import { getPlanGenerator } from "@/lib/plan";
import { getStrategy } from "@/lib/plan/strategies";
import type { GeneratedPlan } from "@/lib/plan/types";
import type { OnboardingInput } from "@/lib/validations/challenge";

/**
 * Every read in this module is scoped by userId. Nothing accepts a challenge id
 * without also proving who is asking — client-supplied ids are never trusted.
 */

export async function createChallenge(
  userId: string,
  input: OnboardingInput
): Promise<{ id: string }> {
  const strategy = getStrategy(input.category);
  const startDate = parseCalendarDay(input.startDate);
  const endDate = challengeEndDate(startDate, DEFAULT_CHALLENGE_LENGTH);

  const plan = await getPlanGenerator().generatePlan({
    category: input.category,
    title: strategy.defaultTitle,
    goal: input.goal,
    whyItMatters: input.whyItMatters || null,
    successDefinition: input.successDefinition || null,
    availableMinutes: input.availableMinutes,
    obstacles: input.obstacles,
    preferredTime: input.preferredTime,
    difficulty: input.difficulty,
    startDate,
  });

  return prisma.$transaction(async (tx) => {
    // One active challenge at a time. Anything still running is archived, not
    // deleted — past progress stays readable forever.
    await tx.challenge.updateMany({
      where: { userId, status: "ACTIVE" },
      data: { status: "ARCHIVED" },
    });

    const challenge = await tx.challenge.create({
      data: {
        userId,
        title: input.goal.slice(0, 120),
        goal: input.goal,
        whyItMatters: input.whyItMatters || null,
        successDefinition: input.successDefinition || null,
        category: input.category,
        availableMinutes: input.availableMinutes,
        difficulty: input.difficulty,
        preferredTime: input.preferredTime,
        obstacles: input.obstacles,
        startDate,
        endDate,
        lengthDays: DEFAULT_CHALLENGE_LENGTH,
        status: "ACTIVE",
      },
    });

    await writePlan(tx, challenge.id, plan);

    return { id: challenge.id };
  });
}

type TransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

/** Writes pillars, milestones, days and actions for a freshly generated plan. */
async function writePlan(
  tx: TransactionClient,
  challengeId: string,
  plan: GeneratedPlan
) {
  await tx.pillar.createMany({
    data: plan.pillars.map((pillar) => ({ ...pillar, challengeId })),
  });

  const pillars = await tx.pillar.findMany({ where: { challengeId } });
  const pillarByName = new Map(pillars.map((pillar) => [pillar.name, pillar.id]));

  await tx.milestone.createMany({
    data: plan.milestones.map((milestone) => ({ ...milestone, challengeId })),
  });

  await tx.challengeDay.createMany({
    data: plan.days.map((day) => ({
      challengeId,
      dayNumber: day.dayNumber,
      date: day.date,
      phase: day.phase,
    })),
  });

  const days = await tx.challengeDay.findMany({
    where: { challengeId },
    select: { id: true, dayNumber: true },
  });
  const dayIdByNumber = new Map(days.map((day) => [day.dayNumber, day.id]));

  await tx.dailyAction.createMany({
    data: plan.days.flatMap((day) =>
      day.actions.map((action) => ({
        challengeDayId: dayIdByNumber.get(day.dayNumber)!,
        pillarId: action.pillarName
          ? (pillarByName.get(action.pillarName) ?? null)
          : null,
        title: action.title,
        description: action.description,
        estimatedMinutes: action.estimatedMinutes,
        optional: action.optional,
        minimumVersionTitle: action.minimumVersionTitle,
        minimumVersionMinutes: action.minimumVersionMinutes,
        sortOrder: action.sortOrder,
      }))
    ),
  });
}

const dayInclude = {
  actions: { orderBy: { sortOrder: "asc" } },
  priorities: { orderBy: { position: "asc" } },
  reflection: true,
} as const;

export async function getActiveChallenge(userId: string) {
  return prisma.challenge.findFirst({
    where: { userId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: {
      pillars: { orderBy: { sortOrder: "asc" } },
      milestones: { orderBy: { dayNumber: "asc" } },
    },
  });
}

export async function getChallengeForUser(userId: string, challengeId: string) {
  return prisma.challenge.findFirst({
    where: { id: challengeId, userId },
    include: {
      pillars: { orderBy: { sortOrder: "asc" } },
      milestones: { orderBy: { dayNumber: "asc" } },
    },
  });
}

export async function listChallenges(userId: string) {
  return prisma.challenge.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { pillars: { orderBy: { sortOrder: "asc" } } },
  });
}

export type FullDay = Awaited<ReturnType<typeof getDayByNumber>>;

export async function getDayByNumber(
  userId: string,
  challengeId: string,
  dayNumber: number
) {
  return prisma.challengeDay.findFirst({
    where: { challengeId, dayNumber, challenge: { userId } },
    include: dayInclude,
  });
}

export async function getDayById(userId: string, dayId: string) {
  return prisma.challengeDay.findFirst({
    where: { id: dayId, challenge: { userId } },
    include: dayInclude,
  });
}

/** All days with their actions — the input every calculation needs. */
export async function getDaySnapshots(
  userId: string,
  challengeId: string
): Promise<DaySnapshot[]> {
  const days = await prisma.challengeDay.findMany({
    where: { challengeId, challenge: { userId } },
    orderBy: { dayNumber: "asc" },
    include: { actions: { orderBy: { sortOrder: "asc" } } },
  });

  return days.map((day) => ({
    dayNumber: day.dayNumber,
    date: day.date,
    isMinimumDay: day.isMinimumDay,
    completedAt: day.completedAt,
    actions: day.actions.map((action) => ({
      id: action.id,
      pillarId: action.pillarId,
      title: action.title,
      completed: action.completed,
      optional: action.optional,
      estimatedMinutes: action.estimatedMinutes,
      minimumVersionTitle: action.minimumVersionTitle,
      minimumVersionMinutes: action.minimumVersionMinutes,
    })),
  }));
}

export async function getStats(
  userId: string,
  challengeId: string,
  startDate: Date,
  today: Date,
  lengthDays = DEFAULT_CHALLENGE_LENGTH
): Promise<{ stats: ChallengeStats; snapshots: DaySnapshot[] }> {
  const snapshots = await getDaySnapshots(userId, challengeId);
  const dayNumber = currentDayNumber(startDate, today, lengthDays);
  return { stats: calculateChallengeStats(snapshots, dayNumber), snapshots };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function setActionCompleted(
  userId: string,
  actionId: string,
  completed: boolean
) {
  const action = await prisma.dailyAction.findFirst({
    where: { id: actionId, challengeDay: { challenge: { userId } } },
    select: { id: true },
  });
  if (!action) throw new Error("NOT_FOUND");

  return prisma.dailyAction.update({
    where: { id: action.id },
    data: { completed, completedAt: completed ? new Date() : null },
  });
}

export async function setMinimumDay(
  userId: string,
  dayId: string,
  isMinimumDay: boolean
) {
  const day = await prisma.challengeDay.findFirst({
    where: { id: dayId, challenge: { userId } },
    select: { id: true },
  });
  if (!day) throw new Error("NOT_FOUND");

  return prisma.challengeDay.update({
    where: { id: day.id },
    data: { isMinimumDay },
  });
}

export async function saveReflection(
  userId: string,
  dayId: string,
  data: {
    dayFeeling?: "EASY" | "GOOD" | "DIFFICULT" | null;
    note?: string;
    whatHelped?: string;
    whatGotInWay?: string;
  }
) {
  const day = await prisma.challengeDay.findFirst({
    where: { id: dayId, challenge: { userId } },
    select: { id: true },
  });
  if (!day) throw new Error("NOT_FOUND");

  return prisma.dailyReflection.upsert({
    where: { challengeDayId: day.id },
    create: {
      challengeDayId: day.id,
      dayFeeling: data.dayFeeling ?? null,
      note: data.note || null,
      whatHelped: data.whatHelped || null,
      whatGotInWay: data.whatGotInWay || null,
    },
    update: {
      dayFeeling: data.dayFeeling ?? null,
      note: data.note || null,
      whatHelped: data.whatHelped || null,
      whatGotInWay: data.whatGotInWay || null,
    },
  });
}

export async function finishDay(userId: string, dayId: string) {
  const day = await prisma.challengeDay.findFirst({
    where: { id: dayId, challenge: { userId } },
    select: { id: true },
  });
  if (!day) throw new Error("NOT_FOUND");

  return prisma.challengeDay.update({
    where: { id: day.id },
    data: { completedAt: new Date() },
  });
}

export async function savePriorities(
  userId: string,
  dayId: string,
  priorities: Array<{ position: number; text: string; completed: boolean }>
) {
  const day = await prisma.challengeDay.findFirst({
    where: { id: dayId, challenge: { userId } },
    select: { id: true },
  });
  if (!day) throw new Error("NOT_FOUND");

  await prisma.$transaction(async (tx) => {
    await tx.dailyPriority.deleteMany({ where: { challengeDayId: day.id } });
    const filled = priorities.filter((priority) => priority.text.trim() !== "");
    if (filled.length > 0) {
      await tx.dailyPriority.createMany({
        data: filled.map((priority) => ({
          challengeDayId: day.id,
          position: priority.position,
          text: priority.text.trim(),
          completed: priority.completed,
        })),
      });
    }
  });
}

export async function completeChallenge(userId: string, challengeId: string) {
  const challenge = await prisma.challenge.findFirst({
    where: { id: challengeId, userId },
    select: { id: true },
  });
  if (!challenge) throw new Error("NOT_FOUND");

  return prisma.challenge.update({
    where: { id: challenge.id },
    data: { status: "COMPLETED" },
  });
}
