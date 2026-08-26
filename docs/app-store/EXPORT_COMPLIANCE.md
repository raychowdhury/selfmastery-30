# Export compliance

Based on an audit of what the app actually does, not a guess.

## Cryptography in the app

| Use | Implementation | Category |
| --- | --- | --- |
| HTTPS to the backend | `URLSession` — the OS TLS stack | Standard, provided by Apple |
| Session token storage | Keychain (`Security.framework`) | Standard, provided by Apple |
| Password hashing | **Server side only** (bcrypt). The app never hashes. | Not in the app |
| Token hashing | **Server side only** (SHA-256) | Not in the app |

The app contains **no proprietary or custom cryptography**, implements no
algorithms of its own, and bundles no cryptographic library. It has zero
third-party dependencies of any kind.

Verified: `grep -r "CommonCrypto\|CryptoKit"` over the iOS sources returns
nothing; the Release bundle has no embedded frameworks.

## App Store Connect answers

| Question | Answer |
| --- | --- |
| Does your app use encryption? | **Yes** |
| Does it qualify for any of the exemptions? | **Yes** |
| Which exemption? | Only uses encryption **provided by Apple's operating system**, and encryption limited to authentication and HTTPS |
| Does it implement proprietary/non-standard encryption? | **No** |
| Is it available in France? | Answer per your distribution; no French-specific declaration is triggered by this app's usage |

The result is that no CCATS or year-end self-classification report is required.

## Info.plist declaration

`ITSAppUsesNonExemptEncryption` is set to `false` in
`ios/SelfMastery/Resources/Info.plist`. With that key present and correct, App
Store Connect stops asking the export question on every upload.

This is accurate: HTTPS via the OS and Keychain are exempt uses. **If the app
ever adds its own encryption** — encrypted local storage, an end-to-end
encrypted feature, a bundled crypto library — this key must be revisited before
the next upload, because the declaration would then be false.

## Re-check when

- Adding any third-party SDK
- Adding local encryption of cached data
- Implementing anything that encrypts beyond authentication and transport
