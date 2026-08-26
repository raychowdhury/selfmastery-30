"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, CircleCheck, User } from "lucide-react";

const TABS = [
  { href: "/today", label: "Today", Icon: CircleCheck },
  { href: "/calendar", label: "Calendar", Icon: CalendarDays },
  { href: "/progress", label: "Progress", Icon: BarChart3 },
  { href: "/settings", label: "Profile", Icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-40 grid grid-cols-4 border-t border-[var(--color-divider)] bg-[color-mix(in_srgb,var(--color-page)_94%,black)] px-2 pb-[max(14px,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur lg:hidden"
    >
      {TABS.map(({ href, label, Icon }) => {
        const current = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className="tabbar-item"
            aria-current={current ? "page" : undefined}
          >
            <Icon className="size-5" aria-hidden />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
