import { defineStrategy, daily, everyNDays, fixed, planTomorrow, share, weeklyLook } from "@/lib/plan/strategies/shared";

export const sleepStrategy = defineStrategy({
  slug: "sleep",
  label: "Improve my sleep routine",
  defaultTitle: "Build a better sleep routine",
  goalExamples: [
    "Go to bed at a consistent time",
    "Stop scrolling in bed",
    "Wake up without feeling wrecked",
  ],
  safetyNote:
    "These are general routine suggestions. Persistent sleep problems are worth discussing with a doctor.",
  pillars: [
    { name: "Wind-down", description: "The hour before bed.", icon: "moon", sortOrder: 0 },
    { name: "Rhythm", description: "Consistent times, day and night.", icon: "clock", sortOrder: 1 },
  ],
  actions: [
    {
      id: "bedtime",
      pillar: "Rhythm",
      minutes: fixed(5),
      cadence: daily,
      priority: 10,
      copy: {
        default: {
          title: "Go to bed within 30 minutes of your target time",
          description: "Consistency matters more than the exact hour.",
        },
        DEPTH: {
          title: "Go to bed within 15 minutes of your target time",
          description: "Tightening the window is what makes mornings easier.",
        },
      },
      minimum: { title: "Be in bed before your usual latest time", minutes: 2 },
    },
    {
      id: "screens-down",
      pillar: "Wind-down",
      minutes: share(0.4, 15, 45),
      cadence: daily,
      priority: 20,
      copy: {
        default: {
          title: "Put screens away {m} minutes before bed",
          description: "Charge the phone outside the bedroom if you can.",
        },
      },
      minimum: { title: "Phone away 10 minutes before bed", minutes: 10 },
    },
    {
      id: "wind-down-ritual",
      pillar: "Wind-down",
      minutes: share(0.3, 10, 25),
      cadence: everyNDays(2),
      priority: 30,
      copy: {
        default: {
          title: "Spend {m} minutes on a quiet wind-down",
          description: "Reading, stretching, tidying one surface. Same thing each night works best.",
        },
      },
      minimum: { title: "Three quiet minutes before lights out", minutes: 3 },
    },
    {
      id: "morning-light",
      pillar: "Rhythm",
      minutes: fixed(10),
      cadence: everyNDays(2, 1),
      optional: true,
      priority: 40,
      copy: {
        default: {
          title: "Get daylight within an hour of waking",
          description: "Step outside, or sit by a window. It helps set the rest of the day.",
        },
      },
      minimum: { title: "Open the curtains straight after waking", minutes: 1 },
    },
    planTomorrow("Rhythm", "wind-down"),
    weeklyLook("Rhythm", "Review your week of sleep", "Which nights went well? What was different about them?"),
  ],
  milestones: {
    7: { title: "Bedtime is roughly consistent", description: "You know your target time and hit it most nights." },
    14: { title: "A wind-down exists", description: "The last half hour of the day looks the same each night." },
    21: { title: "Mornings feel easier", description: "Waking up takes less negotiation than it used to." },
    30: { title: "A routine you can keep", description: "You have a sleep pattern that holds through a normal week." },
  },
});
