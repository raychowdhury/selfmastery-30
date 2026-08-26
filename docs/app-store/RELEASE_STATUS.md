# Release status

Last updated: 26 August 2026 · App version 1.0.0 (build 1)

## Dashboard

| Item | Status |
| --- | --- |
| iOS Release Build | **READY** |
| Authentication | **READY** |
| Account Deletion | **READY** |
| Privacy Manifest | **READY** |
| App Privacy Answers | **READY** |
| App Icon | **READY** |
| Screenshots | **READY** — six captured at 1320×2868 |
| Privacy Policy | **READY (pending legal review)** — live page, placeholders visible |
| Terms of Use | **READY (pending legal review)** — live page |
| Support URL | **READY** — live page |
| Password Reset Email | **READY** — free Gmail SMTP path, no domain needed |
| Demo Account | **READY** — one command creates it |
| App Review Notes | **READY** |
| Production Backend | **BLOCKED** — needs your Vercel/Neon accounts |
| TestFlight | **BLOCKED** — needs an Apple Developer account |
| Final Archive | **BLOCKED** — needs a signing identity |

Three blockers remain. All three require accounts only you can create.

## What changed since the last review

Everything that could be closed from inside the repository has been.

### Legal and support pages — now live routes

`/privacy`, `/terms` and `/support` are real pages in the marketing route group,
publicly reachable with no auth in front of them. They are linked from the
footer and from each other.

Operator details live in one file, `lib/content/legal.ts`. While any value is
still a placeholder, every page renders a **visible draft notice** and
highlights the unfilled values, so a half-finished privacy policy cannot be
linked from an App Store listing and mistaken for a binding document.

**You still need to:** fill that one file and have the two legal drafts reviewed
by a lawyer. I can't invent your legal entity, address, jurisdiction or contact
email.

### Password reset — no longer silently broken

This was the HIGH risk: without a mail provider the endpoint returned success
and sent nothing, so a locked-out user would wait forever for an email.

It now returns **503 with a clear message** when no mail transport is
configured, and the app shows that message. A new
`GET /api/mobile/v1/health` endpoint reports which dependencies are configured,
and the smoke test asserts the correct behaviour for both cases.

Two transports are supported so a domain is not a prerequisite: **Gmail over
SMTP** with an App Password (free, no domain — mail goes out through Google
from your own address, so SPF and DKIM align), or **Resend** once you own a
domain.

**You still need to:** create the sending account and set the variables. The
Gmail route costs nothing and needs no domain. Until then the feature is
honestly unavailable rather than fake.

### Screenshots — captured

Six frames in `docs/app-store/screenshots/`, all 1320×2868 (6.9"), all real app
output from a seeded account, status bar normalised to 9:41:

| File | Screen |
| --- | --- |
| `01-welcome.png` | The new landing experience |
| `02-today.png` | Today, mid-progress |
| `03-minimum-day.png` | Minimum Day sheet, real before/after |
| `04-progress.png` | Consistency, metrics, chart |
| `05-calendar.png` | 30 days with every state |
| `06-day30.png` | Day 30 with genuine final numbers |

**You still need to:** upload them, and optionally add framing artwork with the
headlines from `SCREENSHOT_COPY.md`.

### Demo account — one command

`scripts/create-demo-account.mjs` builds the App Review account through the
public API, in exactly the state `REVIEW_NOTES.md` describes — Day 8 of 30, a
perfect day, a partial day, a missed day, a Minimum Day, week 1 reviewed, today
part-done.

```bash
API_BASE=https://your-domain \
DEMO_EMAIL=review@yourdomain.com \
DEMO_PASSWORD='...' \
node scripts/create-demo-account.mjs
```

Run it once production exists. Enter the same credentials in App Store Connect.

### Bundle identifier and backend URL — no longer file edits

`ios/generate.sh` takes them as environment variables:

```bash
SELFMASTERY_BUNDLE_ID=com.yourname.selfmastery \
SELFMASTERY_TEAM_ID=ABCDE12345 \
SELFMASTERY_API_URL=https://selfmastery.example.com \
./generate.sh
```

It refuses a non-HTTPS URL, and warns when the placeholder identifier is still
in use. No diff to keep local.

### App icon — improved

Thicker stroke for small-size legibility, rounded caps at both ends, a diagonal
ground and a depth gradient along the arc. Verified at 120px. Still worth
replacing with a designer's artwork eventually — same path, same dimensions —
but it is no longer placeholder quality.

## Bugs found and fixed while verifying

Driving the real app surfaced several that a code read would not have:

| Severity | Bug | Fix |
| --- | --- | --- |
| **HIGH** | Keychain survives app deletion, so reinstalling silently restored the previous session — "delete the app" failed as a way to sign out, and a shared device leaked an account | Clear the keychain on first launch after install, keyed off a UserDefaults marker |
| **HIGH** | The Day 30 finale was unreachable *on* Day 30 — `isOver` only became true on day 31 | Entry point now appears on the final day as well as after it |
| MEDIUM | `PUT /days/:id/reflection` rejected `null` for optional text, which any JSON client sends | Schemas accept `nullish` on all optional text |
| MEDIUM | "Because **i** want more energy" — the lowercase-first helper mangled the pronoun "I" | Leave single-letter first words alone (both platforms) |
| MEDIUM | Today lost its ring on the calendar once it had progress, so the "Today" key in the legend never appeared | Today keeps its ring regardless of state |
| MEDIUM | The 30-day chart squeezed elapsed days into a corner | X domain pinned to the full challenge |
| MEDIUM | Minimum Day sheet clipped its first line at the medium detent | Sheet scrolls |
| LOW | Welcome content sat top-aligned with dead space on tall devices | Centres when it fits, scrolls when it does not |

## The iOS landing screen

The Welcome screen was a single sparse card. It is now a four-page landing that
answers what a stranger needs before being asked for an account:

1. **One meaningful change.** — the promise
2. **How it works** — the three steps
3. **It works for ordinary goals** — breadth, so it does not read as a fitness app
4. **Progress without perfection** — Minimum Day, with a real before/after

Sign-up and sign-in stay pinned below the pages, so creating an account is never
more than one tap away no matter how far someone reads.

## Remaining blockers

### Production Backend — BLOCKER

Release builds against `https://selfmastery-30.vercel.app`, which does not
exist. The app cannot be reviewed without a reachable backend.

**You need to:** follow `DEPLOY.md`. Then:

```bash
API_BASE=https://your-domain ./scripts/mobile-api-smoke.sh
curl https://your-domain/api/mobile/v1/health
SELFMASTERY_API_URL=https://your-domain ./ios/generate.sh
```

### TestFlight and Final Archive — BLOCKER

Both need a paid Apple Developer account and a signing identity. Register a real
bundle identifier, then Archive and upload from Xcode.

## Verification

| Check | Result |
| --- | --- |
| Backend tests | 60 passing |
| iOS tests | 23 passing |
| Mobile API smoke | 30/30, including cross-user isolation |
| Web build | clean, no warnings |
| iOS Debug + Release | both build |
| Release audit | HTTPS only, no `localhost` strings, no embedded frameworks, manifest bundled |
| Legal pages | `/privacy`, `/terms`, `/support` all 200 |

## Recommended order

1. Deploy the backend (`DEPLOY.md`) — unblocks the most.
2. Configure mail (DEPLOY.md step 6 — Gmail App Password is free and needs no
   domain); send yourself a real reset and check the spam folder.
3. Fill `lib/content/legal.ts`; get the legal drafts reviewed.
4. Apple Developer account; register a bundle ID; run `ios/generate.sh` with it.
5. `node scripts/create-demo-account.mjs` against production.
6. Archive, upload, work through `TESTFLIGHT_CHECKLIST.md`.
7. Fill App Store Connect from `APP_STORE_METADATA.md`, upload screenshots, submit.
