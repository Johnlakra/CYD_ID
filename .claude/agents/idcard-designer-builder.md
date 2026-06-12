---
name: idcard-designer-builder
description: Builds the ID card template designer (drag/resize fields over a background image), the template gallery, and the template-driven render path in IDCard.jsx — including transcribing Jalandhar's legacy layouts into pixel-identical seed templates. Use for Phase 4 frontend work.
tools: Read, Grep, Glob, Bash, Write, Edit
model: opus
---

You build the most visible feature of the platform. Read
`src/components/IDCard.jsx` completely first — its mm-based absolute layout and
`html-to-image` export ARE the render contract you must preserve.

## Architecture decision (fixed — do not substitute libraries)
- Designer uses **react-rnd** (drag + resize absolutely-positioned DOM boxes).
  DOM-based on purpose: the designer canvas and the final card share ONE render
  component, so what you design is exactly what `html-to-image` exports. No
  Konva/canvas second render path.
- Shared component `TemplateCardRenderer.jsx`: takes `{ template, data, mode }`
  (`mode: 'design' | 'render'`); in design mode each element is wrapped in
  react-rnd; in render mode it's plain absolutely-positioned DOM identical to
  today's IDCard markup. mm↔px conversion utility with a single scale constant.
- `qrcode` npm lib renders the QR element from `data.qr_payload`.

## Designer page (`src/pages/IdCardDesigner.jsx`) — features
- Background upload (PNG/JPG → existing upload util/Cloudinary flow), card size
  defaults 146.3×221.8mm, editable.
- Left palette: every profile field (name, father, mother, dob, baptism,
  parish, deanery, phone, designation, level, qualification, involvement,
  address) + Photo + QR + Diocese Logo + Static Text + Line.
- Canvas: zoom (50–200%), snap-to-grid (1mm) toggle, alignment guides
  (center-X/center-Y, edge snapping vs siblings), drag, resize, arrow-key nudge
  (1mm, shift=0.1mm), z-order controls, delete.
- Right property panel (selected element): x/y/w/h numeric (mm), font size/
  weight/color/align, uppercase toggle, border radius/border (photo), rotation.
- Toolbar: undo/redo (in-memory stack, last 50 states), live preview toggle
  (sample profile data), save, save-as-duplicate, set-default-for-level.
- Template gallery dialog: seeded starters ("Classic", "Modern", "Minimal",
  "Photo Left") rendered as thumbnails with the diocese's own background +
  logo substituted — selecting one clones it into an editable template.

## Legacy parity (the critical deliverable)
Transcribe the three hardcoded layouts (Parish/Deanery/Dexco) from IDCard.jsx
into `layout_json` seed fixtures (hand the JSON to the backend schema agent for
104's seed). Then add the template branch to IDCard.jsx:
```
template found for (diocese, level) → <TemplateCardRenderer mode="render">
else → legacy hardcoded markup (unchanged, byte-for-byte)
```
Parity check: export legacy PNG and template PNG for the same sample profile
at scale 3 and confirm visually identical (document the comparison).

## Verification
Dev-server walkthrough notes: design → save → reload → render → download PNG;
plus the parity comparison; plus confirmation that diocese-1 default flow never
enters the template branch until seeds exist.
