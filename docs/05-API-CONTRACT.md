# 05 · API contract

Every HTTP endpoint the CYD app uses, verified against the backend source (`cyd_id_be`, branch `claude/happy-bell-oy6or2`: `server.js`, `routes/*`, `controllers/*`, `services/*`, `middleware/*`, `config/shopConfig.js`, `migrations/001_p2p_payments.js`). **If this file and the running backend disagree, the backend wins** — fix this file and log it in `11-DESIGN-VS-BACKEND.md`. Everything below was confirmed in code; nothing is marked unverified except where stated (response of a live server was not exercised for this file).

Conventions: money is **integer paise** everywhere (`price_paise`, `total_paise`, …). Timestamps are MySQL `DATETIME` strings or ISO strings as the driver returns them (treat as UTC; prefer the server's `*_seconds_left` fields for countdowns). Field names are given exactly as the server spells them.

## Contents
1. [Global conventions](#1-global-conventions) — base URL, envelope, auth, errors, limits, rate limits
2. [Auth](#2-auth) — `/auth/*`
3. [Profile holder](#3-profile-holder) — `/profile-holder/*`
4. [Profiles](#4-profiles) — `/profiles/*`
5. [Shop: categories, shops, my shop](#5-shop-categories-shops-my-shop)
6. [Shop: products and lookup](#6-shop-products-and-lookup)
7. [Addresses](#7-addresses)
8. [Checkout](#8-checkout)
9. [Orders: lists, view, counts](#9-orders-lists-view-counts)
10. [Orders: actions (claim, confirm, reject, cancel, dispute, refund, fulfilment)](#10-orders-actions)
11. [Order chat and evidence](#11-order-chat-and-evidence)
12. [Seller product management](#12-seller-product-management)
13. [Admin: shops and disputes](#13-admin-shops-and-disputes)
14. [Vocabularies](#14-vocabularies-statuses-allowed_actions-dispute_reasons)
15. [Role matrix](#15-role-matrix)
16. [Quirks checklist](#16-quirks-checklist)

---

## 1. Global conventions

**Base URL.** Production `https://cyd-id-be.onrender.com` (free tier: cold start 30–60 s). Local `http://localhost:3000` (`PORT`), emulator `http://10.0.2.2:3000`. Routes are mounted at the root: `/auth`, `/profiles`, `/profile-holder`, `/shop/...` (there is **no** `/api` prefix; route comments saying `/api/auth/...` are stale). `GET /health` → `{success:true, message:'Server is running', timestamp, version:'1.0.0'}` (no auth).

**Envelope.**
- Success: `{ "success": true, "message": "…", "data": … }` (some endpoints omit `data`, e.g. change-password).
- Failure: `{ "success": false, "message": "…" }`, validation failures add `"errors": ["msg", …]` — a **flat list of strings, not keyed by field**. Validator rules that have no custom message (length caps such as shop/address/product field maxima and `description` ≤1000/`notes` ≤500, `kind`, `ids.*`, `compare_at_price`, `category_id`, `contact_phone`, `current_password`…) report the generic string **`Invalid value`** — show your own copy for those.
- Unknown routes return Express's default **HTML 404** (the JSON 404 handler is commented out in `server.js`) — treat any non-JSON 404 body as "not found / wrong backend branch".
- Unhandled/body-parser errors go through the JSON error handler: malformed JSON → `400 {message:'Malformed JSON in request body'}`; body too large → `413 {message:'Request body is too large'}`; anything else → `500 {message:'Internal server error'}` (some controllers use their own 500 messages, e.g. `Something went wrong. Please try again.`).

**Auth.** `Authorization: Bearer <JWT>`. JWT payload `{userId}`, signed with `JWT_SECRET`, expires in `JWT_EXPIRES_IN` (default **24h**), **no refresh endpoint**, no revocation (logout is client-side). On every request the user (`id, username, email, role`) is re-read from `users` with `status = 1`, so the **role is always the DB role**, and a deactivated user's token stops working.
Auth failures (all `401`, all `success:false`): `Access token required` (no/blank header) · `Invalid token` · `Token expired` · `Invalid token - user not found`. Admin gate: `403 Admin access required`. A malformed header such as `Bearer` with no token counts as missing; the scheme word is not checked (the token is simply the second space-separated part). A database failure inside the auth middleware returns `500 Authentication error`.

**Limits.** JSON/urlencoded body ≤ **10 MB** (`express.json({limit:'10mb'})`). Images are sent as base64 data URLs inside JSON (`data:image/(jpeg|jpg|png|gif|bmp|webp);base64,…`); per-image size limits are enforced in `utils/fileUpload.js` (see §3/§12 for the exact messages); the project documents **5 MB per image**. Resize on the client to ≤1600 px / ≤1 MB.

**Rate limiting.** Login endpoints (`POST /auth/login`, `POST /profile-holder/login`) and order chat `POST /shop/orders/:id/messages` (20/min per user, §11) are limited. Login: **10 failed attempts per 15 min per `IP|lowercased username`**; successful logins do not count (any response ≥400, including 400 validation failures, does). The two login endpoints share **one** counter per `IP|username`. On exceed → `429 {success:false, message:'Too many failed login attempts. Please try again in 15 minutes.'}` (draft-7 headers `RateLimit: limit=10, remaining=N, reset=S` and `RateLimit-Policy: 10;w=900`). Other endpoints have **no** HTTP rate limiting but have business limits (e.g. max open UPI orders).

**Pagination** (where present): `?page=1&limit=…`; response `data.pagination` — shape per endpoint below.

**Idempotency.** Only `POST /shop/checkout` (header `Idempotency-Key`).

**CORS.** Open unless `CORS_ORIGINS` is set (mobile apps are unaffected).

---

## 2. Auth

### POST /auth/login — public (rate limited)
Body `{ "username": string, "password": string }` — `username` may be a username **or email**. Works for **all roles** including `profile_holder`; only users with `status = 1`.
- 200 → `data: { token, user:{ id, username, email, role } }`, message `Login successful`. `role` ∈ `admin | user | profile_holder`.
- 400 `Validation failed` + `errors:['Username or email is required','Password is required']` (either/both).
- 401 `Invalid credentials` (unknown user, wrong password, or inactive user — indistinguishable).
- 429 as §1.
- 500 `Login failed` (in development the body also carries `error`; never display it).
- `username` is matched as sent (no trim; whitespace-only passes validation and returns 401). The app trims before sending. The 401 session-expiry handler must skip both login endpoints, because a wrong password is also a 401.

### POST /auth/register — admin only
Creates any user (the old public registration was closed; there is no self sign-up). Body: `username` (3–50, `[a-zA-Z0-9_-]`), `email` (valid; the server **normalizes** it, e.g. lowercases), `password` (**min 6, must contain a lowercase, an uppercase and a digit**), optional `role` (`admin|user|profile_holder`, default `user`).
- 201 → `data:{ user:{ id, username, email, role, created_at } }`, message `User registered successfully` (**no token**).
- 400 `Validation failed` with any of: `Username must be between 3 and 50 characters`, `Username can only contain letters, numbers, hyphens, and underscores`, `Must be a valid email address`, `Password must be at least 6 characters long`, `Password must contain at least one uppercase letter, one lowercase letter, and one number`, `Role must be admin, user, or profile_holder`.
- 400 `Username or email already exists`.
- 401/403 per §1. 500 `Registration failed`.

### GET /auth/profile — any authenticated user
200 → `data:{ user:{ id, username, email, role, created_at, updated_at } }`. 404 `User not found`.

### PUT /auth/profile — any authenticated user
Body (all optional, at least one): `username` (rules as register), `email` (valid, normalized).
200 → `data:{ user }` (same fields as GET). 400 `Validation failed` (messages as register) · 400 `Username or email already exists` · 400 `No fields to update`.

### PUT /auth/change-password — any authenticated user (holders use `PUT /profile-holder/change-password`, §3, but may also call this one)
Body `{ currentPassword, newPassword }`. `newPassword`: min 6 and lower+upper+digit (messages: `New password must be at least 6 characters long`, `New password must contain at least one uppercase letter, one lowercase letter, and one number`); `currentPassword` required (`Current password is required`).
200 `{success:true, message:'Password changed successfully'}` (no `data`). 400 `Current password is incorrect`.

### POST /auth/logout — authenticated
200 `{success:true, message:'Logout successful'}`. Server does nothing; the app must clear its own session.

## 3. Profile holder

Role `profile_holder` only (except login). A holder is a user linked to exactly one `profile` row (`profile.profile_user_id`). Non-holders get `403 Profile holder access required`.

**Profile row shape** (returned by every endpoint here as raw `SELECT *` from table `profile`; note the **read** column names): `id, name, father, mother, dob, designation, level, date_of_baptism, postal_address, parish, deanery, qualification, phone, involvement, photo_url, issue_date, status, profile_user_id, created_by, created_at, updated_at`. Dates are `DATE` (driver may serialise as ISO datetime strings — take the first 10 chars). `name` is stored **lowercase**. Full field table in `08-DATA-MODELS.md`.

### POST /profile-holder/login — public (rate limited)
Body `{ username, password }` (username **only**, not email — unlike `/auth/login`). Only `role = profile_holder` and `status = 1`.
- 200 → `data:{ token, user:{ id, username, role }, profile }` (no `email` in `user` here).
- 400 `Validation failed` + `errors` (`Username is required`, `Password is required`).
- 401 `Invalid credentials`. 404 `Profile not found` (valid credentials but the profile was soft-deleted → holder cannot log in). 429 as §1. 500 `Login failed`.
- The app should use `/auth/login` for everyone (it returns `user.role`) and then call `/profile-holder/my-profile`; this endpoint is optional.

### GET /profile-holder/my-profile
200 → `data:{ profile }`. 404 `Profile not found` (deleted).

### GET /profile-holder/my-id-card
200 → `data:{ profile, validity:{ issued, expires, isValid, daysUntilExpiry } }`.
- `expires` = `issue_date` + 2 years as `YYYY-MM-DD`; `isValid` = now ≤ expiry; `daysUntilExpiry = ceil((expiry − now)/day)` — **negative once expired**. If `issue_date` is null (column is nullable), `new Date(null)` is the 1970 epoch: the response is `issued: null`, `expires: "1972-01-01"`, `isValid: false`, `daysUntilExpiry` ≈ −20000 (not an error and not `NaN`) — the app must treat a null `issue_date` as "unknown" and ignore `validity`. The server does not return a "60-day warning" flag; the app derives it (rule in `06-DOMAIN-RULES.md`).
- 404 `Profile not found`.

### PUT /profile-holder/update-profile
Updates only `photo`, `qualification`, `postal_address` of the holder's own profile. Body (all optional): `photo` (base64 data URL; route validation rejects URLs here: `Photo must be a valid base64 image`; controller itself would also accept an `http(s)` URL), `qualification`, `postal_address`.
- 200 → `data:{ profile }` (updated row), message `Profile updated successfully`.
- 400 `Validation failed` (`Photo must be a valid base64 image`) · 400 with the image message: `Invalid image format`, `Invalid base64 format`, `Unsupported image type`, `No image data found`, `Image too large. Maximum size: 5MB` · 400 `Photo upload failed: Cloudinary upload failed: …`.
- Quirk: an omitted or **empty** `qualification`/`postal_address` keeps the old value (`||`), so a holder **cannot clear** these fields. 404 `Profile not found`.
- (A parallel endpoint `PUT /profiles/update-limited` exists — see §4 — do not use it; use this one.)

### PUT /profile-holder/change-password
Body `{ currentPassword, newPassword }`. **Rules here are weaker than `/auth/change-password`**: `newPassword` only needs **min 6** (`New password must be at least 6 characters`), no complexity check. The app should still enforce the stricter rule client-side for both.
- 200 `{success:true, message:'Password changed successfully'}`. 400 `Validation failed` (`Current password is required`, `New password must be at least 6 characters`) · 400 `Current password is incorrect`.
- A holder may also use `PUT /auth/change-password` (works for any authenticated user); both update the same `users.password`.

## 4. Profiles

Roles: `admin` (sees all), `user` (CYD manager — sees/edits **only profiles they created**: `created_by = me`), `profile_holder` (list/filter-options show only their own profile; **cannot** call by-id read/update/delete — those return 404 because `created_by` never matches). All require a token.

**Write vs read names (critical).** Requests use `father_name`, `mother_name`, `date_of_birth`; the stored/returned row uses `father`, `mother`, `dob`. Other fields are identical both ways except `photo` (write, base64 or URL) → `photo_url` (read). `name` is stored **lowercased and whitespace-collapsed on create** (not normalised on update).

**Create/update body** (validator `validateProfile`):

| Field | Required | Rule / message |
|---|---|---|
| `name` | **yes** | non-empty `Name is required`; ≤100 `Name must not exceed 100 characters` |
| `phone` | **yes** | non-empty, message is lowercase: `phone is required`. No format check; the holder's initial password = digits of the phone (`phone.replace(/\D/g,'')`) — a phone with no digits yields an empty password hash input (client must validate ≥10 digits) |
| `date_of_birth` | validator says optional, **create requires it in practice** | `Date of birth must be a valid date (YYYY-MM-DD)` (ISO8601). Without it create returns **500** (`Failed to create profile`) because the username is built from it. Send strictly `YYYY-MM-DD` (a datetime string passes the validator but breaks username generation) |
| `father_name`, `mother_name` | no | ≤100 (`Father name must not exceed 100 characters`, `Mother name …`) |
| `designation` | no | ≤100 (`Designation must not exceed 100 characters`) |
| `level` | no | ≤50 (`Level must not exceed 50 characters`); values used by the app: `parish`, `deanery`, `dexco` (see `assets/data/levels.json`) — **not enforced** by the server |
| `date_of_baptism`, `issue_date` | no | ISO8601 (`Date of baptism must be a valid date (YYYY-MM-DD)`, `issue_date must be a valid date (YYYY-MM-DD)`) |
| `email` | no | valid email (`Must be a valid email address`) — validated but **not stored** (profile has no email column) |
| `photo` | no (server) / **required by the app on create** | `http(s)` URL kept as is, or `data:image/(jpeg|jpg|png|gif|bmp|webp);base64,…` (`Photo must be a valid base64 image (jpeg, png, gif, bmp, webp)`); size ≤5 MB else `Image too large. Maximum size: 5MB`; other image messages as §3 |
| `postal_address`, `parish`, `deanery`, `qualification`, `involvement` | no | free text, no length checks in the validator (`postal_address` TEXT) |

Validation failure → `400 {message:'Validation failed', errors:[…]}`. Empty/omitted optionals are stored as `NULL`.

### POST /profiles — admin, user (any authenticated; holders get no special block but should not call)
Creates the profile **and** a `profile_holder` login.
- Username = first 4 ASCII letters of the name (lowercased, spaces/non-letters removed) + `DD` + `MM` of the DOB; if taken, a counter `1,2,…` is appended. Email `<username>@profile.local`. Initial password = digits of `phone`.
- **Restore-by-recreation**: if a soft-deleted profile (`status 0`) with the same normalised name **and exactly the same phone** exists, that row is reactivated with the new data, the holder user is reactivated (looked up by `username LIKE <baseUsername>% AND role=profile_holder AND status=0`, newest first) with a **new password from the phone**, else a new account is created. `created_by` becomes the current caller.
- 201 → `data:{ profile (raw row), credentials:{ username, password, message } }`; `message` is `Profile created successfully` or `Profile restored successfully`. `credentials.password` is the **phone exactly as sent** (e.g. with `+91`/spaces) — the real password is its digits only. Show the digits-only value in the app.
- 400 validation; 400 image messages; 400 `Photo upload failed: Cloudinary upload failed: …` (e.g. Cloudinary not configured locally); 500 `Failed to create profile`.
- No duplicate check against **active** profiles (same name+phone creates another profile and another login).

### GET /profiles — authenticated
Query: `page` (int ≥1, default 1), `limit` (1–100, default **10**), `search`, `deanery`, `parish`, `level`, `designation` (exact match, trimmed), `sort_by` ∈ `name|created_at|deanery|parish|level|designation` (default `created_at`; invalid → default), `sort_order` ASC|DESC (default DESC). Extra `id` is validated but ignored. Filters/search are **ignored for holders**. `search` is a case-insensitive `LIKE %term%` over name, father, mother, phone, parish, deanery, designation, qualification, postal_address.
- Only `status = 1` rows. 200 →
```json
{ "success": true, "message": "Profiles retrieved successfully",
  "data": { "profiles": [ { "...profile row...", "created_by_username": "…", "created_by_email": "…" } ],
            "pagination": { "current_page": 1, "per_page": 10, "total": 0, "total_pages": 0, "has_next": false, "has_prev": false },
            "filters": { "applied": { "search": null, "deanery": null, "parish": null, "level": null, "designation": null } } } }
```
- 400 `Validation failed` (`Page must be a positive integer`, `Limit must be between 1 and 100`, `ID must be a positive integer`).

### GET /profiles/filter-options — authenticated
Distinct values **present in the caller's own visible profiles** (not the master lists). 200 → `data:{ deaneries:[…], parishes:[…], levels:[…], designations:[…], deanery_parish_map:{ "<deanery>":["<parish>",…] } }`. Use it for the filter sheet; use `assets/data/deaneries.json` for the **form** dropdowns (the full master list).

### GET /profiles/stats — admin only
200 → `data:{ stats:{ total_profiles, total_creators, profiles_with_photos, created_today, created_this_week } }` (numbers; **counts include soft-deleted rows**, `total_creators` = distinct `created_by`). 403 `Admin access required`.

### GET /profiles/:id — admin (any), user (own created)
200 → `data:{ profile }` (row + `created_by_username`, `created_by_email`). 404 `Profile not found or access denied`.
**Quirk:** does not filter `status`, so a soft-deleted profile can still be read (and updated) by id; the app should not offer links to deleted profiles.

### PUT /profiles/:id — admin (any), user (own created)
Full-replace semantics of the validator (`name` and `phone` required again). Omitted optional fields are **set to NULL** (send the complete profile), except `photo`: omitted/empty keeps the existing `photo_url`; base64 uploads a new one; an `http(s)` URL keeps/sets that URL. `name` is saved as sent (not lowercased); changing `phone` does **not** change the holder's password; `profile_user_id`/`created_by` unchanged.
- 200 → `data:{ profile }`, message `Profile updated successfully`. 404 `Profile not found or access denied`. 400 validation/image. 500 `Failed to update profile`.

### DELETE /profiles/:id — admin (any), user (own created)
Soft delete: `profile.status = 0` and the linked holder user `status = 0` (login stops; their token also stops because the user is re-read with `status = 1`). Only active profiles match.
- 200 `{success:true, message:'Profile deleted successfully'}`. 404 `Profile not found or access denied`. There is no restore endpoint — restore happens only by re-creating with the same name+phone (see POST).

### PUT /profiles/update-limited — holder
Duplicate of `PUT /profile-holder/update-profile` (same logic; validator `validateLimitedProfile`: `qualification` ≤200 `Qualification must not exceed 200 characters`, `postal_address` ≤500 `Postal address must not exceed 500 characters`, photo may be a URL). Non-holders get 404 `Profile not found`. **The app uses `/profile-holder/update-profile` instead.**

## 5. Shop: categories, shops, my shop

All `/shop/*` endpoints require a token. Shop ownership is **not a role**: any authenticated user (admin, user or holder) may apply; one shop per user (`UNIQUE(owner_user_id)`).

**Shop row** (`SELECT *` from `shops`, returned by `/shop/shops/apply`, `/shop/shops/mine`, `/shop/admin/*`): `id, owner_user_id, name, slug, description, logo_url, banner_url, parish, deanery, contact_phone, upi_id, upi_id_changed_at, status, rejection_reason, reviewed_by, reviewed_at, created_at, updated_at`. `status` ∈ `pending | approved | rejected | suspended`. **Public endpoints return a reduced shape without `upi_id`/`contact_phone`** — buyers learn the seller's UPI ID only from the order (`payee_upi_id`, §9).

### GET /shop/categories — any authenticated
200 → `data:{ categories:[ { id, name, slug, icon, sort_order, status, created_at } ] }` (active only, ordered by `sort_order, name`). Seeded defaults: Devotional Items (`church`), Books & Booklets (`book`), Apparel & Merchandise (`tshirt`), Event Tickets (`ticket`), Handmade & Crafts (`craft`), Food & Snacks (`food`), Other (`category`). `icon` is a free string key, not a URL.

### POST /shop/categories — admin only
Body `{ name (required), icon?, sort_order? }`. 201 → `data:{ category }`. 400 `Category name is required`. 403 `Admin access required`. (Not needed by the app UI.)

### POST /shop/shops/apply — any authenticated
Body: `name` (required, trimmed, ≤150, `Shop name is required`), `contact_phone` (required, ≤20, `Contact phone is required`), `description` (≤2000), `parish` (≤100), `deanery` (≤100), `upi_id` (optional; regex `^[\w.+-]{2,256}@[a-zA-Z]{2,64}$`, message `UPI ID must look like name@bank`; empty string allowed), `logo` (optional base64 data URL — **not size-validated** here; upload errors surface as 500).
- 201 → `data:{ shop }` (status `pending`), message `Shop application submitted. An admin will review it shortly.`
- 400 `Validation failed`; 400 `You already have a shop application (status: <status>).` ; 400 `You already have a shop application.` (race). 500 `Failed to submit shop application`.
- A shop **without `upi_id`** can only sell via COD (see checkout rules).
- No re-apply after rejection: the same row stays (status `rejected`); the owner edits it with `PUT /shop/shops/mine` but there is **no endpoint to resubmit** for review; an admin can still approve it later because `adminReviewShop` accepts any status transition.

### GET /shop/shops/mine — any authenticated
200 → `data:{ shop }` where `shop` is the row or **`null`** when the user has none (not a 404). Drives the five states: none / pending / rejected / suspended / approved.

### PUT /shop/shops/mine — owner (any status)
Body (all optional, ≥1 required): `name` (non-empty, ≤150), `description`, `parish`, `deanery` (≤ limits; empty/`null` allowed and stored as given), `contact_phone` (non-empty, ≤20), `upi_id`, `current_password`, `logo`, `banner` (base64; unvalidated, 500 on upload failure).
- **Changing `upi_id` (including clearing it with `""`) requires `current_password`** → else `403 Enter your current password to change the UPI ID`. Submitting the same value is a no-op. Orders already placed keep the UPI ID shown at placement. Change is audit-logged.
- 200 → `data:{ shop }`, message `Shop updated successfully`. 400 `No fields to update`; 400 validation (`Shop name cannot be empty`, `UPI ID must look like name@bank`). 404 `You do not have a shop yet`. 500 `Failed to update shop`.
- Works for pending/rejected/suspended shops too (only requires that the user owns a shop).

### GET /shop/shops — any authenticated (marketplace)
Query: `page` (default 1), `limit` (default **20**; no max enforced, no validator), `parish`, `deanery` (exact), `q` (`name LIKE %q%`). Only `approved` shops, newest first.
200 → `data:{ shops:[ { id, name, slug, description, logo_url, banner_url, parish, deanery, created_at } ], pagination:{ current_page, per_page, total, total_pages, has_next, has_prev } }`.

### GET /shop/shops/:id — any authenticated
200 → `data:{ shop:{ id, name, slug, description, logo_url, banner_url, parish, deanery, status, created_at } }`. 404 `Shop not found` (missing **or not approved** — a suspended shop disappears from buyers). 400 `Validation failed` + `Invalid id` is **not** applied to this route (no validator) — a non-numeric id simply yields 404.

## 6. Shop: products and lookup

**Product row** (read): `id, shop_id, category_id, title, slug, description, price_paise, compare_at_price_paise, stock_quantity, sku, status, views_count, created_at, updated_at`, plus `images:[ { id, product_id, image_url, sort_order, is_primary, created_at } ]` (ordered by `sort_order`; first is primary). `status` ∈ `draft | active | out_of_stock | archived`. Money fields are **BIGINT paise** (numbers in JSON).

> **Money asymmetry (important).** Product **writes** (create/update) take `price` and `compare_at_price` in **rupees** (decimal number or numeric string, e.g. `199.5`) and the server converts with `Math.round(parseFloat(x)*100)`. Product **reads** give `price_paise` / `compare_at_price_paise` in paise. The app keeps `int` paise internally and converts to a rupees string with exactly two decimals (`paise ~/ 100` and `paise % 100`, never via `double` arithmetic) only at the write boundary.

### GET /shop/products — any authenticated (marketplace)
Query: `page` (≥1, default 1), `limit` (1–100, default **20**), `category_id`, `shop_id`, `q` (`title LIKE` or `description LIKE`). **No other filters or sorting** (no price/sort/in-stock params; the app sorts/filters client-side on the loaded page). Only `status='active'` products of `approved` shops, newest first.
200 → `data:{ products:[ { ...product row..., in_stock (0|1), shop_name, shop_slug, images:[…] } ], pagination:{ current_page, per_page, total, total_pages, has_next, has_prev } }`. 400 `Validation failed` for bad `page/limit/category_id/shop_id`.

### GET /shop/products/:id — any authenticated
200 → `data:{ product:{ ...row, in_stock (0|1), shop_name, shop_slug, shop_id, shop_status, accepts_upi (0|1), images:[…] } }` (`accepts_upi` is a **number** here, boolean in lookup). 404 `Product not found` — returned for missing products **and** for drafts/archived/unapproved-shop products unless the caller is the owner or an admin. 400 `Validation failed` (`Invalid id`). Viewing a public product by a non-owner increments `views_count`.

### POST /shop/products/lookup — any authenticated
Body `{ ids:[int,…] }` (1–100 ids; `ids must be a list of 1 to 100 product ids`). Runs an expiry sweep first (throttled to once per 30 s server-wide, so stock held by just-expired orders is usually, not always, already released); a non-integer entry in `ids` → `400 Validation failed` + `Invalid value`; duplicate ids are de-duplicated. 200 →
```json
{ "data": { "products": [ { "id": 1, "title": "…", "price_paise": 12300, "stock_quantity": 2, "status": "active",
  "shop_id": 7, "shop_name": "…", "shop_status": "approved", "accepts_upi": true, "image_url": "https://…|null", "available": true } ] } }
```
`available = status==='active' && shop_status==='approved' && stock_quantity>0`; `accepts_upi = shop has a UPI id && shop approved`. Unknown ids are simply **absent** from the list (treat as removed). Archived/draft products are returned (with `available:false`). Use it to refresh cart prices/stock/availability and to decide which payment methods each shop supports.

### Seller product endpoints
See §12 (`GET /shop/products/mine`, `POST /shop/products`, `PUT /shop/products/:id`, `DELETE /shop/products/:id`).

## 7. Addresses

Per-user saved delivery addresses. **Row:** `id, user_id, label, full_name, phone, line1, line2, city, state, pincode, is_default (0|1), created_at`. There is **no landmark/country field** (put a landmark in `line2`).

Body (create and update — the validator requires all five required fields on **both**): `full_name` (required ≤100, `Full name is required`), `phone` (required ≤20, `Phone is required`; no format check), `line1` (required ≤200, `Address line 1 is required`), `line2` (≤200), `city` (required ≤100, `City is required`), `state` (required ≤100, `State is required`), `pincode` (`^\d{4,10}$`, `Pincode must be numeric`), `label` (free text, default `Home`, ≤50 by column), `is_default` (truthy → becomes the only default).

| Endpoint | Behaviour |
|---|---|
| `GET /shop/addresses` | 200 `data:{ addresses:[…] }` ordered default first, then newest |
| `POST /shop/addresses` | 201 `data:{ address }`, `Address added successfully`. 400 `Validation failed` + `errors`. First address is **not** auto-default |
| `PUT /shop/addresses/:id` | 200 `data:{ address }`, `Address updated successfully`; 404 `Address not found` (not yours / missing). `is_default:false` **cannot unset** a default (it keeps the old value); the only way to change the default is to set another address `is_default:true` |
| `DELETE /shop/addresses/:id` | 200 `{message:'Address deleted successfully'}`; 404 `Address not found`. Deleting the default does not promote another. Existing orders keep their own copy of the address (`ship_*`), so deletion is always safe |

500 messages: `Failed to retrieve addresses`, `Failed to add address`, `Failed to update address`, `Failed to delete address`. `PUT/DELETE` have **no** `validateIdParam`: a non-numeric id yields 404.

## 8. Checkout

One checkout turns a whole cart into **one order per shop**, in a single DB transaction. Stock is reserved (decremented) at checkout. There is no cart API: the app sends the lines.

### GET /shop/config — any authenticated
200 → `data:{ payment_methods:['upi','cod'], pay_window_minutes, confirm_window_hours, max_open_upi_orders }` (defaults 30 / 24 / 3; the local backend may override via env). Use it for the copy ("within 30 minutes") instead of hard-coding. The 10-minute silent grace and the dispute windows are **not** exposed.

### POST /shop/checkout — any authenticated
**Header (required):** `Idempotency-Key: <8–64 chars of [A-Za-z0-9_-]>` — else `400 A valid Idempotency-Key header (8-64 letters, digits, - or _) is required`.
Body:
```json
{ "address_id": 12,
  "items": [ { "product_id": 5, "quantity": 2 } ],
  "payment_methods": { "7": "upi", "9": "cod" },
  "payment_method": "upi",
  "notes": "optional, ≤500" }
```
- `address_id` int ≥1 (`Choose a delivery address`); must belong to the caller → else `404 Delivery address not found`.
- `items`: 1–50 lines (`Your cart must have between 1 and 50 products`), `product_id` int (`Invalid product`), `quantity` 1–99 (`Quantity must be between 1 and 99`). Duplicate product ids are merged; merged quantity >99 → `400 Quantity for product <id> cannot exceed 99`.
- `payment_methods`: object mapping **shop id (string key) → `"upi"|"cod"`**; `payment_method` is a fallback for shops not listed. Validator failures: `payment_methods must map shop ids to "upi" or "cod"` (not an object) · `Payment method must be upi or cod` (bad value in the map or in `payment_method`). `notes` > 500 chars → `Validation failed` (`Invalid value`). A shop with no resolved method → `400 Choose UPI or cash on delivery for "<shop>"`; `"upi"` for a shop with no valid UPI ID → `400 "<shop>" only accepts cash on delivery`.
- Other errors (all `{success:false,message}`): `400 Product <id> is no longer available` (not active / shop not approved / missing) · `400 You cannot buy from your own shop ("<shop>")` · `400 Only <n> left of "<title>"` · `409 "<title>" just sold out` (race) · `400 You can have at most 3 unpaid UPI orders at a time. Pay or cancel an existing order first.` (limit from `max_open_upi_orders`, counts the caller's orders in `awaiting_payment`/`claimed` plus the new ones) · `409 This checkout key was already used for a different cart. Please refresh and try again.` (same key, different payload).
- Each order snapshots: seller's UPI ID (`payee_upi_id`, UPI only), shop name (`payee_name`), the delivery address (`ship_*`), unit prices. UPI orders start `status:'pending_payment'`, `payment_status:'awaiting_payment'`, `pay_by = now + pay window`; COD orders start `status:'placed'`, `payment_status:'cod_pending'`. Shipping is always 0 (`total = subtotal`).
- **201** `{success:true, message:'Order placed', data:{ checkout_id, replayed:false, orders:[ { id, order_number, shop_id, shop_name, total_paise, status, payment_status, payment_method, pay_by } ] }}`.
- **200** `message:'This checkout was already placed'` with `replayed:true` and the same `orders` when the same key + same payload is re-sent (safe retry/double tap). The payload fingerprint covers `address_id`, the merged lines, `payment_methods` and `payment_method` — **not `notes`**. **Key lifecycle:** keep one key per checkout *attempt* (reuse it on network retries); when the cart, address or payment choices change, generate a new key.
- The request is atomic: any failure leaves no orders and no stock change.

### GET /shop/checkouts/:id — buyer only
200 → `data:{ checkout:{ id, created_at, orders:[ <order list item>, … ] } }` where each order is a *list item* (§9, with `shop_name`, `pay_seconds_left`, `confirm_by`; **no** `items`, **no** `needs_action`). 404 `Checkout not found` (also when it belongs to someone else). 400 `Validation failed` + `Invalid id`. Used by `/pay-checkout/:checkoutId` and `/order-placed/:checkoutId`.

## 9. Orders: lists, view, counts

All order endpoints require a token. Who may see/do what is decided **per order** by the caller's relation to it: **buyer** (`customer_user_id`), **seller** (owner of the order's shop), **admin** (role). Anyone else gets `404 Order not found` (not 403). Opening an order whose payment window already passed lazily expires it first.

**Status vocabularies** (see §14): `status` ∈ `pending_payment | placed | accepted | packed | shipped | delivered | cancelled | rejected`; `payment_status` ∈ `awaiting_payment | claimed | confirmed | disputed | refund_due | refunded | void | written_off | cod_pending | cod_collected`; `payment_method` ∈ `upi | cod`; `cancelled_by` ∈ `buyer | seller | system | admin`.

### GET /shop/orders — buyer's orders
200 → `data:{ orders:[ <list item> ] }` newest first, **max 200**, no paging params. Triggers a background sweep.

**List item** (buyer): `id, order_number, checkout_id, shop_id, shop_name, status, payment_status, payment_method, total_paise, created_at, updated_at, pay_by, confirm_by, pay_seconds_left, needs_action, items:[ { id, order_id, product_id, product_title_snapshot, unit_price_paise, quantity, line_total_paise } ]`.
- `needs_action` (buyer) = `payment_status==='awaiting_payment' && pay_seconds_left > 0`.
- `pay_seconds_left` here is the raw database difference (negative once `pay_by` has passed; `null` for COD) — in the **view** it is nulled unless awaiting payment.

### GET /shop/orders/shop — seller's orders
Role gate: the caller must own a shop with status `approved` **or `suspended`** (suspended shops keep handling existing orders). Else `403 You do not have a shop yet.` / `403 Your shop is <status>.` (pending/rejected).
200 → `data:{ orders:[…] }` newest first, **max 500**; list item as above but `customer_username` instead of `shop_name`, and `needs_action` = payment_status ∈ {`claimed`,`refund_due`} **or** (payment_status ∈ {`confirmed`,`cod_pending`} and status ∈ {`placed`,`accepted`,`packed`,`shipped`}).

### GET /shop/orders/action-count — any authenticated
200 → `data:{ buyer, seller, admin_disputes, total }` (numbers). `buyer` = my UPI orders awaiting payment with time left; `seller` = number of my shop's orders that need action (same rule as `needs_action`); `admin_disputes` = open disputes (admins only, else 0). Drives the tab badge; poll ≤ once per 60 s.

### GET /shop/orders/:id — buyer, seller or admin
200 → `data:{ order }`. The **order view** (same object is returned by every action endpoint in §10):

```json
{
  "id": 41, "order_number": "CYD-XXXX-XXXXXX", "checkout_id": 17,
  "shop_id": 7, "shop_name": "St. Mary's Youth Shop", "shop_status": "approved",
  "customer_user_id": 5, "customer_username": "buyer1",       // omitted entirely when the viewer is the buyer
  "owner_user_id": 3,
  "status": "pending_payment", "payment_status": "awaiting_payment", "payment_method": "upi",
  "subtotal_paise": 24600, "shipping_paise": 0, "total_paise": 24600, "notes": null,
  "created_at": "…", "updated_at": "…",
  "pay_by": "…", "pay_seconds_left": 1799,                    // seconds only while awaiting_payment, else null (may be negative in the 10-min grace)
  "confirm_by": null, "confirm_seconds_left": null,            // seconds only while claimed, else null
  "confirmed_at": null, "cancelled_at": null, "cancelled_by": null, "cancel_reason": null,
  "full_name": "…", "phone": "…", "line1": "…", "line2": null, "city": "…", "state": "…", "pincode": "…",   // delivery address snapshot (NOT ship_* names)
  "items": [ { "id": 1, "order_id": 41, "product_id": 5, "product_title_snapshot": "…", "unit_price_paise": 12300, "quantity": 2, "line_total_paise": 24600 } ],
  "claim": null,   // or { "utr": "123456789012", "amount_paise": 24600, "claimed_at": "…", "updated_at": "…", "refund_utr": null, "refunded_at": null }
  "disputes": [],  // each: { id, origin_payment_status, opened_by_role, reason, description, status, resolution, resolution_note, opened_at, resolved_at, proof_seconds_left }
  "viewer_role": "buyer",                                      // buyer | seller | admin
  "allowed_actions": ["claim", "cancel", "chat", "upload_evidence"],
  "dispute_reasons": [],
  "chat_read_only": false,
  "payee": { "upi_id": "shop@okaxis", "name": "St. Mary's Youth Shop", "upi_link": "upi://pay?pa=shop@okaxis&pn=St.%20Mary's%20Youth%20Shop&am=246.00&tn=CYD-…&cu=INR" }   // null unless viewer is the buyer AND payment_status==='awaiting_payment' AND shop approved
}
```
Notes:
- **Delivery address fields are un-prefixed** (`full_name, phone, line1, line2, city, state, pincode`) in the view even though stored as `ship_*`.
- `payee` exists **only** while the buyer must pay. After a claim, the buyer's screen must remember the UPI ID/amount if it still needs to show them (or omit them); the seller's UPI ID is never in the view afterwards. `upi_link` is a ready `upi://pay` deep link (amount formatted `rupees.paise`, `pn` URL-encoded, `tn` = order number, `cu=INR`) or `null` if the stored UPI id is invalid.
- `disputes[].proof_seconds_left` = seconds left for the buyer to upload proof after a seller's `not_received` report (negative when elapsed). It is computed for **every** dispute entry (`opened_at + proof window − now`, whatever the reason or status); it only means something for an open `not_received` dispute.
- `viewer_role` precedence: buyer, then seller (shop owner), then admin — an admin who is also the order's buyer or the shop's owner is viewed as that role, not as `admin`.
- `claim.utr` is visible to buyer, seller and admin. Time values are database-clock based; **use the `*_seconds_left` fields for countdowns**, never the device clock against `pay_by`.
- A truthy-boolean check on the raw clock flags (`pay_open`, `confirm_overdue`, …) is used internally only; they are not part of the response.
- 404 `Order not found` (missing or not a party). 400 `Validation failed` + `Invalid id`.

## 10. Orders: actions

Every action endpoint below returns **the refreshed order view** (§9) as `{success:true, message, data:{order}}`, so the screen can replace its state with the response. Each runs in a transaction with a row lock; a concurrent change yields `409 This order changed in the meantime. Please refresh and try again.` Role mismatches: not a party → `404 Order not found`; a party but the wrong role → `403 You cannot do this on this order` (an admin counts as a party here, so an admin calling a buyer/seller action gets 403; the one exception is `POST …/evidence`, where admins get 404).

**UTR rules (all UTR fields).** Send as a **JSON string** (a JSON number fails validation). The server strips spaces and `-`, then requires exactly **12 digits**. Messages: validator `The 12-digit UPI Ref No is required` (missing / not a string) → `400 Validation failed` + `errors`; service `400 UTR must be the 12-digit UPI reference number (UPI Ref No), not the transaction ID` (refund endpoint: `Refund UTR must be …`). UTRs are **globally unique**: reuse → `409 This UTR has already been used for another order`.

**`allowed_actions` → endpoint map** (render buttons only for actions present in the order view):

| `allowed_actions` entry | Viewer | Endpoint |
|---|---|---|
| `claim` | buyer | `POST /shop/orders/:id/payment-claim` |
| `edit_claim` | buyer | `PATCH /shop/orders/:id/payment-claim` |
| `cancel` | buyer | `PUT /shop/orders/:id/cancel` |
| `confirm` | seller | `POST /shop/orders/:id/payment-confirm` |
| `reject` | seller | `PUT /shop/orders/:id/status` with `{status:'rejected', reason}` |
| `advance:accepted` / `advance:packed` / `advance:shipped` / `advance:delivered` | seller | `PUT /shop/orders/:id/status` with `{status:<suffix>}` |
| `refund` | seller | `POST /shop/orders/:id/refund` |
| `dispute` (+ `dispute_reasons`) | buyer, seller | `POST /shop/orders/:id/dispute` (seller's `not_received` may also use `POST …/payment-not-received`) |
| `resolve` | admin | `POST /shop/admin/disputes/:disputeId/resolve` (id from the open entry of `disputes[]`) |
| `chat` | buyer, seller, admin (only if the order has ≥1 dispute) | §11 messages |
| `upload_evidence` | buyer, seller | §11 evidence |

### POST /shop/orders/:id/payment-claim — buyer
Body `{ utr: string, screenshot?: base64 data URL }`. Screenshot optional (stored **privately**; `image` errors as §3: `Invalid image format`, `Unsupported image type`, `Image too large. Maximum size: 5MB`, …; upload failure `502 Could not upload the screenshot. Please try again.`). Allowed only when `payment_status='awaiting_payment'`, method UPI, shop approved, and still inside `pay_by + 10 min grace`.
- Order of checks: body validation → screenshot validation/upload (so a bad image gives its 400/502 before any order check, and an uploaded screenshot is orphaned if the claim is then refused) → UTR format → order checks below. The same upload-first order applies to `POST …/dispute` (`screenshot`) and `POST …/evidence` (`image`).
- Effect: `payment_status → claimed`, `confirm_by = now + confirm window` (24 h default). Message: `Payment submitted. The seller will confirm once it shows in their bank.`
- Errors: `400 This is a cash-on-delivery order` · `409 This order is not waiting for payment` · `409 This shop is suspended and cannot take payments. Do not pay; the order will be cancelled.` · `409 The payment window has closed. If you already paid, open a "paid after cancel" dispute with your UTR.` · `409 This UTR has already been used for another order` · UTR messages above.

### PATCH /shop/orders/:id/payment-claim — buyer (edit UTR)
Body `{ utr }`. Only while `claimed` (before the seller responds): else `409 The UTR can only be changed before the seller responds`. Message `UPI reference updated`. If the seller confirms with the old UTR meanwhile → seller gets `409 The buyer has changed the UPI Ref No since you looked. Please check the new one in your bank app.`

### PUT /shop/orders/:id/cancel — buyer
Body optional `{ reason (≤500 stored) }`. Allowed for UPI `awaiting_payment`, or COD `cod_pending` with `status='placed'`. Effect: `status cancelled`, `payment_status void`, stock released once. Message `Order cancelled`.
- Errors: `409 You already submitted a payment for this order. Ask the seller in the chat, or open a dispute after the confirmation window.` (when `claimed`) · `409 This order can no longer be cancelled`.

### POST /shop/orders/:id/payment-confirm — seller
Body `{ utr }` — must **equal the buyer's claimed UTR** (the seller echoes the one they verified in their bank app). Effect: `payment_status → confirmed`, `confirmed_at` set, `status pending_payment → placed`. Message `Payment confirmed`. Errors: `409 There is no payment claim to confirm` · `409 The buyer has changed the UPI Ref No since you looked. …`.

### POST /shop/orders/:id/payment-not-received — seller
Body optional `{ description }`. Shortcut for opening a dispute with `reason:'not_received'` (requires `claimed`). `description` has no validator here (silently truncated at 1000). Message `Reported to an admin. The buyer has been asked for proof.` The buyer then has the proof window (24 h default) to upload a screenshot; if none by then the backend auto-resolves the dispute `claim_rejected` (order cancelled, stock released).

### PUT /shop/orders/:id/status — seller (fulfilment and reject)
Body `{ status: 'accepted'|'packed'|'shipped'|'delivered'|'rejected', reason? (≤500) }`. Validator message `Invalid order status`.
- Fulfilment chain: `placed→accepted→packed→shipped→delivered` only, and only when `payment_status ∈ {confirmed, cod_pending}`; COD `delivered` also sets `payment_status cod_collected`. Errors: `409 Confirm the payment before processing this order` · `400 Cannot move order from "<status>" to "<status>"`.
- `rejected`: allowed while `awaiting_payment` (→ `void`), COD `cod_pending` with status `placed|accepted` (→ `void`), or `confirmed` with status `placed|accepted` (→ `refund_due`, the seller must then refund). Else `409 This order can no longer be rejected`. Stock is released once. Message `Order marked as <status>`.

### POST /shop/orders/:id/refund — seller
Body `{ refund_utr }` (12-digit string). Only when `refund_due`. The refund UTR must differ from this order's payment UTR and from any payment UTR on the platform: `400 The refund UPI Ref No must be the refund transaction, not a payment`; a refund UTR already used as a refund → `409 This refund UTR was already used`; `409 This order has no refund due`; `409 No payment was recorded for this order`. Effect: `payment_status → refunded`, `refunded_at` set. Message `Refund recorded`.

### POST /shop/orders/:id/dispute — buyer or seller
Body `{ reason, description? (≤1000), utr?, screenshot? }`; `reason` ∈ `not_received | not_confirmed | wrong_amount | refund_not_received | paid_after_cancel | not_delivered | other` (`Choose a dispute reason`). Offer only reasons listed in the order's `dispute_reasons`. Effects: creates the dispute (origin = current `payment_status`), `payment_status → disputed`, posts a system chat message. UPI orders only (`400 Cash-on-delivery orders have no payment disputes; use the chat or contact an admin`, checked before the reason rules). One open dispute per order: because an open dispute puts the order in `disputed`, a second attempt normally fails the reason's own eligibility 409 below; `409 This order already has an open dispute` only appears on a race. `utr` is read only for `paid_after_cancel`; `description` > 1000 → `400 Validation failed` (`Invalid value`). An admin calling this gets `403 You cannot do this on this order`.

| reason | who | allowed when (server rule) | extra requirements |
|---|---|---|---|
| `not_received`, `wrong_amount` | seller | `claimed` | — (`409 Only the seller can report this, while a payment claim is waiting`) |
| `not_confirmed` | buyer | `claimed` (else `409 There is no payment claim waiting for the seller`) and `confirm_by` already passed (`409 The seller still has time to confirm. You can open a dispute after the confirmation deadline.`) | a payment screenshot must exist or be attached: `400 Attach a screenshot of your UPI payment to open this dispute` |
| `paid_after_cancel` | buyer | `void` + `cancelled` by `system` or `buyer`, within 48 h of cancellation, **no existing claim** (`409 This applies only to UPI orders that were cancelled before you could submit your payment`, `409 This must be reported within 48 hours of the cancellation`; an existing claim row surfaces only at the end as `409 A payment is already recorded for this order`) | **`utr` required** (12 digits, unique) and a screenshot (as above; the screenshot check comes first); the UTR is recorded as the claim |
| `refund_not_received` | buyer | `refund_due`, or `refunded` within 7 days of `refunded_at` (`403 Only the buyer can report a missing refund`, `409 Refunds can be disputed within 7 days`, `409 There is no refund on this order`) | — |
| `not_delivered` | buyer | `confirmed`, not yet delivered/cancelled/rejected, ≥ 7 days after `confirmed_at` (`409 This applies only to paid orders that have not been delivered`, `409 You can report non-delivery 7 days after the seller confirmed payment`) | — |
| `other` | buyer/seller | origin `claimed`, `confirmed`, `refund_due` (or buyer on `refunded` within 7 days, judged by the `refund_not_received` rules) (`409 This order cannot be disputed in its current state`) | — |

Message `Dispute opened. An admin will review it.` Evidence uploaded with a dispute is stored as `payment_proof` (buyer) or `other` (seller). An unknown `reason` is stopped earlier by the validator (`400 Validation failed` + `Choose a dispute reason`); the service's `400 Unknown dispute reason` is unreachable over HTTP.

## 11. Order chat and evidence

**Who may use chat:** the order's buyer and seller always; an **admin only when the order has at least one dispute** (else `404 Order not found`). Chat becomes **read-only** when the order is terminal (`void`, `refunded`, `written_off`, `cod_collected`, or `confirmed`+`delivered`) **and** untouched for 14 days; `allowed_actions` then omits `chat` and the view has `chat_read_only:true`.

### GET /shop/orders/:id/messages
Query `after` (int message id; optional). Returns messages with `id > after`, oldest first, **max 200 per call** (page forward by passing the last id). Poll every ~5 s while the chat screen is open.
200 → `data:{ messages:[ { id, sender_role, sender_user_id, sender_username, body, created_at } ], read_only }`. `sender_role` ∈ `buyer | seller | admin | system` (`system` rows have `sender_user_id` and `sender_username` `null` — they narrate state changes: order placed, claim, confirm, dispute, cancel…).

### POST /shop/orders/:id/messages
Body `{ body: string }` (`Message is required` if not a string). The server **strips HTML tags** (`<…>`), trims, then: empty → `400 Message cannot be empty`; > 1000 chars → `400 Message is too long (max 1000 characters)`; read-only → `409 This conversation is closed`.
201 → `data:{ message:{ id, sender_role, sender_user_id, sender_username, body, created_at } }`, message `Message sent`.
**Rate limit:** 20 messages per minute per user (all orders) → `429 You are sending messages too quickly. Please wait a minute.` (draft-7 `RateLimit` and `RateLimit-Policy` headers).

### GET /shop/orders/:id/evidence
Same access as chat. 200 → `data:{ evidence:[ { id, kind, created_at, uploader_user_id, uploader_username, url } ] }`, `kind` ∈ `payment_proof | refund_proof | other`. `url` is a **signed, private Cloudinary link valid for 10 minutes** — fetch the list when the screen opens and re-fetch if an image fails to load after ~10 min; never persist these URLs.

### POST /shop/orders/:id/evidence
Body `{ image: base64 data URL (required, "An image is required"), kind?: 'payment_proof'|'refund_proof'|'other' }`. Buyer or seller only (admins and others → `404 Order not found`). Buyers may use `payment_proof|other`, sellers `refund_proof|other` — a vocabulary value not allowed for the caller's role is silently stored as `other`, but a `kind` outside the three vocabulary values (or `null`) is rejected by the validator: `400 Validation failed` + `Invalid value`. Not allowed on a closed order unless a dispute is open: `409 This order is closed`. The image is validated/uploaded **before** any access check (a bad image gives 400/502 even to a non-party); an empty-string `image` passes the validator, skips the upload and then fails with `500 Something went wrong. Please try again.` for a party on an open order.
201 → `data:{ evidence:{ id, kind } }`, message `Uploaded`; a system chat line is added. Image errors: `400 Invalid image format | Invalid base64 format | Unsupported image type | No image data found | Image too large. Maximum size: 5MB`; `502 Could not upload the screenshot. Please try again.`

## 12. Seller product management

Role gate for `GET /shop/products/mine`, `POST`, `PUT`, `DELETE`: the caller must own an **approved** shop. Else `403 You do not have a shop yet. Apply to become a shop owner first.` or `403 Your shop is <status>. Only approved shops can manage products and orders.` (a **suspended** shop therefore cannot edit products but can still manage orders via §9/§10).

### GET /shop/products/mine
200 → `data:{ products:[ <product row> + images ] }` all statuses, newest first, no paging.

### POST /shop/products
Body (rupees!): `title` (required ≤150, `Product title is required`), `price` (number ≥0.01, **rupees**, `Price must be a positive number`), `stock_quantity` (int ≥0, `Stock quantity must be 0 or more`), `description` (≤5000), `compare_at_price` (≥0, rupees; stored only if truthy; no check against `price`), `category_id` (int ≥1; send the key only when set — `null` fails validation), `status` (`draft|active|out_of_stock|archived`, default **`active`**), `sku` (free text), `images` (array of **≤6** base64 data URLs, `Up to 6 images allowed`; the first becomes `is_primary`).
- 201 → `data:{ product }`, message `Product created successfully`. 400 `Validation failed`. 500 `Failed to create product` (also when Cloudinary rejects an image; images are not pre-validated, so check type/size on the client). **Not atomic:** the product row is inserted before the images are uploaded, so a 500 caused by an image can leave a created product with fewer/no images — refresh `GET /shop/products/mine` instead of blindly retrying (a retry would create a duplicate). The whole request must stay under the **10 MB** body limit (6 images ⇒ keep each ≲1.2 MB after resize).

### PUT /shop/products/:id
**Send the full body** — the validator requires `title`, `price` and `stock_quantity` again. Only provided fields are updated (`status` and `description` etc. included). `images`: a **non-empty** array **replaces all images** (strings starting with `http` are kept as URLs, others uploaded); an omitted/empty array leaves images unchanged (images cannot be removed entirely). `stock_quantity` changes do not automatically change `status` (a product at 0 stock stays `active` and is simply `in_stock:0` / unavailable to buy).
- Clearing `compare_at_price`: omitted keeps the old value; `""`/`null` fail validation (`Invalid value`); a JSON number `0` clears it (a string `"0"` would store 0 paise).
- 200 → `data:{ product }`, `Product updated successfully`. 404 `Product not found`; 403 `You do not own this product`; 500 `Failed to update product` (image replacement is also non-atomic: old images are deleted before the new ones are uploaded). `PUT`/`DELETE` have no id validator (a non-numeric id gives 404); `PUT` runs the approved-shop gate before body validation.

### DELETE /shop/products/:id
Soft-removes: sets `status='archived'`. 200 `{message:'Product archived successfully'}`; 404 `Product not found`; 403 `You do not own this product`; 500 `Failed to archive product`. (Existing orders keep their title/price snapshot.)

## 13. Admin: shops and disputes

All admin-only (`403 Admin access required`).

### GET /shop/admin/shops
Query `status` (`pending|approved|rejected|suspended`; omit for all; any other value is not validated and simply returns an empty list). 200 → `data:{ shops:[ <shop row> + owner_username + owner_email ] }` newest first, no paging and no row cap.

### PUT /shop/admin/shops/:id/review
Body `{ status: 'approved'|'rejected'|'suspended', rejection_reason? }` — `Invalid review status`; **`rejection_reason` is required (non-empty, ≤500) for `rejected` and `suspended`**: `Please give a reason when rejecting or suspending a shop`. For `approved` the stored reason is cleared. Any current status may move to any of the three (that is how "reinstate" works: `suspended → approved`).
- 200 → `message:'Shop <status>'`, `data:{ shop, cancelled_unpaid_orders:int }`. Suspending cancels the shop's `awaiting_payment` orders (stock released, buyers told in chat); orders already claimed/confirmed stay and the seller can still fulfil/refund.
- 404 `Shop not found`; 400 validation (`Invalid id` for a bad id); 500 `Failed to review shop`.

### GET /shop/admin/disputes
Query `status` = `open | resolved` (anything else/omitted = all). Open first, then newest; **max 500**.
200 → `data:{ disputes:[ { id, order_id, reason, status, origin_payment_status, opened_by_role, description, resolution, resolution_note, opened_at, resolved_at, order_number, total_paise, payment_status, order_status, shop_name, buyer_username, seller_username } ] }`. To act on a dispute, open the order (`GET /shop/orders/:order_id` as admin) to see claim, chat and evidence.

### POST /shop/admin/disputes/:id/resolve
`:id` is the **dispute id**. Body `{ resolution: string, note: string (required, trimmed, ≤1000) }` (`Choose a resolution`, `A note explaining the decision is required`). The allowed `resolution` values depend on the dispute's **origin** payment status:

| Origin (`origin_payment_status`) | Allowed resolutions |
|---|---|
| `claimed` | `payment_confirmed`, `claim_rejected`, `refund_required` |
| `void` | `refund_required`, `claim_rejected` |
| `confirmed` | `refund_required`, `fulfilment_ordered` |
| `refund_due` | `refund_confirmed`, `refund_required`, `closed_unrecoverable` |
| `refunded` | `refund_confirmed`, `refund_required`, `closed_unrecoverable` |

Wrong choice → `400 For this dispute, choose one of: <list>`. Already resolved → `409 This dispute is already resolved`; unknown id → `404 Dispute not found`. 200 `{success:true, message:'Dispute resolved'}` (no `data`; re-fetch the order). Effects per resolution (details in `06-DOMAIN-RULES.md`): `payment_confirmed`→`confirmed`; `claim_rejected`→`void` (and cancel + restock if origin was `claimed`); `refund_required`→`refund_due` (cancel + restock when appropriate); `fulfilment_ordered`→`confirmed`; `refund_confirmed`→`refunded`; `closed_unrecoverable`→`written_off`. The system also auto-resolves `not_received` disputes `claim_rejected` when the buyer uploads no proof within the proof window.

## 14. Vocabularies (statuses, `allowed_actions`, `dispute_reasons`)

| Name | Values |
|---|---|
| `users.role` | `admin`, `user`, `profile_holder` |
| shop `status` | `pending`, `approved`, `rejected`, `suspended` |
| product `status` | `draft`, `active`, `out_of_stock`, `archived` |
| order `status` | `pending_payment`, `placed`, `accepted`, `packed`, `shipped`, `delivered`, `cancelled`, `rejected` |
| order `payment_status` | `awaiting_payment`, `claimed`, `confirmed`, `disputed`, `refund_due`, `refunded`, `void`, `written_off`, `cod_pending`, `cod_collected` |
| `payment_method` | `upi`, `cod` |
| `cancelled_by` | `buyer`, `seller`, `system`, `admin` |
| `viewer_role` | `buyer`, `seller`, `admin` |
| `allowed_actions` | `claim`, `edit_claim`, `cancel`, `confirm`, `reject`, `advance:accepted`, `advance:packed`, `advance:shipped`, `advance:delivered`, `refund`, `resolve`, `chat`, `upload_evidence`, `dispute` (a viewer may see several at once; unknown future entries must be ignored) |
| `dispute_reasons` (order view) | buyer: `not_confirmed`, `paid_after_cancel`, `refund_not_received`, `not_delivered`, `other`; seller: `not_received`, `wrong_amount`, `other` — the endpoint also accepts the full set `not_received | not_confirmed | wrong_amount | refund_not_received | paid_after_cancel | not_delivered | other` |
| dispute `status` | `open`, `resolved` |
| dispute `resolution` | `payment_confirmed`, `claim_rejected`, `refund_required`, `fulfilment_ordered`, `refund_confirmed`, `closed_unrecoverable` |
| evidence `kind` | `payment_proof`, `refund_proof`, `other` |
| message `sender_role` | `buyer`, `seller`, `admin`, `system` |

**What `allowed_actions` means in each state** (derived from `orderQueries.allowedActions`; the app must not recompute it):
- Buyer: `claim` when UPI + `awaiting_payment` + inside the pay window (+grace) + shop approved; `edit_claim` while `claimed`; `cancel` when UPI `awaiting_payment` or COD `cod_pending`+`placed`; `dispute` reasons as in §10's table; `chat` unless read-only; `upload_evidence` unless the order is terminal without an open dispute.
- Seller: `confirm` while `claimed`; `reject` when `awaiting_payment`, or (`confirmed|cod_pending` and status `placed|accepted`); `advance:<next>` when `confirmed|cod_pending` along `placed→accepted→packed→shipped→delivered`; `refund` when `refund_due`; dispute reasons `not_received`/`wrong_amount` while `claimed` (no open dispute), `other` while `confirmed`/`refund_due` (UPI, no open dispute).
- Admin: `resolve` when the order has an open dispute; `chat` only if the order has any dispute.

## 15. Role matrix

`✓` allowed · `own` only own records · `—` forbidden. "Any" = any authenticated role.

| Endpoint | admin | user (manager) | profile_holder | Notes |
|---|---|---|---|---|
| `POST /auth/login`, `GET /health` | ✓ public | ✓ | ✓ | login rate limited |
| `POST /auth/register` | ✓ | — | — | creates any role |
| `GET/PUT /auth/profile`, `PUT /auth/change-password`, `POST /auth/logout` | ✓ | ✓ | ✓ | |
| `/profile-holder/*` (except login) | — | — | ✓ | |
| `POST /profiles` | ✓ | ✓ | (works, don't expose) | |
| `GET /profiles`, `filter-options` | all | own created | own only | |
| `GET /profiles/stats` | ✓ | — | — | |
| `GET/PUT/DELETE /profiles/:id` | all | own created | — (404) | no status filter on GET/PUT |
| `/shop/categories` GET | ✓ | ✓ | ✓ | POST admin only |
| `/shop/shops*` browse, `shops/apply`, `shops/mine`, `/shop/addresses*`, `/shop/products*` browse + lookup, `/shop/checkout`, `/shop/config`, `/shop/checkouts/:id`, `/shop/orders` (+ `action-count`, `:id`) | ✓ | ✓ | ✓ | any user can buy and apply for a shop |
| `GET /shop/orders/shop` | own shop (approved/suspended) | same | same | |
| `/shop/products` POST/PUT/DELETE/`mine` | own approved shop | same | same | |
| `/shop/orders/:id/*` buyer actions | order's buyer | same | same | per-order relation |
| `/shop/orders/:id/*` seller actions | the shop's owner | same | same | |
| `/shop/admin/*` | ✓ | — | — | |

## 16. Quirks checklist (things the app must handle)

1. **No `/api` prefix**; unknown routes return an HTML 404 (not JSON).
2. **Profile write vs read names** differ (`father_name/mother_name/date_of_birth` ↔ `father/mother/dob`, `photo` ↔ `photo_url`).
3. **Create profile requires `date_of_birth`** in practice (500 without it) and `phone` with digits; initial holder password = digits of phone; `credentials.password` echoes the phone as sent.
4. **Restore-by-recreation**: same name (normalised) + exact phone as a deleted profile ⇒ reactivated, **new credentials**; no restore endpoint, no "deleted" list endpoint.
5. **`GET /profiles/:id` / `PUT /profiles/:id` ignore soft-delete**; holders get 404 on those.
6. **Stats count soft-deleted** rows.
7. **Holder `change-password` is weaker** (min 6) than `/auth/change-password` (min 6 + lower/upper/digit); the app enforces the stricter rule on both.
8. **`filter-options` returns values in use**, not the master deanery/parish lists (use `assets/data/deaneries.json` for forms).
9. **Public shop/product responses hide the UPI ID**; the buyer sees `payee` only while `awaiting_payment`.
10. **Product writes in rupees, reads in paise**; images are base64 in JSON, ≤6, first = primary; PUT needs the full body; images can't be cleared.
11. **UTR must be a string**, 12 digits after stripping spaces/dashes; globally unique; the seller's confirm must **echo the buyer's claimed UTR**, while the refund UTR must be a different one.
12. **Checkout needs `Idempotency-Key`**; replays return 200 with `replayed:true`; same key + different payload → 409.
13. **Order view address fields are un-prefixed**; `customer_username` is omitted for the buyer; `pay_seconds_left`/`confirm_seconds_left` only in their own states and may be negative during the grace period.
14. **Server is the clock**: use `*_seconds_left`; a 10-minute silent grace after `pay_by` still accepts a claim.
15. **A suspended shop** disappears from the public (404 on storefront, `available:false` in lookup), cannot be paid, cannot edit products, but can still handle existing orders.
16. **No pagination** on orders (200 buyer / 500 seller caps), my products and admin shops (uncapped), admin disputes (500 cap). Product/shop/profile lists paginate (`page`, `limit`).
17. **Chat**: ≤200 messages per call (use `after`), 20 posts/min/user, HTML stripped, admin sees chat only if a dispute exists; read-only after 14 days when terminal.
18. **Evidence URLs are signed and expire in 10 minutes.**
19. **JWT 24 h, no refresh**; deleting a profile or deactivating a user invalidates their token on the next call (`Invalid token - user not found`).
20. **Login rate limit** 10 failed/15 min per IP+username; message in §1.
21. **Cold start**: Render free tier can take 30–60 s on the first request.
22. **Validation errors are flat string lists** (`errors:[…]`), not keyed by field.

---
*Source files read for this contract:* `server.js`, `middleware/{auth,security,shopAuth,shopValidation,validation}.js`, `routes/*.js`, `controllers/{auth,profile,profileHolder,shop,product,address,checkout,dispute,order}Controller.js`, `services/{orderLifecycle,orderQueries}.js`, `config/{shopConfig,shopDatabase}.js`, `migrations/001_p2p_payments.js`, `utils/{fileUpload,httpError,shopHelpers}.js`, `config/database.js` (profile table).
