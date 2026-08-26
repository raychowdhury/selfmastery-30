import { calculatePillarCompletion } from "@/lib/analytics/calculations";
import { buildInsights } from "@/lib/analytics/insights";
import {
  toAdjustmentDTO,
  toCalendarDayDTO,
  toChallengeDTO,
  toDayDTO,
  toInsightDTO,
  toPillarProgressDTO,
  toStatsDTO,
  toWeeklyReviewDTO,
  type AdjustmentDTO,
  type CalendarDayDTO,
  type ChallengeDTO,
  type DayDTO,
  type InsightDTO,
  type PillarProgressDTO,
  type StatsDTO,
  type WeeklyReviewDTO,
} from "@/lib/api/dto";
import { summariseWeek } from "@/lib/challenge/adjustment";
import { reviewDays, weekForDay } from "@/lib/challenge/phases";
import { prisma } from "@/lib/db";
import { getDayByNumber } from "@/lib/services/challenge-service";
import { getChallengeContext, getTodayContext } from "@/lib/services/context";
import { listAdjustments, listReviews } from "@/lib/services/review-service";

/**
 * Screen-shaped payloads.
 *
 * The client gets one request per screen rather than assembling four. All the
 * arithmetic still comes from the same pure functions the web app uses — this
 * layer only chooses what to send.
 */

export interface TodayPayload {
  challenge: ChallengeDTO;
  day: DayDTO;
  dayNumber: number;
  phaseLabel: string;
  stats: StatsDTO;
  /** Week number whose review is outstanding, if any. */
  reviewDue: number | null;
  isOver: boolean;
}

const PHASE_LABELS: Record<string, string> = {
  CONSISTENCY: "Consistency",
  BUILD: "Build",
  DEPTH: "Depth",
  FINISH: "Finish",
};

export async function buildTodayPayload(
  userId: string
): Promise<TodayPayload | null> {
  const context = await getTodayContext(userId);
  if (!context) return null;

  const pillarNames = new Map(
    context.challenge.pillars.map((pillar) => [pillar.id, pillar.name])
  );

  return {
    challenge: toChallengeDTO(context.challenge),
    day: toDayDTO(context.day, pillarNames),
    dayNumber: context.dayNumber,
    phaseLabel: PHASE_LABELS[context.day.phase] ?? context.day.phase,
    stats: toStatsDTO(context.stats),
    reviewDue: context.reviewDue,
    isOver: context.isOver,
  };
}

export interface ProgressPayload {
  stats: StatsDTO;
  days: CalendarDayDTO[];
  pillars: PillarProgressDTO[];
  insights: InsightDTO[];
  adjustments: AdjustmentDTO[];
  dayNumber: number;
  lengthDays: number;
}

export async function buildProgressPayload(
  userId: string
): Promise<ProgressPayload | null> {
  const context = await getChallengeContext(userId);
  if (!context) return null;

  const pillars = calculatePillarCompletion(
    context.snapshots,
    context.challenge.pillars.map((pillar) => ({
      id: pillar.id,
      name: pillar.name,
    })),
    context.dayNumber
  );

  const adjustments = await listAdjustments(userId, context.challenge.id);

  return {
    stats: toStatsDTO(context.stats),
    days: context.snapshots.map((snapshot) =>
      toCalendarDayDTO(snapshot, context.dayNumber)
    ),
    pillars: pillars.map(toPillarProgressDTO),
    insights: buildInsights(context.snapshots, pillars, context.dayNumber).map(
      toInsightDTO
    ),
    adjustments: adjustments.map(toAdjustmentDTO),
    dayNumber: context.dayNumber,
    lengthDays: context.challenge.lengthDays,
  };
}

export async function buildReviewsPayload(
  userId: string
): Promise<WeeklyReviewDTO[] | null> {
  const context = await getChallengeContext(userId);
  if (!context) return null;

  const reviews = await listReviews(userId, context.challenge.id);
  const written = new Map(reviews.map((review) => [review.weekNumber, review]));

  return reviewDays(context.challenge.lengthDays).map((closingDay) => {
    const weekNumber = weekForDay(closingDay, context.challenge.lengthDays);
    return toWeeklyReviewDTO(
      weekNumber,
      closingDay,
      context.dayNumber >= closingDay,
      summariseWeek(
        context.snapshots,
        weekNumber,
        context.challenge.lengthDays
      ),
      written.get(weekNumber) ?? null
    );
  });
}

export async function buildDayPayload(
  userId: string,
  dayNumber: number
): Promise<DayDTO | null> {
  const context = await getChallengeContext(userId);
  if (!context) return null;

  const day = await getDayByNumber(userId, context.challenge.id, dayNumber);
  if (!day) return null;

  return toDayDTO(
    day,
    new Map(context.challenge.pillars.map((pillar) => [pillar.id, pillar.name]))
  );
}

export interface HistoryEntry {
  challenge: ChallengeDTO;
  stats: StatsDTO | null;
  finalReflection: {
    reflection: string | null;
    biggestChange: string | null;
    nextGoal: string | null;
  } | null;
}

export async function buildHistoryPayload(
  userId: string
): Promise<HistoryEntry[]> {
  const challenges = await prisma.challenge.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      pillars: { orderBy: { sortOrder: "asc" } },
      milestones: { orderBy: { dayNumber: "asc" } },
      finalReflection: true,
    },
  });

  return challenges.map((challenge) => ({
    challenge: toChallengeDTO(challenge),
    // Full stats for every past challenge would mean loading every day of
    // every one. The detail endpoint carries that when a row is opened.
    stats: null,
    finalReflection: challenge.finalReflection
      ? {
          reflection: challenge.finalReflection.reflection,
          biggestChange: challenge.finalReflection.biggestChange,
          nextGoal: challenge.finalReflection.nextGoal,
        }
      : null,
  }));
}
