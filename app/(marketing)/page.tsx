import Link from "next/link";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Rule } from "@/components/ui/rule";

export const metadata: Metadata = {
  title: "SelfMastery — 30 Days. One Meaningful Change.",
  description:
    "Turn one meaningful goal into small daily actions you can actually follow.",
};

const STEPS = [
  {
    number: "01",
    title: "Choose what matters",
    body: "Tell us what you want to change or accomplish.",
  },
  {
    number: "02",
    title: "Get your 30-day path",
    body: "SelfMastery turns the goal into realistic daily actions.",
  },
  {
    number: "03",
    title: "Show up today",
    body: "Complete today's actions and gradually build consistency.",
  },
];

const GOALS = [
  ["Get healthier", "Move consistently and build healthier routines."],
  ["Study consistently", "Create a study routine that survives busy weeks."],
  ["Find a better job", "Turn the job search into manageable daily actions."],
  ["Get control of my money", "Build better financial organization."],
  ["Reduce phone usage", "Take back control of your attention."],
  ["Finish my project", "Stop restarting and start finishing."],
  ["Spend more time with family", "Make meaningful time intentional."],
  ["Build discipline", "Learn to show up even when motivation changes."],
];

const WHY = [
  ["1 goal", "Not a life overhaul"],
  ["3 actions/day", "Small enough to finish"],
  ["2 min setup", "Answer a few questions"],
  ["30 days", "Long enough to matter"],
];

export default function LandingPage() {
  return (
    <main>
      {/* Hero — the Calm landing: a giant outlined 30 under a soft accent
          bloom, the record dots, and the promise. Left-aligned, quiet. */}
      <section className="mx-auto max-w-[430px] pt-8 sm:pt-14">
        <div className="relative">
          <div
            aria-hidden
            className="absolute -top-8 -left-10 size-[260px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 22%, transparent), transparent 70%)",
              animation: "calm-glow-anim 4s ease-in-out infinite alternate",
            }}
          />
          <div
            aria-hidden
            className="heading relative text-[184px] leading-[0.9] tracking-[-0.05em] text-transparent"
            style={{ WebkitTextStroke: "1.5px var(--color-accent)" }}
          >
            30
          </div>
        </div>

        <div
          aria-hidden
          className="mt-9 grid w-[190px] grid-cols-10 gap-2.5"
        >
          {Array.from({ length: 30 }, (_, index) => (
            <span
              key={index}
              className="block size-2.5 rounded-full"
              style={{
                background: index < 8 ? "var(--color-accent)" : "transparent",
                border: `1px solid ${
                  index < 8
                    ? "var(--color-accent)"
                    : "color-mix(in srgb, var(--color-text) 30%, transparent)"
                }`,
                animation: "calm-dot 0.4s ease both",
                animationDelay: `${index * 35}ms`,
              }}
            />
          ))}
        </div>

        <h1 className="mt-10 mb-0 text-pretty text-[28px] leading-[1.2]">
          Become the person you keep saying you want to be.
        </h1>
        <p className="text-muted mt-3.5 mb-0 text-[15px] leading-normal">
          One goal. Three small actions a day. Thirty days.
        </p>

        <div className="mt-9 flex flex-col gap-2.5">
          <Button asChild block>
            <Link href="/sign-up">Start my 30 days</Link>
          </Button>
          <Button asChild block variant="ghost">
            <Link href="/sign-in">I already have an account</Link>
          </Button>
        </div>
      </section>

      <section id="how" className="pt-16 sm:pt-[120px]">
        <h2 className="text-[24px] sm:text-[30px]">How it works</h2>
        <div className="mt-6 grid gap-4 sm:mt-7 sm:grid-cols-3">
          {STEPS.map((step) => (
            <Card key={step.number} className="p-6">
              <div className="heading text-[13px] text-[var(--color-accent)]">
                {step.number}
              </div>
              <CardTitle className="mt-2.5">{step.title}</CardTitle>
              <CardBody>{step.body}</CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="pt-14 sm:pt-[88px]">
        <h2 className="text-[24px] sm:text-[30px]">It works for ordinary goals</h2>
        <p className="text-muted mt-2 text-[15px]">
          You don&apos;t need a grand mission. You need a direction.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-7 sm:grid-cols-2 lg:grid-cols-4">
          {GOALS.map(([title, body]) => (
            <Card key={title}>
              <CardTitle className="text-[15px]">{title}</CardTitle>
              <CardBody className="text-[12.5px]">{body}</CardBody>
            </Card>
          ))}
        </div>
        <div className="mt-4">
          <Button asChild variant="ghost">
            <Link href="/sign-up">Create my own goal →</Link>
          </Button>
        </div>
      </section>

      <section id="why" className="pt-14 sm:pt-[88px]">
        <h2 className="text-[24px] sm:text-[30px]">Why thirty days</h2>
        <p className="text-muted mt-2 max-w-[62ch] text-[15px]">
          Long enough for something to change. Short enough that you can see the
          end from the start. One goal at a time, because that is how anything
          actually gets finished.
        </p>

        <div className="mt-7 flex flex-wrap gap-x-16 gap-y-7 rounded-[var(--radius-lg)] bg-[var(--color-section)] px-6 py-7 text-[#e9e9ed] sm:px-10">
          {WHY.map(([value, label]) => (
            <div key={value}>
              <div className="heading text-[22px] sm:text-[26px]">{value}</div>
              <div className="mt-0.5 text-[12.5px] text-[var(--color-accent-2-300)]">
                {label}
              </div>
            </div>
          ))}
        </div>

        <Rule className="mt-14" />

        <div className="grid gap-8 pt-8 sm:grid-cols-2">
          <div>
            <h3 className="text-[19px]">Consistency before intensity</h3>
            <p className="text-muted mb-0 text-sm">
              Week one is deliberately easy. The plan grows only once showing up
              has stopped being a decision.
            </p>
          </div>
          <div>
            <h3 className="text-[19px]">A bad day is not a failed challenge</h3>
            <p className="text-muted mb-0 text-sm">
              Every plan has a Minimum Day — the five-minute version. Reduce the
              requirement, not the commitment.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
