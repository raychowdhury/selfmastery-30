import type {
  Challenge,
  ChallengeDay,
  DailyAction,
  DailyPriority,
  DailyReflection,
  Milestone,
  Pillar,
  PlanAdjustment,
  WeeklyReview,
} from "@/lib/generated/prisma/client";

import {
  calculateDailyCompletion,
  classifyDay,
  effectiveAction,
} from "@/lib/analytics/calculations";
import type { ChallengeStats } from "@/lib/analytics/calculations";
import type { DaySnapshot, PillarCompletion } from "@/lib/analytics/types";
import type { Insight } from "@/lib/analytics/insights";
import { toIsoDate } from "@/lib/challenge/dates";
import { renderCopy } from "@/lib/challenge/render";

/**
 * The wire contract for the native client.
 *
 * Two rules keep this decodable without surprises:
 *   - A *calendar day* is a "yyyy-MM-dd" string. It is a date, not an instant,
 *     and sending it as ISO-8601 would drag a timezone into it.
 *   - An *instant* is a full ISO-8601 timestamp, or null.
 *
 * Action copy is rendered here rather than on the device: the `{m}` template
 * belongs to the plan engine, and the client should never have to know about it.
 */

export interface UserDTO {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
}

export function toUserDTO(user: {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
}): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

export interface PillarDTO {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  sortOrder: number;
}

export function toPillarDTO(pillar: Pillar): PillarDTO {
  return {
    id: pillar.id,
    name: pillar.name,
    description: pillar.description,
    icon: pillar.icon,
    sortOrder: pillar.sortOrder,
  };
}

export interface MilestoneDTO {
  id: string;
  dayNumber: number;
  title: string;
  description: string | null;
  achieved: boolean;
}

export function toMilestoneDTO(milestone: Milestone): MilestoneDTO {
  return {
    id: milestone.id,
    dayNumber: milestone.dayNumber,
    title: milestone.title,
    description: milestone.description,
    achieved: milestone.achieved,
  };
}

export interface ActionDTO {
  id: string;
  title: string;
  description: string | null;
  estimatedMinutes: number;
  completed: boolean;
  optional: boolean;
  pillarId: string | null;
  pillarName: string | null;
  sortOrder: number;
  /** The reduced version, for the Minimum Day sheet. Rendered, never a template. */
  minimumTitle: string | null;
  minimumMinutes: number | null;
}

export function toActionDTO(
  action: DailyAction,
  pillarNames: Map<string, string>,
  isMinimumDay: boolean
): ActionDTO {
  const shown = effectiveAction(
    {
      id: action.id,
      pillarId: action.pillarId,
      title: action.title,
      completed: action.completed,
      optional: action.optional,
      estimatedMinutes: action.estimatedMinutes,
      minimumVersionTitle: action.minimumVersionTitle,
      minimumVersionMinutes: action.minimumVersionMinutes,
    },
    isMinimumDay
  );

  const minimumMinutes = action.minimumVersionMinutes ?? action.estimatedMinutes;

  return {
    id: action.id,
    title: shown.title,
    description:
      isMinimumDay || !action.description
        ? null
        : renderCopy(action.description, action.estimatedMinutes),
    estimatedMinutes: shown.estimatedMinutes,
    completed: action.completed,
    optional: action.optional,
    pillarId: action.pillarId,
    pillarName: action.pillarId
      ? (pillarNames.get(action.pillarId) ?? null)
      : null,
    sortOrder: action.sortOrder,
    minimumTitle: action.minimumVersionTitle
      ? renderCopy(action.minimumVersionTitle, minimumMinutes)
      : null,
    minimumMinutes: action.minimumVersionTitle ? minimumMinutes : null,
  };
}

export interface PriorityDTO {
  position: number;
  text: string;
  completed: boolean;
}

export function toPriorityDTO(priority: DailyPriority): PriorityDTO {
  return {
    position: priority.position,
    text: priority.text,
    completed: priority.completed,
  };
}

export interface ReflectionDTO {
  dayFeeling: string | null;
  note: string | null;
  whatHelped: string | null;
  whatGotInWay: string | null;
}

export function toReflectionDTO(
  reflection: DailyReflection | null
): ReflectionDTO | null {
  if (!reflection) return null;
  return {
    dayFeeling: reflection.dayFeeling,
    note: reflection.note,
    whatHelped: reflection.whatHelped,
    whatGotInWay: reflection.whatGotInWay,
  };
}

export interface CompletionDTO {
  required: number;
  completed: number;
  percent: number;
}

export interface DayDTO {
  id: string;
  dayNumber: number;
  date: string;
  phase: string;
  isMinimumDay: boolean;
  completedAt: string | null;
  /** Only the actions the user is actually being asked for today. */
  actions: ActionDTO[];
  priorities: PriorityDTO[];
  reflection: ReflectionDTO | null;
  completion: CompletionDTO;
}

type DayWithRelations = ChallengeDay & {
  actions: DailyAction[];
  priorities: DailyPriority[];
  reflection: DailyReflection | null;
};

export function toDayDTO(
  day: DayWithRelations,
  pillarNames: Map<string, string>
): DayDTO {
  // On a Minimum Day the optional extras fall away — that is the point of one.
  const visible = day.isMinimumDay
    ? day.actions.filter((action) => !action.optional)
    : day.actions;

  const completion = calculateDailyCompletion({
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
  });

  return {
    id: day.id,
    dayNumber: day.dayNumber,
    date: toIsoDate(day.date),
    phase: day.phase,
    isMinimumDay: day.isMinimumDay,
    completedAt: day.completedAt?.toISOString() ?? null,
    actions: visible.map((action: DailyAction) =>
      toActionDTO(action, pillarNames, day.isMinimumDay)
    ),
    priorities: day.priorities.map(toPriorityDTO),
    reflection: toReflectionDTO(day.reflection),
    completion,
  };
}

export interface ChallengeDTO {
  id: string;
  title: string;
  goal: string;
  whyItMatters: string | null;
  successDefinition: string | null;
  category: string;
  availableMinutes: number;
  difficulty: string;
  preferredTime: string;
  obstacles: string[];
  startDate: string;
  endDate: string;
  lengthDays: number;
  status: string;
  pillars: PillarDTO[];
  milestones: MilestoneDTO[];
}

export function toChallengeDTO(
  challenge: Challenge & { pillars?: Pillar[]; milestones?: Milestone[] }
): ChallengeDTO {
  return {
    id: challenge.id,
    title: challenge.title,
    goal: challenge.goal,
    whyItMatters: challenge.whyItMatters,
    successDefinition: challenge.successDefinition,
    category: challenge.category,
    availableMinutes: challenge.availableMinutes,
    difficulty: challenge.difficulty,
    preferredTime: challenge.preferredTime,
    obstacles: challenge.obstacles,
    startDate: toIsoDate(challenge.startDate),
    endDate: toIsoDate(challenge.endDate),
    lengthDays: challenge.lengthDays,
    status: challenge.status,
    pillars: (challenge.pillars ?? []).map(toPillarDTO),
    milestones: (challenge.milestones ?? []).map(toMilestoneDTO),
  };
}

export interface StatsDTO {
  overallCompletion: number;
  activeDays: number;
  perfectDays: number;
  minimumDays: number;
  currentStreak: number;
  longestStreak: number;
  actionsCompleted: number;
  minutesCompleted: number;
}

export function toStatsDTO(stats: ChallengeStats): StatsDTO {
  return { ...stats };
}

export interface CalendarDayDTO {
  dayNumber: number;
  date: string;
  /** FUTURE | TODAY | PERFECT | COMPLETE | PARTIAL | MINIMUM | MISSED */
  state: string;
  percent: number;
  isMinimumDay: boolean;
}

export function toCalendarDayDTO(
  snapshot: DaySnapshot,
  todayDayNumber: number
): CalendarDayDTO {
  return {
    dayNumber: snapshot.dayNumber,
    date: toIsoDate(snapshot.date),
    state: classifyDay(snapshot, todayDayNumber),
    percent: calculateDailyCompletion(snapshot).percent,
    isMinimumDay: snapshot.isMinimumDay,
  };
}

export interface PillarProgressDTO {
  pillarId: string;
  name: string;
  scheduled: number;
  completed: number;
  percent: number;
}

export function toPillarProgressDTO(
  pillar: PillarCompletion
): PillarProgressDTO {
  return { ...pillar };
}

export interface InsightDTO {
  id: string;
  text: string;
}

export function toInsightDTO(insight: Insight): InsightDTO {
  return { id: insight.id, text: insight.text };
}

export interface WeeklyReviewDTO {
  weekNumber: number;
  closingDay: number;
  unlocked: boolean;
  completed: boolean;
  completionRate: number;
  minimumDays: number;
  frequentlySkipped: string[];
  wentWell: string | null;
  struggledWith: string | null;
  mainObstacle: string[];
  difficultyFeedback: string | null;
  nextWeekChange: string | null;
}

export function toWeeklyReviewDTO(
  weekNumber: number,
  closingDay: number,
  unlocked: boolean,
  summary: { completionRate: number; minimumDays: number; frequentlySkipped: string[] },
  review: WeeklyReview | null
): WeeklyReviewDTO {
  return {
    weekNumber,
    closingDay,
    unlocked,
    completed: Boolean(review),
    completionRate: summary.completionRate,
    minimumDays: summary.minimumDays,
    frequentlySkipped: summary.frequentlySkipped,
    wentWell: review?.wentWell ?? null,
    struggledWith: review?.struggledWith ?? null,
    mainObstacle: review?.mainObstacle ?? [],
    difficultyFeedback: review?.difficultyFeedback ?? null,
    nextWeekChange: review?.nextWeekChange ?? null,
  };
}

export interface AdjustmentDTO {
  id: string;
  summary: string;
  rationale: string;
  appliedFromDay: number;
  daysAffected: number;
  createdAt: string;
}

export function toAdjustmentDTO(adjustment: PlanAdjustment): AdjustmentDTO {
  return {
    id: adjustment.id,
    summary: adjustment.summary,
    rationale: adjustment.rationale,
    appliedFromDay: adjustment.appliedFromDay,
    daysAffected: adjustment.daysAffected,
    createdAt: adjustment.createdAt.toISOString(),
  };
}
