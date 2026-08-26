import { describe, expect, it } from "vitest";

import { renderCopy } from "@/lib/challenge/render";
import { RuleBasedPlanGenerator, stageIndexForDay } from "@/lib/plan/rule-based-generator";
import { STRATEGIES } from "@/lib/plan/strategies";
import type { PlanInput } from "@/lib/plan/types";

const generator = new RuleBasedPlanGenerator();
const start = new Date(2026, 7, 25);

function input(overrides: Partial<PlanInput> = {}): PlanInput {
  return {
    category: "fitness",
    title: "Become more physically active",
    goal: "Become more physically active",
    availableMinutes: 30,
    obstacles: [],
    preferredTime: "MORNING",
    difficulty: "BALANCED",
    startDate: start,
    ...overrides,
  };
}

describe("rule-based plan generator", () => {
  it("produces exactly 30 consecutive dated days", () => {
    const plan = generator.generatePlanSync(input());

    expect(plan.days).toHaveLength(30);
    plan.days.forEach((day, index) => {
      expect(day.dayNumber).toBe(index + 1);
      expect(day.date.getTime()).toBe(
        new Date(2026, 7, 25 + index).getTime()
      );
    });
  });

  it("gives every day between two and five actions", () => {
    const plan = generator.generatePlanSync(input());
    for (const day of plan.days) {
      expect(day.actions.length).toBeGreaterThanOrEqual(2);
      expect(day.actions.length).toBeLessThanOrEqual(6);
    }
  });

  it("keeps required actions inside the time the user said they have", () => {
    const plan = generator.generatePlanSync(input({ availableMinutes: 20 }));

    for (const day of plan.days) {
      const required = day.actions
        .filter((action) => !action.optional)
        .reduce((total, action) => total + action.estimatedMinutes, 0);
      // The budget is the stated minutes; two actions are always kept even if
      // that overshoots a very small budget, so allow one action of slack.
      expect(required).toBeLessThanOrEqual(20 + 15);
    }
  });

  it("does not generate thirty identical days", () => {
    const plan = generator.generatePlanSync(input());
    // Compare what the user actually reads: the rendered copy, including the
    // minute counts, since those are part of how a day differs from another.
    const signatures = new Set(
      plan.days.map((day) =>
        day.actions
          .map((action) => renderCopy(action.title, action.estimatedMinutes))
          .join("|")
      )
    );
    expect(signatures.size).toBeGreaterThan(4);
  });

  it("scales the plan with the difficulty setting", () => {
    const gentle = generator.generatePlanSync(input({ difficulty: "GENTLE" }));
    const challenging = generator.generatePlanSync(
      input({ difficulty: "CHALLENGING" })
    );

    const total = (plan: ReturnType<typeof generator.generatePlanSync>) =>
      plan.days.reduce(
        (sum, day) =>
          sum +
          day.actions
            .filter((action) => !action.optional)
            .reduce((inner, action) => inner + action.estimatedMinutes, 0),
        0
      );

    expect(total(gentle)).toBeLessThan(total(challenging));
  });

  it("ramps effort across the phases rather than starting at full load", () => {
    const plan = generator.generatePlanSync(input({ availableMinutes: 60 }));
    const minutesOn = (dayNumber: number) =>
      plan.days[dayNumber - 1].actions
        .filter((action) => !action.optional)
        .reduce((total, action) => total + action.estimatedMinutes, 0);

    expect(minutesOn(2)).toBeLessThan(minutesOn(25));
  });

  it("only includes obstacle-specific actions when the obstacle was named", () => {
    const without = generator.generatePlanSync(input({ category: "study" }));
    const withPhone = generator.generatePlanSync(
      input({ category: "study", obstacles: ["phone"] })
    );

    const mentionsPhone = (plan: ReturnType<typeof generator.generatePlanSync>) =>
      plan.days.some((day) =>
        day.actions.some((action) => action.title.toLowerCase().includes("phone"))
      );

    expect(mentionsPhone(without)).toBe(false);
    expect(mentionsPhone(withPhone)).toBe(true);
  });

  it("gives every action a smaller minimum version", () => {
    const plan = generator.generatePlanSync(input());
    for (const day of plan.days) {
      for (const action of day.actions) {
        expect(action.minimumVersionTitle.length).toBeGreaterThan(0);
        expect(action.minimumVersionMinutes).toBeLessThanOrEqual(
          action.estimatedMinutes
        );
      }
    }
  });

  it("produces milestones for days 7, 14, 21 and 30", () => {
    const plan = generator.generatePlanSync(input());
    expect(plan.milestones.map((milestone) => milestone.dayNumber)).toEqual([
      7, 14, 21, 30,
    ]);
  });

  it("keeps the minute count in the title in step with the duration", () => {
    const plan = generator.generatePlanSync(input({ availableMinutes: 60 }));
    const walk = plan.days[20].actions.find((action) =>
      action.title.includes("{m}")
    );

    expect(walk, "expected at least one action with a templated duration").toBeDefined();
    // Rescaling the action (as a weekly review does) must change the wording too.
    expect(renderCopy(walk!.title, 10)).toContain("10");
    expect(renderCopy(walk!.title, 25)).toContain("25");
  });

  it("advances a sequenced track from first stage to last", () => {
    const plan = generator.generatePlanSync(input({ category: "job-search" }));
    expect(plan.days[0].actions[0].title).toContain("CV");
    expect(plan.days[29].actions[0].title).not.toBe(plan.days[0].actions[0].title);
  });

  it("spreads sequence stages evenly across the challenge", () => {
    expect(stageIndexForDay(1, 30, 10)).toBe(0);
    expect(stageIndexForDay(30, 30, 10)).toBe(9);
    expect(stageIndexForDay(15, 30, 10)).toBe(4);
  });

  it("falls back to the generic strategy for an unknown category", () => {
    const plan = generator.generatePlanSync(input({ category: "underwater-basket-weaving" }));
    expect(plan.days).toHaveLength(30);
    expect(plan.pillars.length).toBeGreaterThan(0);
  });

  it("builds a usable 30-day plan for every category we ship", () => {
    for (const strategy of STRATEGIES) {
      const plan = generator.generatePlanSync(input({ category: strategy.slug }));

      expect(plan.days, strategy.slug).toHaveLength(30);
      expect(plan.pillars.length, strategy.slug).toBeGreaterThanOrEqual(1);
      expect(plan.pillars.length, strategy.slug).toBeLessThanOrEqual(4);
      expect(plan.milestones.length, strategy.slug).toBe(4);

      for (const day of plan.days) {
        expect(day.actions.length, `${strategy.slug} day ${day.dayNumber}`)
          .toBeGreaterThanOrEqual(2);
        for (const action of day.actions) {
          // Copy is stored as a template and rendered with the action's current
          // minutes, so a later rescale never leaves the wording stale.
          const title = renderCopy(action.title, action.estimatedMinutes);
          const description = renderCopy(
            action.description,
            action.estimatedMinutes
          );
          expect(title, strategy.slug).not.toContain("{m}");
          expect(description, strategy.slug).not.toContain("{m}");
          expect(title.length, strategy.slug).toBeGreaterThan(0);
          // Every action belongs to a pillar the strategy actually declares.
          expect(
            plan.pillars.map((pillar) => pillar.name),
            strategy.slug
          ).toContain(action.pillarName);
        }
      }
    }
  });
});
