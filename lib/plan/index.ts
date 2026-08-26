import { RuleBasedPlanGenerator } from "@/lib/plan/rule-based-generator";
import type { PlanGenerator } from "@/lib/plan/types";

/**
 * The only place the application decides which generator it is using. Adding a
 * ClaudePlanGenerator later means adding a case here and an env value — no call
 * site changes.
 */
export function getPlanGenerator(): PlanGenerator {
  switch (process.env.PLAN_GENERATOR) {
    case "rule-based":
    default:
      return new RuleBasedPlanGenerator();
  }
}

export { RuleBasedPlanGenerator };
export type { PlanGenerator } from "@/lib/plan/types";
