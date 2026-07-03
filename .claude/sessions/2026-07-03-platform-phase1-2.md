# 2026-07-03 — Multi-Diocese Platform: Phases 1–2 frontend

Branch: `feature/multi-diocese-platform`. Follows the Phase 0 baseline
(`2026-07-03-platform-phase0-baseline.md`). User approved the full Phase 1–2
scenario map and build order; approval standing for the session.

## Backend discovery (changes the plan)
The backend session has ALREADY shipped **all phases 1–6** on its branch
(commits ece5196 → 1a2e824): `routes/platform.js`, `org.js`, `imports.js`,
`permissions.js`, `idCardTemplates.js`, `events.js`, `qr.js`. Its
`shared/API_CONTRACT.md` documents Phases 5–6 but NOT 1–4, so:
- Synced `shared/API_CONTRACT.md` from the backend repo (was stale here).
- Wrote **`shared/API_CONTRACT_PLATFORM.md`** documenting the Phase 1–2
  endpoints as verified from backend code (routes + controllers), including
  quirks the FE had to adapt to:
  - **No reject endpoint** — suspend doubles as reject; no reactivate — re-approve.
  - **No setup-state endpoint** — wizard progress is client-side localStorage.
  - Imports travel as **raw base64 .xlsx** in JSON bodies (photo-upload convention).
  - Approval auto-creates admin `<slug>.admin`, password = registered contact
    phone (bcrypt 12), and seeds Phase-3 system roles.

## Shipped (frontend)
New files:
- `src/utils/platformHelpers.js` (+ 13 unit tests) — slugify/slug rules
  (mirror backend), tenant gates (`isLegacyDiocese` / `isSuperAdmin` /
  `isNewDioceseAdmin`), status chips, base64 file helpers, setup progress.
- `src/api/platformApi.js` — facade in the anubhavApi pattern
  (envelope unwrap/errorEnvelope, `REACT_APP_PLATFORM_MOCK !== 'false'` toggle).
- `src/api/platformMock.js` — in-memory mock mirroring backend shapes exactly
  (dioceses seeded with Jalandhar active + one pending sample; org CRUD;
  CSV-based import parse/validate/commit incl. column auto-mapping and error
  file; jobs log).
- `src/pages/platform/DioceseRegistration.jsx` (+6 tests) — public form, slug
  auto-derive, 409 → slug field error, pending-confirmation state.
- `src/pages/platform/ApprovalConsole.jsx` (+4 tests) — pending/active/suspended
  tabs, approve dialog → one-time credentials dialog with copy, reject/suspend
  via shared ConfirmDialog.
- `src/pages/platform/OrgStructureManager.jsx` — deanery accordion + parish
  chips CRUD, 409s surfaced, embeddable in the wizard.
- `src/pages/platform/ImportWizard.jsx` — 3-step Stepper (upload+template
  download → column mapping with server auto-suggest + sample preview →
  validate dry-run with per-row errors → commit with auto-create-users toggle,
  credentials table, errors-workbook download), import history panel.
- `src/pages/platform/SetupWizard.jsx` — 4 steps: org structure (manual CRUD or
  org-import) → ID designer (Phase 4 placeholder) → invite roles (Phase 3
  placeholder) → done; progress per diocese in localStorage.

Additive edits to existing files (legacy diocese-1 rendering unchanged):
- `Login.jsx` — "Register your diocese" link under the form (user approved).
- `App.js` — pre-login view switch login ↔ diocese registration.
- `Dashboard.jsx` — super_admin menu (Dashboard/Diocese Approvals/Settings);
  new-diocese admin menu items (Organisation/Bulk Import/Setup Wizard);
  Anubhav menu items + live banner now gated `isLegacyDiocese(user)` (all
  existing users resolve legacy=true → identical menu); setup wizard auto-opens
  for new-diocese admins until completed.
- `App.test.js` — replaced the CRA default "learn react" test (broken since the
  app was created: axios ESM + asserts content that never existed) with two
  real smoke tests using the established axios-mock pattern.

## Repo corruption found & fixed
A rogue snippet-generator had prepended/overwritten files with an invalid React
stub (`const X.test = () => ...`):
- `src/pages/SpeakersManager.test.js` (uncommitted) — reverted (user approved).
- **~120 files inside `node_modules`** (stylehacks, tailwindcss, jsx-ast-utils,
  eslint-plugin-jsx-a11y, stackblur-canvas, @emotion/unitless) — this was the
  cause of the **pre-existing production build failure**
  (`Css Minimizer … Unexpected token '<'` — stylehacks' htmlFirstChild.js was a
  React stub). Verified the failure exists on untouched HEAD; fixed by full
  `rm -rf node_modules && npm ci`. First `npm ci` attempt died on a locked
  `.cache/babel-loader` dir (Windows ENOTEMPTY) — the full rm was required.

## Verification (all green)
- `platformHelpers` 13/13, `DioceseRegistration` 6/6, `ApprovalConsole` 4/4.
- Full suite: **8 suites / 39 tests green** (was 7 green + 1 pre-broken).
- eslint clean on every touched file (IDE inline diagnostics were stale/garbled
  all session — eslint CLI used as source of truth).
- **Production build: Compiled successfully** after the node_modules reinstall
  (first clean build since the corruption).
- **ui-guardian-qa: PASS** — line-by-line diff audit of the 5 modified files;
  legacy diocese-1 users (diocese_id 1/null/undefined/"1", incl. loc/dexco and
  profile_holder edge cases) get a byte-identical menu and dashboard; only
  visible change is the pre-approved Login link. No stray file modified.

## Next
- Phase 3 (permissions matrix UI, usePermissions/<Can>) — backend live.
- Phase 4 (ID card designer, react-rnd; needs `react-rnd` + `qrcode` deps).
- Backend session should mirror `shared/API_CONTRACT_PLATFORM.md`.
