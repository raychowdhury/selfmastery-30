# SelfMastery 30 — Product Specification (v2, General-Purpose)

> **Change from v1:** the product is no longer shaped around developers or technical
> professionals. The "AI/Backend Engineering" 30-day plan from v1 is demoted to **one seeded
> demo template among many**. The core product is domain-independent: any adult, any goal.

---

## 1. Product Philosophy

SelfMastery 30 answers one question:

> **What is one meaningful thing I want to improve over the next 30 days, and what should I do today to move toward it?**

It turns a broad, vague goal into small, realistic daily actions.

**The loop:**

```
Goal → Plan → Daily Action → Consistency → Reflection → Adjustment → Progress
```

**Non-negotiables**

- One primary 30-day goal per challenge. The UI actively discourages more.
- No goal-stacking, no "track 12 habits" dashboard.
- Every screen exists to make today's action easier to take.

---

## 2. Pillars Replace Fixed Categories

v1 hardcoded `Career / Exercise / Mind / Admin`. **Remove entirely.**

A **Pillar** is a user- or template-defined area that contributes to the goal. Pillars are rows
in a table, not enum values, not columns.

**Pillar library (suggestions, not a closed set):**

Health · Fitness · Weight management · Career · Education · Business · Finance ·
Relationships · Family · Parenting · Mental wellness · Focus · Productivity ·
Organization · Reading · Creativity · Spirituality · Sleep · Digital wellness ·
Home · Personal development · **Custom**

**Rules**

- A challenge holds **1–4 pillars**. Hard cap at 4.
- 1 pillar is valid and common ("Read every day").
- Users are never forced to track a pillar irrelevant to their goal.
- Pillars carry a name, icon, and sort order — nothing behavioral. No pillar-specific logic
  anywhere in the codebase. If a `switch (pillar.name)` appears, the design has failed.

---

## 3. The Product Must Fit These Users Equally

These are acceptance scenarios, not marketing copy. Each must be expressible with zero schema
changes.

| User | Goal | Pillars | Sample daily actions |
|---|---|---|---|
| **Student** | Improve my grades | Education, Focus | Study 60 min · Review yesterday's material · Complete assignments · 20 min phone-free · Prepare tomorrow's study plan |
| **Office worker** | Become more productive | Productivity, Focus | Identify top 3 priorities · One deep-work block · Cut one distraction/meeting · Clear important admin · End-of-day review |
| **Parent** | Better quality time with family | Family, Digital wellness | 30 min device-free family time · Ask child/spouse about their day · One household responsibility · Plan one family activity |
| **Fitness beginner** | Become physically active | Fitness, Health | Walk 20 min · Drink enough water · Beginner exercise · Break up long sitting |
| **Financial organizer** | Take control of my money | Finance, Organization | Record spending · Review one category · Skip one unnecessary purchase · Review upcoming bills · Weekly budget check |
| **Reader** | Build a reading habit | Reading | Read 10 pages · Write one takeaway · No phone while reading |
| **Entrepreneur** | Launch my first product | Business, Productivity | Progresses: Idea → Validation → Customer research → Prototype → Feedback → Improvement → Launch |
| **Job seeker** | Find a better job | Career | Progresses: Resume → LinkedIn → Portfolio → Target companies → Applications → Networking → Interview prep → Follow-ups |

**Constraints**

- Fitness content stays general movement guidance. No prescriptive training programs, no
  medical advice.
- Finance content stays organizational (record, review, plan). Never advisory.

**Demo data only:** the v1 "AI/Backend Engineering" plan ships as a seeded template
(`learn-a-skill` variant) used for screenshots and dev fixtures. It has no privileged status.

---

## 4. Onboarding — Conversational, Not a Form

One question per screen. Plain language. Progress dots, no "Step 3 of 7 — Section B".
Conditional: later questions adapt to the answer to Q1. **Never ask the same seven questions
for every goal.**

**Q1 — What would make the next 30 days meaningful for you?**
Category chips + free text. Free text is first-class, not a fallback.
Examples: "I want to get healthier." · "I want to become more disciplined." · "I want to find a
job." · "I want to study consistently." · "I want to save money." · "I want to finish a
project." · "I want to spend more time with my family."

**Q2 — Why does this matter to you?**
Optional free text. **Stored and resurfaced later** when completion drops or the user opens
Life Happens. This is the single highest-leverage field in onboarding.

**Q3 — Where are you today?**
Conditional on Q1's inferred domain. Examples:
- Fitness → "How active are you right now?" (Rarely / Occasionally / A few times a week)
- Study → "How many days a week do you study now?"
- Job search → "Where are you in the process?" (Not started / Resume ready / Applying / Interviewing)
- Finance → "Do you currently track your spending?" (No / Sometimes / Yes)
- Custom/unknown → open text: "Describe where you're starting from."

**Q4 — How much time can you realistically give this each day?**
10 min · 20 min · 30 min · 1 hour · 2 hours · Custom.
Copy emphasizes *realistically*: "Pick the amount you could still manage on a bad day."
This value hard-caps generated `estimatedMinutes` totals per day.

**Q5 — What usually gets in your way?** (multi-select)
Procrastination · Phone · Social media · Lack of time · Lack of motivation · Forgetting ·
Poor planning · Too many goals · Stress · Inconsistent schedule · Other.
Feeds plan generation (e.g. "Phone" → seed a digital-wellness action; "Forgetting" → push
reminder default on).

**Q6 — When are you most likely to work on this?**
Morning · Afternoon · Evening · Flexible. Sets reminder time and "Top Priority" phrasing.

**Q7 — How challenging should your plan feel?**
Gentle · **Balanced** (default) · Challenging.

Output of onboarding → a draft challenge the user reviews and edits before starting.

---

## 5. Universal Plan Engine

```
Goal
 ↓
Pillars            (1–4, arbitrary)
 ↓
Milestones         (Day 7 / 14 / 21 / 30)
 ↓
Weekly Targets
 ↓
Daily Actions      (generic, pillar-tagged)
 ↓
Completion
 ↓
Reflection
 ↓
Adjustment         (feeds back into future days only)
```

The engine is a **template + parameters + generator** pipeline. It knows nothing about
domains; domain knowledge lives in template content and (later) the AI coach.

Generator inputs: goal text, starting point, daily minutes, obstacles, preferred time,
intensity, chosen template (optional).
Generator output: 30 `ChallengeDay` rows, each with 2–5 `DailyAction` rows, plus milestones
and one `minimumDayAction` per pillar or per challenge.

**Hard rules**

- Sum of `estimatedMinutes` for required actions on any day ≤ the user's stated daily minutes.
- 2–5 actions per day. Below 2 feels empty; above 5 reads as a to-do list.
- Actions may be `optional: true` — these don't count against completion percentage.
- Regeneration only ever writes to days `> today`. Completed history is immutable.

---

## 6. Challenge Structure

Every challenge holds:

- **Goal** — what am I trying to accomplish?
- **Why** — why does this matter? (from Q2)
- **Success Definition** — "What would make Day 30 successful?" One sentence, user-written or
  template-suggested, editable.
- **Pillars** — 1–4 contributing areas.
- **Milestones** — Day 7, 14, 21, 30. Short, checkable, not vague.
- **Daily Actions** — small steps toward the current milestone.
- **Minimum Day** — the fallback version of the day (see §9).

Milestone example (Job seeker):
Day 7 "Resume and LinkedIn updated" · Day 14 "20 target companies listed, 5 applications sent" ·
Day 21 "15 applications, 3 networking conversations" · Day 30 "30 applications, interview prep done".

---

## 7. Data Model

Generic task model. **No career/exercise/mind/admin fields anywhere.**

```ts
User {
  id
  displayName
  timezone
  createdAt
}

Challenge {
  id
  userId
  title              // short label, e.g. "Get physically active"
  goal               // free text, user's words
  why                // nullable — resurfaced when motivation drops
  successDefinition  // "What would make Day 30 successful?"
  startDate
  lengthDays         // default 30, not hardcoded
  status             // draft | active | completed | paused | abandoned
  dailyMinutesTarget
  preferredTime      // morning | afternoon | evening | flexible
  intensity          // gentle | balanced | challenging
  templateId         // nullable
  createdAt
  updatedAt
}

Pillar {
  id
  challengeId
  name
  icon
  sortOrder
}

Milestone {
  id
  challengeId
  dayNumber          // 7 | 14 | 21 | 30 (arbitrary integers allowed)
  title
  description
  achieved           // nullable boolean, user-marked
}

ChallengeDay {
  id
  challengeId
  dayNumber          // 1..lengthDays
  date
  status             // pending | completed | partial | minimum | skipped
  topPriority        // one sentence: the single action that matters most today
  difficultyFeedback // easy | good | difficult | null
  reflectionNote     // nullable, short
  isMinimumDay       // true when user invoked Life Happens
  lifeHappensReason  // travel | illness | family | work | unexpected | other | null
}

DailyAction {
  id
  challengeDayId
  pillarId           // nullable — an action need not belong to a pillar
  title
  description
  estimatedMinutes
  completed
  completedAt
  optional           // optional actions excluded from completion %
  sortOrder
}

MinimumDayAction {
  id
  challengeId
  pillarId           // nullable
  title              // "Walk 5 minutes"
  estimatedMinutes
}

WeeklyReview {
  id
  challengeId
  weekNumber         // 1..4 (+ partial)
  completionRate
  difficultyTrend    // too_easy | about_right | too_difficult
  skippedActionTitles  // json[]
  userCause          // free text: what made it hard
  adjustmentSummary  // human-readable description of what changed
  approvedByUser
  createdAt
}

PlanAdjustment {
  id
  challengeId
  source             // weekly_review | difficulty_check | ai_coach | user_edit
  rationale          // why this change is proposed — always shown to the user
  diff               // json: actions added/removed/modified, days affected
  appliedFromDay     // never <= today
  status             // proposed | approved | rejected | auto_applied
  createdAt
}

Template {
  id
  slug
  name
  description
  suggestedPillars   // json[]
  structure          // json: milestone + daily action blueprint, parameterized
  isDemo             // true for seeded demo data (e.g. the AI/backend engineering plan)
}

Reflection {                 // weekly deep reflection, distinct from daily one-tap
  id
  challengeId
  weekNumber
  prompts            // json[]
  answers            // json[]
  createdAt
}
```

**Architectural test:** adding a brand-new challenge type ("Learn piano", "Quit smoking",
"Renovate the garage") must require **zero migrations** — only a new `Template` row.

---

## 8. Daily Dashboard

The primary screen. Ruthlessly simple. No analytics here.

```
DAY 9 OF 30

Your Goal
Become more physically active

Today's Progress
2 / 4 completed

TODAY

☐  Walk for 25 minutes
☑  Drink water with each meal
☑  Take a 10-minute movement break
☐  Prepare tomorrow's walking time


TOP PRIORITY

Walk after dinner.


HOW WAS TODAY?

  Easy      Good      Difficult


Reflection
What helped you today?              (optional, one line)
```

**Rules**

- Checkboxes are the largest tap targets on screen.
- No streak counter, no charts, no percentages beyond `2 / 4`.
- "Top Priority" is one sentence. If everything else fails, do this.
- Reflection row is optional and collapsible; never blocks completing the day.
- A secondary link opens Progress (§15) and Life Happens (§11). Both are one tap away, neither
  is on the main screen.

---

## 9. Minimum Day

Every challenge defines a very small fallback version of itself.

| Normal | Minimum Day |
|---|---|
| Walk 30 minutes | Walk 5 minutes |
| Study 60 minutes | Study 10 minutes |
| Read 20 pages | Read 2 pages |
| Work on business 2 hours | One meaningful 15-minute task |
| 30 min device-free family time | One real conversation |

**Philosophy: reduce the requirement, not the commitment.**

- Generated automatically at plan creation; editable by the user.
- A Minimum Day counts as an **active day** for consistency, tracked separately in stats.
- Completing a Minimum Day is a success state in the UI, not a consolation prize.
- Available on any day, one tap, no justification required.

---

## 10. Adaptive Difficulty

Every ~3 days (and at each weekly review) ask:

> **How does your plan feel?**
> Too easy · About right · Too difficult

Response drives the generator for **future days only**:

| Feedback | Adjustment |
|---|---|
| Too difficult | Reduce duration and/or drop to fewer required actions; convert one action to `optional` |
| About right | Continue planned progression |
| Too easy | Increase duration or add one action — gradually, one step at a time |

**Hard constraints**

- Never modify a completed or past `ChallengeDay`.
- Never increase load more than one step per review cycle.
- Every adjustment writes a `PlanAdjustment` row with a plain-language `rationale`.
- Large changes (>30% of remaining actions, or removing a pillar) require user approval.

---

## 11. Life Happens

When today can't happen as planned — travel, illness, family responsibilities, work emergency,
unexpected event — the user picks a reason and gets one option:

> **Use Minimum Day**

Not "skip", not "fail", not "reset streak".

- Reason is stored (`lifeHappensReason`) and feeds weekly review analysis.
- If the same reason appears repeatedly, the weekly review surfaces it:
  "Work emergencies came up 3 times. Want to move your session to the morning?"
- No punitive messaging. No streak-loss animation. Ever.

---

## 12. Progress Without Perfection — Tone

**Banned copy:** "You failed." · "You broke your streak." · "You lost." · "Streak lost!" ·
guilt framing of any kind.

**Preferred copy:**
- "Yesterday didn't go as planned."
- "Continue today."
- "One difficult day doesn't erase your progress."
- "You've been active 9 of the last 12 days."

Tone target: a calm, competent friend. Supportive, never childish, never a hype coach. No
exclamation-mark inflation, no confetti as the primary reward.

---

## 13. Smart Reflection

Daily journaling is friction. Default to one tap.

**Daily (required-ish, one tap):**
> How did today feel? — Easy / Good / Difficult

**Daily (optional, one line):**
> What helped, or what got in your way?

**Weekly (once per 7 days, 3–4 questions):**
- What worked this week?
- What consistently got in the way?
- Which action felt most valuable?
- What do you want to change for next week?

Weekly answers feed §14 and, later, the AI coach.

---

## 14. Weekly Adjustment

Every 7 days, run:

1. **Calculate completion** — required actions completed / required actions scheduled.
2. **Review difficulty** — aggregate `difficultyFeedback` for the week.
3. **Identify frequently skipped actions** — same action title skipped ≥ 3 times.
4. **Ask the user what caused the difficulty** — free text, optional.
5. **Adjust next week** — write a `PlanAdjustment` with rationale, surface for approval.

**Adjustment policy (explicit, not vibes):**

| Completion | Difficulty feedback | Action |
|---|---|---|
| < 50% | any | **Reduce** workload. Never increase. Do not congratulate; do not scold. |
| 50–74% | too difficult | Reduce duration of the longest action |
| 50–74% | about right | Hold steady; swap out the most-skipped action |
| 75–89% | about right | Continue planned progression |
| ≥ 90% | too easy | Increase slightly (one step) |
| ≥ 90% | about right / difficult | Hold steady — high completion at the right difficulty is the target state |

Worked examples:
- Week 1, 45% completion → **reduce** workload, even though the naive move is to push harder.
- Week 1, 90% + "too easy" → increase difficulty one step.

---

## 15. Progress Dashboard

Separate screen. Understandable numbers only.

```
Day                 12 / 30
Overall             68%
Consistency         9 active days
Completed Actions   31
Minimum Days        2
Best Pillar         Reading
Needs Attention     Exercise
```

Plus **one** simple chart: daily completion over time (bar or dot per day, minimum days shown
in a distinct, non-negative style).

**Definitions**

- *Overall* — completed required actions / scheduled required actions to date.
- *Consistency* — days with ≥1 completed action, including Minimum Days.
- *Best Pillar* / *Needs Attention* — highest and lowest completion rate by pillar; only shown
  when the challenge has ≥2 pillars.

No heatmaps-as-guilt, no "days lost", no comparison to other users, no leaderboards.

---

## 16. Personalized Encouragement

Evidence-based, drawn from actual rows in the database.

**Not:** "You're amazing!" · "Keep crushing it!"

**Yes:**
- "You completed your plan 5 of the last 7 days."
- "You've studied for 240 minutes this week."
- "You've completed 18 walking sessions."
- "You've read 126 pages."
- "You showed up on 3 days you almost didn't." *(minimum days used)*

When completion drops for 3+ days, surface the user's own **Why** from Q2 verbatim, unedited,
with no added commentary beyond: "You wrote this on Day 1."

---

## 17. Templates

Starting structures, fully editable after selection.

Build Discipline · Start Exercising · Study Consistently · Read Every Day ·
Reduce Phone Usage · Organize My Life · Improve My Finances · Job Search ·
Learn a Skill · Finish a Project · Build a Business · Improve Sleep Routine ·
Spend More Time With Family · **Custom Goal**

Each template supplies: suggested pillars, 4 milestones, a daily action blueprint parameterized
by available minutes and intensity, and default minimum-day actions.

Templates are data (`Template.structure` JSON). Adding one is a content task, not an
engineering task.

*(Demo/seed only: an "AI & Backend Engineering" variant of `Learn a Skill`, flagged
`isDemo: true`, used for fixtures and screenshots. Not surfaced above other templates.)*

---

## 18. Future AI Coach — Architecture Now, Feature Later

Nothing in the schema should have to change when the coach ships. Its input is a read-only
snapshot:

```
{
  goal, why, successDefinition,
  pillars,
  milestones + achievement state,
  completion history per day,
  per-action completion/skip counts,
  reflections (daily + weekly),
  difficulty feedback series,
  dailyMinutesTarget, preferredTime, intensity,
  obstacles (Q5),
  lifeHappens reasons and frequency
}
```

Its output is **a proposed plan adjustment**, not motivational text:

> "You completed your study sessions but repeatedly skipped the 30-minute review task. For the
> next three days, let's reduce review time to 15 minutes."

**Rules**

- Every recommendation carries a **why**, grounded in the user's own data.
- Output is a `PlanAdjustment` (`source: ai_coach`, `status: proposed`).
- Major changes require explicit user approval. Minor tweaks may auto-apply with an undo and a
  visible note.
- Never rewrites history.
- Subject to §19 safety boundaries; sensitive-domain output goes through a stricter template.

---

## 19. Safety Boundaries

General-public product. The system must **not** independently generate:

- Medical diagnoses or symptom interpretation
- Medication changes
- Extreme or restrictive diets, calorie targets, weight-loss prescriptions
- Dangerous or high-intensity exercise programming
- Mental-health treatment or therapeutic intervention
- Investment instructions or specific financial products
- Debt or legal strategy presented as professional advice

**For sensitive goals:**

- Keep actions general and behavioral ("record what you spent", "walk 20 minutes", "note how
  you slept"), never clinical or prescriptive.
- Surface a short, non-alarming note encouraging appropriate professional support where
  relevant, once — not on every screen.
- If a user's free text indicates crisis or self-harm risk, show local support resources and
  stop plan generation for that input. This path is hardcoded, not model-generated.
- Both the template content and the AI coach pass through the same guardrail layer. Safety is
  not implemented twice.

---

## 20. Differentiation

| Traditional habit tracker | SelfMastery 30 |
|---|---|
| "What habits do you want to track?" | "Who do you want to become, or what do you want to accomplish?" |
| User designs the system | System proposes today's actions |
| Streak as the product | Progress toward a defined Day 30 |
| Punishes gaps | Absorbs gaps via Minimum Day |
| Static | Adjusts weekly from real behavior |

The combination is the product: **goal planning + habit formation + adaptive daily actions +
reflection + accountability.**

---

## 21. Core Product Principle

Before adding any feature, ask:

> **Does this make it easier for the user to take the right action today?**

If not, reconsider it. The main screen must never become a project-management dashboard.

**Target experience:**

```
Open app → understand today's actions in under 5 seconds → act → check it off → close app
```

Architecture, navigation, and copy all serve that sequence.

---

## Appendix A — Screen Inventory (MVP)

1. **Onboarding** — 7 conditional questions + draft plan review
2. **Template picker** — optional entry point before onboarding
3. **Today** — the daily dashboard (§8) — the app's home
4. **Day detail / edit** — adjust today's actions inline
5. **Life Happens** — reason + Use Minimum Day (§11)
6. **Difficulty check** — 3-option prompt, interstitial, ~every 3 days
7. **Weekly review** — completion, skipped actions, cause, proposed adjustment approval
8. **Progress** — metrics + one chart (§15)
9. **Challenge settings** — goal, why, success definition, pillars, minimum day, reminder time
10. **Day 30 summary** — what changed, what to do next (repeat / evolve / new goal)

## Appendix B — Explicitly Out of Scope for MVP

Social feeds · friends and comparison · leaderboards · multi-challenge concurrency ·
gamified points and badges · long-form journaling · wearable/health integrations ·
notifications beyond one daily reminder + weekly review.

Each of these fails the §21 test at MVP stage.
