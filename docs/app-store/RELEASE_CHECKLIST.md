# Release checklist

## 1. Apple Developer account

- [ ] Apple Developer Program membership active ($99/year) — **human step**
- [ ] Latest agreements accepted in App Store Connect — **human step**
- [ ] Paid Applications agreement (only if charging; not needed for 1.0)
- [ ] Bank and tax details (only if charging) — **human step**

## 2. Identifiers

- [ ] Bundle identifier registered — currently the placeholder
      `com.yourcompany.selfmastery`; change it in `ios/project.yml` first
- [ ] `DEVELOPMENT_TEAM` set in `project.yml` or selected in Xcode
- [ ] No capabilities needed (V1 uses local notifications only)

## 3. Backend

- [ ] Production deployed and reachable over HTTPS
- [ ] `DATABASE_URL` and `DIRECT_URL` set; migrations applied
- [ ] `AUTH_SECRET` set
- [ ] Rate limiting configured (`UPSTASH_REDIS_REST_URL` / `_TOKEN`)
- [ ] `RESEND_API_KEY` and `MAIL_FROM` set, or password reset silently does
      nothing — see Known blockers
- [ ] `/api/mobile/v1/onboarding-options` returns 200 publicly
- [ ] `./scripts/mobile-api-smoke.sh` passes against production **using a
      throwaway account**

## 4. Legal and support pages — live URLs required

- [ ] Privacy policy published (`docs/legal/PRIVACY_POLICY.md`, placeholders filled)
- [ ] Terms of use published
- [ ] Support page published (`docs/app-store/SUPPORT_CONTENT.md`)
- [ ] All three reachable without signing in ⚠ Apple checks

## 5. App Store Connect record

- [ ] App created, bundle ID matched, SKU set
- [ ] Name and subtitle
- [ ] Description, promotional text, keywords
- [ ] Primary Productivity, secondary Lifestyle
- [ ] Age rating questionnaire (see AGE_RATING.md)
- [ ] Price: Free
- [ ] Availability
- [ ] App Privacy answers (see APP_PRIVACY_ANSWERS.md)
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Screenshots uploaded
- [ ] Review contact details
- [ ] Review notes pasted
- [ ] Demo credentials entered **in App Store Connect, never in the repository**
- [ ] Export compliance
- [ ] Content rights: no third-party content

## 6. Build

- [ ] Version 1.0.0, build number unused
- [ ] Tests pass
- [ ] Release build succeeds
- [ ] Archive validates
- [ ] Privacy report generated and matched against the manifest ⚠
- [ ] Uploaded and processed

## 7. TestFlight

- [ ] Internal testing pass (TESTFLIGHT_CHECKLIST.md)
- [ ] External testers if wanted (requires Beta App Review)
- [ ] Crash-free across the test period

## 8. Submit

- [ ] Build selected
- [ ] Release option chosen (manual release recommended for a first launch)
- [ ] Submitted — **human step**

## Human-only steps

Nothing in this repository can perform these:

1. Pay for and maintain Apple Developer membership
2. Accept Apple's agreements
3. Create the App Store Connect record
4. Enter demo credentials
5. Upload screenshots
6. Archive and upload a signed build
7. Press Submit for Review
