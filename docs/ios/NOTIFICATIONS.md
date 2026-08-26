# Notifications

Local notifications only. No remote push, no device tokens, no push server.

Everything the app would nudge about — which day it is, what is left, whether a
review is due — is already known on the device. Remote push would mean holding a
token for every user and running infrastructure to send from, for no benefit in
V1. The `Reminder` type and the scheduler are the only things that would need to
change if that ever stops being true.

## Permission

Never requested at launch. It is asked for from **Profile → Reminders**, after
onboarding, once there is a plan and the reminder has an obvious point.

Declining is a normal outcome: the toggles are replaced by a single "Turn on
reminders" button, and nothing else in the app changes.

## What can be scheduled

| Reminder | When | Copy |
| --- | --- | --- |
| Morning | 08:00 daily | "Your Day N plan is ready." |
| Goal time | The person's preferred time | "A few minutes now is all today asks for." |
| Evening | 20:30 daily | "Take a minute to close out today." |
| Weekly review | Sunday 18:00 | "Two minutes of looking back shapes next week." |

Preferred time maps to 09:00 / 14:00 / 19:00. **Flexible schedules nothing** —
there is no fixed time to nudge, so the app does not invent one.

## Copy rules

Grounded and calm. This is a product rule, not a style preference, and it is
enforced by a test that fails if reminder text contains "streak", "don't break",
"failed" or "!!".

Good: "One action left for today." · "Take one minute to close out Day 8."
Never: "DON'T BREAK YOUR STREAK!"

## Design

Scheduling is split in two so the rules are testable without a device:

- `NotificationPlan.build(...)` — pure. Preferences in, `[PlannedNotification]`
  out. This is what the tests exercise.
- `NotificationScheduler.apply(...)` — the side effect. Cancels everything and
  re-adds, which is cheaper to reason about than diffing for four requests.

Preferences live in `UserDefaults` — they are a local device choice, not account
data, and that is the only required-reason API the app uses.

## Signing out

`AppEnvironment.signOut()` and `didDeleteAccount()` both cancel every pending
notification. A reminder arriving after someone deletes their account would be
a small betrayal.
