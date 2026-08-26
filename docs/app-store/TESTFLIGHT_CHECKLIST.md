# TestFlight checklist

Work through this on a real device before inviting external testers. Items
marked **⚠** have historically been where bugs hide in apps of this shape.

## Build

- [ ] Build number increased since the last upload
- [ ] Release configuration, production API URL (`plutil -extract APIBaseURL raw`)
- [ ] `strings` on the binary returns no `localhost` ⚠
- [ ] Privacy manifest present in the bundle
- [ ] Export compliance answered (or `ITSAppUsesNonExemptEncryption` set)
- [ ] No debug menus, no test data, no `print` of anything sensitive

## Install

- [ ] Fresh install launches to Welcome
- [ ] Upgrade over a previous build keeps the session and lands on Today ⚠
- [ ] Delete and reinstall returns to Welcome, with no stale Keychain session ⚠

## Authentication

- [ ] Sign up with a new email
- [ ] Sign up with an existing email → inline "already registered" on the field
- [ ] Sign in, correct password
- [ ] Sign in, wrong password → message reveals nothing about the account
- [ ] Password shorter than 8 characters → button stays disabled
- [ ] Forgot password → "check your email" regardless of whether it exists ⚠
- [ ] Reset link actually arrives, and the new password works ⚠
- [ ] Sign out returns to Welcome
- [ ] Force-quit and relaunch → still signed in, no flash of Welcome ⚠

## Onboarding

- [ ] Each of the nine categories produces a plan
- [ ] Free-text category ("Something else") produces a plan ⚠
- [ ] Goal examples change with the category
- [ ] Safety note appears for health, fitness, sleep and money ⚠
- [ ] Back works from every step and exits from step one
- [ ] Custom minutes accepts a typed value
- [ ] Start date can be moved forward
- [ ] Plan Ready reflects the answers given
- [ ] "Preview Plan" shows milestones

## Today

- [ ] Loads with actions, minutes and pillars
- [ ] Ticking is instant, before the network returns ⚠
- [ ] Progress and remaining count update with it
- [ ] Airplane mode → ticking rolls back with a message, nothing silently lost ⚠
- [ ] Un-ticking works
- [ ] Priorities save without a Save button
- [ ] Reflection saves and reloads
- [ ] Finish Day → completion summary with real numbers
- [ ] Pull to refresh

## Minimum Day

- [ ] Sheet shows a real original → minimum comparison ⚠
- [ ] "Keep Original Plan" changes nothing
- [ ] Switching reduces the actions and drops optional ones ⚠
- [ ] Progress recalculates against the reduced plan
- [ ] "Restore full plan" brings the original back, with completions intact ⚠
- [ ] Survives force-quit

## Calendar

- [ ] All 30 days, correct states
- [ ] Today is distinguishable without relying on colour ⚠
- [ ] Past day opens and stays editable
- [ ] Future day opens read-only
- [ ] A missed day is not red or alarming ⚠

## Progress

- [ ] Percentage and metrics match the calendar
- [ ] Chart renders and is legible
- [ ] Pillar bars present
- [ ] Insights appear only with enough data; empty state otherwise ⚠
- [ ] No insight contradicts the visible record ⚠

## Reviews

- [ ] Locked until its closing day
- [ ] Submitting shows the adjustment **and its reasoning** ⚠
- [ ] A hard week never produces a heavier plan ⚠
- [ ] Completed days are unchanged afterwards ⚠

## Day 30 and history

- [ ] Day 30 shows real statistics
- [ ] Final reflection saves
- [ ] "Start My Next 30 Days" returns to onboarding
- [ ] Previous challenges lists the finished one

## Network

- [ ] Offline at launch with a token → app opens, banner shows ⚠
- [ ] Offline mid-session → clear message, no crash
- [ ] Reconnect → refresh recovers
- [ ] Slow connection (Network Link Conditioner, 3G) → no frozen UI ⚠
- [ ] Backend returning 500 → readable message, retry offered

## Accessibility

- [ ] VoiceOver: every action announces title, duration, pillar and done state ⚠
- [ ] VoiceOver: the tick button says what it will do
- [ ] Dynamic Type at largest accessibility size — no clipping ⚠
- [ ] Reduce Motion — no spring animations
- [ ] Selected states readable in greyscale ⚠
- [ ] All targets at least 44×44

## Appearance

- [ ] Light, Dark and System all correct on every screen ⚠
- [ ] Theme switch applies immediately
- [ ] iPhone SE-class width — no clipping ⚠
- [ ] iPhone Pro Max
- [ ] iPad — functional, even if not optimised

## Account

- [ ] Name change saves
- [ ] Reminder permission asked only from Profile ⚠
- [ ] Reminders schedule and arrive
- [ ] Sign out cancels pending notifications ⚠
- [ ] **Delete account**: warns, requires password, deletes ⚠
- [ ] After deletion, the old token no longer works ⚠
- [ ] After deletion, signing in with the old details fails

## What to tell testers

```
Thanks for trying SelfMastery.

Pick one goal you actually care about — the app is only useful if the goal is
real. Setup takes about two minutes.

Worth trying on purpose:
• A day you genuinely can't complete → tap "Use Minimum Day"
• Airplane mode, then tick something off
• Largest text size, in Settings → Accessibility → Display & Text Size

Tell us: anything confusing, anything that felt like nagging, and anything that
made you want to stop using it. That last one is the most useful.
```
