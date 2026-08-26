import { apiOk, handler } from "@/lib/api/http";
import { ONBOARDING_CATEGORIES, STRATEGIES } from "@/lib/plan/strategies";
import { OBSTACLES } from "@/lib/plan/strategies/shared";

/**
 * Onboarding content, served rather than hardcoded in the app.
 *
 * Categories, goal examples and safety notes all live in the plan strategies.
 * Serving them means a new strategy reaches existing installs without an App
 * Store release, and keeps the backend authoritative over plan content.
 */
export const GET = handler(async () => {
  return apiOk({
    categories: ONBOARDING_CATEGORIES.map((category) => ({
      slug: category.slug,
      label: category.label,
      description: category.description,
      icon: category.icon,
    })),
    obstacles: OBSTACLES.map((obstacle) => ({
      slug: obstacle.slug,
      label: obstacle.label,
    })),
    timeOptions: [10, 20, 30, 60, 120],
    difficulties: [
      {
        value: "GENTLE",
        label: "Gentle",
        description: "Small actions with low pressure.",
      },
      {
        value: "BALANCED",
        label: "Balanced",
        description: "Meaningful progress without overwhelming you.",
      },
      {
        value: "CHALLENGING",
        label: "Challenging",
        description: "More demanding daily actions.",
      },
    ],
    preferredTimes: [
      { value: "MORNING", label: "Morning" },
      { value: "AFTERNOON", label: "Afternoon" },
      { value: "EVENING", label: "Evening" },
      { value: "FLEXIBLE", label: "Flexible" },
    ],
    strategies: STRATEGIES.map((strategy) => ({
      slug: strategy.slug,
      label: strategy.label,
      goalExamples: strategy.goalExamples,
      safetyNote: strategy.safetyNote ?? null,
    })),
  });
});
