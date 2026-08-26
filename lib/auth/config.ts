import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe half of the auth setup. It carries no database or bcrypt import so
 * it can run inside middleware; the providers live in lib/auth/index.ts.
 */
export const authConfig = {
  // Behind a platform proxy (Vercel, Fly) the forwarded host is the real one.
  trustHost: true,
  pages: {
    signIn: "/sign-in",
    newUser: "/onboarding",
  },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
