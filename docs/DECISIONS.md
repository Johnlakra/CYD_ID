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
- **Release HTTPS guard:** `Env.assertReleaseConfig()` runs in `main()` and throws in release mode if `API_BASE_URL` is not `https`. The default `http://10.0.2.2:3000` is for dev only, so release builds must pass `--dart-define=API_BASE_URL=https://...`.
- **Cleartext HTTP:** Android only in `android/app/src/debug/AndroidManifest.xml` (`usesCleartextTraffic`). iOS has `NSAllowsLocalNetworking` in the single `Info.plist` (it covers localhost/`.local`/IP-literal hosts only and is not `NSAllowsArbitraryLoads`); iOS has no debug-only Info.plist without schemes, so this ships in release too. Revisit in M10 if App Review objects (a per-configuration plist can split it).
- **INTERNET permission** is added to the main Android manifest: `flutter create` only puts it in debug/profile, which would leave release builds with no network.
- **Temporary theme:** `lib/app/app.dart` uses a seeded Material 3 theme (saffron seed) only until M1 replaces it with `CydTokens`. The M0 splash/login placeholders and `lib/app/placeholder_screens.dart` are replaced in M2.
- **`lib/app/theme.dart` and `lib/app/shell.dart`** are not created in M0: both are owned by the design-system-engineer (M1).
- **`.gitignore`** additionally ignores `.env`, `key.properties`, `*.jks`, `*.keystore`, `.claude/settings.local.json`.
