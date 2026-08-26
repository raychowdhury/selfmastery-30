# iOS release process

## Versioning

Set in `ios/project.yml`:

```yaml
MARKETING_VERSION: "1.0.0"     # CFBundleShortVersionString
CURRENT_PROJECT_VERSION: "1"   # CFBundleVersion — must increase every upload
```

Bump the build number for every TestFlight upload, even a rebuild of the same
version. App Store Connect rejects a duplicate.

## Before archiving

```bash
cd ios
xcodegen generate
xcodebuild -project SelfMastery.xcodeproj -scheme SelfMastery \
  -destination 'platform=iOS Simulator,name=iPhone 17' test
xcodebuild -project SelfMastery.xcodeproj -scheme SelfMastery \
  -destination 'generic/platform=iOS' -configuration Release build
```

Then verify the Release bundle actually points where you think:

```bash
REL=$(find ~/Library/Developer/Xcode/DerivedData -name "SelfMastery.app" \
      -path "*Release-iphoneos*" | head -1)
plutil -extract APIBaseURL raw "$REL/Info.plist"     # must be https://
strings "$REL/SelfMastery" | grep -c localhost        # must be 0
ls "$REL/PrivacyInfo.xcprivacy"                       # must exist
```

## Automated release (fastlane)

Everything mechanical is scripted. What is left for you is genuinely a human
decision.

### One-time setup

```bash
cd ios
bundle install                    # installs fastlane from the Gemfile
```

Create an **App Store Connect API key** (App Store Connect → Users and Access →
Integrations → App Store Connect API, role: App Manager). The `.p8` is issued
once and cannot be downloaded again — store it outside the repository.

```bash
export ASC_KEY_ID=XXXXXXXXXX
export ASC_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
export ASC_KEY_PATH=~/private_keys/AuthKey_XXXXXXXXXX.p8

export SELFMASTERY_BUNDLE_ID=com.yourname.selfmastery
export SELFMASTERY_TEAM_ID=F5MY9BC25S
export SELFMASTERY_API_URL=https://your-production-domain
```

API-key auth is used rather than an Apple ID so nothing prompts for two-factor
and the same lanes work unattended on CI.

### Lanes

```bash
bundle exec fastlane test        # run the test suite
bundle exec fastlane beta        # bump build, archive, sign, upload to TestFlight
bundle exec fastlane metadata    # upload metadata + the six screenshots
```

`beta` refuses to run if the API URL is missing, points at localhost, or the
bundle identifier is still the placeholder — failing in a second beats failing
after a five-minute archive.

**Neither lane submits for review.** That stays a deliberate manual press in App
Store Connect, after the TestFlight checklist passes.

### What fastlane uploads

Metadata lives in `ios/fastlane/metadata/en-US/` and screenshots in
`ios/fastlane/screenshots/en-US/`. Both are checked in, so a release is
reproducible and metadata changes show up in a diff.

Three files still contain `[YOUR-DOMAIN]` / `[YOUR LEGAL ENTITY]`:
`support_url.txt`, `marketing_url.txt`, `privacy_url.txt` and
`metadata/copyright.txt`. Fill them before running the `metadata` lane.

## Continuous integration

Two workflows in `.github/workflows/`.

### `ci.yml` — every push and pull request

| Job | Runner | What it does |
| --- | --- | --- |
| `backend` | ubuntu-latest | Postgres 16 service, `prisma migrate deploy`, eslint, `tsc`, vitest, `next build`, then boots the server and runs the full mobile API smoke test against it |
| `ios` | macos-15 | `xcodegen`, tests on a simulator discovered at runtime, a Release build, then the same release audit as above — HTTPS only, zero `localhost` strings, manifest bundled |

No secrets. It builds against a placeholder API URL, because what it is checking
is that the code compiles and behaves, not where it points.

### `ios-release.yml` — tag push

```bash
git tag v1.0.0
git push origin v1.0.0
```

Imports the signing certificate into a throwaway keychain, writes the API key to
a runner-local path, runs `fastlane beta`, and destroys both in a step that runs
even when the build fails. The build lands in TestFlight.

**It does not submit for review**, and there is no input that makes it. Same rule
as the lanes: that press stays yours.

`workflow_dispatch` runs it by hand from the Actions tab, with an optional
`upload_metadata` toggle for the `metadata` lane.

### Required repository secrets

Settings → Secrets and variables → Actions. The workflow checks all eight in its
first step and names the missing ones, rather than failing inside a build.

| Secret | What it is |
| --- | --- |
| `IOS_BUNDLE_ID` | e.g. `com.yourname.selfmastery` |
| `IOS_TEAM_ID` | `F5MY9BC25S` |
| `PRODUCTION_API_URL` | `https://your-production-domain` — the generator rejects non-HTTPS |
| `APP_STORE_CONNECT_KEY_ID` | the 10-character key id |
| `APP_STORE_CONNECT_ISSUER_ID` | the issuer UUID |
| `APP_STORE_CONNECT_KEY_P8` | the `.p8`, base64 |
| `IOS_DIST_CERT_P12` | Apple Distribution certificate + private key, base64 |
| `IOS_DIST_CERT_PASSWORD` | the password you set when exporting the `.p12` |

Base64 the two files so they survive as single-line secrets:

```bash
base64 -i AuthKey_XXXXXXXXXX.p8 | pbcopy
base64 -i distribution.p12 | pbcopy
```

The `.p12` comes from Keychain Access → My Certificates → your **Apple
Distribution** certificate → right-click → Export. You do not have one yet: this
machine has a Development certificate only. Xcode creates the distribution
certificate the first time you archive for App Store distribution.

### On this being a public repository

Actions secrets are not readable from the workflow log, and are never given to
workflows triggered by a pull request from a fork. `ios-release.yml` only runs on
a tag pushed to this repository or a manual dispatch, so a fork cannot reach the
signing key. Keep it that way: do not add a `pull_request` or
`pull_request_target` trigger to it.

## Archiving

1. Xcode → **Product → Archive** (scheme is already set to Release for archive).
2. In the Organizer, select the archive and **Generate Privacy Report**. Check
   it matches `docs/app-store/APP_PRIVACY_ANSWERS.md`. If it lists a data type
   or API the manifest does not declare, fix the manifest — not the report.
3. **Distribute App → App Store Connect → Upload**.

## Signing

Automatic signing with your team. Before the first archive:

- Set `PRODUCT_BUNDLE_IDENTIFIER` in `project.yml` to your real identifier
  (currently the placeholder `com.yourcompany.selfmastery`).
- Register that identifier in the Apple Developer portal.
- Set `DEVELOPMENT_TEAM` in `project.yml`, or select the team in Xcode once.

## Capabilities

Only **Push Notifications** would need enabling, and only if remote push is ever
added. V1 uses local notifications, which need no capability and no entitlement.

## Checklist before every submission

Run through `docs/app-store/FINAL_SUBMISSION_CHECKLIST.md`. The items that have
actually caused rejections in apps like this one:

- Account deletion reachable without contacting support — Profile → Delete account
- Privacy answers matching the manifest and the code
- No placeholder screens or dead ends
- The backend reachable from Apple's network, with a demo account that works
