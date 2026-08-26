import { defineStrategy, daily, everyNDays, fixed, planTomorrow, share, weeklyLook } from "@/lib/plan/strategies/shared";

/**
 * Broad "get healthier" goals. Deliberately behavioural — movement, water,
 * food awareness, wind-down. Nothing prescriptive about diet or medicine.
 */
export const healthStrategy = defineStrategy({
  slug: "health",
  label: "Get healthier",
  defaultTitle: "Build healthier daily habits",
  goalExamples: [
    "Have more energy during the week",
    "Eat and sleep more consistently",
    "Look after myself instead of running on empty",
  ],
  safetyNote:
    "SelfMastery offers general lifestyle suggestions only. It does not give medical, dietary or mental-health advice. Speak to a qualified professional about anything health-related that concerns you.",
  pillars: [
    { name: "Movement", description: "Getting the body going.", icon: "activity", sortOrder: 0 },
    { name: "Nourishment", description: "Food and water, without rules or restriction.", icon: "apple", sortOrder: 1 },
    { name: "Recovery", description: "Winding down and resting properly.", icon: "moon", sortOrder: 2 },
  ],
  actions: [
    {
      id: "daily-movement",
      pillar: "Movement",
      minutes: share(0.7, 10, 45),
      cadence: daily,
      priority: 10,
      copy: {
        default: {
          title: "Move your body for {m} minutes",
          description: "A walk, a stretch, a cycle. Whatever you will actually do today.",
        },
        DEPTH: {
          title: "Move your body for {m} minutes",
          description: "Slightly longer than week one. Keep it comfortable.",
        },
      },
      minimum: { title: "Move for 5 minutes", minutes: 5 },
    },
    {
      id: "water",
      pillar: "Nourishment",
      minutes: fixed(5),
      cadence: daily,
      priority: 40,
      copy: {
        default: {
          title: "Drink water with every meal",
          description: "No counting, no targets. Just make it the default drink.",
        },
      },
      minimum: { title: "Drink one glass of water", minutes: 1 },
    },
    {
      id: "food-notice",
      pillar: "Nourishment",
      minutes: fixed(5),
      cadence: everyNDays(2),
      priority: 45,
      copy: {
        default: {
          title: "Note what you ate today",
          description: "Awareness first. No judgement, no changes required yet.",
        },
        DEPTH: {
          title: "Add one thing you would like more of",
          description: "A vegetable, a proper breakfast, a meal you sit down for. Add rather than remove.",
        },
      },
      minimum: { title: "Note one meal", minutes: 2 },
    },
    {
      id: "wind-down",
      pillar: "Recovery",
      minutes: share(0.25, 10, 30),
      cadence: everyNDays(2, 1),
      priority: 55,
      copy: {
        default: {
          title: "Wind down for {m} minutes before bed",
          description: "Screens down, lights low. Give the day a proper ending.",
        },
      },
      minimum: { title: "Five quiet minutes before bed", minutes: 5 },
    },
    planTomorrow("Recovery", "movement"),
    weeklyLook(
      "Recovery",
      "Review how the week felt",
      "Energy, sleep, mood. Which days felt best, and why?"
    ),
  ],
  milestones: {
    7: { title: "Daily basics are in place", description: "Movement and water happened on most days." },
    14: { title: "The routine has a shape", description: "You know roughly when each part of the day happens." },
    21: { title: "You notice the difference", description: "Energy or sleep has shifted enough for you to feel it." },
    30: { title: "Habits that survive a busy week", description: "The basics hold up even when the day goes sideways." },
  },
});
