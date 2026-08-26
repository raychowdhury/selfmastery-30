# Running the iOS app locally

## Prerequisites

- Xcode 16 or newer (developed against Xcode 26.6, Swift 6.3)
- An iOS 18+ simulator
- XcodeGen: `brew install xcodegen`
- The SelfMastery backend running locally

## First run

```bash
# 1. Start the backend (from the repository root)
npm run dev

# 2. Generate the Xcode project
cd ios
xcodegen generate

# 3. Open it
open SelfMastery.xcodeproj
```

Select the **SelfMastery** scheme and an iPhone simulator, then run.

The Debug configuration points at `http://localhost:3000`. `Info.plist` carries
an `NSAllowsLocalNetworking` exception so that works in the simulator; it does
not relax transport security for any other host.

## From the command line

```bash
cd ios
xcodebuild -project SelfMastery.xcodeproj -scheme SelfMastery \
  -destination 'platform=iOS Simulator,name=iPhone 17' build

xcodebuild -project SelfMastery.xcodeproj -scheme SelfMastery \
  -destination 'platform=iOS Simulator,name=iPhone 17' test
```

## Signing in

Any account works. The seeded demo account is convenient because it already has
a challenge part-way through:

```
maya@example.com / selfmastery30
```

Seed it with `npm run db:seed` from the repository root.

## Pointing at a different backend

Edit the per-configuration values in `ios/project.yml`:

```yaml
configs:
  Debug:
    API_BASE_URL: http:/$()/localhost:3000
  Release:
    API_BASE_URL: https:/$()/selfmastery-30.vercel.app
```

The `$()` is an XcodeGen escape that stops `//` being read as a comment. After
editing, run `xcodegen generate` again.

`APIConfiguration` refuses to start a Release build with a non-HTTPS URL, so a
staging hostname can be swapped in safely but a plaintext one cannot.

## Regenerating the app icon

```bash
python3 scripts/generate-app-icon.py
```

Writes a 1024×1024 PNG into the asset catalogue. Replace it with final artwork
before release — same filename, same dimensions, nothing else to change.
