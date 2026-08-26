import { z } from "zod";

import { OBSTACLES } from "@/lib/plan/strategies/shared";

const obstacleSlugs = OBSTACLES.map((obstacle) => obstacle.slug);

export const difficultyEnum = z.enum(["GENTLE", "BALANCED", "CHALLENGING"]);
export const preferredTimeEnum = z.enum([
  "MORNING",
  "AFTERNOON",
  "EVENING",
  "FLEXIBLE",
]);
export const dayFeelingEnum = z.enum(["EASY", "GOOD", "DIFFICULT"]);
export const difficultyFeedbackEnum = z.enum([
  "TOO_EASY",
  "ABOUT_RIGHT",
  "TOO_DIFFICULT",
]);

/** The complete answer set collected across the onboarding steps. */
export const onboardingSchema = z.object({
  category: z.string().min(1, "Choose an area to focus on."),
  goal: z
    .string()
    .trim()
    .min(3, "Tell us what you want to accomplish.")
    .max(200, "Keep it to a sentence or two."),
  whyItMatters: z.string().trim().max(500).optional().or(z.literal("")),
  successDefinition: z.string().trim().max(300).optional().or(z.literal("")),
  availableMinutes: z
    .number()
    .int()
    .min(5, "Give it at least 5 minutes.")
    .max(240, "Two hours is plenty. Be realistic."),
  obstacles: z.array(z.enum(obstacleSlugs as [string, ...string[]])).max(11),
  preferredTime: preferredTimeEnum,
  difficulty: difficultyEnum,
  /** ISO date (yyyy-MM-dd). Defaults to today in the browser's timezone. */
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a start date."),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const toggleActionSchema = z.object({
  actionId: z.string().min(1),
  completed: z.boolean(),
});

export const reflectionSchema = z.object({
  dayId: z.string().min(1),
  dayFeeling: dayFeelingEnum.nullable().optional(),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
  whatHelped: z.string().trim().max(1000).optional().or(z.literal("")),
  whatGotInWay: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const prioritiesSchema = z.object({
  dayId: z.string().min(1),
  priorities: z
    .array(
      z.object({
        position: z.number().int().min(1).max(3),
        text: z.string().trim().max(160),
        completed: z.boolean(),
      })
    )
    .max(3),
});

export const weeklyReviewSchema = z.object({
  challengeId: z.string().min(1),
  weekNumber: z.number().int().min(1).max(6),
  wentWell: z.string().trim().max(1000).optional().or(z.literal("")),
  struggledWith: z.string().trim().max(1000).optional().or(z.literal("")),
  mainObstacle: z.array(z.string().max(40)).max(10),
  difficultyFeedback: difficultyFeedbackEnum,
  nextWeekChange: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const finalReflectionSchema = z.object({
  challengeId: z.string().min(1),
  reflection: z.string().trim().max(2000).optional().or(z.literal("")),
  biggestChange: z.string().trim().max(500).optional().or(z.literal("")),
  nextGoal: z.string().trim().max(300).optional().or(z.literal("")),
});

export const challengeSettingsSchema = z.object({
  challengeId: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  goal: z.string().trim().min(3).max(200),
  whyItMatters: z.string().trim().max(500).optional().or(z.literal("")),
  successDefinition: z.string().trim().max(300).optional().or(z.literal("")),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Tell us what to call you.").max(80),
});
