# SelfMastery

**30 Days. One Meaningful Change.**

SelfMastery turns one meaningful goal into small, realistic daily actions. It is
built for anybody — a student, a parent, someone starting to walk again, someone
trying to get on top of their money — not for developers, and not for people who
want another habit tracker.

The product answers a single question:

> What is one meaningful thing I want to improve over the next 30 days, and what
> should I do today to move toward it?

---

## Table of contents

- [Product overview](#product-overview)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Database and migrations](#database-and-migrations)
- [Seed data](#seed-data)
- [Development, testing and builds](#development-testing-and-builds)
- [The plan generator](#the-plan-generator)
- [Future AI architecture](#future-ai-architecture)
- [Safety boundaries](#safety-boundaries)
- [Deployment notes](#deployment-notes)
- [Hosting it free](#hosting-it-free)

---

## Product overview

The core loop:

```
Goal → Understand the user → 30-day plan → Today's actions
     → Completion → Reflection → Adjustment → Progress → Next day
```

Design principles that shaped every decision in this repository:

- **Consistency before intensity.** Week one is deliberately easy. The plan grows
  only after showing up has stopped being a decision.
- **Open the app, understand today within five seconds, act.** Today is the home
  screen and carries no analytics.
- **A bad day is not a failed challenge.** Every plan has a Minimum Day — the
  five-minute version. *Reduce the requirement, not the commitment.*
- **Evidence, not cheerleading.** Encouragement quotes the user's own numbers.

### Screens

| Route | What it is |
| --- | --- |
| `/` | Landing page |
| `/templates` | Starter templates |
| `/sign-in`, `/sign-up` | Email + password auth |
| `/onboarding` | Seven conditional questions, one per screen |
| `/challenge/ready` | Plan Ready — the generated plan, before Day 1 |
| `/today` | **The main screen.** Actions, progress, Minimum Day, reflection |
| `/today/complete` | Day completion summary |
| `/calendar` | All 30 days; past days stay editable |
| `/progress` | Consistency, streaks, pillar breakdown, insights |
| `/reviews`, `/reviews/[week]` | Weekly review and the adjustments it produced |
| `/challenge` | My Goal — goal, why, milestones, history |
| `/challenge/complete` | Day 30 and the final reflection |
| `/settings` | Profile, theme, challenge editing |

---

## Architecture

```
app/
  (marketing)/          landing page, templates
  (auth)/               sign in, sign up
  (app)/                today, calendar, progress, reviews, challenge, settings
  onboarding/           the setup flow
  api/auth/             Auth.js route handler

components/
  ui/                   design-system primitives (button, card, tag, dialog…)
  layout/               sidebar, bottom nav, theme
  marketing/ onboarding/ today/ progress/ reviews/ settings/ challenge/

lib/
  analytics/            pure calculation + insight functions
  auth/                 Auth.js configuration (edge-safe half split out)
  challenge/            dates, phases, adjustment policy
  plan/                 the plan generator and its content strategies
  services/             database access, scoped by user
  validations/          Zod schemas
  db/                   Prisma client singleton

actions/                server actions
prisma/                 schema, migrations, seed
tests/                  Vitest suites for the business logic
```

**Business logic lives outside components.** Everything in `lib/analytics` and
`lib/challenge` is pure — no database, no clock — which is why it can be tested
directly.

### The domain model is goal-agnostic

This is the single most important architectural decision. There are **no columns
named after life areas** — no `careerCompleted`, no `exerciseCompleted`. Instead:

```
User → Challenge → Pillar        (1–4, arbitrary: "Movement", "Focus", "Money"…)
                 → Milestone     (day 7 / 14 / 21 / 30)
                 → ChallengeDay  → DailyAction   (points at a Pillar)
                                 → DailyPriority (the user's own top three)
                                 → DailyReflection
                 → WeeklyReview
                 → PlanAdjustment
                 → FinalReflection
```

A `DailyAction` carries its own `minimumVersionTitle` and
`minimumVersionMinutes`. Switching a day to a Minimum Day sets one boolean on
`ChallengeDay` — the original plan is never overwritten, so the day can be
restored.

**The test of this design:** supporting a brand-new kind of goal ("learn piano",
"quit smoking", "renovate the garage") requires *zero migrations* — only a new
strategy file. There is deliberately no `switch (pillar.name)` anywhere in the
codebase.

---

## Technology stack

- **Next.js 16** (App Router, Server Components by default, Server Actions)
- **React 19**, **TypeScript** in strict mode (no `any`)
- **Tailwind CSS v4** with a CSS-variable design system
- **PostgreSQL** + **Prisma 7** (with the `@prisma/adapter-pg` driver adapter)
- **Auth.js v5** (credentials; the schema already carries `Account`/`Session` so
  Google can be added without a migration)
- **Zod** for every mutation boundary
- **Recharts** for the one chart the product has
- **Vitest** for the business logic
- **lucide-react**, **date-fns**

### Design system

The interface implements the **Nocturne** design system from the Claude Design
prototype (`SelfMastery 30 Prototype.dc.html`). Tokens live at the top of
`app/globals.css` and nothing hardcodes a colour. Notable decisions carried over
from the prototype:

- Dark-first, with a light theme derived from the same OKLCH ramps.
- The primary button is an **outline**, not a fill.
- Freestanding rules fade to transparent over their last 48px.
- Inter throughout, headings at weight 500 with `-0.015em` tracking.

Theme is Light / Dark / System, applied by a blocking inline script so there is
no flash, and read through `useSyncExternalStore` so hydration stays correct.

---

## Local setup

**Prerequisites:** Node 20+, a PostgreSQL 14+ server.

```bash
git clone <repo> && cd 30days
npm install
cp .env.example .env      # then fill in DATABASE_URL and AUTH_SECRET
createdb selfmastery
createdb selfmastery_shadow   # optional, for migration diffing
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000.

**Demo account** (created by the seed):

```
maya@example.com / selfmastery30
```

It lands on Day 8 of a 30-day challenge with a scripted first week — perfect
days, a partial day, a missed day and a Minimum Day — plus a completed challenge
in history.

---

## Environment variables

Every variable is documented in [`.env.example`](.env.example). Nothing secret is
committed.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string (pooled, when hosted) |
| `DIRECT_URL` | when hosted | Unpooled connection, used only by migrations |
| `SHADOW_DATABASE_URL` | dev only | Database Prisma uses to diff migrations |
| `AUTH_SECRET` | yes | Signs session cookies. `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | no | Canonical public URL, for link previews and sitemap |
| `UPSTASH_REDIS_REST_URL` | production | Rate-limit store. Unset = sign-up unthrottled |
| `UPSTASH_REDIS_REST_TOKEN` | production | Rate-limit store token |
| `PLAN_GENERATOR` | no | Which generator to use. Defaults to `rule-based` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | no | Reserved for Google sign-in |

---

## Database and migrations

Prisma 7 keeps its CLI configuration in `prisma7.config.ts` (not in
`schema.prisma`) and reaches the database through a driver adapter.

```bash
npm run db:migrate      # create + apply a migration in development
npm run db:deploy       # apply existing migrations (production)
npm run db:generate     # regenerate the client into lib/generated/prisma
npm run db:studio       # browse the data
npm run db:reset        # drop, re-migrate and re-seed
```

The generated client is written to `lib/generated/prisma` and is gitignored;
`postinstall` regenerates it.

## Seed data

`npm run db:seed` is idempotent — it deletes the demo account and rebuilds it, so
it is always safe to re-run. It creates:

1. **An active challenge** — "Become more physically active", Day 9 of 30, with a
   scripted first week and a completed Week 1 review.
2. **A finished challenge** — "Read every day", 30 days, 24 active days, with a
   final reflection.
3. **A demo-only challenge** — "Become a stronger AI/backend engineer", archived,
   progressing Python → FastAPI → PostgreSQL → auth → Redis → background jobs →
   Docker → testing → LLM integration → RAG → system design → deployment.

> The third exists to make one architectural point: a highly specific technical
> path is just another content file (`lib/plan/strategies/demo-ai-backend.ts`,
> flagged `isDemo` and kept out of the public template list). **The product is not
> built around software engineering.** It is one template out of eighteen.

---

## Development, testing and builds

```bash
npm run dev         # development server
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run test        # Vitest
npm run build       # production build
npm run start       # serve the production build
```

### What the tests cover

54 tests across four suites, all on the logic that would silently corrupt a
user's record if it broke:

- **`tests/dates.test.ts`** — 30 correct consecutive dates, start/end
  calculation, day-number ↔ date round-tripping, phase boundaries, which days
  trigger a review.
- **`tests/plan-generator.test.ts`** — every shipped category produces a usable
  30-day plan; days stay inside the user's stated time; no thirty identical days;
  difficulty scales the load; obstacle-specific actions appear only when the
  obstacle was named; every action has a smaller minimum version.
- **`tests/calculations.test.ts`** — daily and overall completion, optional
  actions excluded, Minimum Day semantics (reduced plan measured, original
  preserved), day classification, streaks (including "today isn't broken yet"),
  pillar completion.
- **`tests/review.test.ts`** — the adjustment policy, including the rule that a
  hard week never earns a heavier plan.

---

## The plan generator

`PlanInput → GeneratedPlan`, behind an interface:

```ts
export interface PlanGenerator {
  readonly name: string;
  generatePlan(input: PlanInput): Promise<GeneratedPlan>;
}
```

V1 ships `RuleBasedPlanGenerator` — **deterministic, offline, and needing no API
key**. Given a category, a goal, a realistic daily time budget, a difficulty
setting and the obstacles the user named, it produces 30 days of 2–5 actions,
four milestones, and 1–4 pillars.

### Content strategies

Domain knowledge is content, not code. Each file in `lib/plan/strategies/`
declares pillars, milestones and action templates:

```
fitness  health  sleep  study  learning  reading  productivity  career
job-search  business  financial-organization  family  digital-wellness
organization  morning-routine  project  discipline  custom
```

Two template kinds cover everything:

- **`ActionTemplate`** — a recurring action with a cadence (daily, every *n*
  days, weekly), copy that can change per phase, and a minimum version.
- **`SequenceTemplate`** — a track whose content *advances*, spread evenly across
  the 30 days. A job search moves résumé → profile → targets → applications →
  networking → interview prep → follow-ups. A product moves idea → validation →
  customer research → prototype → feedback → improvement → launch.

`custom` is the fallback for any goal that matches nothing, which is what makes
the engine genuinely domain-independent.

### Phases

| Days | Phase | Objective | Effort |
| --- | --- | --- | --- |
| 1–7 | Consistency | Show up. Keep it small enough that you do it. | 0.70 |
| 8–14 | Build | Add structure now the habit exists. | 0.88 |
| 15–21 | Depth | Move from showing up to real progress. | 1.00 |
| 22–30 | Finish | Finish something you can point at. | 1.00 |

### Adaptive difficulty

Weekly reviews feed `decideAdjustment(completionRate, feedback)` in
`lib/challenge/adjustment.ts`. It is pure, deterministic and conservative:

| Completion | Feedback | Result |
| --- | --- | --- |
| < 50% | *any* | **Reduce** — a hard week never earns a heavier plan |
| 50–74% | too difficult | Reduce |
| 50–74% | otherwise | Hold |
| 75–89% | too difficult | Reduce |
| 75–89% | otherwise | Hold |
| ≥ 90% | too easy | **Increase**, by one step |
| ≥ 90% | otherwise | Hold |

Two hard rules: **completed days are never rewritten** (`appliedFromDay` is
always in the future), and every change writes a `PlanAdjustment` row carrying a
plain-language `rationale` that is shown to the user on `/reviews`.

---

## Future AI architecture

Nothing needs to change in the schema when a coach ships.

- Swap the implementation in `lib/plan/index.ts` (`getPlanGenerator()`), selected
  by the `PLAN_GENERATOR` environment variable. A `ClaudePlanGenerator` satisfies
  the same `PlanGenerator` interface; no call site changes.
- A coach's input is a read-only snapshot that already exists: goal, why,
  success definition, completion history, per-action skip counts, reflections,
  difficulty feedback, available time, preferred time, obstacles, Minimum Day
  reasons.
- Its output should be a **`PlanAdjustment`** (`source: AI_COACH`,
  `status: proposed`) — a behaviour change with a reason, not motivational text:

  > "You completed your study sessions but skipped the 30-minute review four
  > times. For the next three days, let's reduce review time to 15 minutes."

- Major changes require explicit user approval. History is never rewritten.
- No paid API is called unless one is explicitly configured.

Notifications are similarly prepared but not implemented: `Challenge` stores
`preferredTime`, and `User` stores `timezone`.

---

## Safety boundaries

SelfMastery serves the general public, so it does not generate medical
diagnoses, medication changes, extreme diets, dangerous exercise programmes,
mental-health treatment, investment instructions or legal strategy.

Sensitive categories keep their actions behavioural and general — *record what
you spent*, *walk 20 minutes*, *note how you slept* — and carry a `safetyNote`
shown during onboarding and on the Plan Ready screen. See `safetyNote` in
`lib/plan/strategies/{health,fitness,sleep,money}.ts`.

### Security

- Every server action re-derives the user from the session (`requireUserId()`).
  Client-supplied ids are only ever used inside a query that *also* filters on
  that user, so one account can never read or mutate another's data.
- All mutations are validated server-side with Zod.
- Passwords are hashed with bcrypt; sessions are JWTs signed with `AUTH_SECRET`.
- `proxy.ts` protects app routes at the edge, and a session whose account no
  longer exists is sent back to sign in rather than rendering an empty shell.
- Sign-up and sign-in are rate limited through Upstash Redis (5 sign-ups/hour
  per IP; 10 sign-in attempts/15 min per IP + email). The limiter fails open on
  a store outage, so it can never take authentication down with it.

---

## Deployment notes

1. Provision PostgreSQL and set `DATABASE_URL` (and `DIRECT_URL` if the
   provider puts the runtime behind a connection pooler).
2. Set `AUTH_SECRET` (`openssl rand -base64 32`). The app refuses to start in
   production without it.
3. `prisma migrate deploy` on release — never `db:migrate` or `db:reset`.
   `vercel.json` already wires this into the build.
4. `npm run build && npm run start`. The build runs `prisma generate` via
   `postinstall`.
5. Do not run the seed in production. It deletes and rebuilds the demo account,
   and refuses to run under `NODE_ENV=production` without `ALLOW_SEED=true`.

Routes are server-rendered on demand because every screen is personal. The only
static routes are `/sign-up`, the 404, and the metadata routes
(`/robots.txt`, `/sitemap.xml`, `/opengraph-image`).

## Hosting it free

The app runs permanently free on **Vercel Hobby + Neon Postgres**, with no
credit card at any step, on a `*.vercel.app` domain (or a free `is-a.dev`
subdomain). Full walkthrough, capacity notes and the things worth fixing before
sharing the link widely: **[DEPLOY.md](DEPLOY.md)**.

---

## Accessibility

Targets WCAG AA: semantic landmarks, real form controls behind every custom
choice (so keyboard and screen-reader behaviour is native), visible focus rings,
44px minimum touch targets, `aria-current` on navigation, `aria-pressed` on
action checkboxes, and status communicated by text and shape as well as colour.
All motion is disabled under `prefers-reduced-motion`.
