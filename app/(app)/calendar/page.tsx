import { redirect } from "next/navigation";

/**
 * The Calm design merges the calendar and progress into one "Your 30 days"
 * screen. The old address still works.
 */
export default async function CalendarRedirect({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const { day } = await searchParams;
  redirect(day ? `/progress?day=${day}` : "/progress");
}
