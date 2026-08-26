import type { Difficulty } from "@/lib/generated/prisma/enums";

export interface ChallengeTemplate {
  slug: string;
  name: string;
  description: string;
  /** Strategy that generates the plan. */
  category: string;
  group: "Popular" | "Health" | "Career" | "Learning" | "Life" | "Focus";
  timeLabel: string;
  suggestedMinutes: number;
  suggestedDifficulty: Difficulty;
  /** Pre-filled goal text. Always editable before the plan is generated. */
  goal: string;
  /** Demo/seed only — kept out of the public template list. */
  isDemo?: boolean;
}

/**
 * Templates are content. Adding one is a row here, not a schema change — the
 * whole point of the generic pillar/action model.
 */
export const TEMPLATES: ChallengeTemplate[] = [
  {
    slug: "build-discipline",
    name: "Build Discipline",
    description: "Build the ability to follow through consistently.",
    category: "discipline",
    group: "Popular",
    timeLabel: "15–30 min/day",
    suggestedMinutes: 20,
    suggestedDifficulty: "BALANCED",
    goal: "Do what I say I am going to do, every day",
  },
  {
    slug: "get-active",
    name: "Get Active",
    description: "Move consistently without burning out.",
    category: "fitness",
    group: "Popular",
    timeLabel: "20–40 min/day",
    suggestedMinutes: 30,
    suggestedDifficulty: "BALANCED",
    goal: "Become more physically active",
  },
  {
    slug: "study-consistently",
    name: "Study Consistently",
    description: "A study routine that survives busy weeks.",
    category: "study",
    group: "Learning",
    timeLabel: "30–60 min/day",
    suggestedMinutes: 60,
    suggestedDifficulty: "BALANCED",
    goal: "Study consistently instead of cramming",
  },
  {
    slug: "reduce-screen-time",
    name: "Reduce Screen Time",
    description: "Take back control of your attention.",
    category: "digital-wellness",
    group: "Focus",
    timeLabel: "10–20 min/day",
    suggestedMinutes: 20,
    suggestedDifficulty: "GENTLE",
    goal: "Spend less time on my phone",
  },
  {
    slug: "read-every-day",
    name: "Read Every Day",
    description: "A reading habit measured in pages, not pressure.",
    category: "reading",
    group: "Learning",
    timeLabel: "15–30 min/day",
    suggestedMinutes: 20,
    suggestedDifficulty: "GENTLE",
    goal: "Read every day",
  },
  {
    slug: "job-search",
    name: "Job Search",
    description: "Turn the search into manageable daily actions.",
    category: "job-search",
    group: "Career",
    timeLabel: "30–45 min/day",
    suggestedMinutes: 45,
    suggestedDifficulty: "BALANCED",
    goal: "Find a better job",
  },
  {
    slug: "organize-my-life",
    name: "Organize My Life",
    description: "Clear the backlog one small area at a time.",
    category: "organization",
    group: "Life",
    timeLabel: "15–30 min/day",
    suggestedMinutes: 20,
    suggestedDifficulty: "BALANCED",
    goal: "Get organised and stay that way",
  },
  {
    slug: "money-reset",
    name: "Money Reset",
    description: "Build better financial organization.",
    category: "financial-organization",
    group: "Life",
    timeLabel: "10–20 min/day",
    suggestedMinutes: 15,
    suggestedDifficulty: "GENTLE",
    goal: "Get control of my money",
  },
  {
    slug: "finish-a-project",
    name: "Finish a Project",
    description: "Stop restarting and start finishing.",
    category: "project",
    group: "Popular",
    timeLabel: "30–60 min/day",
    suggestedMinutes: 60,
    suggestedDifficulty: "BALANCED",
    goal: "Finish the project I keep putting off",
  },
  {
    slug: "morning-routine",
    name: "Morning Routine",
    description: "Own the first hour of your day.",
    category: "morning-routine",
    group: "Life",
    timeLabel: "20–30 min/day",
    suggestedMinutes: 30,
    suggestedDifficulty: "BALANCED",
    goal: "Build a morning routine that sticks",
  },
  {
    slug: "sleep-routine",
    name: "Sleep Routine",
    description: "Wind down earlier. Wake up human.",
    category: "sleep",
    group: "Health",
    timeLabel: "10–15 min/day",
    suggestedMinutes: 15,
    suggestedDifficulty: "GENTLE",
    goal: "Build a better sleep routine",
  },
  {
    slug: "family-time",
    name: "Family Time",
    description: "Make meaningful time intentional.",
    category: "family",
    group: "Life",
    timeLabel: "20–40 min/day",
    suggestedMinutes: 30,
    suggestedDifficulty: "BALANCED",
    goal: "Spend better time with the people close to me",
  },
  {
    slug: "learn-a-skill",
    name: "Learn a Skill",
    description: "Practise daily and finish with something to show.",
    category: "learning",
    group: "Learning",
    timeLabel: "30–60 min/day",
    suggestedMinutes: 45,
    suggestedDifficulty: "BALANCED",
    goal: "Learn a new skill",
  },
  {
    slug: "get-healthier",
    name: "Get Healthier",
    description: "Energy, movement and rest, without a regime.",
    category: "health",
    group: "Health",
    timeLabel: "20–40 min/day",
    suggestedMinutes: 30,
    suggestedDifficulty: "GENTLE",
    goal: "Build healthier daily habits",
  },
  {
    slug: "build-a-business",
    name: "Build a Business",
    description: "Idea to launch, one small step a day.",
    category: "business",
    group: "Career",
    timeLabel: "45–90 min/day",
    suggestedMinutes: 60,
    suggestedDifficulty: "CHALLENGING",
    goal: "Launch my first product",
  },
  {
    slug: "grow-in-my-role",
    name: "Grow In My Role",
    description: "Build the skill and the evidence for what's next.",
    category: "career",
    group: "Career",
    timeLabel: "30–45 min/day",
    suggestedMinutes: 30,
    suggestedDifficulty: "BALANCED",
    goal: "Move my career forward",
  },
  {
    slug: "focus-at-work",
    name: "Focus At Work",
    description: "One protected block a day, defended properly.",
    category: "productivity",
    group: "Focus",
    timeLabel: "30–90 min/day",
    suggestedMinutes: 60,
    suggestedDifficulty: "BALANCED",
    goal: "Get more of the right work done",
  },
  {
    // Demo fixture only. It exists to prove the engine is domain-independent —
    // a software-engineering challenge is one template among many, not the
    // shape of the product.
    slug: "ai-backend-engineering",
    name: "AI & Backend Engineering",
    description:
      "Demo data: a 30-day path from Python through deployment. One example of a skill challenge.",
    category: "demo-ai-backend",
    group: "Learning",
    timeLabel: "60–90 min/day",
    suggestedMinutes: 90,
    suggestedDifficulty: "CHALLENGING",
    goal: "Become a stronger AI/backend engineer",
    isDemo: true,
  },
];

export const PUBLIC_TEMPLATES = TEMPLATES.filter((template) => !template.isDemo);

export const TEMPLATE_GROUPS = [
  "Popular",
  "Health",
  "Career",
  "Learning",
  "Life",
  "Focus",
] as const;

export function getTemplate(slug: string): ChallengeTemplate | undefined {
  return TEMPLATES.find((template) => template.slug === slug);
}
