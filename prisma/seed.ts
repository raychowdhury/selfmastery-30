import "dotenv/config";

import bcrypt from "bcryptjs";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../lib/generated/prisma/client";
import { addCalendarDays, todayAsCalendarDay } from "../lib/challenge/dates";
import { phaseForDay } from "../lib/challenge/phases";
import { RuleBasedPlanGenerator } from "../lib/plan/rule-based-generator";
import { getTemplate } from "../lib/plan/templates";
import type { GeneratedPlan } from "../lib/plan/types";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const generator = new RuleBasedPlanGenerator();

const DEMO_EMAIL = "maya@example.com";
const DEMO_PASSWORD = "selfmastery30";

/**
 * A scripted week so the demo account shows the states the UI has to handle:
 * perfect days, a partial day, a missed day, and a Minimum Day. Numbers are the
 * fraction of required actions completed.
 */
const SCRIPTED_WEEK: Array<{ ratio: number; minimum?: boolean; feeling?: "EASY" | "GOOD" | "DIFFICULT"; note?: string }> = [
  { ratio: 1, feeling: "GOOD", note: "Easier than I expected once I was out of the door." },
  { ratio: 1, feeling: "GOOD" },
  { ratio: 0.5, feeling: "DIFFICULT", note: "Work ran late. Got the walk in, nothing else." },
  { ratio: 1, feeling: "EASY" },
  { ratio: 0, note: undefined },
  { ratio: 1, minimum: true, feeling: "DIFFICULT", note: "Travelling. Five minutes still counted." },
  { ratio: 1, feeling: "GOOD", note: "First week done. The walk is becoming automatic." },
];

async function writePlan(challengeId: string, plan: GeneratedPlan) {
  await prisma.pillar.createMany({
    data: plan.pillars.map((pillar) => ({ ...pillar, challengeId })),
  });
  const pillars = await prisma.pillar.findMany({ where: { challengeId } });
  const pillarByName = new Map(pillars.map((pillar) => [pillar.name, pillar.id]));

  await prisma.milestone.createMany({
    data: plan.milestones.map((milestone) => ({ ...milestone, challengeId })),
  });

  await prisma.challengeDay.createMany({
    data: plan.days.map((day) => ({
      challengeId,
      dayNumber: day.dayNumber,
      date: day.date,
      phase: phaseForDay(day.dayNumber),
    })),
  });

  const days = await prisma.challengeDay.findMany({
    where: { challengeId },
    select: { id: true, dayNumber: true },
  });
  const dayIdByNumber = new Map(days.map((day) => [day.dayNumber, day.id]));

  await prisma.dailyAction.createMany({
    data: plan.days.flatMap((day) =>
      day.actions.map((action) => ({
        challengeDayId: dayIdByNumber.get(day.dayNumber)!,
        pillarId: action.pillarName ? (pillarByName.get(action.pillarName) ?? null) : null,
        title: action.title,
        description: action.description,
        estimatedMinutes: action.estimatedMinutes,
        optional: action.optional,
        minimumVersionTitle: action.minimumVersionTitle,
        minimumVersionMinutes: action.minimumVersionMinutes,
        sortOrder: action.sortOrder,
      }))
    ),
  });

  return dayIdByNumber;
}

async function createChallenge(opts: {
  userId: string;
  templateSlug: string;
  goal: string;
  whyItMatters: string;
  successDefinition: string;
  startDate: Date;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  obstacles: string[];
}) {
  const template = getTemplate(opts.templateSlug);
  if (!template) throw new Error(`Unknown template: ${opts.templateSlug}`);

  const plan = generator.generatePlanSync({
    category: template.category,
    title: template.name,
    goal: opts.goal,
    whyItMatters: opts.whyItMatters,
    successDefinition: opts.successDefinition,
    availableMinutes: template.suggestedMinutes,
    obstacles: opts.obstacles,
    preferredTime: "MORNING",
    difficulty: template.suggestedDifficulty,
    startDate: opts.startDate,
  });

  const challenge = await prisma.challenge.create({
    data: {
      userId: opts.userId,
      title: opts.goal,
      goal: opts.goal,
      whyItMatters: opts.whyItMatters,
      successDefinition: opts.successDefinition,
      category: template.category,
      availableMinutes: template.suggestedMinutes,
      difficulty: template.suggestedDifficulty,
      preferredTime: "MORNING",
      obstacles: opts.obstacles,
      startDate: opts.startDate,
      endDate: addCalendarDays(opts.startDate, 29),
      status: opts.status,
    },
  });

  const dayIdByNumber = await writePlan(challenge.id, plan);
  return { challenge, dayIdByNumber };
}

/** Marks the first `ratio` of a day's required actions complete. */
async function fillDay(
  dayId: string,
  ratio: number,
  options: { minimum?: boolean; feeling?: "EASY" | "GOOD" | "DIFFICULT"; note?: string; date: Date }
) {
  if (options.minimum) {
    await prisma.challengeDay.update({
      where: { id: dayId },
      data: { isMinimumDay: true },
    });
  }

  const actions = await prisma.dailyAction.findMany({
    where: { challengeDayId: dayId },
    orderBy: { sortOrder: "asc" },
  });
  const required = actions.filter(
    (action) => !action.optional && !(options.minimum && action.optional)
  );
  const target = Math.round(required.length * ratio);

  for (const [index, action] of required.entries()) {
    if (index >= target) break;
    await prisma.dailyAction.update({
      where: { id: action.id },
      data: { completed: true, completedAt: options.date },
    });
  }

  if (ratio > 0) {
    await prisma.challengeDay.update({
      where: { id: dayId },
      data: { completedAt: options.date, difficultyFeedback: null },
    });
  }

  if (options.feeling || options.note) {
    await prisma.dailyReflection.create({
      data: {
        challengeDayId: dayId,
        dayFeeling: options.feeling ?? null,
        note: options.note ?? null,
      },
    });
  }
}

async function main() {
  // The seed deletes and rebuilds the demo account. That is fine locally and
  // destructive anywhere real, so production needs an explicit opt-in.
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "true") {
    throw new Error(
      "Refusing to seed a production database. Set ALLOW_SEED=true if you really mean it."
    );
  }

  console.log("Seeding SelfMastery demo data…");

  // Idempotent: wipe the demo account and rebuild it. Cascades clear everything
  // below it, so re-running the seed is always safe.
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      name: "Maya K.",
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
      timezone: "Europe/London",
    },
  });

  const today = todayAsCalendarDay();

  // ---------------------------------------------------------------------
  // Active challenge — day 8 of 30, matching the prototype's Today screen.
  // ---------------------------------------------------------------------
  const active = await createChallenge({
    userId: user.id,
    templateSlug: "get-active",
    goal: "Become more physically active",
    whyItMatters: "I want more energy and to feel better about myself.",
    successDefinition: "I can consistently walk 30 minutes five days a week.",
    startDate: addCalendarDays(today, -7),
    status: "ACTIVE",
    obstacles: ["motivation", "phone"],
  });

  for (const [index, script] of SCRIPTED_WEEK.entries()) {
    const dayId = active.dayIdByNumber.get(index + 1)!;
    await fillDay(dayId, script.ratio, {
      minimum: script.minimum,
      feeling: script.feeling,
      note: script.note,
      date: addCalendarDays(today, index - 7),
    });
  }

  // Today (day 8) is partly done, so the Today screen opens mid-progress.
  const todayId = active.dayIdByNumber.get(8)!;
  const todayActions = await prisma.dailyAction.findMany({
    where: { challengeDayId: todayId },
    orderBy: { sortOrder: "asc" },
  });
  if (todayActions[0]) {
    await prisma.dailyAction.update({
      where: { id: todayActions[0].id },
      data: { completed: true, completedAt: new Date() },
    });
  }
  await prisma.dailyPriority.createMany({
    data: [
      { challengeDayId: todayId, position: 1, text: "Walk after dinner", completed: false },
      { challengeDayId: todayId, position: 2, text: "Fill the water bottle tonight", completed: false },
    ],
  });

  await prisma.weeklyReview.create({
    data: {
      challengeId: active.challenge.id,
      weekNumber: 1,
      wentWell: "I walked on five of seven days, and the short ones were the easiest to start.",
      struggledWith: "Evenings. By 9pm I had usually talked myself out of it.",
      mainObstacle: ["Time", "Motivation"],
      difficultyFeedback: "ABOUT_RIGHT",
      nextWeekChange: "Move the walk to the morning.",
      completionRate: 79,
    },
  });

  await prisma.planAdjustment.create({
    data: {
      challengeId: active.challenge.id,
      source: "WEEKLY_REVIEW",
      rationale:
        "You completed 79% at a difficulty that is working. Steady progression from here.",
      summary: "Next week continues the planned progression.",
      appliedFromDay: 8,
      daysAffected: 0,
    },
  });

  // ---------------------------------------------------------------------
  // A finished challenge, so history and the Day 30 screen have real data.
  // ---------------------------------------------------------------------
  const finished = await createChallenge({
    userId: user.id,
    templateSlug: "read-every-day",
    goal: "Read every day instead of scrolling",
    whyItMatters: "I used to read constantly and I miss it.",
    successDefinition: "I finish the book on my bedside table.",
    startDate: addCalendarDays(today, -50),
    status: "COMPLETED",
    obstacles: ["phone", "schedule"],
  });

  // 24 active days out of 30 — a realistic, imperfect finish.
  const finishedRatios = [
    1, 1, 0.5, 1, 1, 1, 1, 0, 1, 1, 1, 0.5, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0.5,
    1, 0, 1, 1, 1, 1, 1,
  ];
  for (const [index, ratio] of finishedRatios.entries()) {
    await fillDay(finished.dayIdByNumber.get(index + 1)!, ratio, {
      date: addCalendarDays(today, index - 50),
    });
  }

  await prisma.finalReflection.create({
    data: {
      challengeId: finished.challenge.id,
      reflection:
        "The pages are just part of my evening now. I do not negotiate with myself about it anymore.",
      biggestChange: "My phone stays in the kitchen after nine.",
      nextGoal: "Become more physically active",
    },
  });

  // ---------------------------------------------------------------------
  // Demo data only: a highly technical challenge, archived. It exists to show
  // the engine is domain-independent — one content file, no schema change.
  // ---------------------------------------------------------------------
  await createChallenge({
    userId: user.id,
    templateSlug: "ai-backend-engineering",
    goal: "Become a stronger AI/backend engineer",
    whyItMatters: "Demo fixture — proves a specialist path is just another template.",
    successDefinition: "A deployed service with an LLM feature and a README.",
    startDate: addCalendarDays(today, -120),
    status: "ARCHIVED",
    obstacles: ["too-many-goals"],
  });

  const counts = {
    challenges: await prisma.challenge.count({ where: { userId: user.id } }),
    days: await prisma.challengeDay.count({
      where: { challenge: { userId: user.id } },
    }),
    actions: await prisma.dailyAction.count({
      where: { challengeDay: { challenge: { userId: user.id } } },
    }),
  };

  console.log(
    `Done. ${counts.challenges} challenges, ${counts.days} days, ${counts.actions} actions.`
  );
  console.log(`Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
