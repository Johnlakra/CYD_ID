# Handoff: CYD app build (as of 2026-11-25)

Read this first when resuming. Then read `CLAUDE.md`, `docs/09-IMPLEMENTATION-PLAN.md` (tracker at the bottom) and `docs/DECISIONS.md`.

## Where things stand
| Milestone | State |
|---|---|
| M0 Scaffold | ☑ done (2026-11-20, verified on device) |
| M1 Design system & shell | ◐ **code complete, both reviews' fixes applied; three steps left** (below) |
| M2–M10 | not started |

Branch `claude/cyd-app-kit`, pushed to `origin`. See `git log` for the head commit.

## Big change this session: design v2
The owner directed the build to follow a new prototype, **design v2** (a Claude Design canvas, 42 artboards):
- Canvas: https://claude.ai/artifact/4x1133pXrwyoZ9BQ2vhCsU (every artboard runs the same app).
- In the repo: `design/CYD-Shop-Mobile-v2.dc.html` (the full app; theme object `th`, status map `ST`), `design/CYD-Shop-Mobile-v2-global-states.dc.html`, `design/DESIGN-OVERVIEW-v2.md`.
- Gold accent `#E8B04B` (owner-confirmed), Instrument Serif + Manrope + DM Mono (bundled fonts). The light theme has a white background.
- `docs/02-DESIGN-SYSTEM.md` has a **"Design v2 overrides"** block at the top that wins over the rest of the doc. `CLAUDE.md` rule 7 is updated.
- **Role change (not yet in the docs):** the ID card is admin/CYD-manager-only. The profile holder's first tab is **My Profile** (profile card, Update photo, My details), not My ID, and the holder never sees a card or its validity. Docs 00/01/04/06/07/10/13 and `design/SCREEN-MAP.md` still say "My ID" (about 30 places). **Update them at the start of M2 (first-tab label) and M4 (drop the holder card route `/id/card`; keep `/id/photo`).**

## What M1 delivered (committed)
- `design/tokens.json` (v2) ↔ `lib/core/theme/` (`cyd_tokens.dart`, `status_styles.dart`, `cyd_type.dart`, `cyd_layout.dart`, `font_licenses.dart`). `tokens_json_test.dart` keeps the JSON and Dart in sync.
- `lib/app/theme.dart` (`cydTheme`), `themeModeProvider` (System/Light/Dark, persisted).
- `lib/core/widgets/` (import `widgets.dart`): buttons, chips, status chips, cards, banners, inputs (incl. the UTR field), controls, `PriceText`, skeletons, empty/error/offline, `AsyncListView`, sheet, dialog (catches errors), toast, `CopyRow`, `CountdownPill`, avatar, photo placeholder, app bars, `CydPressable` + `HitSlop` (44 dp targets), the SVG path parser.
- `lib/app/shell.dart`: frosted capsule tab bar. Feature agents use `firstTabProvider` (set from the role in M2) and `tabBadgesProvider` (`setCart`/`setShop`). `StatefulShellRoute` in `lib/app/router.dart` with placeholder tab roots `/id /shop /cart /orders /account`.
- Debug-only `/debug/gallery` (reached from the splash placeholder's "Design gallery" link).
- 46 goldens (dark/light, 390/360) tagged `golden`. CI: the ubuntu job runs `--exclude-tags golden`; a macOS job runs `--tags golden`. CI has not yet run on these commits.

## Left to finish M1
1. **Contrast fixes (owner-approved, in progress, UNCOMMITTED in the working tree).** Files: `design/tokens.json`, `lib/core/theme/cyd_tokens.dart`, `lib/core/widgets/{app_bars,cyd_button,cyd_toast}.dart`, `test/core/theme/tokens_json_test.dart`, new `test/core/theme/contrast_test.dart`. Scope:
   - The dark toast action uses `#7E5410`, via a `toastAction` token.
   - Text on the dark red (badge, destructiveFilled, dialog destructive) is `#0A0A0B`, via an `onDanger` token. Light keeps white if it passes 4.5:1.
   - Raise the `faint` alpha so 9–10 px labels pass 4.5:1 on bg and card in both themes.
   - Add a contrast test, regenerate the goldens (`flutter test --tags golden --update-goldens`), and commit as `M1: contrast fixes per owner`.
   - The work was interrupted part-way, so review the diff, finish it, and check it with analyze, format and test.
2. **Re-run both reviewers** (`ui-fidelity-reviewer`, `flutter-code-reviewer`) on the fix commits. Every blocking and major finding from the first round was addressed in `35ed774`.
3. **Owner visual sign-off** of the gallery on the phone, in both themes. Then tick M1 in the tracker.

## Backend
- Source: `/Users/johnal/Documents/GitHub/cyd_Id_BE`, branch `claude/happy-bell-oy6or2`. It runs on `localhost:3000` (`GET /health` OK).
- **The contract check of the M0 network layer passed** (no blocking or major findings). The doc defects it found are fixed (DB-81 in `docs/11`).
- **Seeded accounts are missing.** Every login, including `admin/admin123`, returns 401. Seed before M2. The owner hasn't yet said whether Claude should run this:
  ```
  cd /Users/johnal/Documents/GitHub/cyd_Id_BE
  npm run init-db     # only on a fresh DB: creates admin/admin123
  npm start
  node /Users/johnal/Documents/GitHub/cyd-app-kit/cyd-app-kit/tools/seed-dev-data.js http://127.0.0.1:3000
  ```
- Phone dev setup: `adb reverse tcp:3000 tcp:3000`. The dev default `API_BASE_URL` is now `http://localhost:3000`.

## Carry into the M2 brief
- `lib/core/network/error_mapper.dart`: a 400 without `errors` becomes `unknown` (decide and document it in doc 08 §14). Add fallback copy for a 413 or 429 that arrives without a JSON body.
- The 401 session-expiry handler must skip `/auth/login` and `/profile-holder/login`. Trim the username before sending.
- Call `firstTabProvider.notifier.set(...)` from the role. The holder gets `FirstTab.myProfile` (v2), so update the M2 acceptance criteria ("holder lands on My Profile").

## Open owner questions
- Should Claude run the backend seeding commands?
- Flutter 3.50 deprecates `package:flutter/material.dart` in favour of `material_ui`: 46 analyzer infos locally, none in CI (pinned 3.47.9). The recommendation is to stay on 3.47.9 for now. **Do not run `dart fix --apply` with 3.50.**
- `google_fonts` is unused. Remove it (`flutter pub remove google_fonts`) when `pubspec.lock` is next committed.
- Design overview "Needs input": real photos, ID card backgrounds, the Create user empty-username copy, whether sellers who aren't youth members see My Profile.

## Uncommitted owner changes (leave alone unless asked)
`android/settings.gradle.kts` (AGP 9.1.1), `pubspec.lock` (local SDK resolution), `android/build/`.
