import { defineStrategy, daily, everyNDays, phoneBoundary, planTomorrow, share, weeklyLook } from "@/lib/plan/strategies/shared";

export const readingStrategy = defineStrategy({
  slug: "reading",
  label: "Read every day",
  defaultTitle: "Build a reading habit",
  goalExamples: [
    "Read a few pages every day",
    "Finish the book I keep restarting",
    "Read instead of scrolling before bed",
  ],
  pillars: [
    { name: "Reading", description: "Pages, most days.", icon: "book-open", sortOrder: 0 },
    { name: "Reflection", description: "Keeping something from what you read.", icon: "pen-line", sortOrder: 1 },
  ],
  actions: [
    {
      id: "read",
      pillar: "Reading",
      minutes: share(0.7, 10, 60),
      cadence: daily,
      priority: 10,
      copy: {
        default: {
          title: "Read for {m} minutes",
          description: "Same chair, same time if you can. Phone in another room.",
        },
        CONSISTENCY: {
          title: "Read for {m} minutes",
          description: "Ten pages is plenty. Finishing the book is not this week's job.",
        },
        DEPTH: {
          title: "Read for {m} minutes",
          description: "Long enough now to properly get into it.",
        },
      },
      minimum: { title: "Read 2 pages", minutes: 5 },
    },
    {
      id: "takeaway",
      pillar: "Reflection",
      minutes: share(0.2, 5, 15),
      cadence: everyNDays(2),
      priority: 30,
      copy: {
        default: {
          title: "Write one takeaway",
          description: "A sentence. What stayed with you, or what you disagreed with.",
        },
      },
      minimum: { title: "Note one line you liked", minutes: 2 },
    },
    phoneBoundary("Reading"),
    planTomorrow("Reading", "reading time"),
    weeklyLook("Reflection", "Look back at what you read", "What has stayed with you from this week?"),
  ],
  milestones: {
    7: { title: "You read on most days", description: "The habit has a time and a place." },
    14: { title: "Reading replaced something else", description: "Usually a scroll. That swap is the real win." },
    21: { title: "Sessions got longer on their own", description: "You are reading because you want to, not because it is on the list." },
    30: { title: "A book finished, or nearly", description: "And a habit that continues past Day 30." },
  },
});
