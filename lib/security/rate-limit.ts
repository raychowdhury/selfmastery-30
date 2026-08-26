import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting for the endpoints an anonymous visitor can reach.
 *
 * Serverless functions share no memory, so an in-process counter would be
 * worthless — the limiter needs a shared store. This uses Upstash Redis, which
 * is free and speaks HTTP (no TCP connection to hold open).
 *
 * When the store is not configured the limiter degrades to "allow": local
 * development should not need Redis to run. In production that is a real gap,
 * so it is logged loudly once at startup rather than passing silently.
 */

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

if (!redis && process.env.NODE_ENV === "production") {
  console.warn(
    "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN are not set. Sign-up and sign-in are UNTHROTTLED. See DEPLOY.md."
  );
}

type Algorithm = ConstructorParameters<typeof Ratelimit>[0]["limiter"];

function limiter(prefix: string, rules: Algorithm) {
  if (!redis) return null;
  return new Ratelimit({ redis, limiter: rules, prefix, analytics: false });
}

/** Account creation is the expensive one: it writes a row and hashes a password. */
const signUpLimiter = limiter(
  "sm:signup",
  Ratelimit.slidingWindow(5, "1 h")
);

/** Sign-in is cheap but is the credential-stuffing surface. */
const signInLimiter = limiter(
  "sm:signin",
  Ratelimit.slidingWindow(10, "15 m")
);

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the caller may try again. Only set when `ok` is false. */
  retryAfterSeconds: number;
}

const ALLOWED: RateLimitResult = { ok: true, retryAfterSeconds: 0 };

/**
 * Best-effort client identity. Behind Vercel this is the real client address;
 * everything falls back to a shared bucket rather than failing open per-caller.
 */
export async function clientIdentifier(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown"
  );
}

async function check(
  instance: Ratelimit | null,
  key: string
): Promise<RateLimitResult> {
  if (!instance) return ALLOWED;

  try {
    const result = await instance.limit(key);
    if (result.success) return ALLOWED;
    return {
      ok: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((result.reset - Date.now()) / 1000)
      ),
    };
  } catch (error) {
    // A limiter outage must not become an auth outage.
    console.error("[rate-limit] check failed, allowing request", error);
    return ALLOWED;
  }
}

export async function limitSignUp(): Promise<RateLimitResult> {
  return check(signUpLimiter, await clientIdentifier());
}

/**
 * Keyed by address *and* caller, so one attacker cannot lock a real user out of
 * their own account by hammering their email from elsewhere.
 */
export async function limitSignIn(email: string): Promise<RateLimitResult> {
  const identifier = await clientIdentifier();
  return check(signInLimiter, `${identifier}:${email.toLowerCase()}`);
}

/** "try again in 4 minutes" reads better than a timestamp. */
export function describeRetry(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}
