import Link from "next/link";
import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";

import { CalmRule } from "@/components/layout/calm-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { summariseWeek } from "@/lib/challenge/adjustment";
import { reviewDays, weekForDay } from "@/lib/challenge/phases";
import { requireUserId } from "@/lib/auth";
import { getChallengeContext } from "@/lib/services/context";
import { listAdjustments, listReviews } from "@/lib/services/review-service";

export const metadata: Metadata = { title: "Reviews" };

const FEEDBACK_LABEL: Record<string, string> = {
  TOO_EASY: "Too easy",
  ABOUT_RIGHT: "About right",
  TOO_DIFFICULT: "Too difficult",
};

export default async function ReviewsPage() {
  const userId = await requireUserId();
  const context = await getChallengeContext(userId);

  if (!context) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No reviews yet"
        description="Every seven days you'll look back for two minutes, and next week's plan adjusts from what you say."
        actionLabel="Start My 30 Days"
        actionHref="/onboarding"
        className="mt-10"
      />
    );
  }

  const { challenge, snapshots, dayNumber } = context;
  const [reviews, adjustments] = await Promise.all([
    listReviews(userId, challenge.id),
    listAdjustments(userId, challenge.id),
  ]);

  const written = new Map(reviews.map((review) => [review.weekNumber, review]));
  const weeks = reviewDays(challenge.lengthDays).map((closingDay) => {
    const weekNumber = weekForDay(closingDay, challenge.lengthDays);
    return {
      weekNumber,
      closingDay,
      unlocked: dayNumber >= closingDay,
      review: written.get(weekNumber) ?? null,
      summary: summariseWeek(snapshots, weekNumber, challenge.lengthDays),
    };
  });

  return (
    <div className="calm-in">
      <h1 className="mb-0 text-[26px] leading-[1.2]">Reviews</h1>
      <p className="text-muted mt-2 mb-0 text-[14px]">
        Every seven days, a short look back.
      </p>

      <div className="mt-8 flex flex-col">
        {weeks.map((week, index) => (
          <div key={week.weekNumber}>
            {index > 0 ? <CalmRule /> : null}
            {week.unlocked ? (
              <Link
                href={`/reviews/${week.weekNumber}`}
                className="flex items-baseline justify-between gap-3 py-[17px] text-inherit no-underline hover:no-underline"
              >
                <div className="min-w-0">
                  <div className="text-[16px]">Week {week.weekNumber}</div>
                  <div className="text-muted mt-0.5 text-[13px]">
                    {week.summary.completionRate}% completed
                    {week.review?.difficultyFeedback
                      ? ` · felt ${FEEDBACK_LABEL[week.review.difficultyFeedback].toLowerCase()}`
                      : ""}
                  </div>
                </div>
                <span className="text-muted shrink-0 text-[13px]">
                  {week.review ? "Reviewed" : "Ready"}
                </span>
              </Link>
            ) : (
              <div className="flex items-baseline justify-between gap-3 py-[17px]">
                <div className="text-muted text-[16px]">
                  Week {week.weekNumber}
                </div>
                <span className="text-muted shrink-0 text-[13px]">
                  Opens on day {week.closingDay}
                </span>
              </div>
            )}
          </div>
        ))}
        <CalmRule />
      </div>

      {adjustments.length > 0 ? (
        <section className="mt-11" aria-labelledby="adjustments-heading">
          <h2
            id="adjustments-heading"
            className="text-muted mb-0 text-[12px] font-normal tracking-[0.08em] uppercase"
          >
            Changes to your plan
          </h2>

          <div className="mt-2 flex flex-col">
            {adjustments.map((adjustment, index) => (
              <div key={adjustment.id}>
                {index > 0 ? <CalmRule /> : null}
                <div className="py-3.5">
                  <p className="mb-0 text-[15px]">{adjustment.summary}</p>
                  <p className="text-muted mt-1 mb-0 text-[13px] leading-normal">
                    {adjustment.rationale} · from day {adjustment.appliedFromDay}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
