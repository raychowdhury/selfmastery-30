import { defineStrategy, everyNDays, fixed, phoneBoundary, planTomorrow, weeklyLook } from "@/lib/plan/strategies/shared";

/**
 * "Finish something." Sequenced from scoping through to shipping, because a
 * project that never narrows never ends.
 */
export const projectStrategy = defineStrategy({
  slug: "project",
  label: "Finish a project",
  defaultTitle: "Finish the project I keep putting off",
  goalExamples: [
    "Finish the thing that has been half-done for a year",
    "Ship a first version of my side project",
    "Clear the project that keeps following me around",
  ],
  pillars: [
    { name: "Progress", description: "Moving the project forward.", icon: "hammer", sortOrder: 0 },
    { name: "Scope", description: "Keeping it small enough to finish.", icon: "scissors", sortOrder: 1 },
    { name: "Planning", description: "Always knowing the next step.", icon: "list-checks", sortOrder: 2 },
  ],
  sequences: [
    {
      id: "project-track",
      pillar: "Progress",
      minutes: { kind: "share", share: 0.6, min: 20, max: 100 },
      priority: 10,
      stages: [
        {
          title: "Write down what finished looks like",
          description: "One paragraph. If you cannot describe done, you cannot reach it.",
          minimum: "Write one sentence describing done",
        },
        {
          title: "Cut the scope to what you can finish in 30 days",
          description: "Move everything else to a 'later' list. Later is a real place.",
          minimum: "Move one item to the later list",
        },
        {
          title: "Break it into the next five concrete steps",
          description: "Concrete means you know exactly what to open and do.",
          minimum: "Write the next single step",
        },
        {
          title: "Build the first real piece",
          description: "The part that makes it feel like an actual thing.",
          minimum: "Work on it for 15 minutes",
        },
        {
          title: "Keep building the core",
          description: "Resist the tempting side quest. The core first.",
          minimum: "Work on it for 15 minutes",
        },
        {
          title: "Get it to rough end-to-end",
          description: "Ugly but complete beats beautiful and half-finished.",
          minimum: "Work on it for 15 minutes",
        },
        {
          title: "Show it to one person and write down what they said",
          description: "Feedback now is cheaper than feedback after launch.",
          minimum: "Send it to one person",
        },
        {
          title: "Fix the three things that matter most",
          description: "Three. The rest goes on the later list.",
          minimum: "Fix one small thing",
        },
        {
          title: "Tidy the rough edges",
          description: "The last ten per cent that makes it feel finished.",
          minimum: "Improve one detail",
        },
        {
          title: "Finish it and put it somewhere real",
          description: "Published, sent, hung on a wall. Out of the drawer.",
          minimum: "Take one step toward shipping",
        },
      ],
    },
  ],
  actions: [
    {
      id: "scope-guard",
      pillar: "Scope",
      minutes: fixed(5),
      cadence: everyNDays(3, 1),
      priority: 40,
      copy: {
        default: {
          title: "Move one nice-to-have onto the later list",
          description: "Finishing is mostly the discipline of not adding things.",
        },
      },
      minimum: { title: "Name one thing you will not do", minutes: 2 },
    },
    phoneBoundary("Progress"),
    planTomorrow("Planning", "work session"),
    weeklyLook("Planning", "Review the project", "What moved, what is stuck, and what is the next single step?"),
  ],
  milestones: {
    7: { title: "Scope is defined and cut", description: "You know what finished means and what you are not doing." },
    14: { title: "The core exists", description: "Something real you can point at." },
    21: { title: "Rough end-to-end, and reviewed", description: "It works, and one other person has seen it." },
    30: { title: "Finished and out in the world", description: "Not perfect. Finished." },
  },
});
