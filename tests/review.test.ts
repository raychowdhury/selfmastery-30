import { describe, expect, it } from "vitest";

import type { ActionSnapshot, DaySnapshot } from "@/lib/analytics/types";
import { decideAdjustment, scaleMinutes, summariseWeek } from "@/lib/challenge/adjustment";

function day(dayNumber: number, actions: Partial<ActionSnapshot>[]): DaySnapshot {
  return {
    dayNumber,
    date: new Date(2026, 7, 24 + dayNumber),
    isMinimumDay: false,
    completedAt: null,
    actions: actions.map((overrides, index) => ({
      id: `${dayNumber}-${index}`,
      pillarId: "p",
      title: "Study for 30 minutes",
      completed: false,
      optional: false,
      estimatedMinutes: 30,
      minimumVersionTitle: "Study 10 minutes",
      minimumVersionMinutes: 10,
      ...overrides,
    })),
  };
}

describe("weekly adjustment policy", () => {
  it("reduces the plan after a hard week, whatever the user says", () => {
    for (const feedback of ["TOO_EASY", "ABOUT_RIGHT", "TOO_DIFFICULT"] as const) {
      expect(decideAdjustment(45, feedback).direction).toBe("REDUCE");
    }
  });

  it("increases only when completion is high and the user says it is too easy", () => {
    expect(decideAdjustment(90, "TOO_EASY").direction).toBe("INCREASE");
    expect(decideAdjustment(95, "ABOUT_RIGHT").direction).toBe("HOLD");
    expect(decideAdjustment(89, "TOO_EASY").direction).toBe("HOLD");
  });

  it("eases off when a well-completed week still felt too hard", () => {
    expect(decideAdjustment(80, "TOO_DIFFICULT").direction).toBe("REDUCE");
  });

  it("holds steady when the plan is working", () => {
    expect(decideAdjustment(80, "ABOUT_RIGHT").direction).toBe("HOLD");
  });

  it("always explains itself in the user's own numbers", () => {
    const decision = decideAdjustment(45, "ABOUT_RIGHT");
    expect(decision.rationale).toContain("45%");
    expect(decision.summary.length).toBeGreaterThan(0);
  });
});

describe("minute scaling", () => {
  it("shortens on reduce and lengthens on increase", () => {
    expect(scaleMinutes(40, "REDUCE")).toBe(30);
    expect(scaleMinutes(40, "INCREASE")).toBe(50);
    expect(scaleMinutes(40, "HOLD")).toBe(40);
  });

  it("never shrinks an action below five minutes", () => {
    expect(scaleMinutes(5, "REDUCE")).toBe(5);
  });
});

describe("week summary", () => {
  it("finds actions skipped three or more times", () => {
    const days = Array.from({ length: 7 }, (_, index) =>
      day(index + 1, [
        { title: "Study for 30 minutes", completed: true },
        { title: "Review yesterday's material", completed: index < 3 },
      ])
    );

    const summary = summariseWeek(days, 1);
    expect(summary.frequentlySkipped).toEqual(["Review yesterday's material"]);
    expect(summary.completionRate).toBe(71);
  });

  it("ignores optional actions when looking for what is being skipped", () => {
    const days = Array.from({ length: 7 }, (_, index) =>
      day(index + 1, [
        { title: "Core", completed: true },
        { title: "Nice to have", completed: false, optional: true },
      ])
    );
    expect(summariseWeek(days, 1).frequentlySkipped).toEqual([]);
    expect(summariseWeek(days, 1).completionRate).toBe(100);
  });
});
