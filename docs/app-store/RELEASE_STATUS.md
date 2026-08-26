# Release status

Last updated: 26 August 2026 · App version 1.0.0 (build 1)

## Dashboard

| Item | Status |
| --- | --- |
| iOS Release Build | **READY** |
| Authentication | **READY** |
| Production Backend | **BLOCKED** — not yet deployed |
| Account Deletion | **READY** |
| Privacy Manifest | **READY** |
| App Privacy Answers | **READY** — draft complete, needs entering |
| App Icon | **READY (placeholder)** — generated, replace with final artwork |
| Screenshots | **BLOCKED** — plan written, capture is a human step |
| Privacy Policy | **BLOCKED** — draft complete, needs legal review and a live URL |
| Support URL | **BLOCKED** — content written, needs publishing |
| Password Reset Email | **BLOCKED** — code complete, needs a mail provider key |
| TestFlight | **BLOCKED** — needs an Apple Developer account |
| App Review Notes | **READY** |
| Final Archive | **BLOCKED** — needs signing identity |

## What each blocker needs

### Production Backend — BLOCKER

The app cannot be reviewed without a reachable backend. `Release` is built
against `https://selfmastery-30.vercel.app`, which does not exist yet.

**You need to:** follow `DEPLOY.md` — create Neon and Vercel accounts (both
free, no card), set the environment variables, deploy. Then confirm the URL in
`ios/project.yml` matches and re-generate.

Verify with:
```bash
API_BASE=https://your-domain ./scripts/mobile-api-smoke.sh
```

I cannot do this: it requires creating accounts.

### Password Reset Email — HIGH

The endpoint, token lifecycle and web reset page are all implemented and tested.
Without `RESEND_API_KEY` and `MAIL_FROM`, `sendPasswordResetEmail` logs a warning
and sends nothing — so the flow looks like it works and does not.

**You need to:** add a mail provider (Resend's free tier is 3,000/month, no
card), set both variables, and send yourself a real reset.

**If you would rather not**, remove the "Forgotten your password?" entry point
before submitting. A visible feature that silently does nothing is a rejection
risk under "app completeness", and worse, a real user could be locked out.

### Privacy Policy and Support URL — BLOCKER

Apple requires a working privacy policy URL and checks it. Drafts are in
`docs/legal/` and `docs/app-store/SUPPORT_CONTENT.md`, with every placeholder
marked.

**You need to:** fill the placeholders, have the legal drafts reviewed by a
lawyer, publish all three pages, and confirm they load without signing in.

I cannot invent your legal entity name, address, jurisdiction or contact email.

### Screenshots — BLOCKER

`SCREENSHOT_PLAN.md` has the six frames, the exact device and pixel sizes, the
`simctl` commands to normalise the status bar, and the account state to seed.

**You need to:** capture and upload them. The app runs and the data exists — the
capture and any framing artwork is the manual part.

### TestFlight and Final Archive — BLOCKER

Both need a paid Apple Developer account and a signing identity.

**You need to:** hold membership, register a real bundle identifier (replacing
`com.yourcompany.selfmastery` in `ios/project.yml`), set `DEVELOPMENT_TEAM`,
then Archive and upload from Xcode.

### App Icon — READY, but replace

`scripts/generate-app-icon.py` produces a real 1024×1024 icon — a progress arc,
no text, strong silhouette. It is good enough to ship and to test with, but it
is programmer-art. Replacing it is one file at the same path and size.

## What is done

| Area | Evidence |
| --- | --- |
| Mobile REST API | 21 routes; `scripts/mobile-api-smoke.sh` passes 30/30, including cross-user isolation |
| Native app | Swift 6, iOS 18+, zero third-party packages, Debug and Release both build |
| Auth + session restore | Keychain-backed, verified on device |
| Onboarding → plan | Eight steps, server-generated plan, verified end to end |
| Today | Optimistic completion, priorities, reflection, Finish Day |
| Minimum Day | Reduces the plan, drops optional actions, restores cleanly |
| Calendar / Progress / Reviews / Day 30 / History | Implemented against live data |
| Notifications | Local, asked for in context; schedule logic unit-tested |
| Account deletion | Two taps from the tab bar, re-authenticated, hard delete verified |
| Privacy manifest | Accurate to an audit; bundles into the app |
| Tests | 23 iOS tests, 60 backend tests, all passing |
| Release audit | HTTPS-only, no `localhost` strings, no embedded frameworks |

## Rejection-risk summary

| Severity | Issue | State |
| --- | --- | --- |
| BLOCKER | Backend unreachable during review | Open — deploy first |
| BLOCKER | Privacy policy URL missing | Open — publish first |
| BLOCKER | Demo account not yet created | Open — needs production |
| HIGH | Password reset sends no email | Open — add a mail key, or remove the entry point |
| MEDIUM | Placeholder bundle identifier | Open — one line in `project.yml` |
| MEDIUM | Placeholder app icon | Open — cosmetic, not a blocker |
| — | Account deletion | Resolved |
| — | Privacy answers vs. implementation | Resolved |
| — | Unnecessary permissions | Resolved — only notifications, asked in context |
| — | ATT prompt without tracking | Resolved — no prompt, no tracking |
| — | Third-party login without Sign in with Apple | Not applicable — no third-party login |
| — | Incomplete subscription flow | Not applicable — no monetisation in 1.0 |

## Recommended order

1. Deploy the backend (`DEPLOY.md`) — unblocks the most.
2. Add the mail provider key and test a real password reset.
3. Publish privacy, terms and support pages.
4. Replace the bundle identifier, get an Apple Developer account.
5. Create the demo account on production, in the state `REVIEW_NOTES.md` describes.
6. Archive, upload, run `TESTFLIGHT_CHECKLIST.md`.
7. Capture screenshots.
8. Fill App Store Connect from `APP_STORE_METADATA.md` and submit.
