import { defineStrategy, daily, everyNDays, fixed, planTomorrow, share, weeklyLook } from "@/lib/plan/strategies/shared";

export const familyStrategy = defineStrategy({
  slug: "family",
  label: "Spend more time with family",
  defaultTitle: "Spend better time with the people close to me",
  goalExamples: [
    "Be properly present in the evenings",
    "Have real conversations, not logistics",
    "Do something together every week",
  ],
  pillars: [
    { name: "Presence", description: "Being there, without the phone.", icon: "heart", sortOrder: 0 },
    { name: "Connection", description: "Conversations that are not admin.", icon: "message-circle", sortOrder: 1 },
    { name: "Shared load", description: "Carrying your part of home life.", icon: "home", sortOrder: 2 },
  ],
  actions: [
    {
      id: "device-free",
      pillar: "Presence",
      minutes: share(0.55, 15, 60),
      cadence: daily,
      priority: 10,
      copy: {
        default: {
          title: "Spend {m} device-free minutes together",
          description: "Phone in another room. Presence is the part people actually notice.",
        },
        DEPTH: {
          title: "Protect {m} device-free minutes at the same time each day",
          description: "Predictable beats spontaneous when everyone is tired.",
        },
      },
      minimum: { title: "10 device-free minutes together", minutes: 10 },
    },
    {
      id: "real-question",
      pillar: "Connection",
      minutes: fixed(10),
      cadence: daily,
      priority: 20,
      copy: {
        default: {
          title: "Ask about their day and listen properly",
          description: "One real question, then let the silence do some work.",
        },
        BUILD: {
          title: "Ask a question you do not already know the answer to",
          description: "Best part of today? Hardest part? Anything on your mind?",
        },
      },
      minimum: { title: "Ask one real question", minutes: 3 },
    },
    {
      id: "household",
      pillar: "Shared load",
      minutes: share(0.25, 10, 30),
      cadence: everyNDays(2),
      priority: 40,
      copy: {
        default: {
          title: "Take one household job off someone else's plate",
          description: "Doing it without being asked is the whole point.",
        },
      },
      minimum: { title: "Do one small household task", minutes: 5 },
    },
    {
      id: "plan-activity",
      pillar: "Connection",
      minutes: fixed(10),
      cadence: everyNDays(4, 3),
      priority: 60,
      copy: {
        default: {
          title: "Plan one thing to do together",
          description: "It does not have to cost anything. It does have to be in the diary.",
        },
      },
      minimum: { title: "Suggest one thing for the weekend", minutes: 3 },
    },
    planTomorrow("Presence", "time together"),
    weeklyLook("Connection", "Look back at the week together", "When did it feel easy? What got in the way?"),
  ],
  milestones: {
    7: { title: "Device-free time exists", description: "Short, daily, and phone-free." },
    14: { title: "Conversations go past logistics", description: "You are asking better questions." },
    21: { title: "Something planned together", description: "Time together is now scheduled rather than hoped for." },
    30: { title: "A rhythm the household can feel", description: "Presence has become the normal setting, not the exception." },
  },
});
