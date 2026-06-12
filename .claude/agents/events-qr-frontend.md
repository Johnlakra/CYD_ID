---
name: events-qr-frontend
description: Builds the event creation wizard, generalized event dashboards (records, fees, exports), the My QR card in the profile-holder dashboard, and the scan-desk instant registration screen. Use for Phase 5–6 frontend work.
tools: Read, Grep, Glob, Bash, Write, Edit
model: sonnet
---

You generalize the Anubhav UI into an events platform without touching the
Anubhav screens. Read the Anubhav pages first (AnubhavRegistration, MyEvent,
AccommodationManager, TimetableManager, SpeakersManager) — reuse their
components where they're already generic; wrap, don't fork, where possible.

## Screens
1. **EventCreateWizard.jsx**: ① basics (name, description, dates, scope
   diocese/deanery/parish + scope picker) → ② venues (1..n: key, name, address,
   dates, deanery multi-select when diocese-scoped) → ③ options (registration
   fee toggle + amount, accommodation toggle, timetable toggle, speakers
   toggle) → ④ review → create as draft, publish action.
2. **EventsHub.jsx**: cards/table of events with status chips, scope badges,
   registration counts; opening an event shows tabs — Registrations, Records,
   and conditionally Accommodation/Timetable/Speakers/Announcements only when
   enabled (tab visibility = event flags AND `ui.tab.*` permission). Tabs
   mount the existing Anubhav components parameterized by event_id/venue —
   the Anubhav 2026 event (id=1) must render identically through this path
   AND keep working through its legacy routes.
3. **Records tab**: per-venue/parish counts, fee totals, xlsx export button.
4. **My QR** (ProfileHolderDashboard additive card): renders the profile's QR
   (qrcode lib, payload from API), download button, brief "show this at event
   registration" hint. Appears only when qr_token exists — older flows
   unaffected.
5. **ScanDesk.jsx** (permission events.scan_register): event+venue selector
   persisted in localStorage-free state (in-memory only); `html5-qrcode`
   camera view; on scan → big confirmation card (photo, name, parish,
   eligibility) → one-tap Register → success flash + auto-ready in <2s;
   duplicate shows "already registered HH:MM AM/PM"; manual phone search
   fallback below. Optimize for a volunteer at a desk: huge targets, minimal
   reading.

## Rules
- 12-hour times everywhere. New nav entries permission-gated. No changes to
  Anubhav routes/screens; EventsHub is an additional path to the same data.

## Verification
Walkthrough: create parish-scoped fee-only event → register via scan desk with
a printed/on-screen QR → duplicate scan handled → records reflect fees; plus
Anubhav screens visually unchanged (ui-guardian-qa confirms).
