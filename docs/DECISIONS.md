# Decisions log

One line per non-obvious decision. Newest at the bottom of each section. Owner: app-architect (orchestrator applies doc edits).

## Toolchain and identifiers
- **Flutter 3.47.9 / Dart 3.13.7** (stable) is the pinned toolchain; CI pins `flutter-version: 3.47.9`. `pubspec.yaml` has `sdk: ^3.13.7`.
- **Application ids (provisional, owner's choice, to be finalised at M10):** Android `applicationId` = `diocese_id.cyd_app`; iOS bundle id = `dioceseid.cydApp`. Changing them later means re-registering Google/Apple app records, so settle before the first store upload (doc 13).
- Launcher name is `CYD` on both platforms (doc 01 §13), set in `AndroidManifest.xml` and `Info.plist` (`CFBundleDisplayName`).

## Repository layout and CI
- **Two nested git repos exist on disk.** The project repo (`Johnlakra/CYD_ID`, branch `claude/cyd-app-kit`, where all work is committed) is the Flutter project folder itself; its parent folder is a *separate* repo (`Johnlakra/cyd-app-kit`, one empty `Initial commit`, the project folder untracked inside it). The brief assumed the parent was the root; `git rev-parse --show-toplevel` in the project folder says otherwise. The workflow therefore lives in the project repo's `.github/workflows/ci.yml` with no `working-directory`. Owner: confirm which remote is the real one; if the parent repo is meant to be the root, the project folder must be added to it (or the nested `.git` removed) and the workflow moved with a `working-directory` and path filters.
- CI steps: `flutter pub get`, `flutter analyze`, `dart format --output=none --set-exit-if-changed .`, `flutter test`. `analysis_options.yaml` excludes `android/**` and `ios/**` from analysis.

## Packages (resolved by `flutter pub add`; `pubspec.lock` committed)
| Package | Version | Note |
|---|---|---|
| flutter_riverpod | 3.5.0 | Riverpod **3.x** (not 2.x): `Notifier`/`AsyncNotifier` API, no `StateNotifier` for new code; no `riverpod_generator`. Test overrides use `overrideWithValue`. |
| go_router | 18.1.4 | |
| dio | 5.11.1 | |
| flutter_secure_storage | 11.2.0 | v11 dropped `encryptedSharedPreferences`; its default (AES-GCM, Keystore-wrapped key) satisfies doc 01 §11, iOS default accessibility is `first_unlock`. `resetOnError` defaults to true (an undecryptable store is wiped, which just logs the user out). |
| shared_preferences | 2.5.6 | |
| google_fonts | 9.0.0 | Used from M1 (Anton, Archivo, DM Mono). |
| intl | 0.20.3 | |
| url_launcher | 6.3.3 | |
| cached_network_image | 4.0.7 | |
| image_picker | 1.2.4 | |
| image | 4.13.1 | |
| path_provider | 2.1.6 | **Added beyond the doc 09 M0 list**: `CacheStore` needs the app documents directory (doc 01 §5); it was only a transitive dependency before. |
| flutter_lints | 6.0.0 | dev |
| mocktail | 1.0.5 | dev |
| http_mock_adapter | 0.6.1 | dev; used with `DioAdapter(dio: ...)`. |
| integration_test | sdk | dev; the add command in doc 09 (`flutter pub add --dev "integration_test:{sdk: flutter}"`) fails (`--dev` cannot combine with a descriptor); use `flutter pub add "dev:integration_test:{sdk: flutter}"`. |
- Deferred to M4: `pdf`, `printing`, `share_plus`, the save-to-gallery plugin.

## Code conventions
- **Dates use `DateFormat(pattern, 'en_US')`, not `en_IN`.** Only `en_US` data is bundled without async `initializeDateFormatting`; with explicit patterns the output is identical on any device and independent of the device locale. (`en_IN` would also lower-case AM/PM.) Money grouping (`₹1,00,000.00`) is hand-written, not `NumberFormat`, so it is deterministic and testable without locale init.
- **`ApiException` lives in `lib/core/network/api_exception.dart`** (doc 01 §2); `lib/models/api_exception.dart` is a one-line re-export so feature code can import it from `models/` as CLAUDE.md and doc 08 §14 imply.
- **Error flow:** `ErrorMapperInterceptor` rewrites every `DioException` so `error` is an `ApiException`; repositories wrap calls in `guardApi(...)` and use `unwrapData`/`unwrapMap` for the envelope. 400 with a non-empty `errors` list is `validation`; 400 without it is `unknown` carrying the server message verbatim.
- **Logging:** the dev `MinimalLogInterceptor` prints only method, path (no query string) and status. It deliberately logs no headers or bodies, which is stricter than the redacted body log in doc 01 §4 and cannot leak tokens, UTRs or base64.
- **Release HTTPS guard:** `Env.assertReleaseConfig()` runs in `main()` and throws in release mode if `API_BASE_URL` is not `https`. The default `http://localhost:3000` (physical phone via `adb reverse tcp:3000 tcp:3000`; emulator passes `http://10.0.2.2:3000`) is for dev only, so release builds must pass `--dart-define=API_BASE_URL=https://...`.
- **Cleartext HTTP:** Android only in `android/app/src/debug/AndroidManifest.xml` (`usesCleartextTraffic`). iOS has `NSAllowsLocalNetworking` (localhost/`.local`/IP-literal hosts only, not `NSAllowsArbitraryLoads`) in `Info.plist`, and a Runner build phase "Strip local-network ATS (non-Debug)" deletes `:NSAppTransportSecurity` from the built Info.plist whenever `CONFIGURATION` is not `Debug` (verified: the Release `Runner.app` has no ATS key, the Debug simulator build does). Placed last in the Runner phases so it runs before signing.
- **INTERNET permission** is added to the main Android manifest: `flutter create` only puts it in debug/profile, which would leave release builds with no network.
- **Temporary theme:** `lib/app/app.dart` uses a seeded Material 3 theme (saffron seed) only until M1 replaces it with `CydTokens`. The M0 splash/login placeholders and `lib/app/placeholder_screens.dart` are replaced in M2.
- **`lib/app/theme.dart` and `lib/app/shell.dart`** are not created in M0: both are owned by the design-system-engineer (M1).
- **`.gitignore`** additionally ignores `.env`, `key.properties`, `*.jks`, `*.keystore`, `.claude/settings.local.json`.

## Review fixes (M0 follow-up)
- **No automatic provider retry.** Riverpod 3 retries failing providers up to 10 times (200 ms to 6.4 s) by default, including 4xx/401/429. `main.dart` passes `ProviderScope(retry: noAutomaticRetry)` (`lib/core/config/riverpod_config.dart`); users retry explicitly with the "Tap to retry" button. Tests use `testScope`/`testContainer` from `test/support/scope.dart`; a test proves a 403 issues exactly one request.
- **`guardApi` maps any failure to `ApiException`**: `ApiException` is rethrown, `DioException` is mapped, and anything else (TypeError, FormatException from wrong-typed fields) becomes `unknown` with `Strings.unknownError`, keeping the stack trace.
- **`Env.assertReleaseConfig`** rejects flavors other than `dev`/`prod` in every mode, and in release requires `FLAVOR=prod` plus an https URL with a non-empty host. Release builds therefore need `--dart-define=FLAVOR=prod --dart-define=API_BASE_URL=https://...`.
- **`parseRupees`** accepts at most 9 whole digits (overflow guard).
- **Backup/privacy:** `android:allowBackup="false"`; `CacheStore` lives in `getApplicationSupportDirectory()` (not user-visible Documents). On iOS the Application Support directory is included in iCloud/iTunes backups by default and no exclusion flag is set yet (no plugin in the M0 set exposes `isExcludedFromBackup`); revisit in M10 if the owner wants cache files excluded.
- **Lints:** dropped the obsolete `missing_required_param`/`missing_return` overrides and redundant `use_build_context_synchronously`; added `avoid_dynamic_calls`, `cancel_subscriptions`, `close_sinks`.
- **CI:** `permissions: contents: read`; triggers on push to `master` and `claude/**` plus pull requests; `flutter pub get --enforce-lockfile`.

## M1 — Design v2 (2026-11-25)
- **The v2 prototype replaces the original mockup's visual system.** The owner directed the build to start from the "CYD Shop Mobile — Design Overview" (Claude Design canvas, 42 artboards). Sources in the repo: `design/DESIGN-OVERVIEW-v2.md`, `design/CYD-Shop-Mobile-v2.dc.html` (the full clickable app; theme in the script's `th` object, status chips in `ST`), `design/CYD-Shop-Mobile-v2-global-states.dc.html`. The older `design/CYD Shop Mobile.dc.html` is kept for history only.
- **Visual changes vs doc 02 / old tokens.json:** fonts Instrument Serif (display, prices, initials; italic gold accents), Manrope (UI), DM Mono (labels), replacing Anton/Archivo. Accent gold `#E8B04B` (accent text `#7E5410` light / `#F0C77A` dark) replacing saffron `#FFA51F`. Light is the default theme and has a white background (`#FFFFFF` with a cool top tint) instead of `#F2F0EA`. Dark bg `#0C0C0E` with a warm gold top glow. Cards have 24 px corners, a 1 px hairline and a soft lifted shadow. The tab bar is a frosted capsule of icon-only circles, and the active tab is a gold circle with a glow.
- **Open with the owner (design overview "Needs input"):** confirm gold vs CYD saffron. The accent is one token, so switching back is a one-line change.
- **Role change in v2 (affects M2/M4/M5, not M1 tokens):** the ID card is admin/CYD-manager-only. The profile holder's first tab is **My Profile** (profile card, Update photo, My details), not My ID, and the holder never sees a card or its validity. Docs 00/01/04 and the M2/M4 acceptance criteria are updated when those milestones start.
- **Fonts are bundled** (`assets/fonts/`: InstrumentSerif, Manrope static 400–800 instances generated from the variable font, DMMono; an OFL licence file per family, registered with `LicenseRegistry`), declared in `pubspec.yaml` and referenced by `CydFonts`. They are not fetched at runtime, so there is no first-frame swap and no request to Google from users' phones. `google_fonts` is unused and will be removed when `pubspec.lock` is next committed. Instrument Serif has no ₹ glyph, so the display fallback is Manrope, then Georgia.
- **Theme layout:** tokens, type and layout live in `lib/core/theme/` (`cyd_tokens.dart`, `status_styles.dart`, `cyd_type.dart`, `cyd_layout.dart`). `lib/app/theme.dart` builds `cydTheme(Brightness)`. `tokens_json_test.dart` keeps `design/tokens.json` and the Dart values in sync. Theme mode defaults to System and is persisted.
- **Shell API:** the first tab is set with `firstTabProvider` (session layer, M2) and badges with `tabBadgesProvider`. The tab bar hides on any route pushed onto the root navigator and while the keyboard is open; there is no hide provider. `core/widgets` has no go_router or dio dependency.
- **Goldens** render at 1x to keep the repo small. `test/flutter_test_config.dart` loads the bundled fonts and MaterialIcons for all tests.
- **Flutter 3.50 tooling:** 3.50 deprecates `package:flutter/material.dart` in favour of `material_ui`, which adds analyzer infos locally. CI stays pinned to 3.47.9 until the owner decides. Do not run `dart fix --apply` with 3.50: it rewrites imports to an undeclared package.
- **Status glyphs** are Material icons, because the fonts lack ◔ ▣ ‖.
- **Owner decisions 2026-11-25:** the accent is gold `#E8B04B` (not saffron). Contrast is fixed where v2 fails 4.5:1: the dark toast action, text on the dark red, and the `faint` alpha; values are in tokens.json. The offline error card is the dashed card with a gold retry from the main prototype, and the Global states artboard's solid variant is not used. The dev default `API_BASE_URL` is `http://localhost:3000`.
