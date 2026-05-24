# Session: 2026-05-23 — Anubhav 2026 bootstrap (frontend repo)

Repo: `CYD_ID` (frontend) — detected by presence of `src/App.js` and absence of `server.js`.
Branch: `feature/anubhav-2026-event-module` (created from `master` at `4319384`).

## State on entry
- `master` had an uncommitted change in `src/api/apiClient.js`
  (`baseURL` switched from `https://cyd-id-be.onrender.com` to `http://localhost:3000`).
  Decision: treat as local dev-loop config; carried with working tree, NOT committed.
- No prior `.claude/sessions/` log existed.

## Shipped this session
- `4da1b35` `chore: bootstrap Anubhav 2026 event-module plan and agents`
  - `MASTER_PLAN.md`, `MANAGER_AGENT.md`
  - `shared/API_CONTRACT.md`
  - `frontend/CLAUDE.md`
  - `frontend/agents/{repo-analyzer,frontend-builder,ux-reviewer,pdf-specialist}.md`

## Contract changes the backend repo must mirror
None yet.

---

## repo-analyzer report (2026-05-23) — Anubhav Phase 1 insertion plan

### 1. Existing structure
React 18 + MUI v5 (default theme, no custom theming) + axios. Navigation uses
`selectedMenu` state in `src/components/Dashboard.jsx` with `getMenuItems()` returning
role-gated menu items and `renderContent()` switching screens via a switch statement
(no react-router). Auth via `Login.jsx` stores `authToken` and `user` (with `role`)
in localStorage; `src/api/apiClient.js` interceptor injects `Authorization: Bearer …`
on every request. Tab pattern exists in `src/pages/IDCardTabs.jsx`. Deanery→parish
chaining pattern lives in `src/pages/ManageProfiles.jsx` via
`filterOptions.deanery_parish_map` + a `getAvailableParishes` memo. `react-toastify`
and `dayjs` are in use. No `event_role` / `loc_place` anywhere yet.

### 2. Files to ADD
- `src/pages/AnubhavRegistration.jsx` — tabbed wrapper (Register + Registered Youth), mirrors `IDCardTabs`.
- `src/pages/RegisterYouth.jsx` — search-by-deanery→parish→youth, attach chaperone, place selector.
- `src/pages/RegisteredYouthList.jsx` — filterable list per place, fee totals, un-register.
- `src/utils/anubhavHelpers.js` — fee math, place labels, deanery→place mapping (per MASTER_PLAN §1).

### 3. Files to EDIT (additive only) — `src/components/Dashboard.jsx`
- **Imports (lines 25–38):** add `Event as EventIcon` to the `@mui/icons-material` group.
- **Imports (after line 44):** `import AnubhavRegistration from '../pages/AnubhavRegistration';`
- **`getMenuItems()` (after line 71, before line 73):** new conditional branch that returns
  the full menu plus an `anubhav-registration` item when `user?.event_role` is `'loc'` or `'dexco'`.
- **`renderContent()` (between line 283 `case 'id-card'` and line 285 `case 'profile'`):**
  add `case 'anubhav-registration': return <AnubhavRegistration ... />;`

### 4. `apiClient.js`
No edits. Existing interceptor (lines 13–24) already attaches token; `/anubhav/*` inherits.

### 5. Patterns to mirror
- Tabs: `src/pages/IDCardTabs.jsx:17-122`.
- Deanery→Parish chain: `src/pages/ManageProfiles.jsx:292-297` (memo) and `382-417` (Selects).
- Card layout: `ManageProfiles.jsx:334-361` (Card BorderRadius 3, CardHeader, CardContent).
- Toast: `ManageProfiles.jsx:48,161,196,204,251,255,262`.
- dayjs: `src/components/ProfileInfo.jsx:17`.
- API + 401 logout pattern: `ManageProfiles.jsx:159-209`.
- Loading state: `ManageProfiles.jsx:35,161-175` (CircularProgress in Card height 140).
- Query params: `ManageProfiles.jsx:168-177` (URLSearchParams).

### 6. STOP signals
None. All insertions additive.

### 7. Open questions (need user decisions before frontend-builder dispatch)
1. **Role fetch timing:** Call `GET /anubhav/me/role` in a Dashboard useEffect and merge
   into `user` state, OR have backend bake `event_role`/`loc_place` into the login response?
2. **Place selector for LOC:** Auto-fill and disable to `loc_place`, OR allow change?
3. **Deanery→Place mapping location:** Hardcode in `anubhavHelpers.js` (from MASTER_PLAN
   §1), OR new backend endpoint?
4. **Fee display granularity:** Collapsible Place→Deanery→Parish→Youth hierarchy, OR flat
   table with summary cards?
5. **Soft cap (>15/parish):** Dialog on register, badge in list, or both?

---

## Open coordination questions for the backend session
- Phase 1 endpoints required before frontend can leave mocks:
  - `GET /anubhav/me/role`
  - `GET /anubhav/eligible?place=&deanery=&parish=&search=`
  - `POST /anubhav/registrations`
  - `GET /anubhav/registrations?place=&deanery=&parish=`
  - `DELETE /anubhav/registrations/:id`
  - `GET /anubhav/chaperones?place=&parish=`
  - `POST /anubhav/chaperones`
  - `GET /anubhav/fees?place=`
- Roles/promotion endpoints: `GET /anubhav/me/role`, `POST /anubhav/roles/grant`, `GET /anubhav/roles`.
- New `users` columns `event_role`, `loc_place` must exist or frontend role gate returns `none` for everyone.

## Decisions (2026-05-23, user-confirmed)
1. **Backend status:** build against mocks now. Mock layer gated by env flag
   `REACT_APP_ANUBHAV_MOCK` (default `true` until backend is live).
2. **Role fetch:** `GET /anubhav/me/role` in Dashboard `useEffect` on mount; result stored
   in Dashboard state and threaded into `getMenuItems()`. No edits to `Login.jsx`.
3. **LOC place selector:** auto-filled to `loc_place` and disabled. Server re-enforces.
4. **Deanery→Place mapping:** hardcoded in `src/utils/anubhavHelpers.js` per MASTER_PLAN §1.
5. **Fee display:** flat table per parish + summary cards (place total, deanery totals,
   overall). Collapsible hierarchy deferred.
6. **Soft cap (>15/parish):** confirm dialog at register-time AND warning badge on the
   parish row in the list. Threshold const `SOFT_CAP_PER_PARISH = 15`.

## Phase pointer
Phase 1 — Registration + Fees. **COMPLETE** (frontend). Backend still mocked.
Phase 2 — Accommodation. **COMPLETE** (frontend). Backend still mocked.
Phase 3 — Timetable + Announcements + Live view. **COMPLETE** (frontend). Backend still mocked.

**All three phases complete (frontend, mock-backed). Next: backend implementation in `cyd_Id_BE`.**

---

## Phase 2 results (2026-05-24, session 3)

### Shipped
| File | Commit | Status |
|------|--------|--------|
| `src/pages/AccommodationManager.jsx` | `a5c420f` | **NEW** — 3-tab wrapper (Building Setup / Room Board / Generate PDFs) |
| `src/pages/BuildingSetup.jsx` | `a5c420f` | **NEW** — Accordion building→floor→room tree with Add dialogs |
| `src/pages/RoomBoard.jsx` | `a5c420f` | **NEW** — Room grid cards with occupancy bar, allot/un-allot |
| `src/api/anubhavMock.js` | `a5c420f` | **EDITED** — Phase 2 seed data: 6 buildings, 12 floors, 36 rooms, 4 allotments |
| `src/api/anubhavApi.js` | `a5c420f` | **EDITED** — Phase 2 API facade: getBuildings, createBuilding/Floor/Room, createAllotment, deleteAllotment, getRooming |
| `src/components/Dashboard.jsx` | `a5c420f` | **EDITED** — ApartmentIcon, AccommodationManager import, menu item, renderContent case |
| `src/pages/RoomingPdfGenerator.jsx` | `ea3dc7f` | **NEW** — jsPDF client-side PDF generator, 4 scopes (room/floor/building/place) |
| `src/pages/AccommodationManager.jsx` | `ea3dc7f` | **EDITED** — Replaced PDF placeholder with `<RoomingPdfGenerator />` |

### Phase 2 acceptance criteria
- [x] Building → Floor → Room hierarchy create UI with Add dialogs
- [x] Live occupancy/capacity chips per room and building
- [x] Room board showing allotment grid with allot/un-allot per youth
- [x] Place-partitioned: Building Setup and Room Board both scope by `activePlace`
- [x] PDF: Room Sheet, Floor Sheet, Building Sheet, Full Place Rooming List
- [x] PDF: mobile-safe `doc.save()` download, no `window.open()`
- [x] PDF: A4, place/venue/dates header on every page, alternating-grey rows, Page N of M footer
- [x] LOC sees only their assigned place; DEXCO sees place selector
- [x] No new npm deps (jsPDF was already in package.json)

### Phase 3 — Timetable + Announcements + Live view — COMPLETE

Commit: `888c2cf`

| File | Status |
|------|--------|
| `src/pages/TimetableManager.jsx` | **NEW** — inline add form + grouped-by-day table with delete |
| `src/pages/AnnouncementManager.jsx` | **NEW** — post form (DEXCO gets diocese-wide scope) + list with delete |
| `src/pages/AnubhavLiveBanner.jsx` | **NEW** — NOW/NEXT chip banner, polls every 2 min, loc/dexco only |
| `src/api/anubhavMock.js` | **EDITED** — 27 timetable seed items (3 places), 3 announcements, 8 new mock fns |
| `src/api/anubhavApi.js` | **EDITED** — 8 new exports incl. getTimetableLive, updateTimetableItem |
| `src/components/Dashboard.jsx` | **EDITED** — ScheduleIcon, CampaignIcon, 2 sidebar items, 2 renderContent cases, live banner |

### What's next — Backend implementation
All frontend phases are complete and mock-backed (REACT_APP_ANUBHAV_MOCK=true).
Switch to the `cyd_Id_BE` repo (branch `feature/anubhav-2026-event-module`) and:
1. Run `schema-architect` to generate the migration (`backend/migrations/001_anubhav_event_module.sql`)
2. Run `api-builder` for each phase of endpoints per `shared/API_CONTRACT.md`
3. Once backend is live, set `REACT_APP_ANUBHAV_MOCK=false` to connect frontend to real data

---

## Session 4 enhancements (2026-05-24) — UX polish, PDF upgrades, batch allotment

### Files changed (no new commits yet — all uncommitted working-tree changes)

| File | Repo | Changes |
|------|------|---------|
| `src/pages/RegisterYouth.jsx` | frontend | Per-youth remove button in confirmation dialog; `IconButton` + `Tooltip` + `PersonRemoveIcon`; auto-close when list empties |
| `src/pages/AnubhavRegistration.jsx` | frontend | **Full Diocese Report** PDF button (DEXCO only): fetches all 3 places, generates combined landscape A4 with per-place sections + summary page (grand total); imports `jsPDF`, `getRegistrations`, `FEE_PER_YOUTH` |
| `src/pages/RegisteredYouthList.jsx` | frontend | (1) `registered_at` grid column: 12hr format (`h:mm A`). (2) PDF report passes active `deanery`/`parish` filter to API; subtitle + filename reflect scope (`All Participants` / `Deanery` / `Parish · Deanery`). (3) Chaperone column: `Name Phone#` instead of `Name (Type)`. (4) Fee: just the number, no `Rs.` prefix. (5) Deanery column removed from PDF (32mm freed → Chaperone 40→72mm, Parish 40→45mm). |
| `src/pages/RoomBoard.jsx` | frontend | `AllotDialog` rewritten: multiselect `Autocomplete` (`disableCloseOnSelect`), Avatar renderOption, Chip renderTags, `getOptionDisabled` caps at vacant slots, live "N selected · M slots remaining" counter; calls `createAllotmentBatch` |
| `src/api/anubhavApi.js` | frontend | Added `ROUTES.allotmentsBatch`, `createAllotmentBatch` export; imported `mockCreateAllotmentBatch` |
| `src/api/anubhavMock.js` | frontend | Added `mockCreateAllotmentBatch`: capacity pre-check, per-registration-id loop, `{ succeeded, failed }` response |
| `src/pages/TimetableManager.jsx` | frontend | `to12h` helper (24h→12h); table time column uses `to12h`; **Download PDF** button → portrait A4, grouped by day, 4 cols (Time/Title/Location/Notes), Page N of M |
| `controllers/anubhavAllotmentController.js` | backend | Added `createAllotmentBatch`: validates room/place/vacancy upfront, loops registration_ids, partial-success reporting |
| `controllers/anubhavRegistrationController.js` | backend | Added `c.phone AS chaperone_phone` to `listRegistrations` SELECT |
| `routes/anubhav.js` | backend | `POST /anubhav/allotments/batch` registered before `/:id` to avoid param collision |

### Key decisions
- **Confirmation dialog remove**: `setSelectedProfiles(next)` on each remove; `setConfirmOpen(false)` when `next.length === 0` — dialog auto-dismisses if all youth removed
- **Full Diocese Report** (DEXCO only): 3 place sections + summary table page at end; grand total line; single `doc.save('anubhav-full-diocese-report-2026.pdf')`
- **PDF filter-awareness**: `generateParticipantReport` reads component-state `deanery`/`parish` — no extra props needed; filename slug derived from `(parish || deanery || activePlace).replace(/[^a-zA-Z0-9]/g, '-')`
- **Batch allotment route order**: Express matches `/allotments/batch` before `/allotments/:id` — route must be declared first in `anubhav.js`
- **12hr format scope**: only `RegisteredYouthList.jsx` used `HH:mm` — all other dayjs calls are date-only; no other files needed changes

### Acceptance criteria
- [x] Confirmation dialog: per-youth remove button, auto-close on empty
- [x] Full Diocese PDF: all 3 places + summary, DEXCO-only button
- [x] Per-place PDF: respects deanery/parish filter, filename matches scope
- [x] Chaperone column in all PDFs: name + phone
- [x] Fee in all PDFs: compact number-only
- [x] Deanery column removed from participant PDF; Chaperone column widened
- [x] Room Board: multiselect autocomplete allot, capacity enforced in UI and backend batch endpoint
- [x] Timetable: 12hr display, PDF download
- [x] RegisteredYouthList grid: 12hr registered_at

---

## frontend-builder results (2026-05-23, session 2)

### Shipped
| File | Status |
|------|--------|
| `src/utils/anubhavHelpers.js` | pre-existing — unchanged |
| `src/api/anubhavMock.js` | pre-existing — unchanged |
| `src/api/anubhavApi.js` | pre-existing — unchanged |
| `src/pages/RegisterYouth.jsx` | pre-existing — unchanged |
| `src/pages/RegisteredYouthList.jsx` | pre-existing — unchanged |
| `src/pages/AnubhavRegistration.jsx` | **NEW** — tabbed wrapper |
| `src/components/Dashboard.jsx` | **EDITED** — EventIcon, AnubhavRegistration import, getMyRole import, eventRole/locPlace state, role-fetch useEffect on mount, menu item gate, renderContent case |

### Key design decisions implemented
- DEXCO: place selector (FormControl) visible with all 3 place options. Defaults to `phagwara`.
- LOC: place auto-filled from `locPlace` prop, selector hidden (server re-enforces).
- Mock role defaults to `dexco` in `anubhavMock.js` → sidebar item always visible in dev.
- `refreshKey` incremented by `onRegistered` callback from RegisterYouth → RegisteredYouthList re-fetches.
- Anubhav menu item inserted at index 2 (after ID Card, before Profile) for users with event_role ∈ {loc, dexco}.
- `profile_holder` branch in `getMenuItems` intentionally not touched (no event participation for profile_holders in Phase 1).

### Acceptance criteria verified
- [x] `AnubhavRegistration` renders two tabs: "Register Youth" / "Registered Youth"
- [x] Place selector visible for DEXCO, hidden for LOC
- [x] `onRegistered` callback increments `refreshKey` so list auto-refreshes after registration
- [x] Dashboard role fetch on mount — no login change needed
- [x] All files exist and are correctly cross-referenced
- [x] CSS minifier `SyntaxError: Unexpected token '<'` is a pre-existing build issue, not new

### Phase 2 — Accommodation
Next task: design building/floor/room UI. Backend endpoint phase 2 shapes are already in `API_CONTRACT.md`.
Dispatch `repo-analyzer` to identify where `AccommodationManager.jsx` should be inserted and what patterns to mirror.

