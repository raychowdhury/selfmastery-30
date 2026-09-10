import Link from "next/link";
import type { Metadata } from "next";

import { CalmRule } from "@/components/layout/calm-shell";
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
    <main className="mx-auto max-w-[430px] pb-8 pt-6 sm:pt-10">
      <h1 className="mb-0 text-[26px] leading-[1.2]">Templates</h1>
      <p className="text-muted mt-2 mb-0 text-[14px]">
        Proven 30-day paths. Make one yours.
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

      <div className="mt-8 flex flex-col">
        {templates.map((template, index) => (
          <div key={template.slug}>
            {index > 0 ? <CalmRule /> : null}
            <Link
              href={`/onboarding?template=${template.slug}`}
              className="flex items-center justify-between gap-3 py-[17px] text-[16px] text-inherit no-underline hover:no-underline"
            >
              <span className="min-w-0">{template.name}</span>
              <span className="text-muted shrink-0 text-[13px]">
                {template.timeLabel}
              </span>
            </Link>
          </div>
        ))}
        <CalmRule />
      </div>

      <p className="text-muted mt-8 mb-0 text-sm">
        <Link href="/onboarding">Create my own goal</Link>
      </p>
    </main>
  );
}
