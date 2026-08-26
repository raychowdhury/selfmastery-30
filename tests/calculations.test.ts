import { describe, expect, it } from "vitest";

import {
  ACTIVE_DAY_THRESHOLD,
  calculateActiveDays,
  calculateChallengeStats,
  calculateCurrentStreak,
  calculateDailyCompletion,
  calculateLongestStreak,
  calculateMinutesCompleted,
  calculateOverallCompletion,
  calculatePerfectDays,
  calculatePillarCompletion,
  calculateTotalActionsCompleted,
  calculateWeeklyCompletion,
  classifyDay,
  visibleActions,
} from "@/lib/analytics/calculations";
import type { ActionSnapshot, DaySnapshot } from "@/lib/analytics/types";

let counter = 0;

function action(overrides: Partial<ActionSnapshot> = {}): ActionSnapshot {
  counter += 1;
  return {
    id: `action-${counter}`,
    pillarId: "pillar-a",
    title: "Walk for 20 minutes",
    completed: false,
    optional: false,
    estimatedMinutes: 20,
    minimumVersionTitle: "Walk 5 minutes",
    minimumVersionMinutes: 5,
    ...overrides,
  };
}

function day(
  dayNumber: number,
  actions: ActionSnapshot[],
  overrides: Partial<DaySnapshot> = {}
): DaySnapshot {
  return {
    dayNumber,
    date: new Date(2026, 7, 24 + dayNumber),
    isMinimumDay: false,
    completedAt: null,
    actions,
    ...overrides,
  };
}

/** A day with `done` of `total` required actions completed. */
function dayWith(dayNumber: number, done: number, total = 4): DaySnapshot {
  return day(
    dayNumber,
    Array.from({ length: total }, (_, index) =>
      action({ completed: index < done })
    )
  );
}

describe("daily completion", () => {
  it("counts completed required actions", () => {
    expect(calculateDailyCompletion(dayWith(1, 3, 4))).toEqual({
      required: 4,
      completed: 3,
      percent: 75,
    });
  });

  it("excludes optional actions from the percentage", () => {
    const d = day(1, [
      action({ completed: true }),
      action({ completed: false, optional: true }),
    ]);
    expect(calculateDailyCompletion(d)).toEqual({
      required: 1,
      completed: 1,
      percent: 100,
    });
  });

  it("reports 0 rather than dividing by zero on an empty day", () => {
    expect(calculateDailyCompletion(day(1, []))).toEqual({
      required: 0,
      completed: 0,
      percent: 0,
    });
  });
});

describe("minimum days", () => {
  it("shows the reduced version and drops optional extras", () => {
    const d = day(
      1,
      [action(), action({ optional: true, title: "Optional extra" })],
      { isMinimumDay: true }
    );

    const visible = visibleActions(d);
    expect(visible).toHaveLength(1);
    expect(visible[0].title).toBe("Walk 5 minutes");
    expect(visible[0].estimatedMinutes).toBe(5);
  });

  it("measures completion against the reduced plan, so a minimum day can be perfect", () => {
    const d = day(1, [action({ completed: true })], { isMinimumDay: true });
    expect(calculateDailyCompletion(d).percent).toBe(100);
  });

  it("credits the reduced minutes, not the original ones", () => {
    const d = day(1, [action({ completed: true })], { isMinimumDay: true });
    expect(calculateMinutesCompleted([d])).toBe(5);
  });

  it("leaves the original action untouched so the day can be restored", () => {
    const original = action();
    const d = day(1, [original], { isMinimumDay: true });
    visibleActions(d);
    expect(original.title).toBe("Walk for 20 minutes");
    expect(original.estimatedMinutes).toBe(20);
  });
});

describe("day classification", () => {
  const todayDayNumber = 5;

  it("never marks a future day as missed", () => {
    expect(classifyDay(dayWith(6, 0), todayDayNumber)).toBe("FUTURE");
  });

  it("does not call today missed just because it is not finished", () => {
    expect(classifyDay(dayWith(5, 0), todayDayNumber)).toBe("TODAY");
  });

  it("distinguishes perfect, complete, partial and missed", () => {
    expect(classifyDay(dayWith(1, 4, 4), todayDayNumber)).toBe("PERFECT");
    expect(classifyDay(dayWith(2, 2, 4), todayDayNumber)).toBe("COMPLETE");
    expect(classifyDay(dayWith(3, 1, 4), todayDayNumber)).toBe("PARTIAL");
    expect(classifyDay(dayWith(4, 0, 4), todayDayNumber)).toBe("MISSED");
  });

  it("labels a minimum day as its own state", () => {
    const d = day(2, [action({ completed: true })], { isMinimumDay: true });
    expect(classifyDay(d, todayDayNumber)).toBe("MINIMUM");
  });

  it("treats half the plan as an active day", () => {
    expect(ACTIVE_DAY_THRESHOLD).toBe(50);
    expect(calculateActiveDays([dayWith(1, 2, 4)])).toBe(1);
    expect(calculateActiveDays([dayWith(1, 1, 4)])).toBe(0);
  });
});

describe("streaks", () => {
  it("counts consecutive active days ending today", () => {
    const days = [
      dayWith(1, 4),
      dayWith(2, 0),
      dayWith(3, 4),
      dayWith(4, 4),
      dayWith(5, 4),
    ];
    expect(calculateCurrentStreak(days, 5)).toBe(3);
  });

  it("does not break the streak because today is still unfinished", () => {
    const days = [dayWith(1, 4), dayWith(2, 4), dayWith(3, 0)];
    expect(calculateCurrentStreak(days, 3)).toBe(2);
  });

  it("returns zero when yesterday and today were both missed", () => {
    const days = [dayWith(1, 4), dayWith(2, 0), dayWith(3, 0)];
    expect(calculateCurrentStreak(days, 3)).toBe(0);
  });

  it("finds the longest run anywhere in the challenge", () => {
    const days = [
      dayWith(1, 4),
      dayWith(2, 4),
      dayWith(3, 4),
      dayWith(4, 0),
      dayWith(5, 4),
    ];
    expect(calculateLongestStreak(days)).toBe(3);
  });

  it("counts a minimum day as keeping the streak alive", () => {
    const days = [
      dayWith(1, 4),
      day(2, [action({ completed: true })], { isMinimumDay: true }),
      dayWith(3, 4),
    ];
    expect(calculateCurrentStreak(days, 3)).toBe(3);
  });
});

describe("aggregates", () => {
  const days = [
    dayWith(1, 4, 4),
    dayWith(2, 2, 4),
    dayWith(3, 0, 4),
    dayWith(4, 4, 4),
    dayWith(5, 1, 4),
    dayWith(6, 4, 4),
    dayWith(7, 4, 4),
    dayWith(8, 0, 4),
  ];

  it("measures overall completion against elapsed days only", () => {
    // 19 of 28 required actions across days 1–7.
    expect(calculateOverallCompletion(days, 7)).toBe(68);
  });

  it("counts perfect days", () => {
    expect(calculatePerfectDays(days.slice(0, 7))).toBe(4);
  });

  it("counts completed actions and minutes", () => {
    expect(calculateTotalActionsCompleted(days.slice(0, 7))).toBe(19);
    expect(calculateMinutesCompleted(days.slice(0, 7))).toBe(19 * 20);
  });

  it("scopes weekly completion to the right week", () => {
    expect(calculateWeeklyCompletion(days, 1)).toBe(
      Math.round((19 / 28) * 100)
    );
    expect(calculateWeeklyCompletion(days, 2)).toBe(0);
  });

  it("rolls everything into one stats object", () => {
    const stats = calculateChallengeStats(days, 7);
    expect(stats).toMatchObject({
      overallCompletion: 68,
      perfectDays: 4,
      actionsCompleted: 19,
      currentStreak: 2,
    });
  });
});

describe("pillar completion", () => {
  it("splits completion by pillar and ignores optional actions", () => {
    const days = [
      day(1, [
        action({ pillarId: "movement", completed: true }),
        action({ pillarId: "focus", completed: false }),
        action({ pillarId: "focus", completed: false, optional: true }),
      ]),
      day(2, [
        action({ pillarId: "movement", completed: true }),
        action({ pillarId: "focus", completed: true }),
      ]),
    ];

    const result = calculatePillarCompletion(
      days,
      [
        { id: "movement", name: "Movement" },
        { id: "focus", name: "Focus" },
      ],
      2
    );

    expect(result).toEqual([
      { pillarId: "movement", name: "Movement", scheduled: 2, completed: 2, percent: 100 },
      { pillarId: "focus", name: "Focus", scheduled: 2, completed: 1, percent: 50 },
    ]);
  });

  it("does not count future days against a pillar", () => {
    const days = [
      day(1, [action({ pillarId: "movement", completed: true })]),
      day(2, [action({ pillarId: "movement", completed: false })]),
    ];
    const result = calculatePillarCompletion(days, [{ id: "movement", name: "Movement" }], 1);
    expect(result[0]).toMatchObject({ scheduled: 1, percent: 100 });
  });
});
