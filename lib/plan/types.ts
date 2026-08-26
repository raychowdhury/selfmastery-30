import type { Difficulty, Phase, PreferredTime } from "@/lib/generated/prisma/enums";

/**
 * Everything the generator is allowed to know about a person. Deliberately
 * small: a goal, a realistic time budget, and what tends to get in the way.
 */
export interface PlanInput {
  category: string;
  title: string;
  goal: string;
  whyItMatters?: string | null;
  successDefinition?: string | null;
  availableMinutes: number;
  obstacles: string[];
  preferredTime: PreferredTime;
  difficulty: Difficulty;
  startDate: Date;
  lengthDays?: number;
}

export interface GeneratedPillar {
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
}

export interface GeneratedAction {
  pillarName: string | null;
  title: string;
  description: string;
  estimatedMinutes: number;
  optional: boolean;
  minimumVersionTitle: string;
  minimumVersionMinutes: number;
  sortOrder: number;
}

export interface GeneratedDay {
  dayNumber: number;
  date: Date;
  phase: Phase;
  actions: GeneratedAction[];
}

export interface GeneratedMilestone {
  dayNumber: number;
  title: string;
  description: string;
}

export interface GeneratedPlan {
  pillars: GeneratedPillar[];
  days: GeneratedDay[];
  milestones: GeneratedMilestone[];
}

/**
 * The seam that keeps AI optional. V1 ships RuleBasedPlanGenerator, which needs
 * no API key and no network. A ClaudePlanGenerator can be dropped in behind the
 * same interface without touching services, actions or UI.
 */
export interface PlanGenerator {
  readonly name: string;
  generatePlan(input: PlanInput): Promise<GeneratedPlan>;
}

// ---------------------------------------------------------------------------
// Strategy authoring types — the content layer
// ---------------------------------------------------------------------------

export type MinuteRule =
  /** Takes a share of the day's budget, clamped to a sane range. */
  | { kind: "share"; share: number; min: number; max: number }
  /** Always the same length, regardless of budget. */
  | { kind: "fixed"; minutes: number };

export type Cadence =
  | { kind: "daily" }
  /** Appears every n days, offset by `offset` (1-indexed day numbers). */
  | { kind: "everyNDays"; n: number; offset?: number }
  /** Appears on the last day of each challenge week (7, 14, 21, 28). */
  | { kind: "weekly" }
  /** Appears only on the listed day numbers. */
  | { kind: "onDays"; days: number[] }
  /** Appears from this day number onwards. */
  | { kind: "fromDay"; day: number };

export interface ActionCopy {
  /** `{m}` is replaced with the allocated minutes. */
  title: string;
  description: string;
}

export interface ActionTemplate {
  id: string;
  pillar: string;
  minutes: MinuteRule;
  cadence: Cadence;
  /** Restricts the action to certain phases. Defaults to all four. */
  phases?: Phase[];
  optional?: boolean;
  /** Copy can change as the challenge progresses. `default` is required. */
  copy: Partial<Record<Phase, ActionCopy>> & { default: ActionCopy };
  minimum: { title: string; minutes: number };
  /** Only included when the user named this obstacle during onboarding. */
  requiresObstacle?: string;
  /** Lower sorts first on the Today screen. */
  priority?: number;
}

/**
 * A track whose content advances over the 30 days — a job search moving from
 * résumé to follow-ups, a product moving from idea to launch. Stages are spread
 * evenly across the challenge.
 */
export interface SequenceTemplate {
  id: string;
  pillar: string;
  minutes: MinuteRule;
  priority?: number;
  stages: Array<{
    title: string;
    description: string;
    minimum?: string;
  }>;
}

export interface CategoryStrategy {
  slug: string;
  label: string;
  /** Short challenge title suggested when the user does not write their own. */
  defaultTitle: string;
  /** Example goals shown as hints during onboarding. */
  goalExamples: string[];
  pillars: GeneratedPillar[];
  actions: ActionTemplate[];
  sequences?: SequenceTemplate[];
  milestones: Record<number, { title: string; description: string }>;
  /** Shown once for domains where we must not sound like a professional. */
  safetyNote?: string;
}
