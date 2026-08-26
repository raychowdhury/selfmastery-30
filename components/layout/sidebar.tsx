"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Rule } from "@/components/ui/rule";
import { initials } from "@/lib/utils/format";

const PRIMARY = [
  { href: "/today", label: "Today" },
  { href: "/calendar", label: "Calendar" },
  { href: "/progress", label: "Progress" },
  { href: "/reviews", label: "Reviews" },
];

const SECONDARY = [
  { href: "/challenge", label: "My Goal" },
  { href: "/settings", label: "Settings" },
];

interface SidebarProps {
  userName: string | null;
  userEmail: string;
  dayLabel: string | null;
}

export function Sidebar({ userName, userEmail, dayLabel }: SidebarProps) {
  const pathname = usePathname();
  const isCurrent = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="sticky top-0 hidden h-dvh w-[224px] shrink-0 flex-col border-r border-[var(--color-divider)] px-5 py-6 lg:flex">
      <Link href="/today" className="wordmark text-sm no-underline text-[var(--color-text)]">
        SELFMASTERY <span className="text-[var(--color-accent)]">30</span>
      </Link>

      <nav className="mt-8 flex flex-col gap-0.5">
        {PRIMARY.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="nav-item"
            aria-current={isCurrent(item.href) ? "page" : undefined}
          >
            {item.label}
            {item.href === "/today" && dayLabel ? (
              <span className="ml-auto text-[11px] opacity-70">{dayLabel}</span>
            ) : null}
          </Link>
        ))}
      </nav>

      <Rule className="my-5" />

      <nav className="flex flex-col gap-0.5">
        {SECONDARY.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="nav-item"
            aria-current={isCurrent(item.href) ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 px-2.5 py-2">
        <span
          aria-hidden
          className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--color-accent-800)] text-[11px] font-medium text-[var(--color-accent-200)]"
        >
          {initials(userName)}
        </span>
        <span className="min-w-0 truncate text-[13px] text-[var(--color-neutral-300)]">
          {userName ?? userEmail}
        </span>
      </div>
    </aside>
  );
}
