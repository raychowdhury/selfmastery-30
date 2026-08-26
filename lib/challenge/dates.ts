import { DEFAULT_CHALLENGE_LENGTH } from "@/lib/challenge/phases";

const MS_PER_DAY = 86_400_000;

/**
 * Challenge days are calendar days, not instants.
 *
 * They are stored in PostgreSQL `date` columns, which Prisma hands back as a
 * JS Date at *UTC* midnight. So the whole app treats a calendar day as UTC
 * midnight and never uses local getters on one — otherwise a user east or west
 * of UTC sees every date shift by one.
 *
 * There are exactly two conversion points:
 *   - `todayAsCalendarDay()` — the server clock's local date, as a calendar day.
 *   - `calendarDayToLocal()` — a calendar day, as a local Date for formatting.
 */

/** Today, according to the server's local calendar, as a calendar day. */
export function todayAsCalendarDay(now: Date = new Date()): Date {
  return new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  );
}

/** Parses a `yyyy-MM-dd` string (from a date input) into a calendar day. */
export function parseCalendarDay(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Formats a calendar day back to `yyyy-MM-dd`. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Re-expresses a calendar day as a local Date with the same year/month/day, so
 * date-fns formatting prints the intended date rather than shifting it.
 */
export function calendarDayToLocal(date: Date): Date {
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
}

export function challengeEndDate(
  startDate: Date,
  lengthDays = DEFAULT_CHALLENGE_LENGTH
): Date {
  return dateForDayNumber(startDate, lengthDays);
}

export function dateForDayNumber(startDate: Date, dayNumber: number): Date {
  return new Date(startDate.getTime() + (dayNumber - 1) * MS_PER_DAY);
}

/**
 * Which day of the challenge a date falls on. Returns a number outside
 * 1..lengthDays when the date sits before the start or after the end, so
 * callers can decide what that means.
 */
export function dayNumberForDate(startDate: Date, date: Date): number {
  return Math.round((date.getTime() - startDate.getTime()) / MS_PER_DAY) + 1;
}

/**
 * The day number to show right now: clamped into the challenge, so a user who
 * returns after a two-week gap lands on a real day rather than Day 44.
 */
export function currentDayNumber(
  startDate: Date,
  today: Date,
  lengthDays = DEFAULT_CHALLENGE_LENGTH
): number {
  const raw = dayNumberForDate(startDate, today);
  return Math.max(1, Math.min(lengthDays, raw));
}

export function isChallengeOver(
  startDate: Date,
  today: Date,
  lengthDays = DEFAULT_CHALLENGE_LENGTH
): boolean {
  return dayNumberForDate(startDate, today) > lengthDays;
}

/** Adds whole calendar days. Safe because calendar days carry no local offset. */
export function addCalendarDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}
