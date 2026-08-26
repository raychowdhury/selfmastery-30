#!/usr/bin/env node
/**
 * Creates the App Review demo account in the state REVIEW_NOTES.md describes.
 *
 * Works entirely through the public mobile API, so it needs no database access
 * and can be pointed at production from anywhere:
 *
 *   API_BASE=https://your-domain \
 *   DEMO_EMAIL=review@yourdomain.com \
 *   DEMO_PASSWORD='...' \
 *   node scripts/create-demo-account.mjs
 *
 * Leaves the account on Day 8 of 30 with:
 *   - a perfect day, a partial day, a missed day and a Minimum Day in week one
 *   - week 1 reviewed, so the Reviews screen shows a real adjustment
 *   - today partly complete, so the reviewer can tick something off
 *
 * Re-running against an existing email fails rather than silently doing nothing.
 * Delete the account in the app first, or use a different address.
 */

const API_BASE = process.env.API_BASE ?? "http://localhost:3000";
const EMAIL = process.env.DEMO_EMAIL;
const PASSWORD = process.env.DEMO_PASSWORD;
const NAME = process.env.DEMO_NAME ?? "Review Demo";
/** How many days ago the challenge started. 7 puts the account on Day 8. */
const START_OFFSET = Number(process.env.DEMO_START_OFFSET ?? 7);

if (!EMAIL || !PASSWORD) {
  console.error(
    "DEMO_EMAIL and DEMO_PASSWORD are required.\n" +
      "Never commit them — pass them in the environment, and enter the same\n" +
      "values in App Store Connect."
  );
  process.exit(1);
}

const root = `${API_BASE.replace(/\/$/, "")}/api/mobile/v1`;
let token = null;

async function call(path, { method = "GET", body } = {}) {
  const response = await fetch(`${root}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const parsed = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = parsed?.error?.message ?? response.statusText;
    throw new Error(`${method} ${path} → ${response.status}: ${message}`);
  }
  return parsed;
}

/** yyyy-MM-dd, `offset` days from today, in UTC to match the server. */
function calendarDay(offset) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

/**
 * How week one should look. Deliberately imperfect: a reviewer should see the
 * states the UI has to handle, including a gap.
 */
const WEEK_ONE = [
  { ratio: 1, feeling: "GOOD", note: "Easier than I expected once I was out of the door." },
  { ratio: 1, feeling: "GOOD" },
  { ratio: 0.5, feeling: "DIFFICULT", note: "Work ran late. Got the walk in, nothing else." },
  { ratio: 1, feeling: "EASY" },
  { ratio: 0 }, // a missed day — the calendar must handle it gently
  { ratio: 1, minimum: true, feeling: "DIFFICULT", note: "Travelling. Five minutes still counted." },
  { ratio: 1, feeling: "GOOD", note: "First week done. The walk is becoming automatic." },
];

async function main() {
  console.log(`Creating demo account against ${API_BASE}`);

  const auth = await call("/auth/sign-up", {
    method: "POST",
    body: { name: NAME, email: EMAIL, password: PASSWORD },
  });
  token = auth.token;
  console.log("  ✓ account created");

  await call("/challenges", {
    method: "POST",
    body: {
      category: "fitness",
      goal: "Become more physically active",
      whyItMatters: "I want more energy and to feel better about myself.",
      successDefinition: "I can consistently walk 30 minutes, five days a week.",
      availableMinutes: 30,
      obstacles: ["motivation", "phone"],
      preferredTime: "MORNING",
      difficulty: "BALANCED",
      // Backdated so the account sits on Day 8.
      startDate: calendarDay(-START_OFFSET),
    },
  });
  console.log(`  ✓ challenge created, starting ${START_OFFSET} days ago`);

  for (const [index, script] of WEEK_ONE.entries()) {
    const dayNumber = index + 1;
    const day = await call(`/days?dayNumber=${dayNumber}`);

    if (script.minimum) {
      await call(`/days/${day.id}/minimum`, {
        method: "PUT",
        body: { isMinimumDay: true },
      });
    }

    // Re-read: switching to a Minimum Day changes which actions apply.
    const current = script.minimum ? await call(`/days?dayNumber=${dayNumber}`) : day;
    const required = current.actions.filter((action) => !action.optional);
    const target = Math.round(required.length * script.ratio);

    for (const action of required.slice(0, target)) {
      await call(`/actions/${action.id}`, {
        method: "PATCH",
        body: { completed: true },
      });
    }

    if (script.feeling || script.note) {
      await call(`/days/${current.id}/reflection`, {
        method: "PUT",
        body: { dayFeeling: script.feeling ?? null, note: script.note ?? null },
      });
    }

    if (script.ratio > 0) {
      await call(`/days/${current.id}/finish`, { method: "POST" });
    }

    process.stdout.write(`  ✓ day ${dayNumber}\r`);
  }
  console.log("  ✓ week one filled            ");

  await call("/reviews/1", {
    method: "PUT",
    body: {
      wentWell: "I walked on five of seven days, and the short ones were easiest to start.",
      struggledWith: "Evenings. By 9pm I had usually talked myself out of it.",
      mainObstacle: ["Time", "Motivation"],
      difficultyFeedback: "ABOUT_RIGHT",
      nextWeekChange: "Move the walk to the morning.",
    },
  });
  console.log("  ✓ week 1 reviewed");

  // Leave today partly done so the reviewer has something to tick off.
  const today = await call("/today");
  const first = today.day.actions.find((action) => !action.optional);
  if (first) {
    await call(`/actions/${first.id}`, {
      method: "PATCH",
      body: { completed: true },
    });
  }
  console.log("  ✓ today left partly complete");

  const progress = await call("/progress");
  console.log("\nDemo account ready.");
  console.log(`  Day ${today.dayNumber} of ${today.challenge.lengthDays}`);
  console.log(`  ${progress.stats.overallCompletion}% overall consistency`);
  console.log(`  ${progress.stats.activeDays} active days, ${progress.stats.minimumDays} Minimum Day`);
  console.log("\nEnter these credentials in App Store Connect — not in the repository.");
}

main().catch((error) => {
  console.error(`\nFailed: ${error.message}`);
  process.exit(1);
});
