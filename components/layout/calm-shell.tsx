"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useTheme } from "@/components/layout/theme-provider";
import { cn } from "@/lib/utils/cn";

/**
 * Chrome for the Calm design: one centred phone-width column on every
 * viewport, a fixed glass bottom nav with three destinations, and a fixed
 * glass action bar each screen slots its own buttons into.
 *
 * The nav height is a shared CSS variable so the action bar can sit exactly
 * on top of it, and pages can pad their scroll end past both.
 */

export const NAV_HEIGHT = 78;

/** Screens that show the bottom nav. Everything else gets the bar at 0. */
const NAV_ROUTES = [
  "/today",
  "/progress",
  "/calendar",
  "/reviews",
  "/settings",
];

export function navVisible(pathname: string): boolean {
  return NAV_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function TodayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <polyline points="9 12 11.5 14.5 15.5 10" />
    </svg>
  );
}

function DaysIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="17" rx="3" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}

const TABS = [
  {
    href: "/today",
    label: "Today",
    Icon: TodayIcon,
    // Day-complete is still "today's" flow.
    match: ["/today"],
  },
  {
    href: "/progress",
    label: "30 days",
    Icon: DaysIcon,
    match: ["/progress", "/calendar", "/reviews", "/challenge/complete"],
  },
  {
    href: "/settings",
    label: "Settings",
    Icon: SettingsIcon,
    match: ["/settings", "/challenge"],
  },
] as const;

export function CalmNav() {
  const pathname = usePathname();
  if (!navVisible(pathname)) return null;

  return (
    <nav
      aria-label="Primary"
      className="glass fixed inset-x-0 bottom-0 z-40 backdrop-blur-[18px]"
    >
      <div className="mx-auto grid w-full max-w-[430px] grid-cols-3 px-3 pt-1.5 pb-[max(22px,env(safe-area-inset-bottom))]">
        {TABS.map(({ href, label, Icon, match }) => {
          const current = match.some(
            (m) => pathname === m || pathname.startsWith(`${m}/`)
          );
          return (
            <Link
              key={href}
              href={href}
              aria-current={current ? "page" : undefined}
              className={cn(
                "flex min-h-[50px] flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium tracking-[0.02em] no-underline",
                current
                  ? "text-[var(--color-accent)] hover:text-[var(--color-accent)]"
                  : "text-[color-mix(in_srgb,var(--color-text)_60%,transparent)] hover:text-[var(--color-text)]"
              )}
            >
              <Icon />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * The fixed action bar. Sits directly above the nav when the nav is present,
 * on the bottom edge otherwise.
 */
export function GlassBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const lifted = navVisible(pathname);

  return (
    <div
      className={cn("glass fixed inset-x-0 z-30 backdrop-blur-[18px]", className)}
      style={{ bottom: lifted ? NAV_HEIGHT : 0 }}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-[430px] flex-col gap-2.5 px-7 pt-4",
          lifted ? "pb-6" : "pb-[max(24px,env(safe-area-inset-bottom))]"
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Theme toggle — sun in the dark theme, moon in the light one. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const resolvedDark = theme !== "light";

  return (
    <button
      type="button"
      aria-label="Toggle appearance"
      onClick={() => setTheme(resolvedDark ? "light" : "dark")}
      className={cn(
        "grid size-11 cursor-pointer place-items-center border-none bg-transparent p-0 text-[color-mix(in_srgb,var(--color-text)_60%,transparent)]",
        className
      )}
    >
      {resolvedDark ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}

/** The accent-tinted fading rule between list rows. */
export function CalmRule({ className }: { className?: string }) {
  return <div role="presentation" className={cn("calm-rule", className)} />;
}
