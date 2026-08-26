import { defineStrategy, daily, everyNDays, fixed, planTomorrow, share, weeklyLook } from "@/lib/plan/strategies/shared";

export const morningRoutineStrategy = defineStrategy({
  slug: "morning-routine",
  label: "Build a morning routine",
  defaultTitle: "Build a morning routine that sticks",
  goalExamples: [
    "Start the day on purpose instead of in a rush",
    "Stop reaching for my phone first thing",
    "Get one important thing done before 9am",
  ],
  pillars: [
    { name: "Start", description: "The first thirty minutes.", icon: "sunrise", sortOrder: 0 },
    { name: "Momentum", description: "One useful thing, early.", icon: "target", sortOrder: 1 },
  ],
  actions: [
    {
      id: "wake-consistent",
      pillar: "Start",
      minutes: fixed(5),
      cadence: daily,
      priority: 10,
      copy: {
        default: {
          title: "Get up within 20 minutes of your target time",
          description: "Same time most days. The routine cannot start if the start moves.",
        },
        DEPTH: {
          title: "Get up within 10 minutes of your target time",
          description: "Tighter now that the habit exists.",
        },
      },
      minimum: { title: "Get up without a second snooze", minutes: 1 },
    },
    {
      id: "no-phone-first",
      pillar: "Start",
      minutes: share(0.35, 10, 40),
      cadence: daily,
      priority: 20,
      copy: {
        default: {
          title: "Stay off your phone for the first {m} minutes",
          description: "Whatever is in there will still be there afterwards.",
        },
      },
      minimum: { title: "Ten minutes before the first look", minutes: 10 },
    },
    {
      id: "morning-anchor",
      pillar: "Momentum",
      minutes: share(0.4, 10, 45),
      cadence: daily,
      priority: 30,
      copy: {
        default: {
          title: "Do your {m}-minute morning thing",
          description: "Movement, reading, writing, planning. Same thing each day.",
        },
        FINISH: {
          title: "Do your {m}-minute morning thing",
          description: "This is the routine you are keeping after Day 30.",
        },
      },
      minimum: { title: "Five minutes of your morning thing", minutes: 5 },
    },
    {
      id: "prep-night-before",
      pillar: "Start",
      minutes: fixed(10),
      cadence: everyNDays(2),
      priority: 60,
      copy: {
        default: {
          title: "Set tomorrow morning up tonight",
          description: "Clothes, kettle, notebook, alarm across the room. Mornings are won the night before.",
        },
      },
      minimum: { title: "Do one thing tonight for tomorrow", minutes: 3 },
    },
    planTomorrow("Momentum", "morning"),
    weeklyLook("Momentum", "Review your mornings", "Which ones went well, and what made the difference?"),
  ],
  milestones: {
    7: { title: "A consistent wake-up time", description: "Roughly the same hour, most days." },
    14: { title: "The phone is no longer first", description: "The morning starts with something you chose." },
    21: { title: "The routine runs itself", description: "You do it without deciding to." },
    30: { title: "Mornings you would keep", description: "A start to the day that survives a bad night." },
  },
});
