# Multi-Diocese Platform — API Contract (Phases 1–2)

> Shared boundary for the platform work on `feature/multi-diocese-platform`.
> Endpoints below are **verified against the backend implementation**
> (`routes/platform.js`, `routes/org.js`, `routes/imports.js` + controllers,
> backend commits ece5196 / 0af53a3). Anubhav endpoints stay in
> `API_CONTRACT.md` (frozen). Envelope everywhere: `{ success, message, data }`.
> The backend repo should mirror this file into its own `shared/`.

## Auth changes (additive)
- `POST /auth/login` → `data.user` now includes `diocese_id` (INT, `1`/`null` = legacy
  Jalandhar). Legacy stored users without the field are treated as diocese 1.
- JWT carries a `diocese_id` claim; old tokens resolve to 1 server-side.
- New role above `admin`: `super_admin` (platform scope). `admin` is diocese-scoped.
- `GET /auth/me/permissions` → flat effective permission key list (Phase 3).

## Phase 1 — Diocese onboarding (`/platform`)
```
POST /platform/dioceses/register            PUBLIC, rate-limited 5/min
     body: { name* (3-150), slug? (^[a-z0-9][a-z0-9-]{1,58}$; derived from name if
             omitted), contact_email*, contact_phone* (7-30 chars), address?, logo_url? }
     -> 201 { id, name, slug, status:'pending' }
     -> 400 invalid slug/fields (express-validator `errors` array or message)
     -> 409 { message } duplicate slug

GET  /platform/dioceses?status=pending|active|suspended     super_admin
     -> { dioceses: [{ id, name, slug, logo_url, contact_email, contact_phone,
                       address, status, created_at }] }   // created_at DESC

PUT  /platform/dioceses/:id/approve         super_admin
     // Transaction: creates admin user `<slug>.admin` (password = registered
     // contact phone, bcrypt 12) unless one exists, seeds system roles
     // (Phase 3 provisionSystemRoles), sets status='active'.
     -> { id, slug, status:'active',
          admin: { username, created:bool, password_hint:'registered contact phone'|undefined } }
     -> 404 not found; 409 already active; 400 no contact phone on record

PUT  /platform/dioceses/:id/suspend         super_admin
     -> { id, status:'suspended' }
     -> 400 diocese 1 is protected; 404 not found
     // There is NO reject endpoint — suspend doubles as reject for bad registrations.
     // There is NO reactivate endpoint yet — re-approve via /approve (it activates
     // any non-active diocese that has a contact phone).
```

## Phase 2 — Org structure (`/org`)
All routes: `authenticateToken` + `tenantScope` + `requirePermission('org.manage')`
(admins resolve to every key). Tenant comes from the JWT; diocese 1 also owns
legacy `diocese_id IS NULL` rows.
```
GET    /org/structure        -> { deaneries: [{ id, name, parishes: [{ id, name }] }] }
POST   /org/deaneries        { name* (2-200) }        -> 201 { id, name };            409 dup name
PUT    /org/deaneries/:id    { name* }                -> { id, name };                404
DELETE /org/deaneries/:id                             -> { id };  409 while parishes remain
POST   /org/parishes         { deanery_id*, name* }   -> 201 { id, name, deanery_id }; 404 deanery, 409 dup
PUT    /org/parishes/:id     { name* }                -> { id, name };                404
DELETE /org/parishes/:id                              -> { id };                      404
```

## Phase 2 — Excel import wizard (`/imports`)
All routes: `authenticateToken` + `tenantScope` + `requirePermission('imports.run')`.
Files travel as **raw base64-encoded .xlsx** in JSON bodies (existing photo-upload
convention; 10 MB JSON cap, max 2000 rows/import). `type` ∈ `youth | org`.
```
GET  /imports/template?type=youth|org
     -> { file_name, file_base64,           // pre-formatted .xlsx workbook
          columns: [{ key, label, required }] }

POST /imports/parse          { type, file_base64* }
     -> { headers: [..],
          total_rows,
          sample_rows: [[..], ..],          // first 5 rows, dates ISO
          suggested_mapping: { colKey: headerIndex, ... },   // fuzzy auto-detect
          unmapped_required: [label, ..],
          unmatched_headers: [header, ..] }
     -> 400 not a readable .xlsx / too many rows

POST /imports/youth/validate { file_base64*, mapping? }      // dry run, writes nothing
     -> { total_rows, valid_rows, invalid_rows,
          preview: [{ row_number, ...mappedFields }],        // first 100 valid
          errors:  [{ row_number, errors: [msg, ..] }] }
     // Row checks: name>=2 chars, DOB valid date, phone>=7 digits + unique in
     // diocese AND within file, deanery/parish must exist in THIS diocese
     // (case-insensitive), baptism falls back to DOB, defaults: level 'Parish',
     // designation 'Member'.
     -> 400 required columns not mapped: Name, DOB, Phone, Deanery, Parish

POST /imports/youth/commit   { file_base64*, file_name?, mapping?,
                               options?: { auto_create_users:bool } }
     // ONE transaction for all valid rows; failed rows never block valid ones.
     // auto_create_users: profile_holder logins, username 4-letters+DDMM
     // (unique-suffixed), password = phone digits, email <username>@cydidcard.com.
     -> 201 { total_rows, inserted_rows, failed_rows, users_created,
              credentials: [{ row_number, name, username }],
              errors: [{ row_number, errors }],
              error_file_base64 | null }                     // errors .xlsx download

POST /imports/org/commit     { file_base64*, file_name?, mapping? }
     // Creates missing deaneries/parishes; skips existing pairs (case-insensitive).
     -> 201 { total_rows, deaneries_created, parishes_created, skipped_existing,
              failed_rows, errors, error_file_base64 | null }

GET  /imports/jobs           -> { jobs: [{ id, type, file_name, total_rows,
                                  inserted_rows, failed_rows, users_created,
                                  status, created_by, created_at }] }   // last 100
```

## Frontend gating conventions (Phases 1–2)
- `user.diocese_id` absent/`null`/`1` → legacy Jalandhar: **zero UI change**.
- `role === 'super_admin'` → Diocese Approvals console in the sidebar.
- `role === 'admin' && diocese_id > 1` → Organisation / Bulk Import / Setup menu
  items; first-login setup wizard auto-opens while the diocese has no org
  structure (progress kept client-side; no setup-state endpoint exists yet).
- Facade `src/api/platformApi.js` mirrors `anubhavApi.js`: same envelope
  normalization, in-memory mock behind `REACT_APP_PLATFORM_MOCK !== 'false'`.

## Later phases (already live server-side, FE pending)
`/permissions/*` (matrix, roles, overrides), `/idcard-templates/*` (designer,
gallery, resolve), `/events/*` + venues/stats, QR: `GET /profiles/qr/:token`,
`POST /events/:id/registrations`, `POST /profiles/qr/ensure/:profileId`,
`GET /profile-holder/my-qr` — documented in `API_CONTRACT.md` §Phase 5/6 and to
be contract-detailed when their FE phases start.
