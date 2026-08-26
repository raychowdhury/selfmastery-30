# iOS architecture

Native SwiftUI. No web view, no cross-platform runtime, no third-party packages.

## Shape

```
ios/
├── project.yml                 XcodeGen spec — the .xcodeproj is generated
└── SelfMastery/
    ├── App/                    entry point, app state, root + tab navigation
    ├── Core/
    │   ├── Networking/         APIClient, endpoints, errors, configuration
    │   ├── Authentication/     Keychain, TokenStore
    │   ├── Models/             Codable wire types
    │   ├── DesignSystem/       tokens and shared modifiers
    │   ├── Notifications/      schedule planning + scheduling
    │   └── Utilities/          CalendarDay, haptics
    ├── Features/               one folder per screen area
    ├── Components/             shared views
    └── Resources/              Info.plist, assets, PrivacyInfo.xcprivacy
```

The `.xcodeproj` is **not committed**. Run `xcodegen generate` in `ios/` after
pulling. That keeps build settings reviewable in a diff instead of buried in a
pbxproj, and makes the API base URL per-configuration rather than hardcoded.

## The backend stays authoritative

The device renders and collects. It never decides.

| Concern | Where it lives | Why |
| --- | --- | --- |
| Plan generation | Server | One engine, shared with web. A phone that could generate plans would drift from it. |
| Adaptive difficulty | Server | The rules must be identical everywhere, and a client could otherwise talk the plan into being easier. |
| Completion maths | Server | The app computes optimistically for instant feedback, then takes the server's number. |
| Action copy | Server | Titles are `{m}` templates rendered against current minutes. The app never sees a template. |
| Onboarding content | Server | Categories, goal examples and safety notes are fetched, so new strategies ship without an App Store release. |
| Authorization | Server | Every query is scoped by the authenticated user; an id from the client is never trusted. |

## App state

One enum, not a set of booleans:

```swift
enum AppState { case launching, unauthenticated, onboarding, ready }
```

This is what prevents the launch flash. With separate flags there is a frame
where "signed in" is true but "has a challenge" has not been answered, and the
UI shows the wrong screen for an instant. With one value there is no such frame.

Launch restores the Keychain token, calls `/me`, and moves straight to the right
state. If that call fails while a token exists, the app opens anyway and each
screen shows its own state — a dropped connection should not look like being
signed out.

## Concurrency

Swift 6 language mode with complete strict concurrency.

- Wire types are value types, so `Sendable` comes for free.
- `TokenStore` is an `actor`: the API client reads the token from arbitrary
  tasks while sign-in and sign-out write it, and a race there would mean
  sending the wrong person's credentials.
- Feature models and `AppEnvironment` are `@MainActor @Observable`.
- `APIClient` is a `Sendable` final class holding only immutable state.

## Networking

Views never perform I/O. A view asks its model; the model calls
`SelfMasteryAPI`; that builds an `Endpoint` and hands it to `APIClient`.

Every error becomes an `APIError` with a message written for a person. A 401 —
and only a 401 — clears the session and returns to sign-in. Decoding failures
never surface internals.

## Optimistic completion

Ticking an action off flips the row immediately, recomputes the day's completion
the same way the server does, sends the request, then reloads so the server's
number is what ends up on screen. A failure puts the row back and shows why.

This is deliberate: the checkbox is the most-used control in the product, and
making it wait on a round trip makes the whole app feel broken on a train.

## Testing

`SelfMasteryTests` covers what would silently corrupt what someone sees:
calendar-day handling across timezones, API decoding including unknown enum
cases, error mapping, and the notification schedule — including a test that
reminder copy never mentions streaks, because that is a product rule, not a
matter of taste.
