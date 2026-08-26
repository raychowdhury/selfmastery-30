import Link from "next/link";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardMeta, CardTitle } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { PUBLIC_TEMPLATES, TEMPLATE_GROUPS } from "@/lib/plan/templates";

export const metadata: Metadata = {
  title: "Templates",
  description: "Proven 30-day paths. Pick one and make it yours.",
};

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const { group } = await searchParams;
  const active = TEMPLATE_GROUPS.includes(group as never) ? group : "Popular";

  // "Popular" is a view of everything, not a separate bucket — a first-time
  // visitor should see the whole catalogue, not a filtered slice of it.
  const templates =
    active === "Popular"
      ? PUBLIC_TEMPLATES
      : PUBLIC_TEMPLATES.filter((template) => template.group === active);

  return (
    <main className="pb-4 pt-6 sm:pt-10">
      <h1 className="text-[28px] sm:text-[36px]">Templates</h1>
      <p className="text-muted mt-2 text-[15px]">
        Proven 30-day paths. Pick one and make it yours.
      </p>

      <div className="mt-5 flex flex-wrap gap-2 sm:mt-6">
        {TEMPLATE_GROUPS.map((name) => (
          <Link
            key={name}
            href={name === "Popular" ? "/templates" : `/templates?group=${name}`}
            className="no-underline"
          >
            <Tag
              variant={name === active ? "accent" : "neutral"}
              className="px-3.5 py-1.5"
            >
              {name}
            </Tag>
          </Link>
        ))}
      </div>

      <div className="mt-7 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.slug} className="p-5">
            <CardTitle>{template.name}</CardTitle>
            <CardBody>{template.description}</CardBody>
            <CardMeta>
              <span>30 days</span>
              <span>·</span>
              <span>{template.timeLabel}</span>
            </CardMeta>
            <Button asChild variant="ghost" className="mt-1 self-start">
              <Link href={`/onboarding?template=${template.slug}`}>
                Start this challenge →
              </Link>
            </Button>
          </Card>
        ))}
      </div>

      <p className="text-muted mt-8 mb-0 text-sm">
        None of these quite right?{" "}
        <Link href="/onboarding">Describe your own goal instead</Link>.
      </p>
    </main>
  );
}
