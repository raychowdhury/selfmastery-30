import { describe, expect, it } from "vitest";

import {
  addCalendarDays,
  calendarDayToLocal,
  challengeEndDate,
  currentDayNumber,
  dateForDayNumber,
  dayNumberForDate,
  isChallengeOver,
  parseCalendarDay,
  toIsoDate,
  todayAsCalendarDay,
} from "@/lib/challenge/dates";
import { isReviewDay, phaseForDay, reviewDays, weekForDay } from "@/lib/challenge/phases";

/**
 * Calendar days are UTC midnight. These tests pin that down, because a
 * one-day drift here silently corrupts every date the user sees.
 */
const start = parseCalendarDay("2026-08-25");

describe("calendar days", () => {
  it("parses an ISO date to UTC midnight, whatever the server timezone", () => {
    expect(start.toISOString()).toBe("2026-08-25T00:00:00.000Z");
  });

  it("round-trips back to the same ISO date", () => {
    expect(toIsoDate(start)).toBe("2026-08-25");
    expect(toIsoDate(parseCalendarDay("2026-01-01"))).toBe("2026-01-01");
  });

  it("takes today from the local calendar, not the local clock", () => {
    // 25 August at 23:50 local is still the 25th, even where that is already
    // the 26th in UTC.
    const lateEvening = new Date(2026, 7, 25, 23, 50);
    expect(toIsoDate(todayAsCalendarDay(lateEvening))).toBe("2026-08-25");

    const earlyMorning = new Date(2026, 7, 25, 0, 10);
    expect(toIsoDate(todayAsCalendarDay(earlyMorning))).toBe("2026-08-25");
  });

  it("renders a calendar day as the same day in local time", () => {
    const local = calendarDayToLocal(start);
    expect(local.getFullYear()).toBe(2026);
    expect(local.getMonth()).toBe(7);
    expect(local.getDate()).toBe(25);
  });
});

describe("challenge dates", () => {
  it("ends 29 days after it starts, inclusive of day 1", () => {
    expect(toIsoDate(challengeEndDate(start))).toBe("2026-09-23");
  });

  it("maps day numbers to dates and back", () => {
    for (let day = 1; day <= 30; day += 1) {
      const date = dateForDayNumber(start, day);
      expect(dayNumberForDate(start, date)).toBe(day);
    }
  });

  it("crosses a daylight-saving boundary without drifting", () => {
    // US clocks change on 1 November 2026; UTC midnights are unaffected.
    const october = parseCalendarDay("2026-10-25");
    expect(toIsoDate(dateForDayNumber(october, 30))).toBe("2026-11-23");
    expect(dayNumberForDate(october, parseCalendarDay("2026-11-23"))).toBe(30);
  });

  it("clamps the current day into the challenge", () => {
    expect(currentDayNumber(start, parseCalendarDay("2026-08-20"))).toBe(1);
    expect(currentDayNumber(start, parseCalendarDay("2026-09-03"))).toBe(10);
    expect(currentDayNumber(start, parseCalendarDay("2026-11-01"))).toBe(30);
  });

  it("knows when the challenge is over", () => {
    expect(isChallengeOver(start, parseCalendarDay("2026-09-23"))).toBe(false);
    expect(isChallengeOver(start, parseCalendarDay("2026-09-24"))).toBe(true);
  });

  it("adds whole days", () => {
    expect(toIsoDate(addCalendarDays(start, -7))).toBe("2026-08-18");
    expect(toIsoDate(addCalendarDays(start, 7))).toBe("2026-09-01");
  });
});

describe("phases", () => {
  it("follows the consistency / build / depth / finish arc", () => {
    expect(phaseForDay(1)).toBe("CONSISTENCY");
    expect(phaseForDay(7)).toBe("CONSISTENCY");
    expect(phaseForDay(8)).toBe("BUILD");
    expect(phaseForDay(14)).toBe("BUILD");
    expect(phaseForDay(15)).toBe("DEPTH");
    expect(phaseForDay(21)).toBe("DEPTH");
    expect(phaseForDay(22)).toBe("FINISH");
    expect(phaseForDay(30)).toBe("FINISH");
  });

  it("puts day 30 in week 4, not week 5", () => {
    expect(weekForDay(1)).toBe(1);
    expect(weekForDay(7)).toBe(1);
    expect(weekForDay(8)).toBe(2);
    expect(weekForDay(28)).toBe(4);
    expect(weekForDay(30)).toBe(4);
  });

  it("triggers reviews on days 7, 14, 21 and 30", () => {
    expect(reviewDays()).toEqual([7, 14, 21, 30]);
    expect(isReviewDay(7)).toBe(true);
    expect(isReviewDay(30)).toBe(true);
    expect(isReviewDay(9)).toBe(false);
  });
});
