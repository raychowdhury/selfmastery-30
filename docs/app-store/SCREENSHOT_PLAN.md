# Screenshot plan

## Required sizes

App Store Connect currently accepts one 6.9" set for iPhone; older sizes are
generated from it. Confirm in App Store Connect before exporting.

| Display | Device to capture on | Portrait pixels |
| --- | --- | --- |
| 6.9" | iPhone 17 Pro Max | 1320 × 2868 |
| 6.5" (if requested) | iPhone 11 Pro Max | 1242 × 2688 |
| 13" iPad (only if listing iPad) | iPad Pro 13" | 2064 × 2752 |

Six screenshots. The first two carry almost all the weight — most people never
swipe past them.

## The set

| # | Headline | Screen | What must be visible |
| --- | --- | --- | --- |
| 1 | One meaningful goal. | Onboarding, goal category | The grid of areas, with one selected. Shows breadth without a wall of text. |
| 2 | Know what to do today. | Today | Day 8 of 30, two or three real actions, one ticked, the progress card. |
| 3 | Progress without perfection. | Minimum Day sheet | The original → minimum comparison. The differentiator; do not cut it. |
| 4 | See your consistency grow. | Progress | The big percentage, four metrics, the 30-day chart. |
| 5 | Reflect. Adjust. Improve. | Weekly review | The difficulty question and the line about nothing completed being changed. |
| 6 | See what changed in 30 days. | Day 30 | Real final numbers and the original goal. |

## Already captured

Six frames are in `docs/app-store/screenshots/`, all 1320×2868 from an iPhone 17
Pro Max simulator with the status bar normalised, all showing real app output:

`01-welcome` · `02-today` · `03-minimum-day` · `04-progress` · `05-calendar` ·
`06-day30`

Re-capture with the steps below if the UI changes. Framing artwork with the
headlines from `SCREENSHOT_COPY.md` is optional and still manual.

## Capturing

Use a **dedicated screenshot account**, not the App Review demo account, so its
data can be shaped for the frame and never changes underneath you.

Seed it to look like this:

- **Day 8 of 30**, goal "Become more physically active"
- Week one at roughly 80% — a perfect day, a partial day, one missed, one Minimum Day
- Today: three actions, the first already complete
- Week 1 review completed so the adjustment is real
- One finished challenge in history

```bash
# From the repository root, against a development database
npm run db:seed
```

The seeded demo account already matches this shape closely.

### Steps

1. Boot **iPhone 17 Pro Max**, iOS 18 or later.
2. Set the status bar so every frame is identical:
   ```bash
   xcrun simctl status_bar booted override \
     --time "9:41" --batteryState charged --batteryLevel 100 \
     --cellularMode active --wifiBars 3
   ```
3. Capture: `xcrun simctl io booted screenshot ~/Desktop/01-goal.png`
4. Repeat for each frame in **both light and dark** — pick one appearance for
   the whole set. Dark shows the brand colour better; light reads more calmly.
   Do not mix.

## Presentation

Frame each screenshot with its headline above the device image on a plain
background using the app's own colours. No shadows, no gradients, no floating
UI fragments, no fake data that the app cannot actually produce.

Every value shown must be something the app really renders. Fabricated numbers
in screenshots are a metadata rejection.

## Accessibility

Headline text is part of the image and is not read by VoiceOver. Keep the app's
own screen content legible in the frame rather than shrinking it to make room
for marketing copy.
