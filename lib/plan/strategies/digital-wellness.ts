import { defineStrategy, daily, everyNDays, fixed, planTomorrow, share, weeklyLook } from "@/lib/plan/strategies/shared";

export const digitalWellnessStrategy = defineStrategy({
  slug: "digital-wellness",
  label: "Reduce phone usage",
  defaultTitle: "Spend less time on my phone",
  goalExamples: [
    "Stop losing evenings to scrolling",
    "Use my phone deliberately instead of automatically",
    "Get my attention back",
  ],
  pillars: [
    { name: "Boundaries", description: "When and where the phone is allowed.", icon: "shield", sortOrder: 0 },
    { name: "Replacement", description: "Something better to do instead.", icon: "sparkles", sortOrder: 1 },
    { name: "Awareness", description: "Seeing the actual numbers.", icon: "bar-chart-3", sortOrder: 2 },
  ],
  actions: [
    {
      id: "phone-free-block",
      pillar: "Boundaries",
      minutes: share(0.5, 15, 60),
      cadence: daily,
      priority: 10,
      copy: {
        default: {
          title: "Take a {m}-minute phone-free block",
          description: "Another room, not just face down. Distance beats willpower.",
        },
        DEPTH: {
          title: "Protect {m} phone-free minutes at the same time daily",
          description: "The same slot each day is what turns this into a habit.",
        },
      },
      minimum: { title: "10 minutes with the phone in another room", minutes: 10 },
    },
    {
      id: "check-usage",
      pillar: "Awareness",
      minutes: fixed(5),
      cadence: everyNDays(2),
      priority: 30,
      copy: {
        default: {
          title: "Check yesterday's screen time",
          description: "Look at the number without arguing with it. That is enough for now.",
        },
      },
      minimum: { title: "Glance at your screen time", minutes: 1 },
    },
    {
      id: "friction",
      pillar: "Boundaries",
      minutes: fixed(10),
      cadence: everyNDays(3, 1),
      priority: 40,
      copy: {
        default: {
          title: "Add friction to one app",
          description: "Log out, delete it, move it off the home screen. One app at a time.",
        },
      },
      minimum: { title: "Turn off notifications for one app", minutes: 2 },
    },
    {
      id: "replacement",
      pillar: "Replacement",
      minutes: share(0.3, 10, 40),
      cadence: everyNDays(2, 1),
      priority: 50,
      copy: {
        default: {
          title: "Spend {m} minutes on something you would rather be doing",
          description: "Reading, walking, cooking, a person. Removing a habit works better when something replaces it.",
        },
      },
      minimum: { title: "Five minutes doing something else", minutes: 5 },
    },
    planTomorrow("Boundaries", "phone-free block"),
    weeklyLook("Awareness", "Review the week's screen time", "Which days were lowest? What was different about them?"),
  ],
  milestones: {
    7: { title: "A daily phone-free block exists", description: "Small, but it happens." },
    14: { title: "The numbers are moving", description: "Screen time is down and you know which app mattered." },
    21: { title: "Something replaced the scrolling", description: "The gap is filled with something you chose." },
    30: { title: "A phone you use on purpose", description: "Deliberate use, most of the time." },
  },
});
