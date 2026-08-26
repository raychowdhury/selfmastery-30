import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth/config";

// Renamed from `middleware.ts` — the middleware file convention is deprecated
// in this version of Next.js.

const { auth } = NextAuth(authConfig);

const PROTECTED_PREFIXES = [
  "/today",
  "/calendar",
  "/progress",
  "/reviews",
  "/challenge",
  "/settings",
  "/onboarding",
];

export const proxy = auth((request) => {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !request.auth) {
    const signIn = new URL("/sign-in", request.nextUrl.origin);
    signIn.searchParams.set("next", pathname);
    return Response.redirect(signIn);
  }

  // Signed-in users have no reason to see the auth screens again — unless the
  // app has told us the session is stale (its account no longer exists), in
  // which case bouncing them back would loop forever.
  const stale = request.nextUrl.searchParams.get("stale") === "1";
  if (
    request.auth &&
    !stale &&
    (pathname === "/sign-in" || pathname === "/sign-up")
  ) {
    return Response.redirect(new URL("/today", request.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
