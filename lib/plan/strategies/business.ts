import { defineStrategy, everyNDays, fixed, phoneBoundary, planTomorrow, share, weeklyLook } from "@/lib/plan/strategies/shared";

/**
 * Launching a first product. Sequenced idea → validation → customer research →
 * prototype → feedback → improvement → launch, because building before talking
 * to anyone is the usual way this fails.
 */
export const businessStrategy = defineStrategy({
  slug: "business",
  label: "Build a business",
  defaultTitle: "Launch my first product",
  goalExamples: [
    "Get my first paying customer",
    "Launch the thing instead of tinkering with it",
    "Find out whether anyone actually wants this",
  ],
  pillars: [
    { name: "Build", description: "Moving the product forward.", icon: "rocket", sortOrder: 0 },
    { name: "Customers", description: "Talking to the people you are building for.", icon: "users", sortOrder: 1 },
    { name: "Planning", description: "Deciding what matters next.", icon: "list-checks", sortOrder: 2 },
  ],
  sequences: [
    {
      id: "launch-track",
      pillar: "Build",
      minutes: { kind: "share", share: 0.55, min: 20, max: 100 },
      priority: 10,
      stages: [
        {
          title: "Write your idea down in three sentences",
          description: "Who it is for, what problem it solves, why they would pay.",
          minimum: "Write one sentence describing the idea",
        },
        {
          title: "Name the single riskiest assumption",
          description: "The one that, if wrong, makes everything else pointless.",
          minimum: "Write down one assumption",
        },
        {
          title: "Find ten people who have the problem",
          description: "Real names, not a market size. A list you could message today.",
          minimum: "Add two names to the list",
        },
        {
          title: "Talk to people about the problem, not your idea",
          description: "Ask what they do now and what it costs them. Do not pitch.",
          minimum: "Send one message asking for a conversation",
        },
        {
          title: "Write down what you heard",
          description: "Patterns across conversations, in their words rather than yours.",
          minimum: "Write one line you heard",
        },
        {
          title: "Build the smallest useful version",
          description: "The least you could put in someone's hands this week.",
          minimum: "Work on the prototype for 15 minutes",
        },
        {
          title: "Put it in front of three people",
          description: "Watch them use it. Say nothing while they do.",
          minimum: "Show it to one person",
        },
        {
          title: "Fix the three things that stopped them",
          description: "Only the blockers. Everything else waits.",
          minimum: "Fix one blocker",
        },
        {
          title: "Prepare the launch",
          description: "Where it goes, what it says, and who you will tell first.",
          minimum: "Write one line of launch copy",
        },
        {
          title: "Launch it",
          description: "Publicly, imperfectly, on a date you have already told someone.",
          minimum: "Take one step toward launching",
        },
      ],
    },
  ],
  actions: [
    {
      id: "customer-contact",
      pillar: "Customers",
      minutes: share(0.25, 10, 40),
      cadence: everyNDays(2),
      priority: 30,
      copy: {
        default: {
          title: "Talk to one potential customer",
          description: "A message, a call, a comment. One conversation beats an afternoon of guessing.",
        },
        FINISH: {
          title: "Tell one more person it is coming",
          description: "A launch nobody was expecting is not a launch.",
        },
      },
      minimum: { title: "Send one message", minutes: 5 },
    },
    {
      id: "next-decision",
      pillar: "Planning",
      minutes: fixed(10),
      cadence: everyNDays(3, 1),
      priority: 60,
      copy: {
        default: {
          title: "Decide the one thing that matters this week",
          description: "Write it where you will see it. Everything else is optional.",
        },
      },
      minimum: { title: "Name this week's one thing", minutes: 3 },
    },
    phoneBoundary("Build"),
    planTomorrow("Planning", "build session"),
    weeklyLook("Planning", "Review the week", "What did you learn, and what does it change?"),
  ],
  milestones: {
    7: { title: "The idea is written down and narrowed", description: "Including the assumption most likely to sink it." },
    14: { title: "You have talked to real people", description: "And written down what they actually said." },
    21: { title: "Something exists and has been used", description: "A rough version, in front of real people." },
    30: { title: "Launched", description: "Out in the world, with the first feedback already coming back." },
  },
});
