# App Privacy answers

For the **App Privacy** section of App Store Connect. Derived from an audit of
the code and the backend schema, not from intention. It matches
`ios/SelfMastery/Resources/PrivacyInfo.xcprivacy`.

Re-check this against the Xcode privacy report generated from the archive before
each submission.

## Summary

- **Data used to track you:** none.
- **Data linked to you:** email address, name, user content.
- **Data not linked to you:** none.
- **Third-party SDKs:** none. The app has zero package dependencies.

## Per data type

### Contact info → Email address — COLLECTED

| Question | Answer |
| --- | --- |
| Linked to identity | Yes — it is the account identifier |
| Used for tracking | No |
| Purposes | App Functionality |

Used to sign in and to send a password reset. Not used for marketing; there is
no mailing list.

### Contact info → Name — COLLECTED

| Question | Answer |
| --- | --- |
| Linked to identity | Yes |
| Used for tracking | No |
| Purposes | App Functionality |

The display name the person chooses. Optional in practice — it is only shown
back to them.

### User content → Other user content — COLLECTED

| Question | Answer |
| --- | --- |
| Linked to identity | Yes |
| Used for tracking | No |
| Purposes | App Functionality |

This is the most sensitive thing the app holds and is declared plainly:

- The goal, and why it matters
- The Day 30 success definition
- Daily reflections — how the day felt, and any note
- Weekly review answers
- Optional top-three priorities
- Completion history

It is stored on SelfMastery's own backend, is never sold or shared, is not used
to train anything, and is deleted permanently when the account is deleted.

### Everything else — NOT COLLECTED

Health & Fitness · Financial Info · Location · Sensitive Info · Contacts ·
Browsing History · Search History · Identifiers · Purchases · Usage Data ·
Diagnostics · Audio · Photos · Videos.

Two worth being explicit about, because the categories the app *serves* might
suggest otherwise:

- **Health & Fitness: not collected.** A fitness goal produces text like "Walk
  for 20 minutes". No measurement, no HealthKit, no body data.
- **Financial info: not collected.** A money goal produces prompts like "Record
  what you spent today". No amounts, no accounts, no institution links.

### Diagnostics — NOT COLLECTED

No crash reporting or analytics SDK is integrated. If one is added later, this
file, the privacy manifest and the App Store answers must all change together.

## Required-reason APIs

| API category | Reason | Use |
| --- | --- | --- |
| `NSPrivacyAccessedAPICategoryUserDefaults` | `CA92.1` | Theme choice and reminder toggles, this app's own data only |

No file timestamp, disk space, active keyboard or boot time APIs are used.
Keychain is not a required-reason API.

## Tracking

`NSPrivacyTracking` is `false` and the tracking domains list is empty. No
advertising identifier, no attribution, no cross-app or cross-site linking.

**No ATT prompt is shown**, and none should be added: showing an App Tracking
Transparency prompt without performing tracking is itself a rejection reason.
