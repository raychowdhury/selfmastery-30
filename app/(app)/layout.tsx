import { redirect } from "next/navigation";

import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { auth } from "@/lib/auth";
import { getShellContext } from "@/lib/services/context";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { user, dayLabel } = await getShellContext(session.user.id);

  // A valid-looking session can outlive the account it points at (a deleted
  // user, or a restored database). Send them back to sign in rather than
  // rendering an empty shell. The `stale` marker stops the proxy bouncing them
  // straight back here.
  if (!user) redirect("/sign-in?stale=1");

  return (
    <div className="flex min-h-dvh bg-[var(--color-page)]">
      <Sidebar
        userName={user?.name ?? null}
        userEmail={user?.email ?? ""}
        dayLabel={dayLabel}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between px-5 py-4 lg:hidden">
          <span className="wordmark text-[13px]">
            SELFMASTERY <span className="text-[var(--color-accent)]">30</span>
          </span>
          {dayLabel ? (
            <span className="text-[12px] text-[var(--color-neutral-500)]">
              {dayLabel} of 30
            </span>
          ) : null}
        </header>

        <main className="flex-1 px-5 pb-10 pt-1 sm:px-8 lg:px-16 lg:pb-16 lg:pt-12">
          <div className="mx-auto w-full max-w-[780px]">{children}</div>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
