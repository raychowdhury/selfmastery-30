# Mobile API integration

Base path: `/api/mobile/v1`. All responses are JSON.

## Why this exists

The web app authenticates with Auth.js **cookie** sessions and mutates through
React Server Actions. Neither is reachable from a native client, so the mobile
API is a separate, token-authenticated surface over the same services. It does
not reimplement business logic — the routes are thin and call the same plan
generator, analytics and challenge services the web app uses.

## Authentication

`Authorization: Bearer <token>`.

Tokens are opaque, 32 bytes of CSPRNG output, stored **hashed** (SHA-256) in the
`DeviceSession` table. Not JWTs, deliberately: sign-out and account deletion have
to revoke access immediately, and a self-contained token cannot be withdrawn
before it expires.

Sessions last 60 days with a sliding expiry. The token is fast-hashed rather than
bcrypt-hashed because it has far more entropy than a password — there is nothing
to brute-force, and every request has to verify it.

On the device the token lives in the Keychain with
`kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`: available to background work
after first unlock, and never carried to another device by a backup.

## Date shapes

Two, deliberately distinct:

| Kind | Format | Example |
| --- | --- | --- |
| Calendar day | `yyyy-MM-dd` | `"2026-08-26"` |
| Instant | ISO-8601 | `"2026-08-26T14:03:00.000Z"` |

A challenge day is a **date**, not a moment. Sending it as ISO-8601 drags a
timezone into it and shifts the day for anyone west of UTC. `CalendarDay` on the
client keeps the two from being confused.

## Errors

Every failure has one shape:

```json
{ "error": { "code": "unauthorized", "message": "Your session has expired.",
             "fields": { "email": "That email is already registered." } } }
```

| Status | Code | Client behaviour |
| --- | --- | --- |
| 400 / 403 / 409 | `bad_request`, `forbidden`, `conflict` | Show inline, attach `fields` to the form |
| 401 | `unauthorized` | Clear the Keychain, return to sign-in |
| 404 | `not_found` | Show the message |
| 429 | `rate_limited` | Show the message, which includes when to retry |
| 5xx | `server_error` | Generic message, offer retry |

## Endpoints

### Authentication

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/auth/sign-up` | Returns token + user. Rate limited. |
| POST | `/auth/sign-in` | Same. Constant-time even for unknown accounts. |
| POST | `/auth/sign-out` | Revokes only the calling device's token. |
| POST | `/auth/forgot-password` | Always 200, whether or not the address exists. |
| POST | `/auth/reset-password` | Consumes a token, revokes every session. |

### Account

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/me` | User + whether a challenge is active. |
| PATCH | `/me` | Display name. |
| DELETE | `/account` | Permanent. Requires the password again. |

### Content

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/onboarding-options` | Categories, obstacles, difficulties, goal examples, safety notes. No auth. |
| GET | `/templates` | Starter templates. No auth. |

### Challenge

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/challenges` | Creates from onboarding answers; the server generates the plan. |
| GET | `/challenges` | History, newest first. |
| GET | `/challenges/active` | The running challenge, or null. |
| GET | `/today` | Screen-shaped: challenge, day, stats, review due. |
| GET | `/days?dayNumber=12` | One day by number. |
| GET | `/progress` | Stats, calendar states, pillars, insights, adjustments. |
| GET | `/reviews` | Every week's review state. |

### Mutations

| Method | Path | Body |
| --- | --- | --- |
| PATCH | `/actions/{id}` | `{ "completed": true }` |
| PUT | `/days/{id}/minimum` | `{ "isMinimumDay": true }` |
| PUT | `/days/{id}/priorities` | `{ "priorities": [...] }` |
| PUT | `/days/{id}/reflection` | `{ "dayFeeling": "GOOD", "note": "…" }` |
| POST | `/days/{id}/finish` | — |
| PUT | `/reviews/{week}` | Review answers; returns the adjustment and its reasoning. |
| PUT | `/challenges/{id}/final-reflection` | Completes the challenge. |

## Authorization model

Every query filters on the authenticated user. An id belonging to someone else
simply does not match and returns 404 rather than 403 — which also avoids
confirming that the id exists.

This is covered by `scripts/mobile-api-smoke.sh`, which signs up a second
account and checks it cannot touch the first one's actions or days.

## Smoke test

```bash
npm run dev
./scripts/mobile-api-smoke.sh
```

30 checks: auth, authorization, the full day lifecycle, cross-user isolation,
password reset, account deletion and token revocation. Creates throwaway
accounts and deletes them again. Never point it at production.
