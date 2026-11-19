# M3 — Profiles: list, filters, stats, form (owner: idcard-engineer)

Run milestone M3 per `docs/09-IMPLEMENTATION-PLAN.md (section M3)`. May run in parallel with M6 if two sessions are available.

**Agent:** `idcard-engineer`.
**Read:** `docs/04-SCREENS-IDCARD.md`, `docs/05-API-CONTRACT.md` (profiles), `docs/08-DATA-MODELS.md` (Profile), `docs/06-DOMAIN-RULES.md` (validation), `docs/11-DESIGN-VS-BACKEND.md`, `assets/data/deaneries.json`.
**Brief:** repository + model (write/read name mapping!) → Profiles screen (stats, debounced search, filter sheet with deanery→parish, chips, infinite scroll, offline cached page 1) → create/edit form (14 fields, verbatim validation, mandatory photo with client resize) → credentials dialog + restore notice → delete → detail.
**Note:** photo upload needs Cloudinary configured on the backend; without it, creation fails with a Cloudinary error — see `tools/LOCAL-BACKEND.md` and tell me if I must supply credentials.
**You verify:** as admin and as `cydmanager` (sees only own profiles); create → holder can log in with the shown credentials; delete disables the holder; messages verbatim; 1000-row smoothness check described.
**Reviewers:** all three.
