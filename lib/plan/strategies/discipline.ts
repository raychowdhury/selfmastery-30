import { defineStrategy, daily, everyNDays, fixed, phoneBoundary, planTomorrow, share, weeklyLook } from "@/lib/plan/strategies/shared";

/**
 * "Build discipline" / general personal growth. The trick is to make the
 * abstract concrete: one kept promise per day, at a fixed time.
 */
export const disciplineStrategy = defineStrategy({
  slug: "discipline",
  label: "Build discipline",
  defaultTitle: "Build discipline I can rely on",
  goalExamples: [
    "Do what I said I would do",
    "Stop starting over every Monday",
    "Become someone who follows through",
  ],
  pillars: [
    { name: "Follow-through", description: "One promise, kept daily.", icon: "check-circle", sortOrder: 0 },
    { name: "Structure", description: "Fixed times beat good intentions.", icon: "clock", sortOrder: 1 },
    { name: "Reflection", description: "Noticing what actually works.", icon: "pen-line", sortOrder: 2 },
  ],
  actions: [
    {
      id: "kept-promise",
      pillar: "Follow-through",
      minutes: share(0.45, 15, 60),
      cadence: daily,
      priority: 10,
      copy: {
        default: {
          title: "Do the {m}-minute thing you committed to",
          description: "One promise to yourself. Keeping it is the entire exercise.",
        },
        CONSISTENCY: {
          title: "Do the {m}-minute thing you committed to",
          description: "Keep it embarrassingly small this week. Small and done beats big and skipped.",
        },
        DEPTH: {
          title: "Do the {m}-minute thing, even on the day you least want to",
          description: "The days you do not feel like it are the ones that count.",
        },
      },
      minimum: { title: "Do a 10-minute version", minutes: 10 },
    },
    {
      id: "hard-first",
      pillar: "Follow-through",
      minutes: fixed(10),
      cadence: everyNDays(2),
      priority: 25,
      copy: {
        default: {
          title: "Do the thing you have been avoiding first",
          description: "It is rarely as bad as the avoidance.",
        },
      },
      minimum: { title: "Spend 5 minutes on the avoided thing", minutes: 5 },
    },
    {
      id: "fixed-time",
      pillar: "Structure",
      minutes: fixed(5),
      cadence: everyNDays(3),
      priority: 50,
      copy: {
        default: {
          title: "Protect the same slot in tomorrow's day",
          description: "Same time, same place. Structure carries you when motivation does not.",
        },
      },
      minimum: { title: "Block the time in your calendar", minutes: 2 },
    },
    {
      id: "note",
      pillar: "Reflection",
      minutes: fixed(5),
      cadence: everyNDays(2, 1),
      optional: true,
      priority: 80,
      copy: {
        default: {
          title: "Write one line about what made today work",
          description: "Patterns show up quickly once you write them down.",
        },
      },
      minimum: { title: "Write one line", minutes: 2 },
    },
    phoneBoundary("Structure"),
    planTomorrow("Structure", "commitment"),
    weeklyLook("Reflection", "Review the week honestly", "Which days did you keep the promise, and what did they have in common?"),
  ],
  milestones: {
    7: { title: "Seven small promises kept", description: "The proof that you do what you say." },
    14: { title: "A fixed time in the day", description: "You are not deciding any more, just doing." },
    21: { title: "You showed up on a bad day", description: "That is what separates this from motivation." },
    30: { title: "Follow-through you can point at", description: "Thirty days of evidence about who you are." },
  },
});
