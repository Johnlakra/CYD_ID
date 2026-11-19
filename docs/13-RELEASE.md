# 13 · Release: identifiers, signing, privacy, stores, CI/CD

> Owned by the **release-engineer** agent (M10). Items marked **OWNER** need a decision or an asset only the
> owner can provide. Nothing here is legal advice: have the diocese's advisers confirm privacy and payment wording.

## 1. Identity (OWNER decisions, then never change)

| Item | Proposal | Status |
|---|---|---|
| App name (store) | "CYD" (subtitle: "Catholic Yuva Dhara, Jalandhar") | OWNER to confirm |
| Android `applicationId` / iOS bundle id | `<reverse-domain-of-the-organisation>.cyd` (cannot be changed after the first store release) | **OWNER** |
| Publisher account | Diocese/CYD organisation account (Google Play Console, Apple Developer) rather than a personal account | **OWNER** |
| Icon / splash | Need a **standalone logo**: the repos contain none (the emblems exist only inside the card backgrounds). Provide a 1024×1024 PNG with safe area for adaptive icons | **OWNER / designer** |
| Support contact | A monitored email + the CYD Office address, shown in the store listing and in-app (a "Help & support" row to be added to the Account screen — **Designed here**, owner approval needed) | **OWNER** |
| Versioning | `MAJOR.MINOR.PATCH+BUILD` in `pubspec.yaml`; build number increments on every upload | agent |

## 2. Configuration and flavors
- `--dart-define=API_BASE_URL=https://cyd-id-be.onrender.com` for production (or the owner's own domain when the backend moves). `FLAVOR=prod`.
- Release builds must **not** contain cleartext exceptions; keep them in `android/app/src/debug/AndroidManifest.xml` and a debug-only iOS configuration.
- Render's free tier sleeps: for launch, recommend a paid always-on instance or a keep-alive, otherwise first requests take 30–60 s.

## 3. Android
- Min SDK per Flutter default (or 26); target SDK = the current Play requirement at submission time (check Play Console).
- Permissions (keep minimal): `INTERNET`; `CAMERA` only if the picker uses it directly (prefer the system picker/intent, which needs none); media access for **saving** the card — use the scoped-storage/MediaStore path (no broad storage permissions).
- `<queries>` entry for the `upi` scheme so `url_launcher` can detect UPI apps (Android 11+).
- Signing: create an upload keystore (kept out of git, backed up in two places), enable **Play App Signing**; `key.properties` ignored by git; CI uses encrypted secrets.
- Build: `flutter build appbundle --release --dart-define=...`; enable R8/shrink; verify ProGuard keeps nothing app-specific.
- Test on at least: a low-end 2 GB device, a mid-range, and an Android 14+ device.

## 4. iOS
- `Info.plist` usage strings: camera, photo library read (picker) and add-only (save card), with plain-language reasons.
- `LSApplicationQueriesSchemes` entry for `upi` (and common UPI apps' schemes if detection is needed).
- App Transport Security: HTTPS only in release.
- Signing/provisioning with the organisation's Apple Developer account; TestFlight internal testing first.
- Review notes for App Review: explain the three roles, provide **test accounts for each role** (admin, manager, holder, buyer, seller) on a staging backend with sample data, and explain that payments happen peer-to-peer outside the app (no in-app purchase): the app lists physical goods/event tickets from parish shops and displays the seller's UPI ID.

## 5. Privacy and data safety (draft answers — review with advisers)

What the app handles:
- **Account**: username, email (generated or admin-entered), role, hashed password (server-side).
- **Profiles (youth members, may include minors)**: name, parents' names, date of birth, baptism date, phone, postal address, parish/deanery, qualification, photo, issue date.
- **Shop**: delivery addresses (name, phone, address), orders, chat messages, **payment screenshots** (may reveal bank details), UTRs, sellers' UPI IDs.
- **Device**: nothing beyond what the OS exposes to normal apps; no advertising ID, no analytics SDK, no location.

Draft store answers: data is collected and linked to the user; used for app functionality only; not sold; not used for advertising; encrypted in transit (HTTPS); users can request deletion by contacting the CYD Office (profile deletion is an admin action; accounts are created by staff, not self-registered). **OWNER** to confirm retention periods (e.g. soft-deleted profiles keep their data) and to publish a privacy policy URL covering the above, including handling of minors' data and parental consent as the diocese requires. India's **Digital Personal Data Protection Act, 2023** may apply to this processing — get advice.

In-app: show a short privacy notice at first login (link to the policy), explain why the photo and phone are collected, and never log or screenshot-prompt sensitive data.

## 6. Payments and marketplace policy notes
- The platform **never receives or holds money**: buyers pay sellers directly by UPI. The app only displays a UPI ID, opens a `upi://` link/QR, and records the buyer's reference number. This is a deliberately lighter position than aggregating funds, but check Google Play's payments/financial-features declarations and Apple's guidelines for apps that link to payments, and describe this accurately in the listing and review notes.
- Disputes: the admin's real lever is suspending a shop and following up through the parish; say so plainly in the in-app help text (do not promise buyer protection the platform cannot deliver).
- Content rules for the marketplace (what may be sold) are a diocesan decision; add a reporting contact and take-down process before launch (**OWNER**).

## 7. Store assets and listing
- Screenshots (phone 6.7" and 5.5", plus tablet if supported) from seeded data: My ID card, Profiles list, Shop home, Product, Pay the seller, Order detail, Seller dashboard — **no real personal data or real photos**.
- Short and full descriptions (English), category (Lifestyle/Shopping or Social), content rating questionnaire answers, privacy policy URL, support email, website.
- Feature graphic (Play) and promotional text (App Store) in the app's saffron/black language (`design/tokens.json`).

## 8. CI/CD
- **On every PR**: `flutter pub get`, `dart format --set-exit-if-changed`, `flutter analyze`, `flutter test` (unit + widget + golden).
- **On tag `v*`**: build signed AAB (secrets: keystore base64, passwords) → upload as artifact (optionally to Play internal track with a service account); iOS via Xcode Cloud/fastlane when the Apple account exists.
- Cache pub and Gradle; pin the Flutter version in CI (`.fvmrc` or workflow) so builds are reproducible.
- Integration tests run manually or on a self-hosted emulator job against the local-backend docker/compose if the owner adds one (not required).

## 9. Release checklist
- [ ] Owner decisions: names, ids, accounts, logo, support contact, privacy policy URL, retention.
- [ ] Version/build bumped; changelog written.
- [ ] Release build uses HTTPS prod URL; no debug banner; no cleartext; no logs of sensitive data.
- [ ] Smoke test on a clean device for every role (the per-role checklists in docs/10 §5).
- [ ] Contract verifier clean against the **merged** production backend commit; seed/staging data cleaned.
- [ ] Store listings, screenshots, privacy/data-safety forms, content rating completed.
- [ ] Internal testing → closed testing with the CYD Office team → staged production rollout (5% → 20% → 100%) with a rollback plan (previous AAB retained).
- [ ] Post-release: monitor store reviews and support mailbox; plan the first update (notifications, backend asks in doc 12).
