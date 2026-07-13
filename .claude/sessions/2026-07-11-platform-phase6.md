# Session 2026-07-11 (b) — Platform Phase 6 frontend (QR + scan desk)

Branch (both repos): `feature/multi-diocese-platform`

## USER INSTRUCTION
User said: *"stop and finalize and create handoff"* after Phase 6 completion.
→ **STOPPED after Phase 6.** Resume with **Phase 7** only on user command.

## Done this session (Phase 6 FE — Pillar F)
- `npm i qrcode@^1.5.4 html5-qrcode@^2.3.8`.
- `src/utils/qrHelpers.js` — token/payload validation (`CYD:<slug>:<uuid>`),
  `parseQrPayload`, `toQrDataUrl` (SVG via QRCode.toString — no canvas needed,
  crisp at print scale), 12-hour `formatScanTimestamp`.
- `src/setupTests.js` — TextEncoder/TextDecoder polyfill (jsdom lacks them;
  the `qrcode` lib needs them; browsers have them natively).
- `src/api/platformMockQr.js` — synthetic profile store (tokens matching the
  Anubhav venue deanery batches), my-qr, ensure-token, phone search;
  `__resetQrMock()`.
- `src/api/platformMockEvents.js` — added `mockQrScanLookup` (eligibility:
  event_open/deanery_allowed/already_registered/reason, mirrors routes/qr.js
  incl. empty-deanery-list = open venue) + `mockScanRegister` (400 not-open /
  deanery mismatch, 409 duplicate w/ registered_at, stats bump).
- `src/api/platformApi.js` — Phase 6 section: getMyQr, ensureProfileQr,
  qrScanLookup, scanRegister (preserves 409 duplicate metadata),
  searchScanProfiles (mock store; real mode = legacy GET /profiles?search=).
- `src/components/MyQrCard.jsx` — self-hiding "My QR" card; mounted in
  ProfileHolderDashboard right column (additive).
- `src/pages/platform/events/ScanDesk.jsx` — event+venue pickers (open events
  only), html5-qrcode camera w/ 3s re-scan cooldown, confirm card w/
  eligibility alerts, big Register button, success flash (<2s ready-for-next),
  duplicate warning w/ 12-hour timestamp, phone-search fallback registering
  via profile_id. Camera-unavailable degrades to phone search.
- `Dashboard.jsx` — "Scan Desk" menu gated by `events.scan_register`;
  **ScanDesk is React.lazy** (html5-qrcode ≈ 110 kB gzip → own chunk; main
  bundle 461.96 kB, only +22 kB over Phase 5).
- `IDCard.jsx` — when the resolved template has a `qr` element and `data.id`
  exists: ensureProfileQr → SVG data URL → `data.qr_image_url` (renderer
  already consumed it; placeholder/legacy paths untouched).
- Tests **143/143 green** (22 new: qrHelpers 7, QR/scan mocks 15).
  `react-scripts build` OK (only html5-qrcode's harmless upstream
  source-map warnings).

## What's left
**Phase 7** — cross-repo E2E (BE `scripts/anubhav-e2e.js` + FE suite), sync
the two MASTER_PLAN copies, contract check, final session log. Candidate
polish: BE endpoint for per-event registrant lists (records page is
stats-only today; name-level export needs it).

## Gotchas
- ECC Fact-Forcing Gate blocks the FIRST Write/Edit/Bash per file/session;
  present the facts then retry (or `ECC_GATEGUARD=off`).
- Mock diocese defaults to 2 without `diocese_id`; diocese-1 logins see the
  Anubhav seeds. Mock QR tokens: 101→…1111 (Jalandhar City/phagwara),
  102→…2222 (Moga/abohar), 103 has none (ensure path), 201 diocese-2.
- `toQrDataUrl` returns SVG data URLs, not PNG (jsdom + print sharpness).
- The scan-desk "camera" needs HTTPS or localhost in real browsers.
- HARD RULE: Jalandhar design/flows 100% unchanged; everything additive.
