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
Phase 1 — Registration + Fees. Dispatching `frontend-builder` next.
