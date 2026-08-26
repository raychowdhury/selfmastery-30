import { defineStrategy, daily, everyNDays, fixed, anchorReminder, phoneBoundary, planTomorrow, share, weeklyLook } from "@/lib/plan/strategies/shared";

/**
 * The fallback for any goal that does not match a specific strategy — and the
 * proof that the engine is domain-independent. It builds a plan out of the one
 * thing every goal has: a main action, done at a set time, reviewed weekly.
 */
export const customStrategy = defineStrategy({
  slug: "custom",
  label: "Something else",
  defaultTitle: "My 30-day goal",
  goalExamples: [
    "Describe it in your own words",
    "Whatever you have been meaning to start",
  ],
  pillars: [
    { name: "Main action", description: "The thing that moves the goal.", icon: "target", sortOrder: 0 },
    { name: "Support", description: "The small things that make it easier.", icon: "sparkles", sortOrder: 1 },
    { name: "Planning", description: "Knowing what happens next.", icon: "list-checks", sortOrder: 2 },
  ],
  actions: [
    {
      id: "main-action",
      pillar: "Main action",
      minutes: share(0.6, 15, 90),
      cadence: daily,
      priority: 10,
      copy: {
        default: {
          title: "Spend {m} minutes on your goal",
          description: "The single most useful thing you could do today toward it.",
        },
        CONSISTENCY: {
          title: "Spend {m} minutes on your goal",
          description: "Short by design. This week is about turning up every day.",
        },
        DEPTH: {
          title: "Spend {m} minutes on the hardest part",
          description: "The part you have been circling around.",
        },
        FINISH: {
          title: "Spend {m} minutes finishing something",
          description: "Work on whatever gets you closest to your Day 30 definition.",
        },
      },
      minimum: { title: "Spend 10 minutes on your goal", minutes: 10 },
    },
    {
      id: "supporting-step",
      pillar: "Support",
      minutes: share(0.25, 10, 30),
      cadence: everyNDays(2),
      priority: 30,
      copy: {
        default: {
          title: "Take one supporting step",
          description: "Preparation, tidying, a message, a small removal of friction.",
        },
      },
      minimum: { title: "One five-minute supporting step", minutes: 5 },
    },
    {
      id: "obstacle-removal",
      pillar: "Support",
      minutes: fixed(10),
      cadence: everyNDays(4, 2),
      optional: true,
      priority: 60,
      copy: {
        default: {
          title: "Remove one thing that got in the way yesterday",
          description: "Fix the environment rather than relying on discipline.",
        },
      },
      minimum: { title: "Name the obstacle out loud", minutes: 2 },
    },
    anchorReminder("Planning"),
    phoneBoundary("Support"),
    planTomorrow("Planning", "session"),
    weeklyLook("Planning", "Review the week", "What worked, what did not, and what changes next week?"),
  ],
  milestones: {
    7: { title: "You showed up every day you could", description: "Small actions, done consistently." },
    14: { title: "It has a time and a place", description: "The action no longer needs a decision." },
    21: { title: "Real progress is visible", description: "You can see the difference between now and Day 1." },
    30: { title: "Close to your Day 30 definition", description: "And a habit that continues past it." },
  },
});
