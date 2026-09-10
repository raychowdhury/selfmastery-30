import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { WeeklyReviewForm } from "@/components/reviews/weekly-review-form";
import { summariseWeek } from "@/lib/challenge/adjustment";
import { reviewDays, weekForDay } from "@/lib/challenge/phases";
import { requireUserId } from "@/lib/auth";
import { getChallengeContext } from "@/lib/services/context";
import { listReviews } from "@/lib/services/review-service";

export const metadata: Metadata = { title: "Weekly review" };

export default async function WeeklyReviewPage({
  params,
}: {
  params: Promise<{ week: string }>;
}) {
  const userId = await requireUserId();
  const context = await getChallengeContext(userId);
  if (!context) redirect("/onboarding");

  const weekNumber = Number((await params).week);
  const { challenge, snapshots, dayNumber } = context;

  const closingDays = reviewDays(challenge.lengthDays);
  const closingDay = closingDays.find(
    (day) => weekForDay(day, challenge.lengthDays) === weekNumber
  );
  if (!closingDay) notFound();

  // A review cannot be written before the week it covers has happened.
  if (dayNumber < closingDay) redirect("/reviews");

  const reviews = await listReviews(userId, challenge.id);
  const existing = reviews.find((review) => review.weekNumber === weekNumber);
  const summary = summariseWeek(snapshots, weekNumber, challenge.lengthDays);
  const isFinalWeek = closingDay === challenge.lengthDays;

  return (
    <div className="calm-in">
      <h1 className="mb-0 text-[26px] leading-[1.2]">Week {weekNumber}.</h1>
      <p className="text-muted mt-2 mb-0 text-[14px]">
        Two minutes to look back.
      </p>

      <div className="mt-7">
        <p className="mb-0 text-[16px]">
          {summary.completionRate}% of your actions completed
        </p>
        {summary.minimumDays > 0 ? (
          <p className="text-muted mt-1 mb-0 text-[13px]">
            Including {summary.minimumDays} Minimum{" "}
            {summary.minimumDays === 1 ? "Day" : "Days"}.
          </p>
        ) : null}
        {summary.frequentlySkipped.length > 0 ? (
          <p className="text-muted mt-2 mb-0 text-[13px]">
            Skipped most often:{" "}
            {summary.frequentlySkipped.slice(0, 2).join(", ")}. Worth changing or
            shortening.
          </p>
        ) : null}
      </div>

      <WeeklyReviewForm
        challengeId={challenge.id}
        weekNumber={weekNumber}
        isFinalWeek={isFinalWeek}
        initial={
          existing
            ? {
                wentWell: existing.wentWell ?? "",
                struggledWith: existing.struggledWith ?? "",
                mainObstacle: existing.mainObstacle,
                difficultyFeedback: existing.difficultyFeedback,
                nextWeekChange: existing.nextWeekChange ?? "",
              }
            : undefined
        }
      />
    </div>
  );
}
