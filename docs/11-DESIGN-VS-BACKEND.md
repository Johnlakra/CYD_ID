# 11 · Mockup ↔ backend conflicts and how the app resolves them

The mockup (`design/CYD Shop Mobile.dc.html`, plus its `ORIGINAL-FLUTTER-STRUCTURE-PROPOSAL.md`) was
built from the **earlier** shop documentation (gateway payments, a server cart). The backend was later
rebuilt. **When the mockup and the backend disagree, the backend wins and the mockup's *look* is kept.**
This file lists every disagreement found, the decision, and where it is specified. Rows are numbered so
agents and reviewers can cite them (e.g. "per DB-07").

Legend — **Decision**: *Backend* = follow the backend; *Mockup* = keep the mockup; *New* = designed here;
*Client* = implemented client-side because the backend cannot.

## A. Payments (the largest change)

| # | Mockup / structure proposal says | Reality | Decision | Spec |
|---|---|---|---|---|
| DB-01 | Screen 08 "Payment": opens a hosted UPI gateway, "Opening UPI checkout…", polls `GET /shop/payments/:id/status` every 3 s | No gateway and no `/shop/payments/*` routes. Payment is **peer-to-peer UPI**: the buyer pays the *seller's* UPI ID and submits a 12-digit UTR | *Backend + New*: replace with **Pay the seller** screen (copyable UPI ID, exact amount, order reference, countdown, Open-UPI-app intent, QR, UTR form, optional screenshot, then "waiting for the seller") | 03 |
| DB-02 | `payment_poller.dart`, `payment_repository.dart`, `payment_status.dart`, 2-min poll cap, 8 s gateway timeout, "Payment page didn't open", "Still waiting for confirmation" | None of it exists | *Backend*: drop. Poll **the order** (`GET /shop/orders/:id`) every 15 s only while `awaiting_payment` or `claimed`; refresh when a countdown hits 0 | 01, 03 |
| DB-03 | Stage control "UPI outcome: Confirms / Gateway down / Times out" | Real outcomes: seller confirms, expiry (30 min + 10 min grace), seller "not received" → dispute, buyer dispute after 24 h | *New*: states `awaiting_payment`, `claimed`, `confirmed`, `disputed`, `refund_due`, `refunded`, `void`, `written_off` | 03, 06 |
| DB-04 | Payment screen button "Switch to cash on delivery" | There is no endpoint to change an order's method | *Backend*: remove. Buyer cancels the unpaid order, then re-checks out with COD | 03 |
| DB-05 | `url_launcher` "opens the gateway URL" | There is no gateway URL | *Backend*: `url_launcher` opens the **`upi://pay?...` link** returned in `payee.upi_link` (buyer only, unpaid orders only); copying the UPI ID is the primary path because UPI apps may block links to personal VPAs | 03 |
| DB-06 | UTR is auto-assigned when the gateway confirms; read-only on order detail | The **buyer types** the UTR (spaces ignored, unique platform-wide); the seller must **send back the UTR they verified** to confirm | *Backend*: UTR input (4-4-4 grouping), confirm sheet shows amount + UTR to match in the bank app | 03, 06 |
| DB-07 | Seller order screen starts at `placed` (accept/reject) — copied from the old `ALLOWED_TRANSITIONS` | Fulfilment steps are only allowed once payment is `confirmed` (or COD). A UPI order is first `claimed` and needs **Confirm payment received** / **Not received** | *Backend*: the seller action bar renders from `allowed_actions` (`confirm`, `reject`, `advance:accepted|packed|shipped|delivered`, `refund`, `dispute`) | 03 |
| DB-08 | Status chip map has only the 8 order statuses | Orders have a second axis, `payment_status` (10 values) | *New*: add `PaymentStatusChip` colours/labels (see tokens) and show both chips where relevant | 02, 03 |
| DB-09 | No chat, evidence, disputes, refunds | All exist (per-order chat, private payment screenshots with 10-minute signed URLs, disputes, refund UTR, admin resolution) | *New*: screens designed in the mockup's language | 03 |
| DB-10 | Customer "Cancel order" for `pending_payment` **or** `placed` | A buyer can cancel only while `awaiting_payment`, or a COD order that is still `placed`; after claiming payment they must use chat/dispute | *Backend*: show Cancel only if `allowed_actions` contains `cancel`; cancel dialog adds "Already paid? Submit your UTR instead" | 03 |
| DB-11 | Rejecting a paid order: "arrange the refund with the customer" (copy only) | Reject → `refund_due`; seller must record a **refund UTR** (≠ any payment UTR); buyer can dispute a missing refund | *Backend*: refund form + states | 03, 06 |
| DB-12 | Confirmation "UPI · paid" label | After checkout a UPI order is `awaiting_payment`, not paid | *Backend*: confirmation shows "UPI · pay the seller now" with a Pay button | 03 |
| DB-13 | Home/seller "This week" stat, "To accept" stat | Under P2P the actionable counts are: orders **to confirm payment**, **to ship**, **refunds due** (from `GET /shop/orders/action-count` and `needs_action`) | *Backend*: My-shop stats = Products · To confirm · To ship (derive from the seller order list) | 03 |

## B. Cart, checkout and data shape

| # | Mockup / structure proposal says | Reality | Decision | Spec |
|---|---|---|---|---|
| DB-20 | Structure doc: "Cart: server-backed `AsyncNotifier`… rolls back if the request fails" | **No cart API.** (The mockup's own screen is client-side: "Your cart stays on this device.") | *Backend*: local cart per user, persisted, revalidated with `POST /shop/products/lookup`; "Undo" after remove is local | 01, 03, 06 |
| DB-21 | Cart lines `{pid, qty}` with prices from the catalogue | Prices change; stale carts happen | *Backend*: on cart open and before checkout call `lookup`; show price/quantity/availability changes; drop unavailable lines with a notice | 03, 06 |
| DB-22 | Checkout "Place order" splits locally and may place orders one by one | One request: `POST /shop/checkout` with `Idempotency-Key`; backend creates **one order per shop in one transaction** | *Backend*: single call; key kept on retry, rotated when cart/choices change | 03, 06 |
| DB-23 | A single payment method for the whole checkout | Method is **per shop** (`payment_methods` map), UPI only if the shop has a UPI ID (`accepts_upi`) | *Backend*: per-shop method selector; UPI disabled for COD-only shops | 03 |
| DB-24 | "Open UPI" assumed to work for every shop | A shop without a UPI ID is COD-only | *Backend* | 03 |
| DB-25 | Max 3 unpaid UPI orders not mentioned | Backend caps a buyer at 3 open UPI orders (`MAX_OPEN_UPI_ORDERS`) | *Backend*: surface the server message | 06 |
| DB-26 | Multi-order payment "pays one after another" automatically | Backend returns all orders; each must be paid separately | *New*: **Pay your orders** list (`GET /shop/checkouts/:id`) | 03 |

## C. Addresses, shops, products

| # | Mockup says | Reality | Decision | Spec |
|---|---|---|---|---|
| DB-30 | Address has `landmark` | Fields are `label, full_name, phone, line1, line2, city, state, pincode, is_default` | *Backend*: the "Landmark" field maps to **`line2`** (label it "Landmark / area (optional)") | 03, 05 |
| DB-31 | Mobile "10 digits"; pincode "6 digits" | Backend only requires non-empty phone (≤20) and numeric pincode 4–10 digits | *Mockup* (stricter, client-side) | 03, 06 |
| DB-32 | Address delete: "Past orders keep their copy" | True after the migration (orders snapshot the address; `address_id` set NULL on delete) | *Mockup* | 03 |
| DB-33 | Seller UPI ID regex `^[\w.-]+@[\w]+$` | Backend: `^[\w.+-]{2,256}@[a-zA-Z]{2,64}$`; blank = COD-only shop | *Backend* regex; helper copy explains COD-only | 03, 06 |
| DB-34 | UPI ID editable freely in Shop profile | Changing it needs `current_password`; recorded in the audit log; open orders keep the old payee | *Backend*: password dialog | 03 |
| DB-35 | Rejected application reason hard-coded | Server returns `rejection_reason` (required for reject **and** suspend; also shown for suspended) | *Backend* | 03 |
| DB-36 | Seller states: none / pending / rejected / suspended / approved from "`/shop/my-shop`" | `GET /shop/shops/mine` → `data.shop` is `null` when none (not 404), else a shop with `status` | *Backend* | 03 |
| DB-37 | Suspended: "Open orders can still be completed" | True: suspended shops see an **orders-only** dashboard; unpaid orders were cancelled and their UPI hidden | *Backend + Mockup* | 03 |
| DB-38 | Seven hard-coded categories with short names and hues | `GET /shop/categories` (admin can add more). Seeded: Devotional Items, Books & Booklets, Apparel & Merchandise, Event Tickets, Handmade & Crafts, Food & Snacks, Other | *Client*: map seeded **slugs** to the mockup's short name + hue (`devotional-items`→Devotional/28°, `books-booklets`→Books/205°, `apparel-merchandise`→Apparel/345°, `event-tickets`→Tickets/265°, `handmade-crafts`→Handmade/150°, `food-snacks`→Food/12°, `other`→Other/45°); for any other category: short = first word, hue = `(id × 47) mod 360` | 02, 03 |
| DB-39 | Product images are initial-letter tiles | Products have `images[]` (Cloudinary URLs, up to 6, `is_primary`) | *Mockup* tile as the **fallback/placeholder**; show real images with `cached_network_image` | 03 |
| DB-40 | Product form: Draft/Active toggle only; category chips | Backend statuses: `draft, active, out_of_stock, archived`; `out_of_stock` is not set automatically; archive = soft remove | *Mockup* + show `Out of stock` chip when `stock_quantity` is 0 | 03 |
| DB-41 | "MRP (₹)" must be higher than price | Backend accepts any `compare_at_price` ≥ 0 | *Mockup* (client-side rule) | 03 |
| DB-42 | Product form posts partial/optional changes freely | `PUT /shop/products/:id` currently requires the **full body** (title, price, stock_quantity) and cannot clear fields | *Backend*: always send the full form; see 12-BACKEND-ASKS (`PATCH`) | 03, 05 |

## D. Search, filters, home

| # | Mockup says | Reality | Decision | Spec |
|---|---|---|---|---|
| DB-50 | Search filter: **deanery** chips (Jalandhar/Ludhiana/Amritsar/Kapurthala) on products | `GET /shop/products` supports only `q`, `category_id`, `shop_id`, `page`, `limit`; **shops** (`GET /shop/shops`) support `parish`, `deanery`, `q` | *Client + Backend*: product search uses `q` + `category_id`; the deanery filter lives on a **Shops** result section (`/shop/shops?deanery=`); backlog item in doc 12 | 03, 12 |
| DB-51 | Price slider and sort (Newest / Price low→high / high→low) | No server price filter or sort (newest first only) | *Client*: sort and price filter applied to the loaded results (load up to `limit=100`), labelled "on loaded results"; doc 12 asks for server support | 03, 12 |
| DB-52 | "Featured shops", promo carousel ("5 parish shops just joined", "Advent collection") | No endpoint for featured/promos | *Client*: featured = first shops from `GET /shop/shops?limit=10`; promo cards are static app content in `strings.dart` (flagged as placeholder copy to be replaced by the owner) | 03 |
| DB-53 | Wishlist heart (local state) | No wishlist API | *Client*: persisted per user in preferences, local only; a **Saved** filter is optional, not required | 03 |
| DB-54 | "Hi {first name}", "{parish} · {deanery}" under the name | `user` has only `username`/`email`; holders have a profile with name/parish/deanery | *Client*: greeting uses the holder's profile name (capitalized) if known, else the username; the subline shows parish·deanery for holders, role label for others | 03, 04 |
| DB-55 | "7 categories" label hard-coded | Count from the API | *Backend* | 03 |
| DB-56 | "1 items" (no singular) | — | *Fix*: "1 item" | 03 |

## E. Navigation, shell, chrome

| # | Mockup says | Reality / decision | Spec |
|---|---|---|---|
| DB-60 | Tabs: Home, Categories, Cart, Orders, Account, identical for all personas | Owner decision D2: **[My ID \| Profiles] · Shop · Cart · Orders · Account**; Categories becomes a screen under Shop | 01, 03, 04 |
| DB-61 | Orders tab shows only the customer's orders; seller orders under My shop | Keep, but `/orders/:id` is one **role-aware** screen (buyer, seller, admin-in-dispute) | 03 |
| DB-62 | Appearance row toggles Dark/Light only | Offer **System / Light / Dark** | 02, 04 |
| DB-63 | Dialogs always say "Keep it" on the cancel button, "Signed out (demo)" toast | Use context-appropriate labels ("Not now", "Cancel") and no "(demo)" | 03 |
| DB-64 | Persona switcher, stage controls, device bezel, fake status bar | Mockup chrome — ignore (use SafeArea) | 02 |
| DB-65 | Structure doc routes `/orders/confirmed`, `/pay/:orderIds` | Use `/order-placed/:checkoutId` and `/pay/:orderId` + `/pay-checkout/:checkoutId` | 01 |
| DB-66 | Structure doc: `auth_interceptor` "mirrors `src/api/apiClient.js`" which redirects to `/login` | The web handler leaves the stored `user` behind and routes to a URL that does not exist; the app clears **both** token and user and navigates through the router | 01 |
| DB-67 | Structure doc packages omit sharing/printing/PDF/image resize | Needed for the ID card and uploads | 01 |

## F. ID-card area (no mockup)

| # | Fact | Decision | Spec |
|---|---|---|---|
| DB-70 | The mockup has **no screens** for login, My ID, profiles, forms, card preview, account settings, users | *New*: designed in the same language | 02, 04 |
| DB-71 | Web holder dashboard never shows the card | *New*: My ID shows it (improvement I1) | 04, 07 |
| DB-72 | Web list shows no deleted profiles; backend has no list-deleted endpoint | *Backend*: nothing to build; explain **restore-by-recreation** in the create flow; ask in doc 12 | 04, 12 |
| DB-73 | Web form photo "max 800K / 5 MB" text is unenforced | Resize client-side (I3) | 04 |
| DB-74 | Two different deanery/parish lists in the web code | `assets/data/deaneries.json` (form list) for **entry**; `GET /profiles/filter-options` for **filtering** | 04 |

### G. Found while writing the screen and contract docs

| # | Mockup / proposal says | Backend / reality | Resolution | Docs |
|---|---|---|---|---|
| DB-75 | A rejected seller applicant "can apply again" | The backend allows **one shop per user**; a rejected applicant cannot reapply | *Backend*: admin gets a "Reconsider and approve" action; copy tells the applicant to contact the CYD Office | 03 |
| DB-76 | Categories show "N items" | `GET /shop/categories` returns no counts | *Backend*: drop the count line | 03 |
| DB-77 | Address `state` shown as optional | The backend requires `state` | *Backend*: required field, default `Punjab` | 03 |
| DB-78 | Cart note "Your cart stays on this device" | Doc 01: sign-out clears the user's cart | *Spec*: copy follows the sign-out rule | 01, 03 |
| DB-79 | Product form allows removing all photos on edit | An empty `images[]` on `PUT` is ignored by the backend | *Backend*: form blocks removing the last photo on edit | 03 |
| DB-80 | Product write uses rupees but reads return `price_paise` | Backend quirk (doc 05) | *Backend*: convert at the model boundary (paise ↔ rupees string); never float math | 05, 08 |

## How to use this file
- Implementing a screen: read its spec section **and** the rows that cite it.
- Reviewing: any behaviour that matches the *Mockup / proposal says* column where the decision is *Backend* is a bug.
- New conflicts discovered during the build: add a row (next free number in its section) and tell the owner.
