import Link from "next/link";
import type { Metadata } from "next";

import { TodayPreview } from "@/components/marketing/today-preview";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Rule } from "@/components/ui/rule";
import { Tag } from "@/components/ui/tag";

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
      {/* Hero — take A from the prototype: centred, with the product itself
          overlapping the fold. */}
      <section className="flex flex-col items-center px-1 pt-10 text-center sm:pt-[88px]">
        <Tag variant="accent">30 days. One meaningful change.</Tag>

        <h1 className="mt-5 max-w-[17ch] text-pretty text-[34px] sm:mt-[26px] sm:text-[58px]">
          Become the person you keep saying you want to be.
        </h1>

        <p className="mt-3 max-w-[46ch] text-[15px] text-[var(--color-neutral-400)] sm:mt-5 sm:text-[17px]">
          Turn one meaningful goal into small daily actions you can actually
          follow.
        </p>

        <div className="mt-7 flex w-full flex-col items-stretch gap-3 sm:mt-9 sm:w-auto sm:flex-row sm:items-center">
          <Button asChild size="lg">
            <Link href="/sign-up">Start My 30 Days</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="#how">See How It Works</Link>
          </Button>
        </div>

        <p className="mt-4 mb-0 text-[12.5px] text-[var(--color-neutral-600)]">
          No complicated setup. Start in less than 2 minutes.
        </p>

        <div className="relative z-[1] mt-10 w-full max-w-[560px] sm:mt-16">
          <TodayPreview />
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
