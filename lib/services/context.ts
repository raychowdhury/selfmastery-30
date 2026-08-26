import { calculateChallengeStats } from "@/lib/analytics/calculations";
import type { DaySnapshot } from "@/lib/analytics/types";
import {
  currentDayNumber,
  dayNumberForDate,
  todayAsCalendarDay,
} from "@/lib/challenge/dates";
import { isReviewDay, weekForDay } from "@/lib/challenge/phases";
import { prisma } from "@/lib/db";
import {
  getActiveChallenge,
  getDayByNumber,
  getDaySnapshots,
} from "@/lib/services/challenge-service";

/** The server's notion of today, as a calendar day. */
export function today(): Date {
  return todayAsCalendarDay();
}

export type ActiveChallenge = NonNullable<
  Awaited<ReturnType<typeof getActiveChallenge>>
>;

export interface ChallengeContext {
  challenge: ActiveChallenge;
  /** Clamped into 1..lengthDays, so a returning user lands on a real day. */
  dayNumber: number;
  /** Unclamped — greater than lengthDays once the 30 days are up. */
  rawDayNumber: number;
  weekNumber: number;
  isOver: boolean;
  snapshots: DaySnapshot[];
  stats: ReturnType<typeof calculateChallengeStats>;
}

export async function getChallengeContext(
  userId: string
): Promise<ChallengeContext | null> {
  const challenge = await getActiveChallenge(userId);
  if (!challenge) return null;

  const now = today();
  const rawDayNumber = dayNumberForDate(challenge.startDate, now);
  const dayNumber = currentDayNumber(
    challenge.startDate,
    now,
    challenge.lengthDays
  );
  const snapshots = await getDaySnapshots(userId, challenge.id);

  return {
    challenge,
    dayNumber,
    rawDayNumber,
    weekNumber: weekForDay(dayNumber, challenge.lengthDays),
    isOver: rawDayNumber > challenge.lengthDays,
    snapshots,
    stats: calculateChallengeStats(snapshots, dayNumber),
  };
}

export interface TodayContext extends ChallengeContext {
  day: NonNullable<Awaited<ReturnType<typeof getDayByNumber>>>;
  pillarNames: Map<string, string>;
  /** True when a weekly review for the finished week has not been written yet. */
  reviewDue: number | null;
}

export async function getTodayContext(
  userId: string
): Promise<TodayContext | null> {
  const context = await getChallengeContext(userId);
  if (!context) return null;

  const day = await getDayByNumber(
    userId,
    context.challenge.id,
    context.dayNumber
  );
  if (!day) return null;

  const reviews = await prisma.weeklyReview.findMany({
    where: { challengeId: context.challenge.id },
    select: { weekNumber: true },
  });
  const written = new Set(reviews.map((review) => review.weekNumber));

  // A review is due once the day that closes a week has arrived and passed
  // unreviewed. We never nag about more than the most recent one.
  let reviewDue: number | null = null;
  for (let dayNumber = 1; dayNumber <= context.dayNumber; dayNumber += 1) {
    if (!isReviewDay(dayNumber, context.challenge.lengthDays)) continue;
    const week = weekForDay(dayNumber, context.challenge.lengthDays);
    if (!written.has(week)) reviewDue = week;
  }

  return {
    ...context,
    day,
    pillarNames: new Map(
      context.challenge.pillars.map((pillar) => [pillar.id, pillar.name])
    ),
    reviewDue,
  };
}

/** Minimal query for the app shell — avoids loading 30 days on every page. */
export async function getShellContext(userId: string) {
  const [user, challenge] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    }),
    prisma.challenge.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: { startDate: true, lengthDays: true },
    }),
  ]);

  return {
    user,
    dayLabel: challenge
      ? `Day ${currentDayNumber(challenge.startDate, today(), challenge.lengthDays)}`
      : null,
  };
}
