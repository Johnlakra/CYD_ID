# Session 2026-07-10 (b) — Platform Phase 4 frontend (ID card designer)

Branch (both repos): `feature/multi-diocese-platform`

## Done this session (Phase 4 FE — Pillar D)
- `npm i react-rnd` (^10.5.3).
- `src/utils/idCardLayout.js` — layout model: mm constants (146.3×221.8),
  mm↔px (96dpi), element factory/clamp, field catalog, `isValidLayout`.
- `src/utils/idCardSeeds.js` — **`buildJalandharLayout()`: 1:1 transcription
  of legacy IDCard.jsx** (all mm tops, Vidaloka/Gafata/Roboto, 24.2px rows at
  x=54, footer band y=213, address lineHeight 96.5%) + 4 gallery starters
  (Classic = the transcription, Modern, Minimal, Photo-left).
- `src/components/TemplateCardRenderer.jsx` — ONE render path for designer
  canvas, gallery thumbnails and final card; legacy formatting preserved
  (capitalizeName on name, DD-MM-YYYY dates, `label` prefix → ": value").
  QR/logo render placeholders until Phase 6.
- `src/api/platformMockIdCards.js` — separate mock module (file-size rule):
  9 endpoints, diocese-scoped, diocese 1 seeded with the 3 Jalandhar
  transcriptions as defaults; `__resetIdCardMock()` for tests.
- `src/api/platformApi.js` — Phase 4 section: list/gallery/resolve/get/
  create/update/set-default/duplicate/delete (`/idcard-templates*`).
- `src/pages/platform/idcard/` — `IdCardDesigner.jsx` (gallery ⇄ editor,
  save dialog w/ level + custom level + background upload as data URL),
  `DesignerCanvas.jsx` (react-rnd with `scale`, snap-to-grid 1mm, center
  guides, zoom via transform scale — same markup as final render),
  `FieldPalette.jsx`, `PropertyPanel.jsx` (x/y/w/h mm, font, color, align,
  label, uppercase/wrap, radius/border, rotation, layer order, delete),
  `TemplateGallery.jsx`, `designerState.js` (immutable reducer, undo ≤50),
  `sampleProfile.js`.
- `src/components/IDCard.jsx` — additive template branch: resolve by
  `data.level`; template → TemplateCardRenderer, else legacy markup
  (unchanged, still the safety net). Stray `console.log` removed.
- `Dashboard.jsx` — "Card Designer" menu item (admins with `idcards.design`,
  existing BadgeIcon), case `platform-idcard-designer`.
- Tests **93/93 green** (37 new: seeds transcription parity, renderer
  formatting, reducer, mock CRUD/tenancy/defaults). `react-scripts build`
  clean (+22 kB main).
- Plan row 4 marked FE DONE in `.claude/MASTER_PLAN_PLATFORM.md`.

## USER INSTRUCTION FOR NEXT SESSION
User said: *"after phase 4 completion stop and create a handoff file and
wait for my command"*. → **STOPPED after Phase 4.** Resume with **Phase 5**
only when the user says continue.

## What's left (in order)
1. **Phase 5 FE** — events wizard (scope → venues → toggles → publish),
   records/fees/export page. BE `/events*` live (see API_CONTRACT Phase 5).
2. **Phase 6 FE** — My QR card (profile-holder dashboard), scan-desk page
   (`html5-qrcode` — NOT installed yet), duplicate handling, phone fallback.
   BE `/qr*` + `GET /profiles/qr/:token` live. Also wire the `qr` element in
   TemplateCardRenderer to the real `CYD:<slug>:<qr_token>` payload
   (`qrcode` npm lib — NOT installed yet).
3. **Phase 7** — cross-repo E2E (BE `scripts/anubhav-e2e.js` 181/181 + FE
   suite), sync the two MASTER_PLAN copies, contract check, session log.

## Gotchas
- ECC Fact-Forcing Gate blocks the FIRST Write/Edit/Bash per file/session;
  present the 4 facts then retry (or `ECC_GATEGUARD=off`).
- Frontend mock mode default ON (`REACT_APP_PLATFORM_MOCK !== 'false'`).
- Mock diocese defaults to 2 (pending sample) when the stored user has no
  `diocese_id` — so legacy Jalandhar logins resolve NO template and keep the
  legacy render; diocese 1 logins get the seeded transcriptions.
- Pixel-parity check: designer gallery "Classic" / diocese-1 seeds ARE the
  legacy layout; `idCardSeeds.test.js` locks the transcription values.
- HARD RULE: Jalandhar design/flows 100% unchanged; everything additive.
