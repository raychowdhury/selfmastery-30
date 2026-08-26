import { defineStrategy, daily, everyNDays, fixed, planTomorrow, share, weeklyLook } from "@/lib/plan/strategies/shared";

/**
 * Movement for someone who is starting from very little. Everything here is
 * general activity guidance — walking, stretching, breaking up sitting. No
 * training programme, no intensity prescriptions.
 */
export const fitnessStrategy = defineStrategy({
  slug: "fitness",
  label: "Get active",
  defaultTitle: "Become more physically active",
  goalExamples: [
    "Walk every day without it feeling like a chore",
    "Move my body five days a week",
    "Build a simple exercise routine I can keep",
  ],
  safetyNote:
    "These are general activity suggestions, not a training or medical programme. Move at a pace that feels comfortable, and check with a healthcare professional if you have any concerns.",
  pillars: [
    { name: "Movement", description: "The activity itself.", icon: "footprints", sortOrder: 0 },
    { name: "Energy", description: "The small things that make moving easier.", icon: "battery-charging", sortOrder: 1 },
    { name: "Planning", description: "Deciding when it actually happens.", icon: "calendar-check", sortOrder: 2 },
  ],
  actions: [
    {
      id: "walk",
      pillar: "Movement",
      minutes: share(0.75, 10, 60),
      cadence: daily,
      priority: 10,
      copy: {
        default: {
          title: "Walk for {m} minutes",
          description: "Build the habit before you increase the intensity. Pace does not matter yet.",
        },
        CONSISTENCY: {
          title: "Walk for {m} minutes",
          description: "Short and easy on purpose. The point this week is turning up, not distance.",
        },
        DEPTH: {
          title: "Walk for {m} minutes",
          description: "Try a slightly brisker pace, or a route with a hill. Still comfortable, just less flat.",
        },
        FINISH: {
          title: "Walk for {m} minutes",
          description: "This is the version of the habit you want to keep after Day 30.",
        },
      },
      minimum: { title: "Walk 5 minutes", minutes: 5 },
    },
    {
      id: "movement-break",
      pillar: "Movement",
      minutes: fixed(10),
      cadence: everyNDays(2),
      priority: 30,
      copy: {
        default: {
          title: "Take a {m}-minute movement break",
          description: "Stand up, stretch, walk around. Breaking up long sitting counts.",
        },
        BUILD: {
          title: "Take two short movement breaks",
          description: "Once mid-morning, once mid-afternoon. Set a reminder if you need one.",
        },
      },
      minimum: { title: "Stand up and stretch for 2 minutes", minutes: 2 },
    },
    {
      id: "hydration",
      pillar: "Energy",
      minutes: fixed(5),
      cadence: daily,
      optional: true,
      priority: 50,
      copy: {
        default: {
          title: "Drink water with each meal",
          description: "An easy win that makes the rest of the day feel better.",
        },
      },
      minimum: { title: "Drink one glass of water", minutes: 1 },
    },
    {
      id: "mobility",
      pillar: "Energy",
      minutes: share(0.2, 5, 20),
      cadence: everyNDays(2, 1),
      priority: 40,
      copy: {
        default: {
          title: "Stretch gently for {m} minutes",
          description: "Neck, shoulders, hips, calves. Nothing that hurts.",
        },
        DEPTH: {
          title: "Stretch or do light bodyweight movement for {m} minutes",
          description: "Add a few slow squats or wall push-ups if that feels comfortable.",
        },
      },
      minimum: { title: "Stretch for 3 minutes", minutes: 3 },
    },
    planTomorrow("Planning", "walk"),
    weeklyLook(
      "Planning",
      "Look back at this week's movement",
      "Which days worked, and what did those days have in common?"
    ),
  ],
  milestones: {
    7: {
      title: "You have moved on most days",
      description: "The habit exists. It is small, and that is exactly right for week one.",
    },
    14: {
      title: "Movement has a regular time",
      description: "You are no longer deciding whether to go, only heading out.",
    },
    21: {
      title: "Sessions feel longer or easier",
      description: "The same walk takes less out of you than it did on Day 1.",
    },
    30: {
      title: "An activity routine you can keep",
      description: "You have a repeatable weekly pattern that does not depend on motivation.",
    },
  },
});
