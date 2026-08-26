import { defineStrategy, daily, everyNDays, phoneBoundary, planTomorrow, share, weeklyLook } from "@/lib/plan/strategies/shared";

/**
 * "Learn a skill" — practice-led rather than reading-led, with a small visible
 * artefact at the end so Day 30 is provable.
 */
export const learningStrategy = defineStrategy({
  slug: "learning",
  label: "Learn a skill",
  defaultTitle: "Learn a new skill",
  goalExamples: [
    "Get comfortable with a new language",
    "Learn to play something on an instrument",
    "Pick up a skill I keep putting off",
  ],
  pillars: [
    { name: "Practice", description: "Hands on the thing itself.", icon: "graduation-cap", sortOrder: 0 },
    { name: "Understanding", description: "Filling in what practice exposes.", icon: "lightbulb", sortOrder: 1 },
    { name: "Planning", description: "Knowing what to practise next.", icon: "list-checks", sortOrder: 2 },
  ],
  actions: [
    {
      id: "practice",
      pillar: "Practice",
      minutes: share(0.6, 15, 75),
      cadence: daily,
      priority: 10,
      copy: {
        default: {
          title: "Practise for {m} minutes",
          description: "Doing beats watching. Spend the time with your hands on it.",
        },
        CONSISTENCY: {
          title: "Practise for {m} minutes",
          description: "Deliberately small. Turning up every day is the whole job this week.",
        },
        DEPTH: {
          title: "Practise the part you are worst at for {m} minutes",
          description: "Comfortable practice stops producing progress around now.",
        },
        FINISH: {
          title: "Work on your finished piece for {m} minutes",
          description: "Something small and complete beats something large and abandoned.",
        },
      },
      minimum: { title: "Practise 10 minutes", minutes: 10 },
    },
    {
      id: "study-source",
      pillar: "Understanding",
      minutes: share(0.25, 10, 30),
      cadence: everyNDays(2),
      priority: 20,
      copy: {
        default: {
          title: "Spend {m} minutes learning the next piece of theory",
          description: "One lesson, one chapter, one video. Then go and use it.",
        },
      },
      minimum: { title: "Read or watch one short lesson", minutes: 5 },
    },
    {
      id: "capture",
      pillar: "Understanding",
      minutes: share(0.15, 5, 15),
      cadence: everyNDays(2, 1),
      optional: true,
      priority: 40,
      copy: {
        default: {
          title: "Write down what clicked today",
          description: "One or two lines. Future you will be glad of the record.",
        },
      },
      minimum: { title: "Write one sentence about today", minutes: 2 },
    },
    phoneBoundary("Practice"),
    planTomorrow("Planning", "practice"),
    weeklyLook("Planning", "Review what you can now do", "Compare against last week, not against someone else."),
  ],
  milestones: {
    7: { title: "Practice happens daily", description: "Short sessions, but they are happening." },
    14: { title: "The basics are familiar", description: "You need to look things up less often." },
    21: { title: "You are working on the hard parts", description: "Practice has stopped being comfortable, which is progress." },
    30: { title: "Something finished to show for it", description: "One small, complete piece of work." },
  },
});
