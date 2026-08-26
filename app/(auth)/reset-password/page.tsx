import Link from "next/link";
import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Reset your password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div>
        <h1 className="text-[30px]">That link is incomplete.</h1>
        <p className="text-muted mt-2 text-sm">
          Reset links expire after 30 minutes. Ask for a new one and try again.
        </p>
        <p className="mt-6 mb-0 text-sm">
          <Link href="/forgot-password">Send another link</Link>
        </p>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
