import type { Metadata } from "next";

import { DraftNotice } from "@/components/marketing/draft-notice";
import { LegalPage, Placeholder, Section } from "@/components/marketing/legal-page";
import { isPlaceholder, OPERATOR } from "@/lib/content/legal";

export const metadata: Metadata = {
  title: "Support",
  description: "Help with SelfMastery — challenges, Minimum Day, passwords and account deletion.",
};

function Detail({ value }: { value: string }) {
  return isPlaceholder(value) ? <Placeholder>{value}</Placeholder> : <>{value}</>;
}

export default function SupportPage() {
  return (
    <LegalPage
      title="Support"
      intro="Answers to the things people ask most. If yours isn't here, email us — a real person reads it."
    >
      <DraftNotice />

      <Section title="What is SelfMastery?">
        <p>
          SelfMastery gives you one goal and thirty days to move toward it. You
          tell it what you want to change, how much time you realistically have
          and what usually gets in your way. It turns that into a few small
          actions each day, and adjusts as you go.
        </p>
        <p>
          It is not a habit tracker. You do not tell it what to track — you tell
          it what you want to change, and it works out what today should look
          like.
        </p>
      </Section>

      <Section title="How does the 30-day challenge work?">
        <p>
          Setup takes about two minutes. After that, opening the app shows
          today&apos;s actions — usually two to four, sized to the time you said
          you had. The plan grows deliberately slowly:
        </p>
        <ul>
          <li>
            <strong>Days 1–7, Consistency.</strong> Small on purpose. The point
            is showing up.
          </li>
          <li>
            <strong>Days 8–14, Build.</strong> Structure, now the habit exists.
          </li>
          <li>
            <strong>Days 15–21, Depth.</strong> Real progress rather than just
            turning up.
          </li>
          <li>
            <strong>Days 22–30, Finish.</strong> Toward whatever you said Day 30
            should look like.
          </li>
        </ul>
        <p>
          Every seven days you spend two minutes reviewing. If the week was hard,
          the next one gets lighter.
        </p>
      </Section>

      <Section title="What is a Minimum Day?">
        <p>
          Some days fall apart. Instead of skipping, tap{" "}
          <strong>Use Minimum Day</strong> and the plan shrinks to its smallest
          meaningful version — a thirty-minute walk becomes five minutes, sixty
          minutes of study becomes ten.
        </p>
        <p>
          It still counts toward your consistency. You can switch back at any
          time, and nothing you have already completed is lost.
        </p>
        <p>Reduce the requirement, not the commitment.</p>
      </Section>

      <Section title="I missed a day. Have I ruined it?">
        <p>
          No. A missed day is a gap in the record, not a failure, and nothing
          resets. The app will not warn you about a streak or tell you that you
          have broken anything.
        </p>
      </Section>

      <Section title="How do I reset my password?">
        <p>
          On the sign-in screen, tap <strong>Forgotten your password?</strong>{" "}
          and enter your email. If that address has an account, we send a link
          that expires in 30 minutes. The link opens a page where you choose a
          new password. For safety, changing it signs you out on every device.
        </p>
        <p>
          If the email does not arrive, check spam and confirm you are using the
          address you signed up with. For privacy we do not confirm whether an
          address is registered, so the confirmation screen looks the same either
          way.
        </p>
      </Section>

      <Section title="My progress is not syncing">
        <p>
          Everything you do is saved to your account, so it follows you across
          devices. If the app says{" "}
          <em>“You&apos;re offline. Your progress will sync when you&apos;re
          connected.”</em>{" "}
          it could not reach our servers. Check your connection, then pull down
          on the Today screen to refresh. If it persists for more than a few
          minutes, contact us — it may be on our side.
        </p>
      </Section>

      <Section title="How do I change my reminders?">
        <p>
          <strong>Profile → Reminders.</strong> You can turn each one on or off:
          the morning plan, a reminder at the time you said you would act, an
          evening nudge to close out the day, and the weekly review.
        </p>
        <p>
          We never ask for notification permission when you first open the app,
          and declining changes nothing else.
        </p>
      </Section>

      <Section title="How do I delete my account?">
        <p>
          <strong>Profile → Delete account</strong>, at the bottom.
        </p>
        <p>
          You will be shown exactly what is removed and asked for your password.
          Deletion is permanent and immediate: your account, every challenge, all
          your daily actions, completion history, reflections and weekly reviews.
          It cannot be undone, and we cannot recover it afterwards.
        </p>
        <p>There is no “deactivate” option. If you delete, it is gone.</p>
      </Section>

      <Section title="Can I run more than one challenge at once?">
        <p>
          Not in this version, and that is intentional — the product&apos;s
          entire premise is one meaningful goal at a time. Finishing or archiving
          a challenge lets you start another, and completed challenges stay in{" "}
          <strong>Profile → Previous challenges</strong>.
        </p>
      </Section>

      <Section title="Is SelfMastery medical, therapeutic or financial advice?">
        <p>
          No. It suggests general behavioural actions only — “walk for twenty
          minutes”, “record what you spent today”. It does not diagnose, treat,
          prescribe, or advise on money. For anything affecting your health,
          mental health or finances, speak to a qualified professional.
        </p>
      </Section>

      <Section title="Contact us">
        <p>
          Email: <Detail value={OPERATOR.supportEmail} />
          <br />
          Typical response time: <Detail value={OPERATOR.supportResponseTime} />
        </p>
        <p>
          Telling us your device model, iOS version and app version makes it much
          faster to help.
        </p>
      </Section>
    </LegalPage>
  );
}
