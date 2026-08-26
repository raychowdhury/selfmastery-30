# App Review notes

Paste the section below into **App Review Information → Notes** in App Store
Connect. Enter demo credentials in the fields provided — never in this file, and
never in the repository.

---

## Notes for the reviewer

SelfMastery turns one personal goal into a small set of daily actions over 30
days. It requires an account because a person's plan, progress and reflections
are stored on our server and sync across devices.

**A demo account is provided.** It is already on Day 8 of an active 30-day
challenge, so every screen has real data — you should not need to complete
onboarding to review the app. If you would like to see onboarding, sign out and
create a new account with any email address; no verification is required.

### Suggested five-minute walkthrough

1. **Sign in** with the demo account.
2. **Today** — the main screen. Tick an action off; it saves immediately.
3. **"Use Minimum Day"**, below the progress card. This is our core feature: on
   a difficult day the plan shrinks to its smallest version (a 30-minute walk
   becomes 5 minutes) instead of being skipped. Choose "Keep Original Plan" to
   dismiss without changing anything.
4. **Finish Day** — one-tap reflection, then a summary of the day.
5. **Calendar** tab — all 30 days. Tap any day to see or edit it.
6. **Progress** tab — consistency, streaks and observations drawn only from the
   account's own record.
7. **Profile** tab — settings, previous challenges, and account deletion.

### Account deletion (Guideline 5.1.1(v))

**Profile tab → Delete account**, at the bottom of the list. Two taps from the
tab bar, with no need to contact support.

It states exactly what will be removed, requires the password again, then
permanently deletes the account and all associated data — challenges, daily
actions, completion history, reflections and weekly reviews — and clears the
device's stored credentials. There is no "deactivate" alternative; deletion is
real and immediate.

To test it without losing the demo account, please create a throwaway account
first and delete that one.

### Notifications

The app asks for notification permission only from **Profile → Reminders**,
after onboarding, never at launch. All notifications are **local**; there is no
push server and no remote notification capability. Declining changes nothing
else about the app.

### Backend

The app talks to `https://[YOUR-PRODUCTION-DOMAIN]` over HTTPS. It must be
reachable for the app to function. It is running and monitored for the review
period. There is no region restriction and no VPN requirement.

### Content and safety

The app produces general behavioural prompts only. For health, fitness, sleep
and money goals it shows an explicit note during setup stating that SelfMastery
is not a medical, therapeutic or financial service, and its suggestions stay
behavioural — "Walk for 20 minutes", "Record what you spent today". It gives no
medical, dietary, therapeutic, investment or legal advice, and makes no
guarantees about outcomes.

### Not in this version

No in-app purchases, no subscriptions, no advertising, no third-party analytics
or tracking SDKs, and no third-party login. The app therefore shows no App
Tracking Transparency prompt, and Sign in with Apple is not required because no
qualifying third-party login is offered.

### Anything else

If any screen fails to load, it is almost certainly network reachability to our
backend. Please contact us at the review email and we will respond same-day.

---

## Demo account fields (enter in App Store Connect, not here)

```
Sign-in required:  Yes
Username:          [ADD IN APP STORE CONNECT]
Password:          [ADD IN APP STORE CONNECT]
```

## Preparing the demo account

Create it against production and leave it in a state where every screen has
something to show:

- An **active challenge around Day 8** — far enough in for stats to be real
- Roughly **6 of 7 days completed** in week one, including:
  - at least one **perfect day**
  - one **partial day**
  - one **missed day** — so the calendar's gentle handling of a gap is visible
  - one **Minimum Day**
- **Week 1 review already completed**, so the Reviews screen shows a real
  adjustment with its reasoning
- A **finished challenge in history**, so Previous Challenges is not empty
- Today left **partly complete**, so the reviewer can tick something off

Do not enable notifications on the demo account; leaving them off lets the
reviewer see the permission request in its proper place.
