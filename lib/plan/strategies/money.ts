import { defineStrategy, daily, everyNDays, fixed, planTomorrow, share, weeklyLook } from "@/lib/plan/strategies/shared";

/**
 * Organisational only: recording, reviewing, planning. Nothing here recommends
 * products, investments or debt strategies.
 */
export const moneyStrategy = defineStrategy({
  slug: "financial-organization",
  label: "Get control of my money",
  defaultTitle: "Get control of my money",
  goalExamples: [
    "Know where my money actually goes",
    "Stop being surprised by bills",
    "Save something every month",
  ],
  safetyNote:
    "SelfMastery helps you organise and review your own money. It is not a financial adviser and gives no investment, tax or debt advice. For decisions with real consequences, speak to a qualified professional.",
  pillars: [
    { name: "Awareness", description: "Seeing where the money goes.", icon: "receipt", sortOrder: 0 },
    { name: "Control", description: "Small decisions, made on purpose.", icon: "wallet", sortOrder: 1 },
    { name: "Planning", description: "Looking a week ahead instead of backwards.", icon: "calendar-check", sortOrder: 2 },
  ],
  actions: [
    {
      id: "record",
      pillar: "Awareness",
      minutes: fixed(5),
      cadence: daily,
      priority: 10,
      copy: {
        default: {
          title: "Record what you spent today",
          description: "Every purchase, no judgement. Awareness comes before change.",
        },
        DEPTH: {
          title: "Record today's spending and tag each one",
          description: "Essential, useful, or neither. The tags are where the insight lives.",
        },
      },
      minimum: { title: "Note today's largest expense", minutes: 2 },
    },
    {
      id: "category-review",
      pillar: "Awareness",
      minutes: share(0.3, 10, 30),
      cadence: everyNDays(3),
      priority: 30,
      copy: {
        default: {
          title: "Review one spending category for {m} minutes",
          description: "Subscriptions, food, transport. One at a time, not all at once.",
        },
      },
      minimum: { title: "Look at one category", minutes: 5 },
    },
    {
      id: "pause-purchase",
      pillar: "Control",
      minutes: fixed(5),
      cadence: everyNDays(2, 1),
      priority: 45,
      copy: {
        default: {
          title: "Put one non-essential purchase on hold",
          description: "Not never. Just not today. Most of them stop being appealing by tomorrow.",
        },
      },
      minimum: { title: "Delay one small purchase by a day", minutes: 1 },
    },
    {
      id: "bills",
      pillar: "Planning",
      minutes: share(0.25, 10, 25),
      cadence: everyNDays(4, 2),
      priority: 50,
      copy: {
        default: {
          title: "Check what is due in the next two weeks",
          description: "Surprises are the expensive part, not the bills themselves.",
        },
      },
      minimum: { title: "Check the next bill due", minutes: 3 },
    },
    planTomorrow("Planning", "money check"),
    weeklyLook("Planning", "Do your weekly money check", "Total spent, one thing that surprised you, one thing to change."),
  ],
  milestones: {
    7: { title: "You are recording spending daily", description: "The habit that makes everything else possible." },
    14: { title: "You know your two biggest categories", description: "Most of the money is usually in a couple of places." },
    21: { title: "One category is deliberately lower", description: "A decision you made, not a sacrifice you endured." },
    30: { title: "A weekly money routine", description: "Fifteen minutes a week, and no more nasty surprises." },
  },
});
