# 09 · Implementation plan — milestones M0 → M10

How the app is built, in order. The **main Claude Code session is the orchestrator**: it reads this
plan, delegates each milestone's work to the named specialist agents (`.claude/agents/`), runs the
reviewers, and ticks the tracker at the bottom. (Subagents cannot launch subagents — the orchestrator
does all delegation. See `prompts/00-MASTER-BUILD-PROMPT.md`.)

Effort figures are rough *working days for one developer driving Claude Code*, to help sequencing — not commitments.

## Global Definition of Done (applies to every milestone)

A task is done only when **all** hold:
1. `flutter analyze` has no issues; `dart format --set-exit-if-changed .` passes.
2. New logic has unit tests; new screens have widget tests for loading/empty/error/data states; screens specified with exact visuals have golden tests (dark + light, 390 px; 360 px for dense screens).
3. Every endpoint used is in `docs/05-API-CONTRACT.md` with the exact path/method/body; the **api-contract-verifier** reports no mismatches for the touched repositories.
4. Every screen matches its spec section (copy, states, measurements); the **ui-fidelity-reviewer** reports no blocking findings.
5. The **flutter-code-reviewer** reports no blocking findings (architecture rules in doc 01 §12).
6. Verified at least once against the **local backend** with seeded data (`tools/`), for each role the screen concerns.
7. The tracker below and `docs/11-DESIGN-VS-BACKEND.md` (if a new conflict appeared) are updated.
8. No secrets, tokens, base64 or personal data in logs, tests, fixtures or commits.

## Dependency graph

```
M0 ─► M1 ─► M2 ─┬─► M3 ─► M4 ─► M5
                ├─► M6 ─► M7 ─► M8
                └──────────────────► M9 ─► M10
```
M3–M5 (ID cards) and M6–M8 (shop) are independent after M2 and may run in parallel if two sessions/people are available.

---

## M0 — Scaffold and foundations  *(owner: app-architect · ~1 day)*
**Goal:** an empty-but-correct app that builds, runs on an emulator, and has every convention in place.
**Tasks**
1. `flutter create` (org chosen by the owner, project name `cyd_app`, android + ios), copy the kit in (see README), **delete the generated `test/widget_test.dart`** (it will not compile once `main.dart` changes), commit.
2. Add packages — M0 set only: `flutter pub add flutter_riverpod go_router dio flutter_secure_storage shared_preferences google_fonts intl url_launcher cached_network_image image_picker image` and `flutter pub add --dev flutter_lints mocktail http_mock_adapter` plus `flutter pub add "dev:integration_test:{sdk: flutter}"` (`--dev` cannot be combined with an SDK descriptor), and `path_provider` (needed by `core/storage/cache_store`). Defer `pdf`, `printing`, `share_plus`, the gallery-save plugin to M4. Commit `pubspec.lock`.
3. Create the folder layout of doc 01 §2 with placeholder files; set up `analysis_options.yaml` (`flutter_lints` + rules from doc 01 §12).
4. Register assets in `pubspec.yaml` (under `flutter:` → `assets:` list `assets/idcard/`, `assets/data/`; under `fonts:` declare family `Gafata` → `assets/fonts/Gafata-Regular.ttf`) — Vidaloka/Roboto are added in M4; verify the three card images load.
5. `core/config/env.dart` with `API_BASE_URL`/`FLAVOR` defines; `core/network` skeleton (dio provider, error mapper, envelope parser) with unit tests using a mock adapter.
6. `core/storage` wrappers; `core/format` (money, dates, text) **with unit tests** (cases in doc 06 §Formats).
7. `main.dart` + `MaterialApp.router` + temporary router with `/splash`, `/login` placeholder.
8. CI workflow (GitHub Actions): `flutter pub get`, analyze, format check, test.
9. Debug-only cleartext access for the local backend: Android → `android/app/src/debug/AndroidManifest.xml` with `android:usesCleartextTraffic="true"` on `<application>` (the emulator reaches the host at `http://10.0.2.2:3000`); iOS → `NSAllowsLocalNetworking` under `NSAppTransportSecurity` in `Info.plist` (lets the simulator reach `localhost`). Release builds stay HTTPS-only (doc 13).
10. Append to `.gitignore`: `.env`, `key.properties`, `*.jks`, `*.keystore`, `.claude/settings.local.json`. Add `/debug/health` (calls `GET /health`) as a debug-only route to prove connectivity from the emulator, plus the "DEV" ribbon for `FLAVOR=dev`.
**Acceptance:** `flutter run` shows a placeholder; `flutter test` green; CI green; `GET /health` reachable from the emulator; assets load; no secrets committed.
**Risks:** package version conflicts → resolve with `pub add`, record decisions in `docs/DECISIONS.md` (create it).

## M1 — Design system and shell  *(owner: design-system-engineer · ~3 days)*
**Goal:** the visual foundation every screen uses.
**Tasks**
1. `CydTokens` ThemeExtension from `design/tokens.json` (dark + light); `ThemeData` builders; theme mode controller (System/Light/Dark) persisted.
2. Fonts via `google_fonts` (Anton/Archivo/DM Mono) + the type ladder from doc 02; offline fallbacks.
3. Core widgets (doc 02 catalogue): buttons, chips, status chips (order **and** payment **and** card-validity), cards, inputs, radio/switch/stepper, price text, skeleton, empty/error cards, `AsyncListView`, bottom sheet, dialog, toast, copy-row, countdown pill, section label, avatar, app bars.
4. `ShellScaffold` + **floating pill tab bar** (5 tabs, badge, per-role first tab label/icon, hide rules).
5. A hidden "Design gallery" debug route showing every widget in both themes.
6. Golden tests for each widget (dark/light).
**Acceptance:** gallery matches doc 02 measurements; goldens committed; tab bar behaves per doc 02 (blur, selected pill, badge, hide on sub-screens).
**Depends on:** M0.

## M2 — Session, auth and network  *(owner: auth-network-engineer · ~3 days)*
**Goal:** log in as any role and land on the right first tab with a working, secure HTTP layer.
**Tasks**
1. `token_store`, `session_controller` (restore, login, logout, expire), redirect guard in the router.
2. `AuthRepository`: `POST /auth/login` for all roles; map errors (`Invalid credentials`, 429 rate limit copy).
3. Login screen per doc 04 (show/hide password, loading text "Logging in…", error banner, rate-limit message).
4. Splash/session restore; expiry handling (401 → clear → login with toast `Session expired. Please login again.`).
5. Role-based first-tab root (`IdHomeByRole`), Account tab stub with sign-out (clears token, user, cart, caches).
6. Cold-start "Waking up the server…" hint; offline detection banner.
**Acceptance:** each seeded account logs in and sees the right first tab (the holder lands on **My ID**; admin, manager, buyer and sellers all have role `admin`/`user` and land on **Profiles**); wrong password shows the exact message; 11 wrong attempts show the 15-minute message; killing the token (edit secure storage or wait) returns to login; sign-out leaves no personal data behind.
**Depends on:** M1.

## M3 — Profiles: list, filters, stats, form  *(owner: idcard-engineer · ~6 days)*
**Goal:** admin/user can find, create, edit, delete profiles.
**Tasks**
1. `ProfilesRepository`: `GET /profiles` (page, limit, search, deanery, parish, level, designation, sort), `GET /profiles/filter-options`, `GET /profiles/stats`, `GET /profiles/:id`, `POST /profiles`, `PUT /profiles/:id`, `DELETE /profiles/:id`.
2. Profiles screen: stats tiles (admin) / fallback (user), debounced search (500 ms), filter sheet (deanery→parish dependency), active-filter chips, infinite-scroll list (limit 25) with skeleton/empty/error, pull-to-refresh, cached first page offline.
3. Profile form (create/edit): all 14 fields, verbatim validation, dependent parish list from `assets/data/deaneries.json`, date pickers (`YYYY-MM-DD`), mandatory photo with client resize, exact write/read field mapping (`father_name`↔`father` …).
4. Credentials dialog after create (copy/share; restore-by-recreation notice).
5. Delete with confirmation; profile detail screen.
**Acceptance:** doc 04 checklists for Profiles/Form pass for `admin` and `user` (a `user` only sees profiles they created); creating a profile returns credentials and the holder can log in; deleting disables the holder login; validation messages match verbatim; list handles 1000 rows smoothly.
**Depends on:** M2. **Note:** photo upload needs Cloudinary configured on the local backend.

## M4 — ID card rendering, export and My ID  *(owner: idcard-engineer · ~6 days)*
**Goal:** the card looks exactly like the printed design and can be shared/printed; holders see their own.
**Tasks**
0. Download and register the card fonts (Vidaloka, Roboto; Gafata is in the kit) and assert they are loaded before any export.
1. Card widget per doc 07 (3 level backgrounds, mm→px scale, fonts, value rows, photo, footer) + long-text policy.
2. Golden tests with the six fixtures F1–F6 of doc 07 §14.3 (each level; long name/parish/address; edge data; photo crop).
3. Preview screen (zoom/pan), Share PNG, Save to gallery, PDF at 146.3×221.8 mm + print; filename rule.
4. **My ID** screen for `profile_holder`: `GET /profile-holder/my-profile` + `/my-id-card`, validity chip (Valid / Expires in n days / Expired, 60-day rule, 2 years), renewal copy, card preview, update photo (`PUT /profile-holder/update-profile`), offline cached card.
5. Admin/user: open any profile's card from the list.
**Acceptance:** side-by-side with the web card for the same data matches within 1 mm; exported PNG is 1728×2620 (the "original quality" option may be 2744×4160); PDF page is exactly the card size; holder can see and share their card offline after one online load.
**Depends on:** M3 (profile data) and M1.

## M5 — Account area  *(owners: idcard-engineer + auth-network-engineer · ~3 days)*
**Tasks:** account info view/edit (`GET/PUT /auth/profile`), change password (`PUT /auth/change-password`, `PUT /profile-holder/change-password` for holders; strict rules in the UI, strength meter), create user (admin, `POST /auth/register`), appearance (System/Light/Dark), sign-out dialog, role-specific entries (shop entries are added in M6/M8).
**Acceptance:** doc 04 Account checklist for all roles; password rules verbatim; holder cannot see admin-only rows.
**Depends on:** M2, M3 (for holder pieces).

## M6 — Shop browse, cart, addresses  *(owner: shop-customer-engineer · ~6 days)*
**Tasks**
1. Repositories: categories, shops (list/detail), products (list/detail/lookup), addresses CRUD.
2. Shop home (hero, search entry, category rail, promo cards (static), featured shops, product grid), Categories, Search & Filter (query, category, shops section with deanery, client sort/price), Storefront, Product detail (gallery, stock chip, stepper, add/buy now), wishlist (local).
3. Cart: per-user persisted controller, lookup revalidation with change notices, grouped by shop, stepper, undo, multi-shop banner.
4. Addresses list/form (landmark → `line2`), default handling, delete confirm.
**Acceptance:** doc 03 sections for these screens match (loading/empty/error everywhere); cart survives restart, is separate per user, clears on sign-out; price change on the server is detected at checkout; address CRUD works against the backend.
**Depends on:** M2.

## M7 — Checkout, peer-to-peer payment, orders (buyer)  *(owner: shop-customer-engineer · ~8 days)*
**Tasks**
1. Checkout (steps Address → Payment (per shop, `accepts_upi`) → Review), `POST /shop/checkout` with stable Idempotency-Key, routing to Pay / Pay-your-orders / Confirmation.
2. Pay the seller screen (copy UPI ID/amount/reference, countdown, `upi://` intent, QR, UTR form, screenshot, claim/edit claim), waiting/expired/confirmed/disputed states, polling.
3. Orders list (filters, needs-action), Order detail (role-aware; buyer part): banners by state, cancel, dispute sheet, refund-not-received.
4. Order chat (poll `?after=` 5 s) and evidence upload/view (signed URLs).
5. Action badge on the **Shop** tab (doc 02 §9.19; Cart shows the quantity badge) from `action-count`.
**Acceptance:** the full timeline in doc 06 §Worked example passes end-to-end on the local backend with the shortened timers; the buyer can never perform an action the server did not offer; double-tapping Place order creates one set of orders; expiry returns the buyer to a "no longer waiting" state.
**Depends on:** M6.

## M8 — Seller and admin  *(owner: shop-seller-admin-engineer · ~8 days)*
**Tasks**
1. Become a seller form + the five states (none/pending/rejected/suspended/approved) from `GET /shop/shops/mine`.
2. My shop: stats, Products tab (list, status chips, edit, archive), Product form (up to 6 images, categories, price/MRP/stock/status, full-body PUT), Orders tab, Shop profile tab (logo/banner, fields, password-gated UPI change).
3. Seller order handling in Order detail: confirm payment (sends the claim UTR), not received → dispute, reject (reason), refund form, fulfilment steps from `allowed_actions`; suspended-shop orders-only mode.
4. Admin: Shop applications (filters, review sheet, approve/reject/suspend/reinstate with reasons), Shop disputes (queue, detail with chat + evidence, resolve with note per origin).
**Acceptance:** doc 03 seller/admin checklists pass; admin resolves each dispute type end-to-end; seller of a suspended shop can still ship/refund; buyer–seller–admin visibility rules hold (admin sees chat only with a dispute).
**Depends on:** M7 (shared order screen).

## M9 — Quality pass  *(owners: test-engineer, api-contract-verifier, ui-fidelity-reviewer, flutter-code-reviewer · ~6 days)*
**Tasks:** full contract verification against the live local backend; UI fidelity sweep (every screen, dark/light, 360/390/412 px, text scale 1.3); accessibility (labels, contrast, tap targets, screen reader order); performance (list jank, memory with card export, image sizes); offline and poor-network behaviour; integration tests per role; security review (logs, storage, cleartext, secrets); fix everything blocking; update docs.
**Acceptance:** doc 10 checklists all pass; zero blocking findings from the three reviewers; integration suite green.
**Depends on:** M5 and M8.

## M10 — Release  *(owner: release-engineer · ~4 days)*
**Tasks:** identifiers and icons (owner input needed), flavors, Android signing + Play App Signing, iOS signing, versioning, privacy policy and data-safety answers, store listing assets, CI build artifacts, internal testing track, staged rollout plan, support contact. Details in doc 13.
**Acceptance:** a signed release build installs on a clean device, points to the production HTTPS URL, passes the smoke checklist, and the store checklists in doc 13 are complete.

---

## Cross-cutting tasks (assign when relevant)
- **Strings**: collect user-visible text in `core/strings.dart` from the first screen on.
- **Accessibility**: semantics labels for every icon-only button and glyph (doc 02).
- **Analytics/crash**: none until M10 decision.
- **Decision log**: `docs/DECISIONS.md` — one line per non-obvious decision (package choice, deviation, new conflict).

## Risk register
| Risk | Impact | Mitigation |
|---|---|---|
| Local backend lacks Cloudinary → photo flows can't be tested | M3/M4/M8 blocked | Owner provides a Cloudinary dev account; until then test with API-created profiles (no photo) and mock uploads |
| Render cold starts make demos feel broken | UX | Wake-up hint, retry GET once, keep the Render instance warm during demos |
| Card text overflow for long parish/address | Ugly cards | Long-text policy in doc 07 + golden fixtures |
| Rules drift between app and backend (order actions) | Bugs | Render only from `allowed_actions`; contract verifier each milestone |
| iOS/Android differences (UPI intents, gallery save, permissions) | Late surprises | Test on both from M4 on; doc 13 permission list |
| Backend PRs not merged yet | App built on a branch | Develop on `claude/happy-bell-oy6or2`; re-verify after merge (M9) |
| Owner sign-off on invented screens late | Rework | Share screenshots after M1 (tokens), M3/M4 (ID area), M7 (payment) |

## Progress tracker (the orchestrator updates this; `/status` reads it)

| Milestone | Status | Owner agent(s) | Notes |
|---|---|---|---|
| M0 Scaffold | ☑ done 2026-11-20 | app-architect | analyze/format clean, 89 tests, code review passed. Ran on Android 14 phone (adb reverse); live `GET /health` OK against local backend. App ids provisional until M10. |
| M1 Design system & shell | ◐ in progress 2026-11-25 | design-system-engineer | Built to design v2 (gold, Instrument Serif/Manrope). Review fixes in 3c7c811. Left: contrast fixes (WIP), reviewer re-run, owner visual sign-off. See docs/HANDOFF.md. |
| M2 Session & auth | ☐ | auth-network-engineer | |
| M3 Profiles | ☐ | idcard-engineer | |
| M4 ID card & My ID | ☐ | idcard-engineer | |
| M5 Account | ☐ | idcard-engineer, auth-network-engineer | |
| M6 Shop browse & cart | ☐ | shop-customer-engineer | |
| M7 Checkout, pay, orders | ☐ | shop-customer-engineer | |
| M8 Seller & admin | ☐ | shop-seller-admin-engineer | |
| M9 Quality | ☐ | test-engineer + reviewers | |
| M10 Release | ☐ | release-engineer | |

Legend: ☐ not started · ◐ in progress · ☑ done (all Definition-of-Done items met).
