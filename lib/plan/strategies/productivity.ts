import { defineStrategy, daily, everyNDays, fixed, phoneBoundary, planTomorrow, share, weeklyLook } from "@/lib/plan/strategies/shared";

export const productivityStrategy = defineStrategy({
  slug: "productivity",
  label: "Become more productive",
  defaultTitle: "Get more of the right work done",
  goalExamples: [
    "Stop ending the day with nothing important finished",
    "Do focused work before the inbox takes over",
    "Get on top of my week",
  ],
  pillars: [
    { name: "Focus", description: "Uninterrupted work on what matters.", icon: "target", sortOrder: 0 },
    { name: "Priorities", description: "Choosing the right work first.", icon: "list-checks", sortOrder: 1 },
    { name: "Boundaries", description: "Protecting the time you set aside.", icon: "shield", sortOrder: 2 },
  ],
  actions: [
    {
      id: "top-three",
      pillar: "Priorities",
      minutes: fixed(5),
      cadence: daily,
      priority: 5,
      copy: {
        default: {
          title: "Write down today's top three",
          description: "Three, not ten. If everything is a priority, nothing is.",
        },
        DEPTH: {
          title: "Write today's top three, hardest first",
          description: "Put the one you are avoiding at number one.",
        },
      },
      minimum: { title: "Name the one thing that must happen today", minutes: 2 },
    },
    {
      id: "deep-work",
      pillar: "Focus",
      minutes: share(0.55, 20, 90),
      cadence: daily,
      priority: 10,
      copy: {
        default: {
          title: "Complete one {m}-minute focused block",
          description: "One task, notifications off, door shut if you have one.",
        },
        CONSISTENCY: {
          title: "Complete one {m}-minute focused block",
          description: "Short enough that you cannot talk yourself out of it.",
        },
        FINISH: {
          title: "Complete a {m}-minute block on your most important work",
          description: "The work you would be glad to have finished by Day 30.",
        },
      },
      minimum: { title: "One focused 15-minute task", minutes: 15 },
    },
    {
      id: "admin",
      pillar: "Priorities",
      minutes: share(0.2, 10, 30),
      cadence: everyNDays(2),
      priority: 40,
      copy: {
        default: {
          title: "Clear {m} minutes of important admin",
          description: "The small things that quietly take up mental space.",
        },
      },
      minimum: { title: "Clear one small admin task", minutes: 5 },
    },
    {
      id: "distraction-cut",
      pillar: "Boundaries",
      minutes: fixed(10),
      cadence: everyNDays(2, 1),
      priority: 50,
      copy: {
        default: {
          title: "Remove one distraction before you start",
          description: "A tab, a notification, a meeting. One is enough.",
        },
        DEPTH: {
          title: "Decline or shorten one unnecessary commitment",
          description: "Protecting focus time usually means saying no to something.",
        },
      },
      minimum: { title: "Silence notifications for one block", minutes: 2 },
    },
    {
      id: "end-of-day",
      pillar: "Priorities",
      minutes: fixed(10),
      cadence: daily,
      optional: true,
      priority: 85,
      copy: {
        default: {
          title: "End-of-day review",
          description: "What moved, what did not, and what tomorrow starts with.",
        },
      },
      minimum: { title: "Name one thing that moved today", minutes: 2 },
    },
    phoneBoundary("Boundaries"),
    planTomorrow("Priorities", "focused block"),
    weeklyLook("Priorities", "Review the week's work", "What actually moved, and what quietly ate the time?"),
  ],
  milestones: {
    7: { title: "One focused block per day", description: "Small, protected, and happening." },
    14: { title: "Priorities are set before the day starts", description: "You are choosing work rather than reacting to it." },
    21: { title: "Focus time is defended", description: "You have started saying no to things that used to win by default." },
    30: { title: "A working week that produces something", description: "You can point at what got finished across 30 days." },
  },
});
