import type { Metadata } from "next";

import { signUpAction } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Start your 30 days" };

export default function SignUpPage() {
  return <AuthForm mode="sign-up" action={signUpAction} />;
}
