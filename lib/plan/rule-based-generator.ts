import type { Difficulty, Phase } from "@/lib/generated/prisma/enums";

import { dateForDayNumber } from "@/lib/challenge/dates";
import {
  DEFAULT_CHALLENGE_LENGTH,
  isReviewDay,
  MILESTONE_DAYS,
  phaseDefinition,
  phaseForDay,
} from "@/lib/challenge/phases";
import { getStrategy } from "@/lib/plan/strategies";
import type {
  ActionTemplate,
  Cadence,
  GeneratedAction,
  GeneratedDay,
  GeneratedMilestone,
  GeneratedPlan,
  MinuteRule,
  PlanGenerator,
  PlanInput,
  SequenceTemplate,
} from "@/lib/plan/types";

/**
 * How much of the stated daily budget the required actions are allowed to fill.
 * Even on Challenging we stay under the ceiling — people overestimate the time
 * they have, and a plan that always overruns stops being followed.
 */
const DIFFICULTY_BUDGET: Record<Difficulty, number> = {
  GENTLE: 0.7,
  BALANCED: 0.88,
  CHALLENGING: 1,
};

/** Upper bound on required actions per day. Never a to-do list. */
const DIFFICULTY_MAX_ACTIONS: Record<Difficulty, number> = {
  GENTLE: 3,
  BALANCED: 4,
  CHALLENGING: 5,
};

const MIN_ACTIONS_PER_DAY = 2;

function matchesCadence(cadence: Cadence, dayNumber: number, lengthDays: number): boolean {
  switch (cadence.kind) {
    case "daily":
      return true;
    case "everyNDays":
      return (dayNumber - 1 - (cadence.offset ?? 0)) % cadence.n === 0 &&
        dayNumber - 1 >= (cadence.offset ?? 0);
    case "weekly":
      return isReviewDay(dayNumber, lengthDays);
    case "onDays":
      return cadence.days.includes(dayNumber);
    case "fromDay":
      return dayNumber >= cadence.day;
  }
}

/** Rounds to a friendly number — nobody schedules 17 minutes. */
function roundMinutes(minutes: number): number {
  if (minutes <= 20) return Math.max(5, Math.round(minutes / 5) * 5);
  return Math.round(minutes / 10) * 10;
}

function resolveMinutes(rule: MinuteRule, budget: number): number {
  if (rule.kind === "fixed") return Math.min(rule.minutes, Math.max(5, budget));

  // A template's floor is written for a typical budget. Someone who told us
  // they have ten minutes a day must not be handed a fifteen-minute action, so
  // the floor gives way when the budget is smaller than it assumed.
  const floor = Math.min(rule.min, Math.max(5, Math.round(budget * 0.4)));
  const target = Math.min(rule.max, Math.max(floor, budget * rule.share));
  return roundMinutes(target);
}

function copyForPhase(template: ActionTemplate, phase: Phase) {
  return template.copy[phase] ?? template.copy.default;
}

/**
 * Which stage of a sequenced track a given day belongs to. Stages are spread
 * evenly across the challenge so a ten-stage track advances every three days.
 */
export function stageIndexForDay(
  dayNumber: number,
  lengthDays: number,
  stageCount: number
): number {
  if (stageCount <= 0) return 0;
  const index = Math.floor(((dayNumber - 1) / lengthDays) * stageCount);
  return Math.min(stageCount - 1, Math.max(0, index));
}

function buildSequenceAction(
  sequence: SequenceTemplate,
  dayNumber: number,
  lengthDays: number,
  budget: number
): GeneratedAction {
  const stage = sequence.stages[stageIndexForDay(dayNumber, lengthDays, sequence.stages.length)];
  const minutes = resolveMinutes(sequence.minutes, budget);

  return {
    pillarName: sequence.pillar,
    // Copy keeps its `{m}` placeholder: durations can be rescaled later by a
    // weekly review, and the wording has to follow.
    title: stage.title,
    description: stage.description,
    estimatedMinutes: minutes,
    optional: false,
    minimumVersionTitle: stage.minimum ?? "Spend 10 minutes on this step",
    minimumVersionMinutes: 10,
    sortOrder: sequence.priority ?? 10,
  };
}

function buildTemplateAction(
  template: ActionTemplate,
  phase: Phase,
  budget: number
): GeneratedAction {
  const minutes = resolveMinutes(template.minutes, budget);
  const copy = copyForPhase(template, phase);

  return {
    pillarName: template.pillar,
    title: copy.title,
    description: copy.description,
    estimatedMinutes: minutes,
    optional: template.optional ?? false,
    minimumVersionTitle: template.minimum.title,
    minimumVersionMinutes: template.minimum.minutes,
    sortOrder: template.priority ?? 50,
  };
}

/**
 * Deterministic, offline, and the only generator V1 needs. It reads a category
 * strategy and shapes it around the person: their time, their difficulty
 * setting, and the obstacles they told us about.
 */
export class RuleBasedPlanGenerator implements PlanGenerator {
  readonly name = "rule-based";

  async generatePlan(input: PlanInput): Promise<GeneratedPlan> {
    return this.generatePlanSync(input);
  }

  /** Synchronous twin, used by tests and the seed script. */
  generatePlanSync(input: PlanInput): GeneratedPlan {
    const lengthDays = input.lengthDays ?? DEFAULT_CHALLENGE_LENGTH;
    const strategy = getStrategy(input.category);
    const obstacles = new Set(input.obstacles);
    const maxActions = DIFFICULTY_MAX_ACTIONS[input.difficulty];
    const budgetShare = DIFFICULTY_BUDGET[input.difficulty];

    const days: GeneratedDay[] = [];

    for (let dayNumber = 1; dayNumber <= lengthDays; dayNumber += 1) {
      const phase = phaseForDay(dayNumber);
      const budget = Math.max(
        10,
        Math.round(
          input.availableMinutes * budgetShare * phaseDefinition(phase).effortFactor
        )
      );

      const actions: GeneratedAction[] = [];

      for (const sequence of strategy.sequences ?? []) {
        actions.push(buildSequenceAction(sequence, dayNumber, lengthDays, budget));
      }

      for (const template of strategy.actions) {
        if (template.requiresObstacle && !obstacles.has(template.requiresObstacle)) {
          continue;
        }
        if (template.phases && !template.phases.includes(phase)) continue;
        if (!matchesCadence(template.cadence, dayNumber, lengthDays)) continue;
        actions.push(buildTemplateAction(template, phase, budget));
      }

      days.push({
        dayNumber,
        date: dateForDayNumber(input.startDate, dayNumber),
        phase,
        actions: trimToBudget(actions, budget, maxActions),
      });
    }

    return {
      pillars: strategy.pillars,
      days,
      milestones: buildMilestones(strategy, lengthDays),
    };
  }
}

/**
 * Keeps a day honest: required actions must fit the time the user said they
 * have, and there must never be more than a handful of them. Optional extras
 * are dropped first, then the lowest-priority required actions.
 */
function trimToBudget(
  actions: GeneratedAction[],
  budget: number,
  maxActions: number
): GeneratedAction[] {
  const ordered = [...actions].sort((a, b) => a.sortOrder - b.sortOrder);
  const required = ordered.filter((action) => !action.optional);
  const optional = ordered.filter((action) => action.optional);

  const kept: GeneratedAction[] = [];
  let spent = 0;

  for (const action of required) {
    const overBudget = spent + action.estimatedMinutes > budget;
    const overCount = kept.length >= maxActions;
    // Always keep the first couple of actions: a day with one item does not
    // feel like a plan, even if the budget is tiny.
    if ((overBudget || overCount) && kept.length >= MIN_ACTIONS_PER_DAY) continue;
    kept.push(action);
    spent += action.estimatedMinutes;
  }

  for (const action of optional) {
    if (kept.length >= maxActions + 1) break;
    kept.push(action);
  }

  return kept.map((action, index) => ({ ...action, sortOrder: index }));
}

function buildMilestones(
  strategy: ReturnType<typeof getStrategy>,
  lengthDays: number
): GeneratedMilestone[] {
  const days = MILESTONE_DAYS.filter((day) => day <= lengthDays);
  if (!days.includes(lengthDays)) days.push(lengthDays);

  return days.map((dayNumber) => {
    const milestone =
      strategy.milestones[dayNumber] ??
      strategy.milestones[MILESTONE_DAYS[MILESTONE_DAYS.length - 1]];
    return {
      dayNumber,
      title: milestone.title,
      description: milestone.description,
    };
  });
}
