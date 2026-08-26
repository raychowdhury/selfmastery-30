import Link from "next/link";
import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Rule } from "@/components/ui/rule";
import { Tag } from "@/components/ui/tag";
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
    <div>
      <h1 className="text-[27px] sm:text-[36px]">Reviews</h1>
      <p className="text-muted mt-1.5 text-[13px] sm:text-[15px]">
        Every seven days, a short look back. What you say here is what changes
        the days ahead.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        {weeks.map((week) => (
          <Panel key={week.weekNumber} className="p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div className="flex flex-wrap items-baseline gap-2.5">
                <h2 className="heading mb-0 text-[17px]">Week {week.weekNumber}</h2>
                {week.review ? (
                  <Tag variant="accent">Reviewed</Tag>
                ) : week.unlocked ? (
                  <Tag variant="outline">Ready</Tag>
                ) : (
                  <Tag variant="neutral">Opens on day {week.closingDay}</Tag>
                )}
              </div>

              {week.unlocked ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/reviews/${week.weekNumber}`}>
                    {week.review ? "View or edit" : "Start the review"} →
                  </Link>
                </Button>
              ) : null}
            </div>

            {week.unlocked ? (
              <p className="text-muted mt-2 mb-0 text-[13px]">
                {week.summary.completionRate}% of this week&apos;s actions
                completed
                {week.summary.minimumDays > 0
                  ? ` · ${week.summary.minimumDays} Minimum ${week.summary.minimumDays === 1 ? "Day" : "Days"}`
                  : ""}
                {week.review?.difficultyFeedback
                  ? ` · felt ${FEEDBACK_LABEL[week.review.difficultyFeedback].toLowerCase()}`
                  : ""}
              </p>
            ) : (
              <p className="text-muted mt-2 mb-0 text-[13px]">
                Nothing to do yet. Keep going.
              </p>
            )}
          </Panel>
        ))}
      </div>

      {adjustments.length > 0 ? (
        <section className="mt-11" aria-labelledby="adjustments-heading">
          <h2 id="adjustments-heading" className="text-[17px] sm:text-[20px]">
            Changes to your plan
          </h2>
          <p className="text-muted mt-1 mb-4 text-[13px]">
            Every adjustment, and why it was made. Days you have already
            completed are never rewritten.
          </p>

          <Panel className="p-5">
            {adjustments.map((adjustment, index) => (
              <div key={adjustment.id}>
                {index > 0 ? <Rule className="my-4" /> : null}
                <p className="heading mb-1 text-[14.5px]">{adjustment.summary}</p>
                <p className="text-muted mb-0 text-[13px]">
                  {adjustment.rationale}
                </p>
                <p className="mt-1.5 mb-0 text-[12px] text-[var(--color-neutral-600)]">
                  Applied from day {adjustment.appliedFromDay}
                  {adjustment.daysAffected > 0
                    ? ` · ${adjustment.daysAffected} days updated`
                    : " · no change to your actions"}
                </p>
              </div>
            ))}
          </Panel>
        </section>
      ) : null}
    </div>
  );
}
