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
