import { defineStrategy, daily, everyNDays, phoneBoundary, planTomorrow, share, weeklyLook } from "@/lib/plan/strategies/shared";

export const studyStrategy = defineStrategy({
  slug: "study",
  label: "Study consistently",
  defaultTitle: "Study consistently",
  goalExamples: [
    "Improve my grades this term",
    "Study every day without cramming",
    "Stay on top of my coursework",
  ],
  pillars: [
    { name: "Study", description: "Time actually spent learning.", icon: "book-open", sortOrder: 0 },
    { name: "Focus", description: "Protecting attention while you work.", icon: "target", sortOrder: 1 },
    { name: "Planning", description: "Knowing what to study next.", icon: "list-checks", sortOrder: 2 },
  ],
  actions: [
    {
      id: "study-block",
      pillar: "Study",
      minutes: share(0.6, 15, 90),
      cadence: daily,
      priority: 10,
      copy: {
        default: {
          title: "Study for {m} minutes",
          description: "One subject, phone away, timer running.",
        },
        CONSISTENCY: {
          title: "Study for {m} minutes",
          description: "Short on purpose. The aim this week is a session every day, not a long one.",
        },
        DEPTH: {
          title: "Study for {m} minutes on your hardest topic",
          description: "Start with the thing you have been avoiding. It gets easier once it is underway.",
        },
        FINISH: {
          title: "Study for {m} minutes",
          description: "Work on whatever brings you closest to how you defined a successful Day 30.",
        },
      },
      minimum: { title: "Study 10 minutes", minutes: 10 },
    },
    {
      id: "review",
      pillar: "Study",
      minutes: share(0.2, 10, 30),
      cadence: everyNDays(2),
      priority: 20,
      copy: {
        default: {
          title: "Review yesterday's material for {m} minutes",
          description: "Cover your notes and try to recall it first. Checking comes second.",
        },
        DEPTH: {
          title: "Test yourself for {m} minutes without notes",
          description: "Retrieval is uncomfortable and it is what makes things stick.",
        },
      },
      minimum: { title: "Review one page of notes", minutes: 5 },
    },
    {
      id: "assignment",
      pillar: "Study",
      minutes: share(0.3, 15, 45),
      cadence: everyNDays(3, 2),
      priority: 25,
      copy: {
        default: {
          title: "Move one assignment forward by {m} minutes",
          description: "Not finish it. Move it. Open the document and add something.",
        },
      },
      minimum: { title: "Open the assignment and write one line", minutes: 5 },
    },
    phoneBoundary("Focus"),
    planTomorrow("Planning", "study session"),
    weeklyLook(
      "Planning",
      "Plan next week's study",
      "What is coming up, and which topic needs the most time?"
    ),
  ],
  milestones: {
    7: { title: "You studied on most days", description: "Sessions were short. That is the point of week one." },
    14: { title: "Study has a fixed slot", description: "You no longer negotiate with yourself about when to start." },
    21: { title: "You are testing yourself, not just re-reading", description: "Harder, and far more effective." },
    30: { title: "A study routine that survives a busy week", description: "You can point at what you covered over 30 days." },
  },
});
