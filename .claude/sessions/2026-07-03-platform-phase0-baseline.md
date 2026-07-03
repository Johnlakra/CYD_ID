# 2026-07-03 — Multi-Diocese Platform: Phase 0 Baseline (frontend)

Branch: `feature/multi-diocese-platform` (at 8b7b2cb). Orchestrator: platform-orchestrator-fe.
Purpose: freeze a written snapshot of every screen/flow the platform work must NOT change.

## Verification of prior work
- **No platform-phase code exists in this repo.** `.claude/sessions/` contains only Anubhav
  logs (2026-05-23, 2026-05-28). No diocese/registration/import/permission/designer files found.
- HEAD (8b7b2cb ".") only prepended deprecation notes to `MANAGER_AGENT.md` / `MASTER_PLAN.md`
  pointing to `MASTER_PLAN_PLATFORM.md`.
- Uncommitted: `src/pages/SpeakersManager.test.js` has a **corrupted, syntactically invalid
  stub prepended** (`const SpeakersManager.test = () => ...`). Breaks the test suite.
  Recommendation: revert this hunk (`git checkout -- src/pages/SpeakersManager.test.js`).
- `shared/API_CONTRACT.md` (142 lines) is **Anubhav-only** — zero platform endpoints
  (`/platform/*`, `/org/*`, imports, permissions, templates all absent).

## Architecture snapshot (as of this baseline)

### Shell & routing
- **No react-router.** `src/App.js` toggles `<Login>` ↔ `<Dashboard>` on localStorage
  `authToken`/`user`. `Dashboard.jsx` (735 ln) is the shell: permanent/temporary MUI Drawer
  (width 280/64), AppBar, footer; content switched by `selectedMenu` string via
  `renderContent()` switch — pages are components, not routes.
- Menu building (`getMenuItems()`): `profile_holder` without event role → My Profile /
  Anubhav 2026 (MyEvent) / Settings. admin|user → Dashboard, ID Card Management, Profile &
  Settings; + 4 Anubhav tabs for admin|loc|dexco; + Speakers for admin|dexco; +
  Role Management for admin only.
- Auth: `POST {baseURL}/auth/login` → `{ success, data: { token, user } }` stored in
  localStorage. `src/api/apiClient.js`: axios instance, `baseURL = 'http://localhost:3000'`,
  Bearer interceptor, 401 → clears token, `window.location.href = '/login'`.

### ID card flow (pixel-freeze target)
- `IDCard.jsx` (285 ln): fixed 146.3mm × 221.8mm div; background chosen by `data.level`
  from 3 hardcoded imports (`assets/images/Parish|Deanery|Dexco.jpg`); absolutely-positioned
  fields in mm. Fonts: Vidaloka (name, 31.5px, #C01E2C), Roboto (designation 16px #C01E2C;
  footer 19px #fff), Gafata (detail rows, 24.2px, #000, left 54mm, rows at top 128 /
  136.1 / 144.12 / 152.4 / 160.68 / 168.96 / 177.24mm). Photo: top 42.5mm, centered,
  58×67mm, radius 14px, border 1px #8D8D8D. Footer at 213mm: "Issued: DD-MM-YYYY" |
  "Valid for two years". Export: `html-to-image` `toPng(ref, { cacheBust, scale: 3 })`,
  filename `${name}-${parish}-${phone}`.
- `IDCardTabs.jsx` (114 ln): 2 tabs — Create ID Card (`FormDetails`) / Manage Profiles
  (`ManageProfiles`); edit switches to tab 0 with `editProfile` prefill.
- `FormDetails.jsx` (1029 ln): react-hook-form + yup; required: name, father, mother,
  DOB, baptism, issue_date, address, parish, deanery, qualification, phone (10 digits),
  involvement, level, designation. Its own inline `deaneries` map (16 deaneries; note
  `"Ajnala "` parish has a trailing space here, unlike ManageProfiles' copy).
  Levels: parish|deanery|dexco. 13 designations. Photo via `EncodeBase64`.
- `ManageProfiles.jsx` (738 ln): 2 sub-tabs (ID-Card Profiles / Independent Entries).
  Server-side filter/sort/pagination on `GET /profiles`; options from
  `GET /profiles/filter-options` with inline `fallbackDeaneries` static map as fallback;
  delete dialog; ID-card preview dialog maps row → IDCard props (photo_url→photo,
  father→father_name, dob→date_of_birth).

### Static org data (diocese-1 source of truth)
- Deanery→parish map duplicated inline in `FormDetails.jsx`, `ManageProfiles.jsx`
  (fallback), `EditProfileDialog.jsx` — there is **no standalone JSON file**; the "static
  JSON" is these literals. 16 deaneries. Stays untouched for diocese 1.

### Anubhav module (frozen, additive precedent)
- `src/api/anubhavApi.js` (512 ln) facade + `anubhavMock.js` (1515 ln) in-memory mock;
  `REACT_APP_ANUBHAV_MOCK !== 'false'` → mock. Routes under `/anubhav/*` per contract.
- `src/utils/anubhavHelpers.js`: PLACES, PLACE_META, DEANERY_TO_PLACE, fee/soft-cap
  constants, ID_CARD_REQUIRED_FIELDS, `to12h` (12-hour rule), chip colors.
- Pages: AnubhavRegistration (RegisterYouth/RegisteredYouthList), AccommodationManager
  (BuildingSetup/RoomBoard/RoomingPdfGenerator jsPDF), TimetableManager,
  AnnouncementManager, AnubhavLiveBanner, MyEvent, RoleManagement, SpeakersManager,
  IndependentEntriesTab + dialogs (IndependentEntry, PromoteIndependent, badges).

### Design language tokens (new screens must match)
- Default MUI theme (no custom theme file; `src/theme/` is empty). Cards `borderRadius: 3–4`,
  gradient stat cards `alpha(color, 0.2→0.05)`, hover `translateY(-4/-8px)` + soft shadow,
  page headers `variant="h4" fontWeight 300` + `body1 text.secondary` subtitle, tabs
  `textTransform: 'none'` minHeight 64, drawer selected item `alpha(primary, 0.1)`,
  react-toastify top-right, dayjs, 12-hour display everywhere.

### Test/tooling baseline
- No E2E script in this repo (plan's `scripts/anubhav-e2e.js` lives in the backend).
- Unit tests: IndependentBadge, IndependentEntriesTab, SpeakersManager, anubhavHelpers,
  App.test.js (CRA default). `src/pages/__tests__/` exists but is empty.
- CRA (react-scripts 5), not Vite. Key deps: MUI v5, axios, dayjs, html-to-image, jspdf,
  react-hook-form+yup, formik+yup (both present), swr (present, unused in core flows).
- **Not yet installed** (needed later per plan): react-rnd (Phase 4), qrcode +
  html5-qrcode (Phase 6), xlsx/exceljs client template download (Phase 2 — TBD).

## Phase-0 exit status
- Baseline doc: this file. Screens/flows recorded above.
- Blocker for Phase 1–2 coding: `shared/API_CONTRACT.md` contains no platform endpoints.
  Per hard rule 2, the backend session must ship the contract additions first.
- Awaiting user confirmation of the architecture summary + Phase 1–2 scenario map
  (presented in chat 2026-07-03) before any code is written.
