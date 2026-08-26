"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  describeRetry,
  limitSignIn,
  limitSignUp,
} from "@/lib/security/rate-limit";
import { credentialsSchema, signUpSchema } from "@/lib/validations/auth";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function signUpAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  // Checked after validation so malformed submissions do not burn the budget.
  const limit = await limitSignUp();
  if (!limit.ok) {
    return {
      error: `Too many accounts created from here. Try again in ${describeRetry(limit.retryAfterSeconds)}.`,
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing) {
    return { fieldErrors: { email: "That email is already registered." } };
  }

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
    },
  });

  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: "/onboarding",
  });

  return {};
}

export async function signInAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const limit = await limitSignIn(parsed.data.email);
  if (!limit.ok) {
    return {
      error: `Too many sign-in attempts. Try again in ${describeRetry(limit.retryAfterSeconds)}.`,
    };
  }

  const next = String(formData.get("next") || "/today");

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: next.startsWith("/") ? next : "/today",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Deliberately vague: never confirm whether an address is registered.
      return { error: "That email and password don't match." };
    }
    throw error;
  }

  return {};
}

export async function signOutAction() {
  await signOut({ redirect: false });
  redirect("/");
}
