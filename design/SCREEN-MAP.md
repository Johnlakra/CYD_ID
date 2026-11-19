# Screen map — mockup → spec → route → feature folder

Every mockup screen (ids from `CYD Shop Mobile.dc.html`, attribute `data-screen-label`) and every screen designed for this kit appears **exactly once** below.
Shop specs are in `docs/03-SCREENS-SHOP.md` (section numbers match the mockup ids; `E1…F5` are the new screens). ID-card-area specs are in `docs/04-SCREENS-IDCARD.md` (no mockup exists for them; titles are given so the section can be found).
Routes come from `docs/01-ARCHITECTURE.md` §6 (no additions were needed beyond the table there). Feature folders are under `lib/features/`. Tab = position in the floating pill bar: 1 `[My ID | Profiles]`, 2 Shop, 3 Cart, 4 Orders, 5 Account.

Legend — **Origin**: *Mockup* = rebuilt from the mockup · *Replaced* = mockup screen whose behaviour was replaced by the real backend · *Designed* = not in the mockup, designed in the same language (needs the owner's visual sign-off).

## 1. Mockup screens (19)

| Mockup id | Mockup title | Origin | Spec section | Route | Tab | Feature folder | Notes |
|---|---|---|---|---|---|---|---|
| 01 | Home | Mockup | 03 · §01 Shop home | `/shop` | 2 | `marketplace` | Home + Categories merged into the Shop tab (D2); promo cards are placeholders (DB-52) |
| 02 | Categories | Mockup | 03 · §02 | `/shop/categories` | 2 | `marketplace` | item counts dropped (API has none) |
| 03 | Search & filter | Mockup | 03 · §03 | `/shop/search` | 2 (bar hidden) | `marketplace` | deanery is a *shops* filter; price/sort client-side (DB-50/51) |
| 04 | Storefront | Mockup | 03 · §04 | `/shop/shops/:id` | 2 (bar hidden) | `marketplace` | |
| 05 | Product | Mockup | 03 · §05 | `/shop/products/:id` | 2 (bar hidden) | `marketplace` | |
| 06 | Cart | Mockup | 03 · §06 | `/cart` | 3 | `cart` | client-side cart + lookup revalidation (DB-20/21) |
| 07 | Checkout | Mockup | 03 · §07 | `/checkout` | 3 (bar hidden) | `checkout` | payment method per shop; Idempotency-Key (DB-22/23) |
| 08 | Payment | **Replaced** | 03 · §08 (mapping) → **E1** | `/pay/:orderId` | 3 (bar hidden) | `payments` | gateway/polling screen removed (DB-01…05) |
| 09 | Confirmation | Mockup (adapted) | 03 · §09 → **E3** | `/order-placed/:checkoutId` | 3 (bar hidden) | `checkout` | UPI variant shows "pay the seller now" (DB-12) |
| 10 | Orders | Mockup (adapted) | 03 · §10 → **E4** | `/orders` | 4 | `orders` | adds *Needs action* filter and countdowns |
| 11 | Order detail | Mockup (adapted) | 03 · §11 → **E5** | `/orders/:id` | 4 (bar hidden) | `orders` | one role-aware screen (buyer/seller/admin) |
| 12 | Addresses | Mockup | 03 · §12 | `/account/addresses` | 5 (bar hidden) | `addresses` | |
| 12b | Address form | Mockup | 03 · §12b | `/account/addresses/new`, `/account/addresses/:id` | 5 (bar hidden) | `addresses` | landmark → `line2`; state required (DB-30) |
| 13 | Become a seller | Mockup | 03 · §13 (+F1) | `/account/sell` | 5 | `seller` | five states; no "apply again" (backend allows one shop per user) |
| 14 | Account (shop rows) | Mockup | 03 · §14 (rest in 04 · Account) | `/account` | 5 | `account` | shop entries here; profile/password/appearance in doc 04 |
| 15 | My shop | Mockup | 03 · §15 (+F2, F3) | `/my-shop` | 5 | `owner` | stats = Products · To confirm · To ship (DB-13) |
| 16 | Shop order | **Replaced** (merged) | 03 · §16 → **E5, E9, E10** | `/orders/:id` | 4 (bar hidden) | `orders` | no separate seller order screen (DB-07, DB-61) |
| 17 | Product form | Mockup | 03 · §17 | `/my-shop/products/new`, `/my-shop/products/:id` | 5 (bar hidden) | `owner` | full-body PUT; keep ≥ 1 photo on edit (DB-42) |
| 18 | Shop applications | Mockup | 03 · §18 | `/admin/shops` | 5 | `admin` | rejected → *Reconsider and approve* |

## 2. New shop screens (Designed here, not in the mockup)

| Id | Screen | Origin | Spec section | Route | Tab | Feature folder | Roles |
|---|---|---|---|---|---|---|---|
| E1 | Pay the seller (UPI ID, amount, note, QR, UTR form, claim/edit, waiting/expired/confirmed/disputed) | Designed | 03 · E1 | `/pay/:orderId` | 3 (bar hidden) | `payments` | buyer |
| E2 | Pay your orders (multi-shop) | Designed | 03 · E2 | `/pay-checkout/:checkoutId` | 3 (bar hidden) | `payments` | buyer |
| E3 | Order placed (COD and UPI variants) | Designed (see 09) | 03 · E3 | `/order-placed/:checkoutId` | 3 (bar hidden) | `checkout` | buyer |
| E4 | Orders list with needs-action | Designed (extends 10) | 03 · E4 | `/orders` | 4 | `orders` | buyer |
| E5 | Role-aware order detail: banners and server-driven action bar | Designed (extends 11, 16) | 03 · E5 | `/orders/:id` | 4 (bar hidden) | `orders` | buyer, seller, admin |
| E6 | Cancel dialog, Report-a-problem sheet (dispute), refund-not-received | Designed | 03 · E6 | sheets over `/orders/:id` | — | `orders` | buyer |
| E7 | Order chat | Designed | 03 · E7 | `/orders/:id/chat` (| 4 (bar hidden) | `orders` | buyer, seller, admin (with a dispute) |
| E8 | Evidence strip, viewer and upload | Designed | 03 · E8 | section + overlay in `/orders/:id` | — | `orders` | buyer, seller (admin view-only) |
| E9 | Seller: confirm payment, not received, reject, record refund | Designed | 03 · E9 | sheets over `/orders/:id` | — | `orders` (seller actions) | seller |
| E10 | Seller fulfilment steps | Designed (replaces 16's bar) | 03 · E10 | action bar in `/orders/:id` | — | `orders` | seller |
| F1 | Seller application states | Designed (states of 13) | 03 · F1 → §13.1–13.5 | `/account/sell` | 5 | `seller` | any user |
| F2 | My shop — suspended / orders-only mode | Designed | 03 · F2 | `/my-shop` | 5 | `owner` | seller (suspended) |
| F3 | Shop profile — password-gated UPI change | Designed | 03 · F3 | sheet in `/my-shop` | 5 | `owner` | seller |
| F4 | Admin payment-disputes queue | Designed | 03 · F4 | `/admin/disputes` | 5 (bar hidden) | `admin` | admin |
| F5 | Admin dispute detail and resolve sheet | Designed | 03 · F5 | `/orders/:id` (admin variant) | 4 (bar hidden) | `admin` + `orders` | admin |

## 3. ID-card-area screens (no mockup; specified in `docs/04-SCREENS-IDCARD.md`)

Listed for completeness so the shell is mapped once. The exact section numbers are in doc 04; match by title.

| Screen (title in doc 04) | Origin | Route (doc 01 §6) | Tab | Feature folder | Roles |
|---|---|---|---|---|---|
| Login | Designed | `/login` | — | `auth` | all |
| Splash / session restore | Designed | `/splash` | — | `auth` | all |
| My ID (holder home) | Designed | `/id` | 1 | `idcard` | profile_holder |
| My ID card (full-screen preview/export) | Designed | `/id/card` | 1 | `idcard` | profile_holder |
| Update photo | Designed | `/id/photo` | 1 | `idcard` | profile_holder |
| Profiles (list, filters, stats) | Designed | `/id` | 1 | `idcard` | admin, user |
| Profile form — create | Designed | `/id/profiles/new` | 1 | `idcard` | admin, user |
| Profile detail | Designed | `/id/profiles/:id` | 1 | `idcard` | admin, user |
| Profile form — edit | Designed | `/id/profiles/:id/edit` | 1 | `idcard` | admin, user |
| Card preview / export | Designed | `/id/profiles/:id/card` | 1 | `idcard` | admin, user |
| Credentials dialog (after create) | Designed | dialog over `/id/profiles/new` | 1 | `idcard` | admin, user |
| Account (profile, appearance, sign-out) | Designed (shop rows: §14 above) | `/account`, `/account/profile` | 5 | `account` | all |
| Change password | Designed | `/account/password` | 5 | `account` | all |
| Create user | Designed | `/account/users/new` | 5 | `account` | admin |

## 4. Checks

- Mockup ids covered: 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 12b, 13, 14, 15, 16, 17, 18 = **19** ✔.
- New shop screens: E1–E10, F1–F5 = **15** (each appears once in §2).
- Routes added beyond doc 01 §6: `/orders/:id/chat` (E7). Everything else reuses the doc 01 table; admin dispute detail intentionally reuses `/orders/:id`.
- Tab-bar badge: **Shop** tab shows `GET /shop/orders/action-count` → `total` (doc 02 §9.19); **Cart** tab shows the line-quantity total.
