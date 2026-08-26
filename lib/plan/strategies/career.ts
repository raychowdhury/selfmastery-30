import { defineStrategy, daily, everyNDays, fixed, planTomorrow, share, weeklyLook } from "@/lib/plan/strategies/shared";

export const careerStrategy = defineStrategy({
  slug: "career",
  label: "Move my career forward",
  defaultTitle: "Move my career forward",
  goalExamples: [
    "Be ready for a promotion conversation",
    "Build a skill my role actually needs",
    "Be visible for the work I already do",
  ],
  pillars: [
    { name: "Craft", description: "Getting measurably better at the work.", icon: "hammer", sortOrder: 0 },
    { name: "Visibility", description: "Making the work known.", icon: "megaphone", sortOrder: 1 },
    { name: "Planning", description: "Direction, not drift.", icon: "compass", sortOrder: 2 },
  ],
  actions: [
    {
      id: "skill-block",
      pillar: "Craft",
      minutes: share(0.5, 15, 60),
      cadence: daily,
      priority: 10,
      copy: {
        default: {
          title: "Spend {m} minutes building the skill you need next",
          description: "The one that would matter in the role you want, not the one you already have.",
        },
        DEPTH: {
          title: "Apply the skill to real work for {m} minutes",
          description: "Practice inside the job counts double.",
        },
      },
      minimum: { title: "10 focused minutes on the skill", minutes: 10 },
    },
    {
      id: "evidence",
      pillar: "Visibility",
      minutes: fixed(10),
      cadence: everyNDays(2),
      priority: 30,
      copy: {
        default: {
          title: "Record one thing you delivered",
          description: "A line in a running document. In six months this is your case.",
        },
        FINISH: {
          title: "Turn your record into something you could send",
          description: "A short summary of what you have delivered, in your own words.",
        },
      },
      minimum: { title: "Note one thing you did well today", minutes: 3 },
    },
    {
      id: "conversation",
      pillar: "Visibility",
      minutes: share(0.25, 10, 30),
      cadence: everyNDays(4, 2),
      priority: 45,
      copy: {
        default: {
          title: "Have one useful work conversation",
          description: "Ask someone how they got where they are, or share what you are working on.",
        },
      },
      minimum: { title: "Send one message to someone useful", minutes: 5 },
    },
    planTomorrow("Planning", "skill block"),
    weeklyLook("Planning", "Review the week against where you want to be", "What moved you closer? What was just busy?"),
  ],
  milestones: {
    7: { title: "Daily practice has started", description: "A skill block exists in your week." },
    14: { title: "Evidence is accumulating", description: "You have a written record of what you deliver." },
    21: { title: "People know what you are working on", description: "Visibility is deliberate rather than accidental." },
    30: { title: "A case you could actually make", description: "Skill, evidence and a conversation to have." },
  },
});
