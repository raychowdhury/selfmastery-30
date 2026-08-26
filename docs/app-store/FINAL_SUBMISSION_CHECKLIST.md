# Final submission checklist

The last pass before pressing Submit. Ordered by how often each item actually
causes a rejection.

## Rejection-risk audit

### BLOCKER — will be rejected

- [ ] **Account deletion works and is easy to find.** Profile → Delete account.
      Guideline 5.1.1(v). Verified end to end on a throwaway account.
- [ ] **The backend is reachable from Apple's network.** A review during an
      outage is rejected as "app does not function".
- [ ] **Demo credentials are entered and work.** Test them on a clean install
      immediately before submitting.
- [ ] **Privacy policy URL is live** and reachable without signing in.
      `/privacy`, `/terms` and `/support` ship with the web app; confirm the
      draft notice is gone, meaning `lib/content/legal.ts` has been filled in.
- [ ] **App Privacy answers match reality** and the privacy manifest.
- [ ] **No placeholder or dead-end screens.** Every button does something.
- [ ] **No crashes** on the review path.

### HIGH

- [ ] **Password reset actually delivers email.** Without `RESEND_API_KEY` the
      endpoint now returns 503 with a clear message rather than pretending to
      succeed, so nothing is silently broken — but the feature is unavailable
      until a mail provider is configured. Check with
      `curl https://your-domain/api/mobile/v1/health`.
- [ ] **Support URL live.**
- [ ] Screenshots show only real app output; no fabricated numbers.
- [ ] Description makes no guaranteed, medical or financial claims.
- [ ] Notification permission is requested in context, not at launch.
- [ ] No ATT prompt (the app does not track, so one would itself be a violation).

### MEDIUM

- [ ] Bundle identifier is your real one. Pass `SELFMASTERY_BUNDLE_ID` to
      `ios/generate.sh`; it warns when the placeholder is still in use.
- [ ] App icon reviewed. The generated one is shippable; replace it with
      designer artwork at the same path and size if you want to.
- [ ] Keywords contain no competitor names.
- [ ] Age rating answers match the content.
- [ ] Export compliance answered.
- [ ] iPad at least functional — it is offered in the device family.

### LOW

- [ ] Subtitle within the character limit.
- [ ] Promotional text set.
- [ ] Release notes written.
- [ ] Manual release chosen, so launch timing is yours.

## Technical verification

```bash
cd ios
xcodegen generate
xcodebuild -project SelfMastery.xcodeproj -scheme SelfMastery \
  -destination 'platform=iOS Simulator,name=iPhone 17' test
xcodebuild -project SelfMastery.xcodeproj -scheme SelfMastery \
  -destination 'generic/platform=iOS' -configuration Release build

REL=$(find ~/Library/Developer/Xcode/DerivedData -name "SelfMastery.app" \
      -path "*Release-iphoneos*" | head -1)
plutil -extract APIBaseURL raw "$REL/Info.plist"   # https://…
strings "$REL/SelfMastery" | grep -c localhost      # 0
ls "$REL/PrivacyInfo.xcprivacy"                     # exists
ls "$REL/Frameworks" 2>/dev/null || echo none       # none
```

Backend, against production, with a throwaway account:

```bash
API_BASE=https://[YOUR-DOMAIN] ./scripts/mobile-api-smoke.sh
```

## Archive audit

- [ ] Signing: Distribution certificate, correct team
- [ ] Capabilities: none required
- [ ] Privacy report generated and compared against the manifest
- [ ] Third-party SDK list: empty
- [ ] Symbols included, for readable crash reports
- [ ] No embedded frameworks
- [ ] Entitlements minimal
- [ ] Warnings reviewed

## Immediately before pressing Submit

1. Install the exact TestFlight build on a device that has never run the app.
2. Sign in with the demo credentials you entered in App Store Connect.
3. Tick an action off. Confirm it persists after a force-quit.
4. Open Profile → Delete account and confirm the screen appears (do not confirm).
5. Confirm the privacy and support URLs load in Safari on that device.

If all five pass, submit.
