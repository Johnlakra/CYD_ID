# 08 · Data models and JSON mapping

> Hand-written Dart models (no code generation). Every field below was checked against the `cyd_Id_BE` source on branch
> `claude/happy-bell-oy6or2` (controllers, `services/orderQueries.js`, `services/orderLifecycle.js`, `config/*Database.js`,
> `migrations/001_p2p_payments.js`, `middleware/*Validation.js`). Items tagged **[unverified-live]** were derived from code
> only and were not confirmed against a running server. **Verified live** (MariaDB 10.11 + the seeded data of `tools/seed-dev-data.js`, all roles): the shapes of login, `auth/profile`, profiles list/filter-options/stats, holder my-profile/my-id-card, shops (mine/list/admin), categories, products (list/detail/mine/lookup), addresses, config, checkout, checkout get, buyer/seller order lists, OrderView in the states awaiting_payment → claimed → confirmed → disputed, claim/confirm/dispute responses, messages, admin disputes, action-count, and the error messages quoted in §14. **Not verified live** (no Cloudinary locally): evidence upload response, any image field with a real URL, signed evidence URLs, refund/reject/fulfilment responses (same OrderView shape by code). **Money is `int` paise everywhere. Never `double`.** Dart snippets are illustrative and uncompiled.

## Contents
1. Conventions and parsing helpers · 2. User / Session · 3. Profile · 4. FilterOptions & ProfileStats · 5. Shop · 6. Category
7. Product (+ images, lookup row) · 8. CartLine (client only) · 9. Address · 10. Order (list item, detail, item, checkout result)
11. Claim · Dispute · Message · Evidence · 12. ActionCounts · ShopConfig · 13. Paging · 14. ApiError and envelope
15. Enums (exact strings) · 16. Illustrative snippet

---

## 1. Conventions and parsing helpers

- **Envelope.** Success: `{ "success": true, "message": "...", "data": { ... } }`. Failure: `{ "success": false, "message": "...", "errors"?: ["...", ...] }`. Repositories return `data` only (see §14).
- **Naming.** JSON keys are `snake_case`; Dart fields are `lowerCamelCase`. Model classes are immutable, with `fromJson(Map<String,dynamic>)` and, where the app sends the model back, `toRequest()` (never `toJson()` that round-trips read names into write names).
- **Integers.** MySQL `BIGINT UNSIGNED` money columns and `COUNT(*)` arrive as JSON numbers → Dart `int`. Read with `(json['x'] as num).toInt()` to tolerate `1.0`.
- **Booleans from `TINYINT`.** Several columns arrive as `0`/`1` numbers, not JSON booleans (`is_default`, `is_primary`, `in_stock`, `status` on categories, and `accepts_upi` on the product detail). Others are real booleans (`accepts_upi`/`available` on lookup, `needs_action` on order list rows, `chat_read_only` on the order view, `validity.isValid`). The clock flags (`pay_open`, `confirm_overdue`, `not_delivered_eligible`, `paid_after_cancel_open`, `stale`) are internal and are **not** in any response (§10.2). Always read booleans with the helper below.
- **Dates and times.** The server uses `mysql2` without `dateStrings`, so `DATE`/`DATETIME`/`TIMESTAMP` columns serialise through `JSON.stringify(Date)` as ISO-8601 UTC strings, e.g. `"2026-11-19T10:28:00.000Z"` (**verified live**, server in UTC).
  - Timestamps (`created_at`, `updated_at`, `claimed_at`, `pay_by`, …) → `DateTime.parse(...)` (UTC) then `.toLocal()` for display.
  - **Calendar dates** (`dob`, `date_of_baptism`, `issue_date`): a `DATE` has no zone, but the server turns it into a `Date` at the server's local midnight. With the production server in UTC the string is `YYYY-MM-DDT00:00:00.000Z`: take the **first 10 characters** as the calendar date and never convert it through the device time zone (a device west of UTC would show the previous day). Write requests send `YYYY-MM-DD`.
  - Countdowns never use these strings: use `*_seconds_left` (see doc 06 and doc 01 §3).
- **Nullability.** A column that is nullable in SQL is `T?` in Dart. Fields marked "always" are `NOT NULL` or always populated by the view builder.
- **Unknown keys** are ignored (the server may add fields); **missing optional keys** map to `null`.

```dart
// core/format/json.dart (illustrative)
bool asBool(Object? v) => v == true || v == 1 || v == '1';
int asInt(Object? v) => (v as num).toInt();
int? asIntOrNull(Object? v) => v == null ? null : (v as num).toInt();
DateTime? asDateTime(Object? v) => v == null ? null : DateTime.parse(v as String).toLocal();
String? asCalendarDate(Object? v) => v == null ? null : (v as String).substring(0, 10); // 'YYYY-MM-DD'
```

---

## 2. User and Session

Returned by `POST /auth/login` as `data.user`, by `GET/PUT /auth/profile` as `data.user`, and by `POST /auth/register` as `data.user`. The holder-only login (`POST /profile-holder/login`) returns the same shape plus `profile`, but the app uses `/auth/login` for **all** roles (doc 05).

| JSON key | Dart name | Dart type | Null? | Notes |
|---|---|---|---|---|
| `id` | `id` | `int` | no | |
| `username` | `username` | `String` | no | Holder usernames look like `anil1304` (name + birth-day digits; see doc 06) |
| `email` | `email` | `String` | no | Present in login/profile/register. Holder accounts have a generated email |
| `role` | `role` | `UserRole` | no | `admin` \| `user` \| `profile_holder` (§15). Unknown string → `UserRole.unknown`, treat as no privileges |
| `created_at` | `createdAt` | `DateTime?` | yes | Only in `GET/PUT /auth/profile` and register, **not** in login |
| `updated_at` | `updatedAt` | `DateTime?` | yes | Only in `GET/PUT /auth/profile` |

Login response: `data = { token: String, user: User }` (JWT, 24 h, no refresh token). Payload of the JWT is `{userId}`; **the role is read from the database on every request**, so the app must trust the `user.role` it received at login only for UI, never for authorisation.

`Session` (client-only, persisted in secure storage): `{ token: String, user: User }`. Serialise as `{"token": "...", "user": {id, username, email, role}}`.

`toRequest` shapes (doc 05 has the endpoints): login `{username, password}` (`username` may also be an email); update account `{username?, email?}` (at least one); change password `{currentPassword, newPassword}` — note **camelCase** here, an exception to the snake_case rule; create user (admin) `{username, email, password, role}`.

---

## 3. Profile

Table `profile` (soft delete via `status`). One Dart class `Profile` serves the list item, the detail and the holder's own profile; the extra join columns are nullable.

### 3.1 Read fields (all of: list item `GET /profiles` → `data.profiles[]`, detail `GET /profiles/:id` → `data.profile`, create/update responses `data.profile`, holder `GET /profile-holder/my-profile` → `data.profile`, `my-id-card` → `data.profile`, login → `data.profile`)

| JSON key (READ) | Dart name | Dart type | Null? | Notes |
|---|---|---|---|---|
| `id` | `id` | `int` | no | |
| `name` | `name` | `String` | no | **Stored lowercase** by the server on create/restore (`normalizeName`; `PUT` saves it exactly as sent); display with the capitalisation helper (doc 06 §Formats) |
| `father` | `fatherName` | `String?` | yes | READ name is `father` — **write name is `father_name`** |
| `mother` | `motherName` | `String?` | yes | READ `mother` — write `mother_name` |
| `dob` | `dateOfBirth` | `String?` (calendar date) | yes | READ `dob` — write `date_of_birth`. `YYYY-MM-DD` after §1 trimming |
| `designation` | `designation` | `String?` | yes | One of `assets/data/designations.json` |
| `level` | `level` | `ProfileLevel` (`String` raw kept) | yes | `parish` \| `deanery` \| `dexco` (card background), see §15 |
| `date_of_baptism` | `dateOfBaptism` | `String?` (calendar date) | yes | Same name for read and write |
| `postal_address` | `postalAddress` | `String?` | yes | Free text |
| `parish` | `parish` | `String?` | yes | |
| `deanery` | `deanery` | `String?` | yes | |
| `qualification` | `qualification` | `String?` | yes | |
| `phone` | `phone` | `String?` | yes | 10-digit Indian mobile; also the holder's initial password (doc 06) |
| `involvement` | `involvement` | `String?` | yes | Free text |
| `photo_url` | `photoUrl` | `String?` | yes | Cloudinary URL; null → show initials placeholder |
| `issue_date` | `issueDate` | `String?` (calendar date) | yes | Basis of the 2-year validity (doc 06/07). Null-safe |
| `status` | `status` | `int` | no | `1` active, `0` deleted. Lists never contain `0` rows (but `stats` counts them) |
| `profile_user_id` | `profileUserId` | `int?` | yes | The holder's `users.id` |
| `created_by` | `createdBy` | `int?` | yes | `users.id` of the creator (managers see only their own) |
| `created_at` | `createdAt` | `DateTime?` | yes | |
| `updated_at` | `updatedAt` | `DateTime?` | yes | |
| `created_by_username` | `createdByUsername` | `String?` | yes | **List and detail only** (joined); absent in create/update/holder responses |
| `created_by_email` | `createdByEmail` | `String?` | yes | Same as above |

### 3.2 Write fields (`POST /profiles`, `PUT /profiles/:id`)

| JSON key (WRITE) | Dart source | Rules (verbatim messages are in doc 06) |
|---|---|---|
| `name` | `name` | required |
| `father_name` | `fatherName` | optional |
| `mother_name` | `motherName` | optional |
| `date_of_birth` | `dateOfBirth` | **Required by the app** — the validator treats it as optional but create fails with a 500 without it |
| `designation`, `level`, `date_of_baptism`, `postal_address`, `parish`, `deanery`, `qualification`, `phone`, `involvement` | same names | `phone` required (10 digits); `level` from §15 |
| `photo` | `photoDataUrl` | `data:image/jpeg;base64,...` (≤5 MB image, ≤10 MB body); **mandatory on create, optional on update** (an existing `http(s)` URL is accepted and kept) |

Holder self-service `PUT /profile-holder/update-profile` accepts only `{photo?, qualification?, postal_address?}`.

### 3.3 Create response and credentials

`POST /profiles` → `201`, `data = { profile: Profile, credentials: { username, password, message } }`. The `message` text on the envelope is `Profile created successfully` or `Profile restored successfully` (restore-by-recreation: same normalised name + phone as a deleted profile). `Credentials{username, password, message}` is **shown once** (copy/share) and must never be stored or logged.

### 3.4 Holder ID-card response (`GET /profile-holder/my-id-card`)

`data = { profile: Profile, validity: Validity }`

| JSON key | Dart name | Dart type | Null? | Notes |
|---|---|---|---|---|
| `validity.issued` | `issued` | `String?` | yes | Raw `issue_date` (ISO) — trim to 10 chars |
| `validity.expires` | `expires` | `String` | no | `YYYY-MM-DD` already (server `toISOString().split('T')[0]`), `issue_date` + 2 years |
| `validity.isValid` | `isValid` | `bool` | no | **camelCase** key. `now <= expiry` |
| `validity.daysUntilExpiry` | `daysUntilExpiry` | `int` | no | **camelCase** key; negative once expired; `ceil` of fractional days. If `issue_date` is null the server evaluates `new Date(null)` = 1970-01-01, so it reports an expired card with a hugely negative number — treat a null `issue_date` as "unknown" in the UI and do not trust `validity` then |

The app may also compute validity locally from `issue_date` (needed for admin-side cards and offline); both must agree (doc 07 defines the edge cases).

### 3.5 Holder login response

`POST /profile-holder/login` → `data = { token, user: {id, username, role}, profile }` — **no `email` in this `user`**. Not used by the app (it uses `/auth/login`), documented so nobody parses it as a `User` by mistake.

---

## 4. FilterOptions and ProfileStats

**`GET /profiles/filter-options`** → `data`:

| JSON key | Dart name | Dart type | Notes |
|---|---|---|---|
| `deaneries` | `deaneries` | `List<String>` | distinct values currently in the caller's visible profiles (admin: all active; user: own) |
| `parishes` | `parishes` | `List<String>` | same |
| `levels` | `levels` | `List<String>` | same |
| `designations` | `designations` | `List<String>` | same |
| `deanery_parish_map` | `deaneryParishMap` | `Map<String, List<String>>` | only combinations that exist in data |

Filter options reflect data present, **not** the master lists. Forms use `assets/data/deaneries.json` for the full 16 deaneries / 154 parishes.

**`GET /profiles/stats`** (admin only) → `data.stats`:

| JSON key | Dart name | Dart type | Notes |
|---|---|---|---|
| `total_profiles` | `totalProfiles` | `int` | **Counts soft-deleted rows too** (no `status` filter) |
| `total_creators` | `totalCreators` | `int` | |
| `profiles_with_photos` | `profilesWithPhotos` | `int` | |
| `created_today` | `createdToday` | `int` | |
| `created_this_week` | `createdThisWeek` | `int` | `DATE(created_at) >= CURDATE() − 7 days`: today plus the previous 7 calendar days (8 dates), server date |

**`GET /profiles` envelope extras:** `data.pagination` (§13) and `data.filters.applied = { search, deanery, parish, level, designation }` (each `String?`) — informational, the app need not parse `filters`.

---

## 5. Shop

Table `shops` (one shop per user: `UNIQUE(owner_user_id)`). Which columns appear depends on the endpoint.

| JSON key | Dart name | Dart type | Null? | Appears in |
|---|---|---|---|---|
| `id` | `id` | `int` | no | all |
| `name` | `name` | `String` | no | all |
| `slug` | `slug` | `String` | no | all |
| `description` | `description` | `String?` | yes | all |
| `logo_url` | `logoUrl` | `String?` | yes | all |
| `banner_url` | `bannerUrl` | `String?` | yes | all |
| `parish` | `parish` | `String?` | yes | all |
| `deanery` | `deanery` | `String?` | yes | all |
| `created_at` | `createdAt` | `DateTime` | no | all |
| `status` | `status` | `ShopStatus` | no | `GET /shop/shops/:id` (always `approved`), owner (`mine`), admin list. **Not** in `GET /shop/shops` rows (only approved are returned) |
| `owner_user_id` | `ownerUserId` | `int?` | yes | owner (`mine`), admin list, apply/update responses (`SELECT *`) |
| `contact_phone` | `contactPhone` | `String?` | yes | owner / admin (`SELECT *`). **Not** in public list/detail |
| `upi_id` | `upiId` | `String?` | yes | owner / admin only. Buyers never get it from shop endpoints — they get `payee.upi_id` on the order |
| `upi_id_changed_at` | `upiIdChangedAt` | `DateTime?` | yes | owner / admin (`SELECT *`) |
| `rejection_reason` | `rejectionReason` | `String?` | yes | owner / admin. Holds the reason for `rejected` **and** `suspended` |
| `reviewed_by` | `reviewedBy` | `int?` | yes | owner / admin |
| `reviewed_at` | `reviewedAt` | `DateTime?` | yes | owner / admin |
| `updated_at` | `updatedAt` | `DateTime?` | yes | owner / admin |
| `owner_username` | `ownerUsername` | `String?` | yes | **admin list only** (joined) |
| `owner_email` | `ownerEmail` | `String?` | yes | **admin list only** |

Mapping notes
- `GET /shop/shops/mine` → `data = { shop: Shop? }` — **`shop` is `null` when the user has none** (state "none"). The five UI states are `none | pending | rejected | suspended | approved`.
- `GET /shop/shops` → `data = { shops: [Shop(public)], pagination }`; `GET /shop/shops/:id` → `data.shop`; `GET /shop/admin/shops?status=` → `data.shops` (full rows + owner join).
- `PUT /shop/admin/shops/:id/review` body `{status: approved|rejected|suspended, rejection_reason?}` → `data = { shop, cancelled_unpaid_orders: int }`.
- Apply `POST /shop/shops/apply` body: `{name, description?, parish?, deanery?, contact_phone, upi_id?, logo?}` (`logo` = data URL). Update `PUT /shop/shops/mine`: `{name?, description?, parish?, deanery?, contact_phone?, upi_id?, current_password?, logo?, banner?}` — **changing `upi_id` requires `current_password`** (403 `Enter your current password to change the UPI ID`).
- Derived (client): `acceptsUpi = upiId != null && upiId.isNotEmpty` for owner screens; for buyers use `accepts_upi` on product/lookup rows.

---

## 6. Category

`GET /shop/categories` → `data.categories[]` (`SELECT *` from `shop_categories WHERE status = 1`).

| JSON key | Dart name | Dart type | Null? | Notes |
|---|---|---|---|---|
| `id` | `id` | `int` | no | |
| `name` | `name` | `String` | no | |
| `slug` | `slug` | `String` | no | |
| `icon` | `icon` | `String?` | yes | A key such as `church`, `book`, `tshirt`, `ticket`, `craft`, `food`, `category` → map to the app icon set (doc 02 glyph map); unknown → generic |
| `sort_order` | `sortOrder` | `int` | no | already sorted by the server |
| `status` | — | `int` | no | always `1` in this endpoint; ignore |
| `created_at` | — | `DateTime` | no | ignore |

Seeded defaults (slug): `devotional-items`, `books-booklets`, `apparel-merchandise`, `event-tickets`, `handmade-crafts`, `food-snacks`, `other`. Admin-only `POST /shop/categories` `{name, icon?, sort_order?}` exists but is **not** part of the app scope.

---

## 7. Product

Table `shop_products`; money columns are `*_paise`. The server sends columns of the table verbatim (`SELECT p.*`) plus joined fields, so the **price key is `price_paise`**, and the optional MRP is `compare_at_price_paise`. (Write requests use rupees `price` / `compare_at_price` — see 7.3.)

### 7.1 Product (list item `GET /shop/products` → `data.products[]`; detail `GET /shop/products/:id` → `data.product`; owner list `GET /shop/products/mine`)

| JSON key | Dart name | Dart type | Null? | Notes |
|---|---|---|---|---|
| `id` | `id` | `int` | no | |
| `shop_id` | `shopId` | `int` | no | |
| `category_id` | `categoryId` | `int?` | yes | |
| `title` | `title` | `String` | no | |
| `slug` | `slug` | `String` | no | |
| `description` | `description` | `String?` | yes | plain text |
| `price_paise` | `pricePaise` | `int` | no | **paise** |
| `compare_at_price_paise` | `compareAtPricePaise` | `int?` | yes | MRP; show strikethrough + % off only when `> pricePaise` |
| `stock_quantity` | `stockQuantity` | `int` | no | ≥ 0 (DB check) |
| `sku` | `sku` | `String?` | yes | |
| `status` | `status` | `ProductStatus` | no | `draft`\|`active`\|`out_of_stock`\|`archived` |
| `views_count` | `viewsCount` | `int` | no | |
| `created_at`, `updated_at` | `createdAt`, `updatedAt` | `DateTime` | no | |
| `images` | `images` | `List<ProductImage>` | no | possibly empty; sorted by `sort_order` |
| `in_stock` | `inStock` | `bool` | no | **list and detail only**; arrives as `0`/`1` (`asBool`). Not in `products/mine` |
| `shop_name` | `shopName` | `String` | no | list and detail |
| `shop_slug` | `shopSlug` | `String` | no | list and detail |
| `shop_status` | `shopStatus` | `ShopStatus?` | yes | **detail only** |
| `accepts_upi` | `acceptsUpi` | `bool` | no | **detail only**, `0`/`1` (`asBool`). `false` → COD only |
| `owner_user_id` | — | — | — | removed by the server from the public response; never present |

Derived (client): `available = status == active && inStock` (and shop approved — public endpoints only return approved shops' active products). Use `lookup` (7.2) for the authoritative flag in the cart.

### 7.2 ProductImage (`images[]`)

| JSON key | Dart name | Dart type | Null? | Notes |
|---|---|---|---|---|
| `id` | `id` | `int` | no | |
| `product_id` | `productId` | `int` | no | |
| `image_url` | `url` | `String` | no | Cloudinary URL |
| `sort_order` | `sortOrder` | `int` | no | |
| `is_primary` | `isPrimary` | `bool` | no | `0`/`1` (`asBool`); first image is primary |
| `created_at` | — | `DateTime` | no | ignore |

### 7.3 Product write (`POST /shop/products`, `PUT /shop/products/:id`)

| JSON key | Dart source | Notes |
|---|---|---|
| `title` | `title` | required on create |
| `description` | `description?` | |
| `price` | `pricePaise / 100` | **rupees as a number/decimal string**, min 0.01 — the only place the API wants rupees. Convert from int paise as a two-decimal string (`'199.50'`), never via `double` arithmetic |
| `compare_at_price` | `compareAtPricePaise / 100` | optional, ≥ 0 (rupees). On create it is stored only if truthy. On PUT, omitted keeps the old value; to clear send the JSON number `0` — `""`/`null` fail validation (400 `Invalid value`) |
| `stock_quantity` | `stockQuantity` | int ≥ 0, required on create |
| `sku`, `category_id`, `status` | same | `status` ∈ ProductStatus; default `active` on create |
| `images` | `List<String>` | data URLs (new) or `http(s)` URLs (kept); **a non-empty list replaces all images** (full-body PUT semantics for images); omit to keep existing |

`DELETE /shop/products/:id` archives (`status = archived`), it does not remove rows.

### 7.4 LookupRow (`POST /shop/products/lookup` body `{ids: [int]}` (1–100) → `data.products[]`)

Minimal live data for cart validation.

| JSON key | Dart name | Dart type | Null? | Notes |
|---|---|---|---|---|
| `id` | `id` | `int` | no | |
| `title` | `title` | `String` | no | |
| `price_paise` | `pricePaise` | `int` | no | current price |
| `stock_quantity` | `stockQuantity` | `int` | no | |
| `status` | `status` | `ProductStatus` | no | |
| `shop_id` | `shopId` | `int` | no | |
| `shop_name` | `shopName` | `String` | no | |
| `shop_status` | `shopStatus` | `ShopStatus` | no | |
| `accepts_upi` | `acceptsUpi` | `bool` | no | real boolean here, already AND-ed with `shop_status == approved` |
| `available` | `available` | `bool` | no | real boolean: `active && approved && stock > 0` |
| `image_url` | `imageUrl` | `String?` | yes | primary image |

Ids that do not exist are simply **absent** from the result (treat as "removed").

---

## 8. CartLine (client only — there is no cart API)

Persisted per user in `shared_preferences` under `cyd_cart:<userId>` as a JSON list. Server data never overwrites the user's quantity; it only drives notices.

| Field | Dart type | Notes |
|---|---|---|
| `productId` | `int` | |
| `quantity` | `int` | 1…99 (server max `maxLineQuantity`); also clamp to `stockQuantity` when known |
| `titleSnapshot` | `String` | shown while offline / before lookup |
| `unitPricePaiseSnapshot` | `int` | price when added; compared with lookup `price_paise` to raise the "price changed" notice |
| `imageUrl` | `String?` | |
| `shopId`, `shopName` | `int`, `String` | cart is grouped by shop |
| `acceptsUpi` | `bool` | last known, refreshed by lookup |
| `addedAt` | `DateTime` | |

Checkout request items are only `{product_id, quantity}` — the server prices every line itself; never send prices.

---

## 9. Address

Table `shop_addresses` (`SELECT *`). `GET /shop/addresses` → `data.addresses[]` (default first); create/update → `data.address`.

| JSON key | Dart name | Dart type | Null? | Notes |
|---|---|---|---|---|
| `id` | `id` | `int` | no | |
| `user_id` | — | `int` | no | ignore |
| `label` | `label` | `String` | no | default `Home` |
| `full_name` | `fullName` | `String` | no | |
| `phone` | `phone` | `String` | no | |
| `line1` | `line1` | `String` | no | |
| `line2` | `line2` | `String?` | yes | **no landmark field exists: the app's "Landmark" input is stored in `line2`** |
| `city` | `city` | `String` | no | |
| `state` | `state` | `String` | no | |
| `pincode` | `pincode` | `String` | no | 6 digits (doc 06) |
| `is_default` | `isDefault` | `bool` | no | `0`/`1` (`asBool`); setting one default clears the others |
| `created_at` | — | `DateTime` | no | ignore |

Write body (`POST`/`PUT /shop/addresses[/:id]`): `{label?, full_name, phone, line1, line2?, city, state, pincode, is_default?}` — snake_case, `is_default` as boolean. `PUT` keeps previous values for any empty field (it cannot blank `line1`, etc., and `is_default: false` does not un-default).

---

## 10. Order

Two shapes: **OrderListItem** (lists) and **OrderView** (detail, and the response of every order action). Both are produced by `services/orderQueries.js`; the app **renders actions only from `allowed_actions` / `dispute_reasons` of OrderView** (never from `status`/`payment_status`).

### 10.1 OrderListItem — `GET /shop/orders` (buyer) and `GET /shop/orders/shop` (seller) → `data.orders[]`; also the rows of `GET /shop/checkouts/:id`

| JSON key | Dart name | Dart type | Null? | Notes |
|---|---|---|---|---|
| `id` | `id` | `int` | no | |
| `order_number` | `orderNumber` | `String` | no | shown to users and sent as UPI note |
| `checkout_id` | `checkoutId` | `int?` | yes | group of orders from one checkout |
| `shop_id` | `shopId` | `int` | no | |
| `shop_name` | `shopName` | `String` | buyer list & checkout rows | absent in seller list |
| `customer_username` | `customerUsername` | `String?` | seller list only | |
| `status` | `status` | `OrderStatus` | no | §15 |
| `payment_status` | `paymentStatus` | `PaymentStatus` | no | §15 |
| `payment_method` | `paymentMethod` | `PaymentMethod` | no | `upi`\|`cod` |
| `total_paise` | `totalPaise` | `int` | no | |
| `created_at`, `updated_at` | | `DateTime` | no | |
| `pay_by` | `payBy` | `DateTime?` | yes | UPI orders only |
| `confirm_by` | `confirmBy` | `DateTime?` | yes | set when the buyer claims |
| `pay_seconds_left` | `paySecondsLeft` | `int?` | yes | in list rows it is **raw** `TIMESTAMPDIFF` (can be ≤ 0 or null for COD); use it only with `payment_status == awaiting_payment` |
| `needs_action` | `needsAction` | `bool` | no | list endpoints only (buyer: awaiting payment and time left; seller: claimed / refund_due / fulfilment pending). Real boolean |
| `items` | `items` | `List<OrderItem>` | no | attached to buyer/seller list rows; **not** attached to `GET /shop/checkouts/:id` rows |

Rows of the **checkout confirmation** `GET /shop/checkouts/:id` → `data.checkout = { id, created_at, orders: [OrderListItem without items, needs_action] }` (the same `LIST_COLUMNS` as above plus `shop_name`).

### 10.2 OrderView — `GET /shop/orders/:id`, and `data.order` of claim/edit-claim/confirm/not-received/refund/dispute/status/cancel

| JSON key | Dart name | Dart type | Null? | Notes |
|---|---|---|---|---|
| `id`, `order_number`, `checkout_id`, `shop_id`, `shop_name` | | | | as 10.1 (`checkout_id` nullable) |
| `shop_status` | `shopStatus` | `ShopStatus` | no | |
| `customer_user_id` | `customerUserId` | `int` | no | |
| `customer_username` | `customerUsername` | `String?` | yes | **omitted for the buyer** (`undefined`); present for seller/admin |
| `owner_user_id` | `ownerUserId` | `int` | no | the shop owner |
| `status` | `status` | `OrderStatus` | no | |
| `payment_status` | `paymentStatus` | `PaymentStatus` | no | |
| `payment_method` | `paymentMethod` | `PaymentMethod` | no | |
| `subtotal_paise`, `shipping_paise`, `total_paise` | | `int` | no | `shipping_paise` is currently always 0 (verified) |
| `notes` | `notes` | `String?` | yes | buyer's note, ≤ 500 chars |
| `created_at`, `updated_at` | | `DateTime` | no | |
| `pay_by` | `payBy` | `DateTime?` | yes | |
| `pay_seconds_left` | `paySecondsLeft` | `int?` | yes | **only when `payment_status == awaiting_payment`, else `null`**. May be negative during the grace window (see doc 06) |
| `confirm_by` | `confirmBy` | `DateTime?` | yes | |
| `confirm_seconds_left` | `confirmSecondsLeft` | `int?` | yes | **only when `claimed`, else `null`** |
| `confirmed_at` | `confirmedAt` | `DateTime?` | yes | |
| `cancelled_at` | `cancelledAt` | `DateTime?` | yes | |
| `cancelled_by` | `cancelledBy` | `CancelledBy?` | yes | `buyer`\|`seller`\|`system`\|`admin` |
| `cancel_reason` | `cancelReason` | `String?` | yes | |
| `full_name` | `shipFullName` | `String?` | yes | delivery address **copied onto the order** (keys are unprefixed in the view: `full_name, phone, line1, line2, city, state, pincode`) |
| `phone`, `line1`, `line2`, `city`, `state`, `pincode` | `shipPhone`, … | `String?` | yes | nullable for legacy orders |
| `items` | `items` | `List<OrderItem>` | no | §10.3 |
| `claim` | `claim` | `Claim?` | yes | §11.1 |
| `disputes` | `disputes` | `List<Dispute>` | no | §11.2, oldest first, usually 0–1 open |
| `viewer_role` | `viewerRole` | `ViewerRole` | no | `buyer`\|`seller`\|`admin` |
| `allowed_actions` | `allowedActions` | `List<String>` | no | vocabulary in §15.6 |
| `dispute_reasons` | `disputeReasons` | `List<DisputeReason>` | no | reasons the viewer may open **now** |
| `chat_read_only` | `chatReadOnly` | `bool` | no | |
| `payee` | `payee` | `Payee?` | yes | **only for the buyer while `awaiting_payment` and the shop is approved**, otherwise `null` |

**Keys that exist in the database row but are NOT in the view** (never expect them): `payee_upi_id`, `payee_name` (use `payee`), `address_id`, `stock_released_at`, `customer_*` internals, `pay_open`, `confirm_overdue`, `not_delivered_eligible`, `paid_after_cancel_open`, `stale`.

`Payee`: `{ upi_id: String, name: String?, upi_link: String? }` — `upi_link` is a ready `upi://pay?pa=…&pn=…&am=<rupees.paise>&tn=<order_number>&cu=INR` (null if the stored UPI ID fails validation). The app should use `upi_link` as given rather than rebuilding it.

### 10.3 OrderItem (`items[]`, `SELECT *` from `shop_order_items`)

| JSON key | Dart name | Dart type | Null? | Notes |
|---|---|---|---|---|
| `id` | `id` | `int` | no | |
| `order_id` | `orderId` | `int` | no | |
| `product_id` | `productId` | `int` | no | |
| `product_title_snapshot` | `title` | `String` | no | title at purchase time |
| `unit_price_paise` | `unitPricePaise` | `int` | no | |
| `quantity` | `quantity` | `int` | no | |
| `line_total_paise` | `lineTotalPaise` | `int` | no | |

No image is stored on order items; resolve a thumbnail from the product only if it still exists (optional).

### 10.4 Checkout request and result

`POST /shop/checkout` (header `Idempotency-Key`, 8–64 chars `[\w-]`; missing/invalid → 400 `A valid Idempotency-Key header (8-64 letters, digits, - or _) is required`) body:

| JSON key | Dart source | Notes |
|---|---|---|
| `address_id` | `int` | required |
| `items` | `[{product_id:int, quantity:int}]` | 1–50 lines, quantity 1–99; duplicate products are merged server-side |
| `payment_methods` | `{ "<shopId>": "upi"\|"cod" }` | **one entry per shop in the cart is required** (keys are shop ids as strings); a missing entry → 400 `Choose UPI or cash on delivery for "<shop name>"`. A legacy single `payment_method` applies to every shop |
| `notes` | `String?` | ≤ 500 |

Response `201` (or `200` when replayed with the same key and same cart): `data = { checkout_id: int, replayed: bool, orders: [CheckoutOrder] }`, where `CheckoutOrder = { id, order_number, shop_id, shop_name, total_paise, status, payment_status, payment_method, pay_by }` (no items, no seconds-left).

### 10.5 Other order request bodies (field names only; endpoints/errors in doc 05)

| Action | Body |
|---|---|
| claim | `{ utr, screenshot? }` (`screenshot` = data URL, stored privately) |
| edit claim | `{ utr }` |
| confirm | `{ utr }` (the UTR the buyer claimed; server compares) |
| not received (seller) | `{ description? }` |
| refund (seller) | `{ refund_utr }` |
| open dispute | `{ reason, description?, utr?, screenshot? }` |
| fulfilment | `{ status: accepted\|packed\|shipped\|delivered\|rejected, reason? }` |
| cancel (buyer) | `{ reason? }` |
| resolve (admin) | `{ resolution, note }` (note required, ≤ 1000) |

UTR input is normalised by the server (spaces and `-` removed) and must then be exactly 12 digits; the client sends the normalised digits.

---

## 11. Claim · Dispute · Message · Evidence

### 11.1 Claim (`OrderView.claim`, nullable until the buyer submits a UTR)

| JSON key | Dart name | Dart type | Null? | Notes |
|---|---|---|---|---|
| `utr` | `utr` | `String` | no | 12 digits, globally unique. Display grouped `1234 5678 9012` |
| `amount_paise` | `amountPaise` | `int` | no | the order total at claim time |
| `claimed_at` | `claimedAt` | `DateTime` | no | |
| `updated_at` | `updatedAt` | `DateTime` | no | changes when the buyer edits the UTR |
| `refund_utr` | `refundUtr` | `String?` | yes | set when the seller records a refund |
| `refunded_at` | `refundedAt` | `DateTime?` | yes | |

(`refund_recent` is computed in SQL for the rules but is **not** in the view.)

### 11.2 Dispute (`OrderView.disputes[]`)

| JSON key | Dart name | Dart type | Null? | Notes |
|---|---|---|---|---|
| `id` | `id` | `int` | no | |
| `origin_payment_status` | `originPaymentStatus` | `PaymentStatus` | no | the payment status the dispute was opened from; selects the resolution set (§15.5). Kept as a `String` fallback if unknown |
| `opened_by_role` | `openedByRole` | `String` | no | `buyer` \| `seller` |
| `reason` | `reason` | `DisputeReason` | no | §15 |
| `description` | `description` | `String?` | yes | ≤ 1000 chars |
| `status` | `status` | `DisputeStatus` | no | `open` \| `resolved` |
| `resolution` | `resolution` | `DisputeResolution?` | yes | null while open |
| `resolution_note` | `resolutionNote` | `String?` | yes | |
| `opened_at` | `openedAt` | `DateTime` | no | |
| `resolved_at` | `resolvedAt` | `DateTime?` | yes | |
| `proof_seconds_left` | `proofSecondsLeft` | `int?` | yes | raw `TIMESTAMPDIFF(SECOND, NOW(), opened_at + proof window)`, present on every dispute entry; meaningful only while `status == open` and `reason == not_received` (buyer's time to upload proof after a seller "not received"); can be ≤ 0 |

### 11.3 AdminDisputeRow (`GET /shop/admin/disputes?status=open|resolved` → `data.disputes[]`)

| JSON key | Dart name | Dart type | Null? |
|---|---|---|---|
| `id`, `order_id` | `id`, `orderId` | `int` | no |
| `reason`, `status`, `origin_payment_status`, `opened_by_role`, `description`, `resolution`, `resolution_note`, `opened_at`, `resolved_at` | as 11.2 | | per 11.2 |
| `order_number` | `orderNumber` | `String` | no |
| `total_paise` | `totalPaise` | `int` | no |
| `payment_status` | `paymentStatus` | `PaymentStatus` | no | current, may differ from origin |
| `order_status` | `orderStatus` | `OrderStatus` | no | (renamed from `status`) |
| `shop_name`, `buyer_username`, `seller_username` | | `String` | no |

Sorted open first, then newest. Max 500 rows. Resolve: `POST /shop/admin/disputes/:id/resolve` `{resolution, note}` → `{success, message: "Dispute resolved"}` (no `data`).

### 11.4 Message (`GET /shop/orders/:id/messages?after=<id>` → `data = { messages: [Message], read_only: bool }`; `POST` → `201`, `data.message`)

| JSON key | Dart name | Dart type | Null? | Notes |
|---|---|---|---|---|
| `id` | `id` | `int` | no | monotonically increasing; poll with `?after=<lastId>` |
| `sender_role` | `senderRole` | `MessageSender` | no | `buyer`\|`seller`\|`admin`\|`system` |
| `sender_user_id` | `senderUserId` | `int?` | yes | null for `system` messages |
| `sender_username` | `senderUsername` | `String?` | yes | null for `system` |
| `body` | `body` | `String` | no | plain text, ≤ 1000; HTML tags are stripped by the server. **System messages are auto-generated English sentences** (e.g. "Seller marked the order as shipped.") — render as centred notices |
| `created_at` | `createdAt` | `DateTime` | no | |

Page size 200. Send body: `{ body: String }` (non-empty after trimming, ≤ 1000).

### 11.5 Evidence (`GET /shop/orders/:id/evidence` → `data.evidence[]`; `POST` → `201`, `data.evidence = { id, kind }`)

| JSON key | Dart name | Dart type | Null? | Notes |
|---|---|---|---|---|
| `id` | `id` | `int` | no | |
| `kind` | `kind` | `EvidenceKind` | no | `payment_proof`\|`refund_proof`\|`other` (buyer may post `payment_proof`/`other`, seller `refund_proof`/`other`; the other role's vocabulary value is coerced to `other`, a value outside the three kinds is a 400) |
| `created_at` | `createdAt` | `DateTime` | no | |
| `uploader_user_id` | `uploaderUserId` | `int` | no | |
| `uploader_username` | `uploaderUsername` | `String` | no | |
| `url` | `url` | `String` | no | **signed, expires in ~10 minutes** — fetch the list again to refresh; never persist |

`POST` body: `{ image: <data URL>, kind? }`.

---

## 12. ActionCounts and ShopConfig

**`GET /shop/orders/action-count`** → `data` (no wrapper key):

| JSON key | Dart name | Dart type | Notes |
|---|---|---|---|
| `buyer` | `buyer` | `int` | unpaid UPI orders with time left |
| `seller` | `seller` | `int` | claimed / refund_due / fulfilment pending (0 if no shop) |
| `admin_disputes` | `adminDisputes` | `int` | open disputes (0 for non-admins) |
| `total` | `total` | `int` | sum — drives the tab badge |

**`GET /shop/config`** → `data`: `payment_methods: List<String>` (`["upi","cod"]`), `pay_window_minutes: int`, `confirm_window_hours: num` (in practice a whole number: `CONFIRM_WINDOW_HOURS` is parsed with `parseInt`, minimum 1), `max_open_upi_orders: int`. Use it for copy such as "Pay within 30 minutes" instead of hard-coding.

---

## 13. Paging

Present on `GET /profiles`, `GET /shop/shops`, `GET /shop/products` as `data.pagination`. Other lists (orders, addresses, categories, disputes, admin shops, messages) are **not paged** (fixed caps: buyer orders 200, seller orders 500, disputes 500, messages 200 per call).

| JSON key | Dart name | Dart type |
|---|---|---|
| `current_page` | `currentPage` | `int` |
| `per_page` | `perPage` | `int` |
| `total` | `total` | `int` |
| `total_pages` | `totalPages` | `int` |
| `has_next` | `hasNext` | `bool` |
| `has_prev` | `hasPrev` | `bool` |

Query parameters: `page` (default 1), `limit` (default 20 for shops/products; profiles default per backend, app uses 25; products max 100).
A page holder in the app (`Paged<T> { items, pagination }`) is a client class, not a server shape.

---

## 14. ApiError and envelope

```jsonc
// success
{ "success": true, "message": "Login successful", "data": { /* … */ } }
// failure
{ "success": false, "message": "Validation failed", "errors": ["Username must be between 3 and 50 characters", "…"] }
```

| Source | HTTP | `message` examples | `errors` |
|---|---|---|---|
| express-validator (`handleValidationErrors`) | 400 | `Validation failed` | list of plain strings (not keyed by field) |
| Business rule (`HttpError`) | 400/403/404/409/… | verbatim, user-facing English | absent |
| Auth middleware | 401 | `Access token required`, `Invalid token`, `Token expired`, `Invalid token - user not found` | absent |
| Admin gate | 403 | `Admin access required` | absent |
| Shop gates | 403 | `You do not have a shop yet. Apply to become a shop owner first.`, `Your shop is <status>. Only approved shops can manage products and orders.` | absent |
| Login limiter / chat limiter | 429 | `Too many failed login attempts. Please try again in 15 minutes.` / `You are sending messages too quickly. Please wait a minute.` | absent |
| Body too large | 413 | `Request body is too large` | absent |
| Malformed JSON | 400 | `Malformed JSON in request body` | absent |
| Unexpected | 500 | `Something went wrong. Please try again.` / `Internal server error` / controller-specific (`Failed to …`) | absent (`error`/`stack` only in development: never display) |

```dart
class ApiException implements Exception {
  final int? status;          // null for offline/timeout
  final String message;       // server message verbatim, or app copy for offline/timeout
  final List<String> errors;  // validation messages, may be empty
  final ApiErrorKind kind;    // validation|unauthorized|forbidden|notFound|conflict|rateLimited|tooLarge|server|offline|timeout|unknown
}
```

A 401 on any non-login call means the session is over (doc 01 §4). Messages are the contract the UI shows; do not rewrite them.

---

## 15. Enums (exact strings)

Every enum gets a `fromJson(String?)` that maps unknown values to `unknown` (never throws) and a `value` getter returning the wire string. The app must **not** invent states: render unknown states as a neutral chip with the raw text.

### 15.1 Roles and viewer roles
| Enum | Values |
|---|---|
| `UserRole` | `admin`, `user`, `profile_holder` |
| `ViewerRole` (order view) | `buyer`, `seller`, `admin` |
| `MessageSender` | `buyer`, `seller`, `admin`, `system` |
| `CancelledBy` | `buyer`, `seller`, `system`, `admin` |

### 15.2 Profile
`ProfileLevel`: `parish`, `deanery`, `dexco` (stored free-form `VARCHAR(50)` — treat unknown as `parish` background but keep the raw value). Designations: see `assets/data/designations.json` (13 values).

### 15.3 Shop and product
| Enum | Values | Notes |
|---|---|---|
| `ShopStatus` | `pending`, `approved`, `rejected`, `suspended` | UI adds client state `none` when `shop == null` |
| `ProductStatus` | `draft`, `active`, `out_of_stock`, `archived` | |
| `PaymentMethod` | `upi`, `cod` | |

### 15.4 Order and payment
| Enum | Values |
|---|---|
| `OrderStatus` | `pending_payment`, `placed`, `accepted`, `packed`, `shipped`, `delivered`, `cancelled`, `rejected` |
| `PaymentStatus` | `awaiting_payment`, `claimed`, `confirmed`, `disputed`, `refund_due`, `refunded`, `void`, `written_off`, `cod_pending`, `cod_collected` |

Notes: a new UPI order starts `pending_payment` + `awaiting_payment`; a new COD order starts `placed` + `cod_pending`. When the seller confirms a UPI payment the status moves to `placed`. Legacy value `paid`/`pending`/`failed` no longer exist after the migration. Fulfilment steps allowed by the server: `placed → accepted → packed → shipped → delivered` (and `rejected`/`cancelled` as terminals). Terminal payment states: `void`, `refunded`, `written_off`, `cod_collected` (and `confirmed` once `delivered`). The full state machine, timers and transitions are in doc 06.

### 15.5 Disputes
| Enum | Values |
|---|---|
| `DisputeReason` | `not_received`, `not_confirmed`, `wrong_amount`, `refund_not_received`, `paid_after_cancel`, `not_delivered`, `other` |
| `DisputeStatus` | `open`, `resolved` |
| `DisputeResolution` | `payment_confirmed`, `claim_rejected`, `refund_required`, `fulfilment_ordered`, `refund_confirmed`, `closed_unrecoverable` (the backend also records `claim_rejected` automatically when the buyer misses the proof deadline) |
| `EvidenceKind` | `payment_proof`, `refund_proof`, `other` |

Resolutions an admin may choose, by `origin_payment_status` (from `RESOLUTIONS_BY_ORIGIN`; the UI offers exactly this set for the dispute's origin — a server 400 means the list drifted):

| Origin | Allowed resolutions |
|---|---|
| `claimed` | `payment_confirmed`, `claim_rejected`, `refund_required` |
| `void` | `refund_required`, `claim_rejected` |
| `confirmed` | `refund_required`, `fulfilment_ordered` |
| `refund_due` | `refund_confirmed`, `refund_required`, `closed_unrecoverable` |
| `refunded` | `refund_confirmed`, `refund_required`, `closed_unrecoverable` |

### 15.6 `allowed_actions` vocabulary (strings in `OrderView.allowed_actions`)

| Action | Who | Meaning / which endpoint (doc 05) |
|---|---|---|
| `claim` | buyer | submit UTR → `POST /shop/orders/:id/payment-claim` |
| `edit_claim` | buyer | correct UTR → `PATCH …/payment-claim` |
| `cancel` | buyer | `PUT …/cancel` |
| `confirm` | seller | `POST …/payment-confirm` |
| `reject` | seller | `PUT …/status` with `status: rejected` + reason |
| `advance:accepted`, `advance:packed`, `advance:shipped`, `advance:delivered` | seller | `PUT …/status` with the suffix as `status` |
| `refund` | seller | `POST …/refund` |
| `resolve` | admin | `POST /shop/admin/disputes/:id/resolve` |
| `chat` | buyer/seller/admin(with dispute) | messages enabled |
| `upload_evidence` | buyer/seller | `POST …/evidence` |
| `dispute` | buyer/seller | at least one entry in `dispute_reasons` |

Parse `advance:<x>` by splitting on `:`; ignore any action string the app does not know. Seller "not received" (`POST …/payment-not-received`) and "wrong amount" are **dispute reasons** (`dispute_reasons` of a seller contains `not_received`, `wrong_amount`, `other`), not entries of `allowed_actions`; buyer dispute reasons: `not_confirmed`, `paid_after_cancel`, `refund_not_received`, `not_delivered`, `other`.

---

## 16. Illustrative snippet — `Profile` (uncompiled)

```dart
class Profile {
  const Profile({
    required this.id, required this.name, this.fatherName, this.motherName, this.dateOfBirth,
    this.designation, this.level, this.dateOfBaptism, this.postalAddress, this.parish, this.deanery,
    this.qualification, this.phone, this.involvement, this.photoUrl, this.issueDate,
    required this.status, this.profileUserId, this.createdBy, this.createdByUsername,
  });

  final int id;
  final String name;            // lowercase from server; format for display
  final String? fatherName;     // JSON READ key: 'father'
  final String? motherName;     // JSON READ key: 'mother'
  final String? dateOfBirth;    // JSON READ key: 'dob' (calendar date, YYYY-MM-DD)
  final String? designation, level, dateOfBaptism, postalAddress, parish, deanery;
  final String? qualification, phone, involvement, photoUrl, issueDate;
  final int status;             // 1 active, 0 deleted
  final int? profileUserId, createdBy;
  final String? createdByUsername; // only on list/detail

  factory Profile.fromJson(Map<String, dynamic> j) => Profile(
        id: asInt(j['id']),
        name: j['name'] as String,
        fatherName: j['father'] as String?,
        motherName: j['mother'] as String?,
        dateOfBirth: asCalendarDate(j['dob']),
        designation: j['designation'] as String?,
        level: j['level'] as String?,
        dateOfBaptism: asCalendarDate(j['date_of_baptism']),
        postalAddress: j['postal_address'] as String?,
        parish: j['parish'] as String?,
        deanery: j['deanery'] as String?,
        qualification: j['qualification'] as String?,
        phone: j['phone'] as String?,
        involvement: j['involvement'] as String?,
        photoUrl: j['photo_url'] as String?,
        issueDate: asCalendarDate(j['issue_date']),
        status: asInt(j['status']),
        profileUserId: asIntOrNull(j['profile_user_id']),
        createdBy: asIntOrNull(j['created_by']),
        createdByUsername: j['created_by_username'] as String?,
      );
}

/// The form → request mapping: WRITE names differ from READ names. Keep it next to the model.
Map<String, dynamic> profileToRequest(ProfileFormData f) => {
      'name': f.name.trim(),
      'father_name': f.fatherName,        // not 'father'
      'mother_name': f.motherName,        // not 'mother'
      'date_of_birth': f.dateOfBirth,     // not 'dob'; required in practice
      'designation': f.designation,
      'level': f.level,
      'date_of_baptism': f.dateOfBaptism,
      'postal_address': f.postalAddress,
      'parish': f.parish,
      'deanery': f.deanery,
      'qualification': f.qualification,
      'phone': f.phone,
      'involvement': f.involvement,
      if (f.photoDataUrl != null) 'photo': f.photoDataUrl, // mandatory on create
    };
```

Required unit tests for this doc (doc 10 §2): a round-trip test that `profileToRequest` never emits `father`/`mother`/`dob`; `Profile.fromJson` never reads `father_name`/`mother_name`/`date_of_birth`; `asBool` for `0/1/true/false`; `OrderView.fromJson` with `payee: null`, `claim: null`, unknown `payment_status`, and an unknown `allowed_actions` string.
