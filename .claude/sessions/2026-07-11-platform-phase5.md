# Session 2026-07-11 — Platform Phase 5 frontend (generalized events)

Branch (both repos): `feature/multi-diocese-platform`

## Done this session (Phase 5 FE — Pillar E)
- `src/utils/eventHelpers.js` — status lifecycle (draft→open→closed→archived),
  wizard step validators, venue_key slug/pattern, payload builders,
  display-only fee math, DD-MM-YYYY formatting, CSV builder + download.
- `src/api/platformMockEvents.js` — separate mock module (file-size rule):
  events CRUD (DELETE = soft archive), venues CRUD (409 on duplicate key),
  stats; diocese-scoped. Seeds mirror BE migration 106: event 1 = Anubhav 2026
  (open, fee ₹50, 3 venues w/ exact deanery batches) + diocese-2 sample
  parish-scoped draft (no accommodation). `__resetEventsMock()` for tests.
- `src/api/platformApi.js` — Phase 5 section: listEvents/createEvent/getEvent/
  updateEvent/archiveEvent, venue CRUD, getEventStats (`/events*`).
- `src/pages/platform/events/` — `EventsManager.jsx` (list ⇄ wizard ⇄ records,
  same shell pattern as IdCardDesigner), `EventWizard.jsx` (4-step stepper:
  basics&scope → venues [org-structure-fed freeSolo pickers, auto venue_key]
  → module/fee toggles → review, Save-as-draft or Publish), `EventRecords.jsx`
  (stats cards, per-venue registrations table, indicative fee totals
  [counts × fee, labeled non-authoritative], lifecycle buttons w/ confirm,
  venue add/edit/delete dialog, CSV export gated by `ui.button.export_xlsx`).
- `Dashboard.jsx` — "Events" menu item (admins with `ui.tab.events`,
  EventNote icon), case `platform-events`. Additive; legacy menus untouched.
- Tests **121/121 green** (28 new: helpers 15, events mock 13).
  `react-scripts build` clean (+7.99 kB main).
- Plan row 5 marked FE DONE in `.claude/MASTER_PLAN_PLATFORM.md`.

## What's left (in order)
1. **Phase 6 FE** — My QR card (profile-holder dashboard), scan-desk page
   (`html5-qrcode` — NOT installed yet), duplicate handling, phone fallback.
   BE `/qr*` + `GET /profiles/qr/:token` + `POST /events/:id/registrations`
   live. Wire the `qr` element in TemplateCardRenderer to the real
   `CYD:<slug>:<qr_token>` payload (`qrcode` npm lib — NOT installed yet).
2. **Phase 7** — cross-repo E2E (BE `scripts/anubhav-e2e.js` + FE suite),
   sync the two MASTER_PLAN copies, contract check, session log.

## Gotchas
- ECC Fact-Forcing Gate blocks the FIRST Write/Edit/Bash per file/session;
  present the facts then retry (or `ECC_GATEGUARD=off`).
- No BE endpoint lists an event's individual registrants — the records page is
  stats-driven (`GET /events/:id/stats`); CSV export is client-side from
  on-screen per-venue data. Participant-level lists would need a new BE
  endpoint (candidate for Phase 7 polish).
- Fee totals in the UI are labeled indicative (counts × fee_amount); never
  treat as authoritative.
- Mock diocese defaults to 2 when the stored user has no `diocese_id`;
  diocese-1 logins see Anubhav 2026 seeded, diocese-2 sees the parish draft.
- mgrep (session-mandated search tool) needs interactive login — unavailable;
  fell back to grep/find.
- HARD RULE: Jalandhar design/flows 100% unchanged; everything additive.
