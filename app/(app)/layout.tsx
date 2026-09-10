import { redirect } from "next/navigation";

import { CalmNav, ThemeToggle } from "@/components/layout/calm-shell";
import { auth } from "@/lib/auth";
import { getShellContext } from "@/lib/services/context";

/**
 * The Calm shell: one phone-width column on every viewport, an accent bloom
 * behind the top of the screen, a theme toggle in the corner, and a fixed
 * three-tab glass nav. There is no sidebar — the design is the same calm
 * column everywhere, which is also what the App Store screenshots show.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { user } = await getShellContext(session.user.id);

  // A valid-looking session can outlive the account it points at (a deleted
  // user, or a restored database). Send them back to sign in rather than
  // rendering an empty shell. The `stale` marker stops the proxy bouncing them
  // straight back here.
  if (!user) redirect("/sign-in?stale=1");

  return (
    <div className="calm-glow min-h-dvh">
      <ThemeToggle className="fixed top-3.5 right-5 z-50" />

      <main className="mx-auto w-full max-w-[430px] px-7 pt-[60px] pb-[230px]">
        {children}
      </main>

      <CalmNav />
    </div>
  );
}
