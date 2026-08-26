import type {
  ActionTemplate,
  Cadence,
  CategoryStrategy,
  MinuteRule,
} from "@/lib/plan/types";

export function share(shareOf: number, min: number, max: number): MinuteRule {
  return { kind: "share", share: shareOf, min, max };
}

export function fixed(minutes: number): MinuteRule {
  return { kind: "fixed", minutes };
}

export const daily: Cadence = { kind: "daily" };
export const weekly: Cadence = { kind: "weekly" };

export function everyNDays(n: number, offset = 0): Cadence {
  return { kind: "everyNDays", n, offset };
}

export function onDays(...days: number[]): Cadence {
  return { kind: "onDays", days };
}

export function fromDay(day: number): Cadence {
  return { kind: "fromDay", day };
}

export function defineStrategy(strategy: CategoryStrategy): CategoryStrategy {
  return strategy;
}

// ---------------------------------------------------------------------------
// Reusable actions
//
// These appear across many goals, so they are written once. Anything that reads
// as domain-specific belongs in the individual strategy instead.
// ---------------------------------------------------------------------------

/** Deciding when tomorrow's action happens is the cheapest reliability win. */
export function planTomorrow(
  pillar: string,
  what: string,
  overrides: Partial<ActionTemplate> = {}
): ActionTemplate {
  return {
    id: "plan-tomorrow",
    pillar,
    minutes: fixed(5),
    cadence: daily,
    priority: 90,
    copy: {
      default: {
        title: `Decide when tomorrow's ${what} happens`,
        description:
          "Pick the actual time, not just the intention. A decision made today is one fewer decision to make tomorrow.",
      },
      FINISH: {
        title: `Set up tomorrow's ${what}`,
        description:
          "You are close to the end. Make tomorrow as easy to start as possible.",
      },
    },
    minimum: { title: "Name tomorrow's start time", minutes: 2 },
    ...overrides,
  };
}

/** Offered only to people who said their phone gets in the way. */
export function phoneBoundary(pillar: string): ActionTemplate {
  return {
    id: "phone-boundary",
    pillar,
    minutes: share(0.18, 10, 30),
    cadence: everyNDays(2),
    requiresObstacle: "phone",
    // Obstacle-driven actions sit directly behind the core action and ahead of
    // generic support: this is the part of the plan the user asked for by name.
    priority: 15,
    copy: {
      default: {
        title: "Spend {m} minutes with your phone out of reach",
        description:
          "Put it in another room. Distance works better than willpower.",
      },
      DEPTH: {
        title: "Protect {m} phone-free minutes",
        description:
          "Same idea, slightly longer. Notice how quickly the urge passes.",
      },
    },
    minimum: { title: "Ten minutes with your phone in another room", minutes: 10 },
  };
}

/** For people who said they simply forget. */
export function anchorReminder(pillar: string): ActionTemplate {
  return {
    id: "anchor-reminder",
    pillar,
    minutes: fixed(3),
    cadence: everyNDays(3),
    requiresObstacle: "forgetting",
    optional: true,
    priority: 95,
    copy: {
      default: {
        title: "Attach today's action to something you already do",
        description:
          "After coffee, after school run, after you close your laptop. Anchors beat reminders.",
      },
    },
    minimum: { title: "Set one reminder for tomorrow", minutes: 1 },
  };
}

/** A short weekly stock-take, used by most goals. */
export function weeklyLook(
  pillar: string,
  copyTitle: string,
  description: string
): ActionTemplate {
  return {
    id: "weekly-look",
    pillar,
    minutes: share(0.25, 10, 25),
    cadence: weekly,
    priority: 80,
    copy: {
      default: { title: copyTitle, description },
    },
    minimum: { title: "Two minutes: what worked this week?", minutes: 2 },
  };
}

export const OBSTACLES = [
  { slug: "procrastination", label: "Procrastination" },
  { slug: "phone", label: "Phone" },
  { slug: "social-media", label: "Social media" },
  { slug: "time", label: "Lack of time" },
  { slug: "motivation", label: "Lack of motivation" },
  { slug: "forgetting", label: "Forgetting" },
  { slug: "planning", label: "Poor planning" },
  { slug: "too-many-goals", label: "Too many goals" },
  { slug: "stress", label: "Stress" },
  { slug: "schedule", label: "Inconsistent schedule" },
  { slug: "other", label: "Other" },
] as const;

export type ObstacleSlug = (typeof OBSTACLES)[number]["slug"];
