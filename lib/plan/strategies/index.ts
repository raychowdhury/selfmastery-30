import type { CategoryStrategy } from "@/lib/plan/types";

import { businessStrategy } from "@/lib/plan/strategies/business";
import { careerStrategy } from "@/lib/plan/strategies/career";
import { customStrategy } from "@/lib/plan/strategies/custom";
import { demoAiBackendStrategy } from "@/lib/plan/strategies/demo-ai-backend";
import { digitalWellnessStrategy } from "@/lib/plan/strategies/digital-wellness";
import { disciplineStrategy } from "@/lib/plan/strategies/discipline";
import { familyStrategy } from "@/lib/plan/strategies/family";
import { fitnessStrategy } from "@/lib/plan/strategies/fitness";
import { healthStrategy } from "@/lib/plan/strategies/health";
import { jobSearchStrategy } from "@/lib/plan/strategies/job-search";
import { learningStrategy } from "@/lib/plan/strategies/learning";
import { moneyStrategy } from "@/lib/plan/strategies/money";
import { morningRoutineStrategy } from "@/lib/plan/strategies/morning-routine";
import { organizationStrategy } from "@/lib/plan/strategies/organization";
import { productivityStrategy } from "@/lib/plan/strategies/productivity";
import { projectStrategy } from "@/lib/plan/strategies/project";
import { readingStrategy } from "@/lib/plan/strategies/reading";
import { sleepStrategy } from "@/lib/plan/strategies/sleep";
import { studyStrategy } from "@/lib/plan/strategies/study";

/**
 * Every strategy is content, not code paths. Supporting a new kind of goal
 * means adding a file here — no schema change, no branching in the UI.
 */
export const STRATEGIES: CategoryStrategy[] = [
  fitnessStrategy,
  healthStrategy,
  sleepStrategy,
  studyStrategy,
  learningStrategy,
  readingStrategy,
  productivityStrategy,
  careerStrategy,
  jobSearchStrategy,
  businessStrategy,
  moneyStrategy,
  familyStrategy,
  digitalWellnessStrategy,
  organizationStrategy,
  morningRoutineStrategy,
  projectStrategy,
  disciplineStrategy,
  customStrategy,
  // Demo content — see the file header for why it ships.
  demoAiBackendStrategy,
];

const BY_SLUG = new Map(STRATEGIES.map((strategy) => [strategy.slug, strategy]));

/** Falls back to the generic strategy, so an unknown category still gets a plan. */
export function getStrategy(slug: string): CategoryStrategy {
  return BY_SLUG.get(slug) ?? customStrategy;
}

export function strategyExists(slug: string): boolean {
  return BY_SLUG.has(slug);
}

/**
 * The nine choices shown on the first onboarding screen, mapped onto the
 * strategy that generates the plan.
 */
export const ONBOARDING_CATEGORIES = [
  { slug: "health", label: "Health", description: "Energy, movement, looking after yourself", icon: "heart-pulse" },
  { slug: "career", label: "Career", description: "Grow in the work you already do", icon: "briefcase" },
  { slug: "study", label: "Study", description: "Learn consistently, stop cramming", icon: "book-open" },
  { slug: "financial-organization", label: "Money", description: "Know where it goes, take control", icon: "wallet" },
  { slug: "family", label: "Relationships", description: "Time with the people close to you", icon: "heart" },
  { slug: "productivity", label: "Focus", description: "Do the work that actually matters", icon: "target" },
  { slug: "discipline", label: "Personal growth", description: "Follow through on what you say", icon: "compass" },
  { slug: "project", label: "Finish something", description: "The project that keeps following you", icon: "flag" },
  { slug: "custom", label: "Something else", description: "Describe it in your own words", icon: "pen-line" },
] as const;
