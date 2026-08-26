import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center px-5 py-10">
      <Link href="/" className="wordmark text-[13px] no-underline text-[var(--color-text)]">
        SELFMASTERY <span className="text-[var(--color-accent)]">30</span>
      </Link>
      <main className="flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">
        {children}
      </main>
    </div>
  );
}
