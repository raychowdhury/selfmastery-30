import { format } from "date-fns";

import { calendarDayToLocal } from "@/lib/challenge/dates";

/**
 * Both of these take a *calendar day* (UTC midnight, as stored in a `date`
 * column) and print the day it actually represents, not whatever instant it
 * lands on in the server's timezone.
 */
export function formatDayDate(date: Date): string {
  return format(calendarDayToLocal(date), "EEEE, MMMM d");
}

export function formatShortDate(date: Date): string {
  return format(calendarDayToLocal(date), "d MMM yyyy");
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "··";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** "3 actions" / "1 action" — small, but it is on every screen. */
export function pluralise(count: number, singular: string, plural?: string) {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
}
