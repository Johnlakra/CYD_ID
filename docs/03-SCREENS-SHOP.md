# 03 · Shop screens — specification

Screens of the **Shop** half of the CYD app: the 19 mockup screens (01–18 + 12b) rebuilt against the real backend,
plus the screens the mockup does not have (peer-to-peer payment, order chat, disputes, refunds, admin disputes…).
Visual vocabulary (tokens, type, components `§9.x`) is in `02-DESIGN-SYSTEM.md`; routes in `01-ARCHITECTURE.md` §6;
every mockup↔backend decision cited as `DB-nn` is in `11-DESIGN-VS-BACKEND.md`; endpoints in `05-API-CONTRACT.md`;
state machine, timers and validation in `06-DOMAIN-RULES.md`.

**Markers.** `[Mockup]` = taken from the Claude Design mockup (screen id in brackets). `[Designed here]` = **not in the
mockup**; designed in the same language and needing the owner's visual sign-off. `[Replaced]` = a mockup screen whose behaviour
was replaced because the backend works differently.

## Global rules (apply to every screen below)
1. **Four states**: loading skeleton shaped like the content · empty (dashed card, copy given) · error (card + "Tap to retry") · data. (doc 01 §10)
2. **Server-driven actions.** Order screens render buttons only from `allowed_actions` and dispute reasons only from `dispute_reasons` on the order view. Never derive them from `status`/`payment_status`. (D6)
3. **Money is `int` paise** shown `₹x.xx` (`formatPaise`), en-IN grouping in lists. (D7)
4. **Tab bar** = the floating pill bar of doc 02 §9.19. It is shown on tab roots and hidden on the screens marked *tab bar: hidden*.
5. **Status chips** use the tables of doc 02 §3. Order chip and payment chip are both shown where a screen says so.
6. Every mutation: button disabled + inline spinner while pending, success toast (copy given), failure → server `message` verbatim in a toast or inline banner.
7. Images: real `images[]`/logos via `cached_network_image`; the mockup's initial-letter tile with category hue is the **placeholder/fallback** (DB-39).
8. Pull-to-refresh on every list; `ref.invalidate` on mutation.
9. Section order in each spec: **Route & role · Purpose · Layout · States · Copy · Interactions · API · Acceptance**.

## Contents
**A. Browse and buy [Mockup]** — 01 Shop home · 02 Categories · 03 Search & filter · 04 Storefront · 05 Product detail · 06 Cart · 07 Checkout · 08 Payment `[Replaced]` · 09 Confirmation · 10 Orders · 11 Order detail
**B. Addresses and seller entry [Mockup]** — 12 Addresses · 12b Address form · 13 Become a seller · 14 Account (shop entries)
**C. Seller [Mockup]** — 15 My shop · 16 Shop order · 17 Product form
**D. Admin [Mockup]** — 18 Shop applications
**E. Peer-to-peer payment and order lifecycle [Designed here]** — E1 Pay the seller · E2 Pay your orders · E3 Order placed (COD and UPI variants) · E4 Orders list with needs-action · E5 Role-aware order detail (banners and actions) · E6 Cancel, dispute and refund sheets · E7 Order chat · E8 Evidence · E9 Seller: confirm / not received / reject / refund · E10 Seller fulfilment
**F. Seller & admin extensions [Designed here]** — F1 Seller application states · F2 My shop: suspended / orders-only mode · F3 Shop profile tab (password-gated UPI change) · F4 Admin disputes queue · F5 Admin dispute detail and resolution
**G. Cross-screen reference** — G1 Seeded category → name/hue map · G2 Status/chip copy · G3 Strings that are placeholders for the owner

---

# A. Browse and buy

## 01 · Shop home `[Mockup 01]`
**Route** `/shop` (tab 2, **Shop**) · **Role** any signed-in user · **Feature** `marketplace` · tab bar: shown.

**Purpose.** Landing page of the marketplace: greet the user, offer search, jump into a category or shop, show fresh products.

**Layout** (top → bottom; screen padding `60 0 130`, horizontal padding 20):
1. **Header row** (gap 11): avatar 42 (doc 02 §9.28; initials Anton 15) · column: `Hi {first}` (Archivo 700 15) over a mono-9 uppercase line `{PARISH} · {DEANERY}` for holders, or the role label (`ADMIN`, `CYD MANAGER`, `MEMBER`) for others (DB-54) · **cart button** 44 circle, 1px `line2`, glyph `₹` Anton 16, accent count badge (min 18, top −2/right −2, Archivo 700 10) when the cart has lines. Tap → `/cart`.
2. **Hero** (padding `22 20 0`): two stacked Anton 46/1 uppercase lines: `Shop the` / `diocese.`; the second line sits on an accent block (`accent` fill, `onAccent` text, padding `0 8 3`).
3. **Search entry** (padding-top 18): full-width button 52 high, radius 16, 1px `line`, `card` fill, leading `⌕`, placeholder text `Search rosaries, books, hoodies…` (`faint`). Tap → `/shop/search` (field focused).
4. **Category rail** (horizontal scroll, gap 10, padding `20 20 4`): items 72 wide: tile 58×58 radius 18 in the category tint with the category mark (Anton 22, `markFg`), label Archivo 600 10 centred (short name, doc §G1). Tap → `/shop/search?cat={id}`.
5. **Promo cards** (horizontal, scroll-snap, gap 12, padding `18 20 0`): two cards 300×156 radius 22.
   - Accent card, glow: mono-9 `NEW THIS MONTH`; Anton 30/.95 uppercase `5 parish shops just joined`; Archivo 500 12 `From Amritsar to Kapurthala.` — **static placeholder copy** (DB-52, §G3).
   - Raised card with 1px `line`: mono-9 `SEASONAL`; Anton 30 `The Advent collection is here`; `Candles, wreaths and calendars →`. Tap → `/shop/search?q=advent`.
6. **Featured shops** (section title Anton 22 `Featured shops`; horizontal list): card with shop mark (Anton 15 on tint, or logo), shop name Archivo 700, `{deanery} deanery`, `Visit shop →`. Source: first 10 shops of `GET /shop/shops?limit=10`. Tap → `/shop/shops/:id`.
7. **Fresh from parish shops** (section title Anton 22): product grid 2 columns (gap 12 × 16), card per doc 02 §9.13 incl. wishlist heart and SOLD OUT overlay.

**States.**
| State | Rendering |
|---|---|
| Loading | header + hero render immediately; rail/featured/grid show skeletons (4 product skeleton tiles) |
| Error | in the grid slot: error card, icon `!`, title `Couldn't load products`, body `Check your connection, then try again.`, button `Tap to retry`. Rail and featured fail independently and hide silently if empty |
| Empty | empty card, icon `☼`, title `No products yet`, body `Parish shops are still setting up. Check back after Sunday Mass.` |
| Data | as layout; infinite scroll appends pages of 20 (`pagination.has_next`) |

**Interactions.** Heart toggles the local wishlist (DB-53) with no toast. Product tap → `/shop/products/:id`. Pull-to-refresh reloads all three sources. Opening the screen runs `GET /shop/orders/action-count` to refresh the tab badge.

**API.** `GET /shop/categories` · `GET /shop/shops?limit=10` · `GET /shop/products?limit=20&page=n` (items: `id,title,price_paise,compare_at_price_paise,stock_quantity,in_stock,shop_id,shop_name,category_id,images[]`; hide `stock_quantity` of 0 behind SOLD OUT but keep the card).

**Acceptance.**
- [ ] Greeting uses the holder's profile name (capitalised) when known, else the username; the subline never shows `undefined`.
- [ ] Cart badge equals the quantity total and survives an app restart.
- [ ] With zero products the empty card shows; with the API failing the error card shows and retry works.
- [ ] Promo text is read from one `strings.dart`-style constants file (§G3).

## 02 · Categories `[Mockup 02]`
**Route** `/shop/categories` (reached from Shop home "see all" and the category rail's trailing "All" tile) · **Role** any · tab bar: shown (Shop tab stays selected).

**Layout** (padding `66 20 130`): mono-9 `{n} CATEGORIES` (n from the API, DB-55) · Anton 40/.95 two lines `What are you` / `looking for?` · search button `⌕ Search everything` (as Home) · vertical list of category rows (gap 10): tile 58×58 radius 18 with mark, then name (Archivo 700 15). Tap → `/shop/search?cat={id}`.

**Differences from the mockup.** The mockup's `{n} ITEMS` line is dropped: `GET /shop/categories` returns no counts (DB-38). Add an item count only if a future backend ask (doc 12) provides it.

**States.** Loading: 6 row skeletons. Error: card `Couldn't load categories` + `Tap to retry`. Empty (no categories): `No categories yet` / `Check back soon.`

**API.** `GET /shop/categories` → `categories[{id,name,slug,sort_order,status}]`; map slugs to short name + hue per §G1.

**Acceptance.** [ ] The seven seeded categories render with the mockup's marks and hues; an unknown category uses the fallback hue rule. [ ] Row order follows `sort_order`.

## 03 · Search & filter `[Mockup 03]`
**Route** `/shop/search?q=&cat=` · **Role** any · tab bar: **hidden** (full-screen search).

**Layout.**
- **Top row** (padding `60 20 0`): back button · search field (height 48, 1px `accent` border always, `⌕`, placeholder `Search products and shops`, trailing `×` when non-empty) · `Filter` button (height 40; shows a count badge when filters are active).
- **Idle** (no query and no filters): section `Recent searches` + `Clear` (text button) with chips `↺ {term}` (max 8, stored per user in preferences, newest first, de-duplicated) · section `Trending categories`: rows (mark, name, `→`) from the category list.
- **Searching** (query or any filter): result header = mono `{n} RESULTS` + removable chips for active filters (`{category} ×`, `{deanery} ×`, `Up to ₹{n} ×`) · product grid 2-col.
- **Filter & sort sheet** (§9.16, title Anton 26 `Filter & sort`, `Reset` top-right): **Category** (chips: Any + categories) · **Shop's deanery** (chips: Any + the four from the mockup, see below) · **Price** (slider ₹50–₹1,000 step 50, label `Any price` at max, else `Up to ₹{n}`) · **Sort by** (radio rows: `Newest`, `Price low → high`, `Price high → low`) · sticky CTA `Show {n}`.

**What is real vs client-side (DB-50, DB-51).**
- Server: `q` (matches title and description) and `category_id`, `page`, `limit` (≤ 100). Debounce typing 400 ms; a query shorter than 2 characters shows idle state.
- Client on the **loaded results** (load `limit=100`; if `has_next`, a footer text button `Load more`): price filter, price sort. Show the footnote `Filters apply to loaded results.` under the result count when either is active.
- **Deanery** is not a product filter. Implement as a **Shops** section above the products when a deanery is chosen: `GET /shop/shops?deanery={d}&q={query}` rendered as a horizontal list of featured-shop cards; products are not narrowed. The deanery chip list is the four mockup values (`Jalandhar, Ludhiana, Amritsar, Kapurthala`); a shops filter-options endpoint is a backlog item in doc 12.
- Recent searches are saved when the user taps a result or submits the keyboard "search" key.

**States.** Loading: 4 product skeletons. Error: `!` / `Search isn't working right now` / `Tap to retry`. No results: icon `?`, title `No results for “{q}”` (or `Nothing in {category} yet` when only a category is set), body `Try a shorter word, or browse by category instead.`, button `Browse categories` → `/shop/categories`. Results: grid.

**API.** `GET /shop/products?q=&category_id=&limit=100&page=` · `GET /shop/shops?deanery=&q=`.

**Acceptance.** [ ] Typing, clearing and re-typing never shows stale results from an earlier query (cancel in-flight requests). [ ] `Reset` clears filters but keeps the query. [ ] Back from a result returns to the same results and scroll position. [ ] The Home promo card `advent` pre-fills the field and runs the search.

## 04 · Storefront `[Mockup 04]`
**Route** `/shop/shops/:id` · **Role** any · tab bar: **hidden** (hero screen).

**Layout** (padding `0 0 130`):
- **Banner** (height ≈ 150, `banner_url` or tint with mono caption `SHOP BANNER` only when absent); hero back button (top 56, left 18, `card` fill).
- **Identity block** (negative margin-top over the banner): logo/mark 84 circle with 4px `bg` ring (Anton 28) · shop name Anton 32/1 · info chips (26 high): `⛪ {parish}` and `{deanery} deanery` · description Archivo 400 13/1.5 `mute` · count line mono `{n} PRODUCTS`.
- **Category chips** (horizontal filter chips): `All` + categories that appear among this shop's products (client-side grouping of the loaded list).
- **Product grid** (storefront variant of §9.13: no shop name, no PHOTO caption).

**States.** Loading: banner block + 4 tile skeletons. Error: `Couldn't load this shop` + `Tap to retry`. 404 (`Shop not found`: shop suspended/rejected): full-screen empty `This shop isn't available right now` + `Back to shop`. Empty: `This shop hasn't added products yet` / `Check back soon.`

**API.** `GET /shop/shops/:id` (public fields only: `id,name,slug,description,logo_url,banner_url,parish,deanery,status,created_at`; **no UPI ID, phone or owner**) · `GET /shop/products?shop_id=:id&limit=100`.

**Acceptance.** [ ] Product count equals `pagination.total`. [ ] A suspended shop's storefront shows the unavailable state, never products. [ ] Seller's own storefront is viewable (a seller can browse but cannot buy from their own shop; the checkout error is explained in screen 07).

## 05 · Product detail `[Mockup 05]`
**Route** `/shop/products/:id` · **Role** any · tab bar: **hidden**; sticky purchase bar.

**Layout.**
- **Gallery** (full width × 390 reference, height ≈ 390; horizontal pager with dots under it: active dot 18×6 `ink`, others 6×6 `line2`). Images from `images[]` ordered by `sort_order`; none → tinted tile with category mark and caption `PRODUCT PHOTO {n}`. Hero back button and wishlist heart overlay (top).
- **Info block** (padding 20): shop link `{shop_name} →` (mono/Archivo 600 12, `accText`) → storefront · title Anton 32/1 · price row: price (Anton 26), MRP strike (when `compare_at_price_paise > price_paise`), `{n}% off` pill · chips row: stock chip (`In stock` ✓ / `Only {n} left` for 1–3 / `Out of stock`) and the category chip · hairline · section label `About this item` · description (clamped to 4 lines when longer than 120 chars, text button `Read more` / `Show less`).
- **Sticky bar** (bottom, `bg` fill, hairline top): quantity stepper (52 high, §9.11, max = `stock_quantity` capped at 99) · `Add to cart` (outline, 52) · `Buy now` (accent, 52). When `stock_quantity` is 0: single disabled button `Out of stock`.

**Interactions.** `Add to cart` merges into an existing line (quantity capped at stock) and toasts `Added to cart ✓` with action `View cart` (5 s). `Buy now` adds then navigates to `/cart`. A seller viewing their own product sees the normal screen; the purchase bar is replaced by the info card `This is your own product. You can't buy from your own shop.` (checkout would be refused by the server).

**States.** Loading: gallery block + 3 text skeleton lines. Error: `Couldn't load this product` + `Tap to retry`. Not found / archived / shop not approved: `This product isn't available any more` + `Back to shop`.

**API.** `GET /shop/products/:id` → `product{id,shop_id,title,description,price_paise,compare_at_price_paise,stock_quantity,status,category_id,images[],shop_name,...}`.

**Acceptance.** [ ] Stepper can't exceed stock; stock 0 disables buying. [ ] Discount percent equals `round((1 − price/mrp)×100)` and only shows when MRP > price. [ ] Gallery dots follow the swipe. [ ] The wishlist heart state matches the grid.

## 06 · Cart `[Mockup 06]`
**Route** `/cart` (tab 3) · **Role** any · tab bar: shown; summary bar sits above it (bottom offset 92, doc 02 §8.4).

**Principle.** The cart is **local** (DB-20): a list of `{productId, quantity}` per signed-in user, stored under `cyd_cart:<userId>`, and **revalidated** with the server whenever the screen opens and before checkout (DB-21).

**Layout** (padding `66 20 240`): mono `{n} items` (singular `1 item`, DB-56) · Anton 40 `Your cart` · multi-shop info card when lines come from more than one shop: `ⓘ Items from {n} shops are sent as separate orders, one per shop.` · **shop groups**: header (shop mark, name Archivo 700, deanery mono) then line rows: thumb 56 (image or tint), title (2-line clamp) with `×` remove, unit price (`faint`), stepper (34 high) and line total; group footer `Shop subtotal` + amount · **summary bar** (radius `22 22 0 0`): `Total · delivery arranged by shop` + Anton 26 total, and primary `Proceed to checkout` (54).

**Revalidation (`POST /shop/products/lookup` with `{ids}` → `products[{id,title,price_paise,stock_quantity,status,shop_id,shop_name,shop_status,accepts_upi,available,image_url}]`).**
| Server says | Cart does |
|---|---|
| price changed | update the unit price and show an inline notice under the line: `Price changed to ₹{new} (was ₹{old})` |
| `stock_quantity` < quantity | clamp the quantity and show `Only {n} left` |
| `available` false (archived, shop not approved, out of stock) | mark the line `No longer available` (greyed, stepper disabled, excluded from the total); `Proceed` is disabled until the line is removed (button `Remove unavailable items`) |
| lookup request fails | keep the cart as is, show a quiet banner `Prices may be out of date` and still allow checkout (the server re-checks) |

**Interactions.** Stepper min 1, max `min(stock, 99)`. `×` removes immediately and toasts `Removed from cart` with action `Undo` (local restore, 5 s). Decrementing below 1 does nothing (use `×`).

**States.** Empty: icon `₹`, `Your cart is empty` / `Find something from a parish shop.` / button `Start shopping` → `/shop`. Loading (first lookup after restart): lines show with a thin shimmer on prices.

**Acceptance.** [ ] Cart persists across restart; two accounts on one device have separate carts; sign-out clears the signed-out user's cart. [ ] Totals are integer-paise sums. [ ] A deleted/archived product never reaches checkout. [ ] Group order follows first-added shop.

## 07 · Checkout `[Mockup 07]` (payment step changed)
**Route** `/checkout` · **Role** buyer (any signed-in user) · tab bar: **hidden** · one screen with three steps; keyboard-aware sticky CTA.

**Layout.** Header row: back + Anton 26 `Checkout`. Step indicator: three 3-px segments with labels `1 Address`, `2 Payment`, `3 Review` (done/current segments `accent`, others `line2`). Back from step 2/3 returns to the previous step; from step 1 it pops the route. Sticky CTA (56): `Continue to payment` → `Review order` → `Place order · ₹x.xx` (or `Place {n} orders · ₹x.xx` when the cart spans {n} shops).

**Step 1 · Deliver to** (Anton 22). Selectable address cards (§9.31): `{label} · {full_name}`, `{line1}`, `{line2}`, `{phone}`; the default address is pre-selected. `+ Add a new address` (dashed) opens screen 12b and returns here with the new address selected. No addresses → empty card `No saved addresses` / `Add one so checkout is quicker.` and the CTA becomes `Add address`.

**Step 2 · How will you pay?** (Anton 22). **One block per shop** in the cart (DB-23): block header = shop mark + name + subtotal; inside, two selectable method cards (tile 40 with glyph, title Archivo 700 14, note Archivo 400 12 `mute`):
| Method | Title | Note | Enabled when |
|---|---|---|---|
| `upi` | `Pay by UPI` | `Pay the shop's UPI ID from any UPI app, then enter the reference number. The shop confirms once the money arrives.` | `accepts_upi` is true for the shop (from the cart lookup) |
| `cod` | `Cash on delivery` | `Pay the seller in cash when your order arrives.` | always |
If a shop is COD-only the UPI card is disabled with helper `This shop only accepts cash on delivery` (DB-24) and COD is preselected. Default for the others: UPI. Info line under the blocks when any UPI is chosen: `You'll get 30 minutes to pay after placing the order.` (value from `GET /shop/config` → `pay_window_minutes`) and, when more than the cap would be open: show the server's cap message early if the user has open UPI orders (`max_open_upi_orders` from config; see error table).

**Step 3 · Review.** Multi-shop info card `Your order will be placed as {n} separate orders, one per shop.` · collapsible shop panels (header: mark, name, `{n} ITEMS · ₹sub`, `+`/`−`; expanded: `{title} × {qty}` and line total) · optional textarea **Note for the seller** `[Designed here]` (max 500, helper `Optional`, sent as `notes`) · recap card: `DELIVER TO {label} · {city} {pincode}` · `PAYMENT` one line per shop (`{shop}: UPI · pay after placing` or `{shop}: Cash on delivery`; single shop → just the method) · `GRAND TOTAL` Anton 24.

**Placing the order.**
1. Generate an `Idempotency-Key` (UUID v4: 36 chars, accepted pattern `[A-Za-z0-9_-]{8,64}`) when the user reaches step 3. **Keep the same key** for every retry of the same attempt (timeouts, 5xx, double tap); **rotate** it when the cart, address, payment choices or note change. A `200` with `replayed: true` is success.
2. `POST /shop/checkout`, header `Idempotency-Key`, body `{ address_id, items:[{product_id, quantity}], payment_methods:{ "<shop_id>": "upi"|"cod" }, notes }`.
3. On `201/200`: clear the cart, then navigate (replace the checkout route) by what was created (`data.orders[]`):
   - exactly one order and it is UPI → `/pay/:orderId` (screen E1);
   - any UPI order otherwise → `/pay-checkout/:checkoutId` (E2);
   - all COD → `/order-placed/:checkoutId` (E3).

**Errors (show the server `message` verbatim in a banner above the recap; the CTA re-enables).**
| Server message (400/404/409) | UI addition |
|---|---|
| `Only {n} left of "{title}"` / `"{title}" just sold out` / `Product {id} is no longer available` | button `Review cart` → `/cart` with a forced lookup |
| `You cannot buy from your own shop ("{shop}")` | button `Review cart`; the offending lines are highlighted |
| `Choose UPI or cash on delivery for "{shop}"` / `"{shop}" only accepts cash on delivery` | jump back to step 2 |
| `You can have at most 3 unpaid UPI orders at a time. Pay or cancel an existing order first.` | button `My orders` → `/orders` |
| `Delivery address not found` | jump to step 1 |
| `This checkout key was already used for a different cart. Please refresh and try again.` | rotate the key, keep the user on step 3 |
| Network failure / timeout | `Couldn't reach the server. Your order may or may not have been placed.` + `Try again` (same key; safe) |

**API.** `GET /shop/addresses` · `POST /shop/products/lookup` · `GET /shop/config` · `POST /shop/checkout`.

**Acceptance.** [ ] Double-tapping `Place order` (or tapping again after a timeout) creates exactly one set of orders. [ ] A COD-only shop cannot be set to UPI. [ ] Stock/price changes between cart and placing surface the server message, not a crash. [ ] The CTA total equals the sum of lines in paise.

## 08 · Payment `[Mockup 08 — Replaced]`
The mockup's **Payment** screen opened a hosted UPI gateway, showed `Opening UPI checkout…`, polled `/shop/payments/:id/status` every 3 s and offered `Try UPI again` / `Switch to cash on delivery` / `Keep checking`. **None of it exists in the backend** (DB-01…DB-05): there is no gateway, no payment polling endpoint, and an order's payment method cannot be changed.

It is replaced by the peer-to-peer flow:
| Mockup 08 element | Replacement |
|---|---|
| Big amount + `to {shop}` | **E1 Pay the seller** header (same Anton 44 amount, `to {shop}`) |
| `Opening UPI checkout…` / `Complete payment in your UPI app` | E1 instructions: copy the UPI ID, pay in any UPI app, then enter the UTR |
| `I've paid, check now` | E1 **Submit payment reference** (UTR form) |
| `Payment page didn't open` / `Try UPI again` | E1 `Open UPI app` button + copy/QR fallbacks; if the app can't open the link: toast `No UPI app found. Copy the UPI ID and pay from your UPI app.` |
| `Switch to cash on delivery` | **Removed** (DB-04): cancel the order (E6) and check out again with COD |
| `Still waiting for confirmation` / `Keep checking` / `Go to my orders` | E1 state `Waiting for the seller` (claimed) with `Go to my orders`; order detail polls (§E5) |
| Multi-order "pays one after another" | E2 **Pay your orders** list (DB-26) |
Do **not** build `payment_poller`, `payment_repository` or `payment_status` from the mockup's structure proposal (DB-02).

## 09 · Confirmation `[Mockup 09]` → see E3
Mockup recap: 104 accent circle with ✓ (Anton), Anton 42 `Order placed!` / `{n} orders placed!`, body `Each shop has been told. You'll get updates here as they accept, pack and ship.`, one tappable card per order (order number mono, shop name, method, total, `→`), buttons `View my orders` and `Continue shopping`. Specified for the real flow, including the UPI variant (`UPI · pay the seller now`, DB-12), in **E3**.

## 10 · Orders `[Mockup 10]` → see E4
Mockup recap: Anton 40 `My orders`, horizontal filter chips with counts (`All · n`, `Awaiting payment`, `Placed`, `Accepted`, `Packed`, `Shipped`, `Delivered`, `Cancelled`, `Rejected`), order cards (§9.7) with overlapping thumbs, empty `No orders yet` / `No {filter} orders yet` + `Browse the marketplace`. Specified with the real two-axis status model and needs-action handling in **E4**.

## 11 · Order detail `[Mockup 11]` → see E5
Mockup recap: header (back, order number, status chip), shop name Anton 34, `Ordered {date}`, 5-step timeline, awaiting banner `Payment not confirmed yet` + `Pay now`, ended card for cancelled/rejected, items card with TOTAL, `Payment & delivery` card (method, payment status, UTR, address), buttons `Visit {shop}` and `Cancel order`. One **role-aware** screen (buyer, seller, admin-in-dispute) specified in **E5**, replacing both mockup 11 and mockup 16.

---

# B. Addresses and seller entry

## 12 · Addresses `[Mockup 12]`
**Route** `/account/addresses` · **Role** any signed-in user · **Feature** `addresses` · tab bar: hidden (padding `60 20 130` kept).

**Layout.** Header: back + Anton 26 `Addresses`. Address cards (gap 12; §9.7): row 1 = label (mono 10 uppercase: `HOME`, `HOSTEL`, `WORK`, `OTHER`) + `DEFAULT` pill when `is_default`; `{full_name} · {phone}` (Archivo 700 14); `{line1}`; `{line2}` (omitted when empty); then `{city}, {state} {pincode}`; action row: `Edit` · `Set default` (hidden on the default card) · spacer · `Delete` (danger text). Footer: dashed `+ Add address` (50).

**States.** Loading: 3 card skeletons. Error: `Couldn't load addresses` + `Tap to retry`. Empty: `No saved addresses` / `Add one so checkout is quicker.` (the dashed add button stays).

**Interactions.**
- `Set default`: `PUT /shop/addresses/:id` with the **full** address body plus `is_default: true` (the endpoint needs all required fields); toast `Default address updated`. The default cannot be un-set directly; setting another one replaces it.
- `Delete`: dialog title `Delete this address?`, body `{label} · {line1}. Past orders keep their copy.` (DB-32), buttons `Keep it` / `Delete` (danger). Toast `Address deleted`. Deleting the default leaves no default; checkout then asks the user to choose.
- `Edit` / `Add` → 12b.

**API.** `GET /shop/addresses` → `addresses[{id,label,full_name,phone,line1,line2,city,state,pincode,is_default}]` · `PUT /shop/addresses/:id` · `DELETE /shop/addresses/:id`.

**Acceptance.** [ ] Orders already placed keep their address after the address is deleted. [ ] Only one address shows `DEFAULT`. [ ] Another user's address id returns 404 and the UI shows the error card.

## 12b · Address form `[Mockup 12b]`
**Route** `/account/addresses/new` · `/account/addresses/:id` (edit) · also opened from checkout · **Role** any · tab bar: hidden; sticky `Save address` bar rises with the keyboard (doc 02 §8.3).

**Layout.** Header: back + title `Add address` / `Edit address`. **Label chips** (form chips 34): `Home`, `Hostel`, `Work`, `Other` (default `Home`). Fields (labels mono-9 uppercase above, §9.8):
| Label | Key (request) | Keyboard | Required | Client validation / error text |
|---|---|---|---|---|
| `RECEIVER NAME` | `full_name` | words | yes | `Enter the receiver's name` (prefill: holder's profile name or empty) |
| `MOBILE` | `phone` | phone, placeholder `98765 43210` | yes | exactly 10 digits after stripping non-digits: `Enter a 10-digit mobile number` (DB-31; backend only checks non-empty ≤ 20; send digits only) |
| `HOUSE, STREET OR HOSTEL` | `line1` | text | yes | `Enter house, street or hostel` |
| `LANDMARK / AREA (OPTIONAL)` | `line2` | text | no | — (**the mockup's "Landmark" maps to `line2`**, DB-30) |
| `CITY` | `city` | words | yes | `Enter a city` |
| `PINCODE` | `pincode` | number, max 6 | yes | `Pincode is 6 digits` (backend accepts 4–10 digits; the app is stricter) |
| `STATE` | `state` | words | **yes** (backend requires it; the mockup showed it optional) | `Enter a state`; prefill `Punjab` for the first address as a convenience |
Switch row `Use as default address` (§9.10): on by default for the first address. Sticky CTA `Save address` (56; spinner `Saving…`).

**Behaviour.** Errors appear on submit and on blur after first edit; a server 400 `errors[]` list is shown as a banner above the fields. Success toast `Address saved` / `Address updated`, then pop (checkout selects the saved address). Leaving with edits shows the discard dialog (doc 02 §10.4).

**API.** `POST /shop/addresses` (201 → `address`) · `PUT /shop/addresses/:id` · body `{label, full_name, phone, line1, line2, city, state, pincode, is_default}`.

**Acceptance.** [ ] A valid address saves with and without a landmark. [ ] Each error string above appears exactly as written. [ ] Editing the default address keeps it default.

## 13 · Become a seller `[Mockup 13]` (+ states F1)
**Route** `/account/sell` · **Role** any signed-in user (admins too) · **Feature** `seller` · tab bar: shown (Account tab selected) · the screen shows one of five states from `GET /shop/shops/mine` → `data.shop` (`null` = none; DB-36).

**Header.** Back + mono `SELL ON CYD SHOP`.

### 13.1 State `none` (apply form)
Anton 40 `Open your` / `parish shop`; body `Youth groups and individual members can apply. The diocesan office reviews every application, usually within a few days.`; logo picker row (tile 64 with `+`, `Shop logo` / `Optional · square image works best`; picks via `image_picker`, resized ≤ 1600 px / ≤ 1 MB, sent as a data URL); fields:
| Label | Key | Required | Rules |
|---|---|---|---|
| `SHOP NAME *` | `name` | yes | non-empty ≤ 150: `Shop name is required` · placeholder `e.g. Holy Family Candles` |
| `WHAT WILL YOU SELL?` | `description` | no | textarea ≤ 2000 |
| `PARISH` | `parish` | no | ≤ 100; suggestions from `assets/data/deaneries.json` when a deanery is chosen |
| `DEANERY` | `deanery` | no | picker from the 16 deaneries in `assets/data/deaneries.json` (free text is not allowed so shops filter consistently) |
| `CONTACT PHONE *` | `contact_phone` | yes | `Contact phone is required` (≥ 10 digits client-side; ≤ 20 server) |
| `UPI ID (OPTIONAL)` | `upi_id` | no | regex `^[\w.+-]{2,256}@[a-zA-Z]{2,64}$` → `Looks like name@bank` (server: `UPI ID must look like name@bank`); helper: `Add it to accept UPI payments. Leave it blank to sell cash-on-delivery only.` (DB-33) |
CTA `Submit application` → `POST /shop/shops/apply` → toast `Application submitted` and the screen switches to `pending`. Server `400 You already have a shop application (status: …)` → refetch and show that state.

### 13.2 State `pending`
Centre card: glyph `◔` tile, Anton 34 `Application` / `in review`, body `The diocesan office is checking your details. You'll be able to add products as soon as it's approved.`; summary card with `SHOP`, `PARISH`, `PHONE` rows (key/value §9.30). Pull-to-refresh rechecks.

### 13.3 State `rejected`
Glyph `!`, Anton 34 `Not approved`, reason quote `“{rejection_reason}” · CYD office`, body `Questions? Contact the Youth Directorate office at the Bishop's House.` **No "apply again" button**: the backend allows one shop record per user and refuses a second application, so a rejected applicant must contact the office, which may reconsider the same application (admin action *Reconsider and approve*, screen 18). This replaces the mockup's "The applicant can apply again" (new conflict, report to owner).

### 13.4 State `suspended`
Glyph `‖`, Anton 34 `Shop suspended`, reason quote when `rejection_reason` is present (the server stores the suspension reason in that column, DB-35), body `Your products are hidden from the marketplace. Open orders can still be completed. Contact the CYD office to reinstate the shop.` Button `Open my orders` → `/my-shop` (orders-only mode, F2).

### 13.5 State `approved`
Glyph `✓`, Anton 34 `You're approved`, button `Open my shop` → `/my-shop`.

**API.** `GET /shop/shops/mine` · `POST /shop/shops/apply` (body `{name, description, parish, deanery, contact_phone, upi_id, logo}`; 201 → `shop`).

**Acceptance.** [ ] All five states render from one fixture each. [ ] `shop: null` is *none*, not an error. [ ] A blank UPI ID is submitted as omitted. [ ] The logo upload fails gracefully (`Could not upload the logo`) without losing the form.

## 14 · Account — shop entries `[Mockup 14]`
**Route** `/account` (tab 5) · full Account screen incl. profile/password/appearance is specified in `04-SCREENS-IDCARD.md`; this section defines the **shop-related rows** that the mockup placed there.

**Rows** (card list, each row 56 high with trailing `→`):
| Row | Visible when | Target |
|---|---|---|
| `My orders` | always | `/orders` |
| `Saved addresses` | always | `/account/addresses` |
| Seller row: `Become a seller` + hint `Start a shop` · `My shop application` + `In review` / `Rejected` · `My shop` + `Suspended` / `Approved` | always (text from `shop.status`; from the `mine` call, cached for the session) | `/account/sell` (none/pending/rejected) or `/my-shop` (approved/suspended) |
| `Shop applications` + hint `{n} pending` | `role == admin` | `/admin/shops` |
| `Payment disputes` + hint `{n} open` | `role == admin` | `/admin/disputes` (hint from `action-count.admin_disputes`) `[Designed here]` |
| `Appearance` + `System` / `Light` / `Dark` | always | sheet with the three options (DB-62) |
`Sign out` (outline danger) → dialog `Sign out?` with body `You'll need to log in again. The cart on this device for this account will be cleared.` and buttons `Not now` / `Sign out` (doc 01 §5 clears the user's cart on sign-out, which supersedes the mockup's "Your cart stays on this device"); no `(demo)` in the toast.

**Acceptance.** [ ] Rows appear/disappear by role and shop status. [ ] The admin dispute count refreshes after resolving a dispute.

---

# C. Seller

## 15 · My shop `[Mockup 15]`
**Route** `/my-shop` · **Role** owner of a shop whose `status` is `approved` (full) or `suspended` (orders-only, see F2) · **Feature** `owner` · tab bar: shown (Account tab stays selected), as in the mockup.

**Layout** (padding `62 0 130`).
- **Header** (padding 20): logo/mark 52 + mono accent line `● APPROVED SHOP` (suspended: `‖ SUSPENDED SHOP`, `mute`) + Anton 24 shop name.
- **Stat tiles** (3, §10.5; DB-13): `Products` (non-archived count) · `To confirm` (orders with `payment_status = claimed`) · `To ship` (orders with `payment_status ∈ {confirmed, cod_pending}` and `status ∈ {placed, accepted, packed}`). Computed from `GET /shop/orders/shop` and `GET /shop/products/mine`. If any order has `payment_status = refund_due`, an info card under the tiles: `{n} refund(s) due. Tap to see them.` → Orders tab filtered to *Needs action*.
- **Tab chips**: `Products` · `Orders` · `Shop profile` (selected tab remembered while the screen lives).

**Products tab.** Dashed `+ Add product` (50) → `/my-shop/products/new`. Rows (card, padding 12): thumb 56 (first image or tint) · title Archivo 700 14 (1 line) · `₹{price} · {n} in stock` (`Out of stock` when 0) · chips: status (22 high: `Active`, `Draft`, `Archived`; `out_of_stock` shows `Out of stock`) · actions `Edit` (→ `/my-shop/products/:id`) and `Archive` (hidden when archived). Archive dialog: title `Archive "{title}"?`, body `This removes it from the marketplace, but keeps its order history.`, buttons `Keep it` / `Archive` (danger); toast `Product archived`. States: loading 3 skeletons · error `Couldn't load your products` + `Tap to retry` · empty `No products yet` / `Add your first product to open the shop.`

**Orders tab.** Filter chips `All` · `Needs action` · `Closed` `[Designed here]`. Cards (§9.7 variant): row 1 `{order_number} · {date}` + order chip (and payment chip when `claimed`/`refund_due`/`disputed`); row 2 `@{customer_username}` · `{n} items` · total; footer `Needs your response →` when `needs_action`. Tap → `/orders/:id` (role-aware screen E5). States: error `Couldn't load shop orders` · empty `No orders yet` / `New orders appear here as soon as they're placed.` Pull-to-refresh; list refreshes when the app returns to foreground.

**Shop profile tab.** Banner picker (full-width 120, `Change banner`), logo picker (`Change logo`), fields `SHOP NAME`, `DESCRIPTION`, `PARISH`, `DEANERY`, `CONTACT PHONE`, `UPI ID`, CTA `Save changes` (only sends changed fields). The UPI ID change flow is specified in F3. Toast `Shop updated`. Server `No fields to update` (400) is shown as `Nothing to save`.

**API.** `GET /shop/shops/mine` · `GET /shop/products/mine` (approved only: a suspended shop skips it) · `DELETE /shop/products/:id` (archive) · `GET /shop/orders/shop` (approved or suspended) · `PUT /shop/shops/mine` (`name, description, parish, deanery, contact_phone, upi_id, current_password, logo, banner`; `logo`/`banner` are data URLs).

**Acceptance.** [ ] Stat tiles equal the lists. [ ] Archived products disappear from the marketplace but stay in this list with the `Archived` chip. [ ] A suspended shop never reaches the Products tab (F2). [ ] Saving without edits does nothing and says so.

## 16 · Shop order `[Mockup 16]` → merged into E5
The mockup's separate seller order screen (customer name, items, TOTAL, method/payment status/UTR, delivery address, sticky action bar with `Accept order` / `Mark as packed` / `Mark as shipped` / `Mark as delivered` / `Reject`, stage line like `New order · accept or reject it`) is **not** a separate screen in the app. Sellers open the same `/orders/:id` as buyers; the seller view of E5 shows the buyer's username and delivery address, the claim (UTR, amount, screenshot) and an action bar rendered from `allowed_actions` (E9, E10). The mockup's stage lines map to E10. Its `ALLOWED` transition table (`placed → accepted/rejected …`) is **not** used (DB-07): fulfilment steps exist only after the payment is `confirmed` (or for COD).

## 17 · Product form `[Mockup 17]`
**Route** `/my-shop/products/new` · `/my-shop/products/:id` · **Role** approved-shop owner · tab bar: hidden; sticky `Save product` rises with the keyboard.

**Layout.** Header back + `New product` / `Edit product`. **Photos** row: mono `PHOTOS · FIRST IS THE COVER` + `{n} / 6`; horizontal tiles 96×96 (radius 14): image with `×` (remove) and `COVER` tag on the first, `Set cover` text button on others (moves it to index 0); dashed `+ Add photo` tile while < 6 (multi-select from gallery, resized ≤ 1600 px / ≤ 1 MB, 5 MB max). Fields:
| Label | Key | Keyboard | Required | Client validation → message |
|---|---|---|---|---|
| `TITLE *` | `title` | sentences | yes | non-empty ≤ 150 → `Give it a title` |
| `DESCRIPTION` | `description` | multiline | no | ≤ 5000 |
| `PRICE (₹) *` | `price` | decimal, placeholder `249` | yes | > 0 → `Price in rupees, e.g. 249` |
| `MRP (₹)` | `compare_at_price` | decimal, placeholder `Optional` | no | if set, must be > price → `Should be higher than the price` (DB-41) |
| `STOCK QUANTITY *` | `stock_quantity` | number | yes | integer ≥ 0 → `How many do you have?` |
| `CATEGORY` | `category_id` | chips (categories) | no | single select |
Switch row: `Active · visible in the marketplace` / `Draft · only you can see it` (maps to `status: active|draft`; the other server statuses `out_of_stock` and `archived` are not toggled here; when editing an `archived` product the row reads `Archived` and the toggle un-archives to `draft`). Edit mode: danger text button `Archive this product` (same dialog as screen 15).

**Money handling.** The form takes rupees; convert to paise for display consistency but **send rupees** (`price`, `compare_at_price` are rupee numbers in the request; responses use `*_paise` ints). Use integer parsing of the typed string (`249`, `249.5` → ₹249.50) — never binary floats when computing paise for previews.

**Save.** Create `POST /shop/products` (201) · edit `PUT /shop/products/:id`. **Always send the full body** (`title, description, price, compare_at_price, stock_quantity, category_id, status, images[]`): the endpoint requires title/price/stock on every update and cannot clear fields (DB-42). `images[]` = existing image URLs (kept as they are; `http…` strings are accepted) followed by new data URLs, in cover-first order. **Known limit:** sending an empty `images` array leaves the stored images unchanged, so removing *all* photos from an existing product is not possible; if the user removes the last photo the form blocks save with `Keep at least one photo` (edit mode only) and a backend ask is logged in doc 12. Toasts `Product added` / `Product updated`, then pop and refresh the list. Server 400 `errors[]` shows as a banner.

**States.** Loading (edit): field skeletons. Error loading: `Couldn't load this product` + retry. 403 `You do not own this product` → pop with toast.

**Acceptance.** [ ] Each error string appears as written. [ ] A product with 6 images can't take a 7th. [ ] An MRP that is not higher than the price is rejected client-side. [ ] Editing keeps the order of existing images and the cover. [ ] Price `249.50` posts `"249.50"` (string built from paise) and renders `₹249.50`.

---

# D. Admin

## 18 · Shop applications `[Mockup 18]`
**Route** `/admin/shops` · **Role** `admin` only (others are redirected to `/account` with a toast) · **Feature** `admin` · tab bar: shown (Account tab selected).

**Layout** (padding `66 0 130`). mono `ADMIN` · Anton 40 `Shop` / `applications` · filter chips with counts: `Pending · n`, `Approved`, `Rejected`, `Suspended`, `All` (default **Pending**; counts from one `GET /shop/admin/shops` fetch, filtered client-side) · rows: mark tile, shop name Archivo 700 14, mono `@{owner_username} · {deanery} · {date}`, trailing status chip (label only). Tap → review sheet.

**Review sheet** (§9.16, 86% height): grabber · header (mark 52, name Anton 24, status chip 26 high) · description · key/value card: `APPLICANT @{owner_username} · {owner_email}`, `PARISH {parish} · {deanery}`, `PHONE {contact_phone}`, `UPI {upi_id or "None (cash on delivery only)"}` · when status is `rejected` or `suspended`: `Reason given: “{rejection_reason}”` · **actions by current status** (primary full-width buttons):
| Status | Actions |
|---|---|
| `pending` | `Approve shop` · `Reject with reason` |
| `approved` | `Suspend shop` |
| `suspended` | `Reinstate shop` |
| `rejected` | `Reconsider and approve` `[Designed here]` (replaces the mockup's *“Rejected applications are closed. The applicant can apply again.”*; the backend lets an admin move a rejected shop to `approved` and refuses a second application from the owner — DB-35) |
`Approve`/`Reinstate`/`Reconsider` → `PUT /shop/admin/shops/:id/review` `{status:"approved"}` directly. `Reject`/`Suspend` switch the sheet to a **reason step**: title `Why is this application rejected?` / `Why is this shop being suspended?`, hint `The owner sees this reason on their shop screen.`, textarea (placeholder `At least 5 characters`), buttons `Back` and danger-filled `Reject application` / `Suspend shop` disabled until the trimmed reason has ≥ 5 characters (server max 500; server message when blank: `Please give a reason when rejecting or suspending a shop`).

**After the call.** Toast `{shop name} · {approved|rejected|suspended}`; suspension adds `· {n} unpaid orders cancelled` from `data.cancelled_unpaid_orders` (buyers' unpaid orders are voided, DB-37). Refetch the list; close the sheet.

**States.** Loading 3 row skeletons · error `Couldn't load applications` + `Tap to retry` · empty `No {filter} applications` (mockup: `{appsEmptyT}`) / `New applications land here for review.`

**API.** `GET /shop/admin/shops[?status=]` → `shops[{…shop columns, owner_username, owner_email}]` · `PUT /shop/admin/shops/:id/review` `{status, rejection_reason}` → `{shop, cancelled_unpaid_orders}`.

**Acceptance.** [ ] A non-admin can never open the route. [ ] Reject/Suspend can't be confirmed with fewer than 5 characters. [ ] Suspending shows the cancelled-orders count. [ ] The pending count matches the Account row hint.

---

# E. Peer-to-peer payment and order lifecycle `[Designed here]`

Everything in this section is **not in the mockup**: it is designed in the same visual language (doc 02) from the backend behaviour documented in `cyd_id_be/docs/PAYMENTS.md` and `services/orderQueries.js`. It needs the owner's visual sign-off.

**How the money moves (read once).** The platform never receives or holds money. The buyer pays the **seller's own UPI ID** from any UPI app, then types the 12-digit **UPI Ref No (UTR)**; the seller checks their bank and confirms; an admin decides only when they disagree. Stock reserved at checkout is the "escrow". Timers (defaults; the server value always wins): **30 min** to pay (+10 min silent grace), **24 h** for the seller to confirm. The full state machine is `06-DOMAIN-RULES.md`.

**Order view data** (`GET /shop/orders/:id` → `data.order`): `id, order_number, checkout_id, shop_id, shop_name, shop_status, customer_username (non-buyers only), status, payment_status, payment_method, subtotal_paise, shipping_paise, total_paise, notes, created_at, pay_by, pay_seconds_left, confirm_by, confirm_seconds_left, confirmed_at, cancelled_at, cancelled_by, cancel_reason, full_name, phone, line1, line2, city, state, pincode, items[{id, product_id, product_title_snapshot, unit_price_paise, quantity, line_total_paise}], claim{utr, amount_paise, claimed_at, updated_at, refund_utr, refunded_at} | null, disputes[{id, origin_payment_status, opened_by_role, reason, description, status, resolution, resolution_note, opened_at, resolved_at, proof_seconds_left}], viewer_role (buyer|seller|admin), allowed_actions[], dispute_reasons[], chat_read_only, payee{upi_id, name, upi_link} | null` (payee only for the buyer while `awaiting_payment` and the shop is approved).

**Order status vs payment status.** `status` ∈ `pending_payment, placed, accepted, packed, shipped, delivered, cancelled, rejected`; `payment_status` ∈ `awaiting_payment, claimed, confirmed, disputed, refund_due, refunded, void, written_off, cod_pending, cod_collected`. A UPI order starts as `pending_payment` + `awaiting_payment` and becomes `placed` when the payment is confirmed. Chips per doc 02 §3.

## E1 · Pay the seller
**Route** `/pay/:orderId` (optional `?from=checkout`) · **Role** buyer · **Feature** `payments` · tab bar: hidden · replaces mockup 08.

**Purpose.** Tell the buyer exactly who to pay, how much, and with what reference; then collect the UTR.

**Layout** (padding `60 24 40`; scrolls; sticky CTA rises with the keyboard).
1. **Top row:** back · order number (mono 11) · `Order {i} of {n}` chip when opened from E2.
2. **Hero:** 64 accent circle with `UPI` (Anton 30, `onAccent`) · amount Anton 44 `₹{total}` · `to {shop_name}` (Archivo 600 14) · **countdown pill** (§9.22) `Pay within {mm:ss}` from `pay_seconds_left`.
3. **Step 1 — Pay the seller** (section label `1 · PAY THE SELLER`):
   - Copy-row `UPI ID` — big variant (Anton 24) = `payee.upi_id`; helper `Copy this and paste it in your UPI app. Check the name shown matches {payee.name}.`
   - Copy-row `AMOUNT` = `₹{total}` · helper `Pay exactly this amount.`
   - Copy-row `PAYMENT NOTE` = `order_number` · helper `Put this in the note so the seller can match your payment.`
   - Primary button **`Open UPI app`** (52) → `url_launcher` with `payee.upi_link` (`upi://pay?pa=…&pn=…&am=…&tn=…&cu=INR`), external application mode. If nothing handles it: toast `No UPI app found. Copy the UPI ID and pay from your UPI app.` UPI apps may refuse links to personal UPI IDs, so **copying the ID is the primary path** (DB-05); the button is secondary in prominence when the OS reports no handler.
   - Text button `Show QR code` expands the QR card (§9.26, data = `payee.upi_link`).
4. **Step 2 — Enter the reference number** (`2 · TELL US YOU PAID`): UTR input (§9.20), label `UPI REF NO (12 DIGITS)`; helper `This is the 12-digit "UPI Ref No" in your payment details, not the Transaction ID.`; optional screenshot tile (dashed 96×96, `Add screenshot (optional)`; helper `Helps the seller if there is any doubt. Crop out anything private.`); sticky CTA `I've paid — submit` (56, disabled until 12 digits).
5. **Reassurance card** (`accSoft`): `You pay the seller directly. CYD never holds your money. Only pay the UPI ID shown here.`

**States** (derived from the order view, not guessed):
| Condition | Rendering |
|---|---|
| `awaiting_payment` and `claim` ∈ actions | the layout above; pill counts down |
| `awaiting_payment`, `pay_seconds_left ≤ 0`, `claim` still ∈ actions (grace) | pill reads `Time's up — submit now if you've paid`; form stays enabled |
| `awaiting_payment`, `claim` ∉ actions, `payee` null (window closed or shop suspended) | replace steps with a banner: window closed → `The payment window has closed. If you already paid, we'll show your options once the order updates.` ; suspended shop → `This shop is suspended and cannot take payments. Do not pay; the order will be cancelled.` Refetch immediately (the server expires the order on read) |
| `claimed` | **Waiting for the seller:** tick tile, Anton 30 `Waiting for the seller`, body `You submitted {UTR 4-4-4}. The seller checks their bank and confirms.`, confirm countdown pill `Seller has {h}h {mm}m to confirm`, buttons `Edit reference` (if `edit_claim`), `Chat with seller`, `View order`, `Go to my orders`. When `not_confirmed` ∈ `dispute_reasons`: banner `The seller hasn't confirmed in time.` + button `Report to admin` (E6 sheet preselected) |
| `confirmed` (or status ≥ placed) | `Payment confirmed ✓` · `The seller will now prepare your order.` · `View order` |
| `disputed` | `In dispute` · `An admin is reviewing this order. You can add evidence and chat with the seller.` · `View order` |
| `void` + `cancelled` | `This order was cancelled.` · `Nothing was charged.` · if `paid_after_cancel` ∈ reasons: card `Already paid?` + `Report it` (E6) |
| COD order opened here | redirect to `/orders/:id` |

**Edit reference** (only while `claimed`, before the seller acts): bottom sheet with the UTR input → `PATCH /shop/orders/:id/payment-claim` `{utr}` → toast `UPI reference updated`. Server `The UTR can only be changed before the seller responds` (409) → refetch.

**Submit.** `POST /shop/orders/:id/payment-claim` `{utr, screenshot?}` (`screenshot` = data URL; stored privately). Success → server message toast `Payment submitted. The seller will confirm once it shows in their bank.` and the screen moves to *Waiting*. Errors (verbatim): `{label} must be the 12-digit UPI reference number (UPI Ref No), not the transaction ID` (400, shown under the field), `This UTR has already been used for another order` (409), `The payment window has closed. If you already paid, open a "paid after cancel" dispute with your UTR.` (409), `This shop is suspended and cannot take payments…`, `This order is not waiting for payment` (409 → refetch).

**Polling.** `GET /shop/orders/:id` every 15 s while `awaiting_payment` or `claimed` and the screen is visible; refetch when a countdown reaches 0 and when the app returns from the UPI app (lifecycle `resumed`). Stop on any other state.

**Accessibility.** The UPI ID row is announced as `UPI ID {value}, double-tap to copy`. The countdown has `liveRegion` off (announce only at 5 min and 1 min).

**Acceptance.** [ ] Copy rows put the exact string on the clipboard and toast `{label} copied`. [ ] The UPI link opens a UPI app with amount and note prefilled on a device that has one. [ ] Submit is impossible with ≠ 12 digits; spaces and hyphens are tolerated. [ ] A reused UTR shows the 409 text. [ ] The buyer sees no payment form for COD orders or when `payee` is null. [ ] Leaving and returning never loses the entered UTR (kept in memory per order id while the app lives).

## E2 · Pay your orders (multi-shop)
**Route** `/pay-checkout/:checkoutId` · **Role** buyer · tab bar: hidden · replaces the mockup's "pays one after another" behaviour (DB-26).

**Layout.** Back · Anton 26 `Pay your orders` · info card `You placed {n} orders. Each shop is paid separately, so pay each one before its timer runs out.` · summary line `Still to pay ₹{sum of awaiting totals}` (omitted at 0) · one card per order (§9.7, gap 12): row 1 shop name Archivo 700 15 + order chip; row 2 order number mono + total; row 3 state-specific:
| Order state | Row 3 / action |
|---|---|
| UPI `awaiting_payment` | countdown pill + primary `Pay now` (46) → `/pay/:orderId?from=checkout` |
| UPI `claimed` | `Waiting for the seller ✓` (muted) + `View` |
| UPI `confirmed` | `Payment confirmed ✓` + `View` |
| COD `cod_pending` | chip `Cash on delivery` + text `Pay the seller when it arrives` + `View` |
| `void`/`cancelled` | `Expired — nothing was charged` |
Footer: `Go to my orders` (outline). Returning from E1 refetches. When nothing is `awaiting_payment` any more, show a success header `All paid ✓` and the `Go to my orders` button becomes primary.

**API.** `GET /shop/checkouts/:id` → `checkout{id, created_at, orders[{id, order_number, shop_id, shop_name, status, payment_status, payment_method, total_paise, pay_by, confirm_by, pay_seconds_left}]}` (404 `Checkout not found` for other users' ids). Poll every 15 s while any order is `awaiting_payment`.

**Acceptance.** [ ] Each order is paid on its own screen and the list reflects it on return. [ ] An order that expires while the list is open flips to `Expired` without a manual refresh.

## E3 · Order placed
**Route** `/order-placed/:checkoutId` · **Role** buyer · tab bar: hidden · replaces mockup 09 (used for **all-COD** checkouts; UPI checkouts go to E1/E2, but the row variants are specified so the screen is also correct if opened for a mixed checkout, e.g. from a notification later).

**Layout** (padding `90 22 40`, centred): 104 accent circle with `✓` (Anton) · Anton 42 `Order placed!` / `{n} orders placed!` · body `Each shop has been told. You pay the seller in cash when your order arrives.` (COD) · list of order cards: order number (mono), shop, method line, total, `→` → `/orders/:id`. Method line: COD = `Cash on delivery`; UPI awaiting = `UPI · pay the seller now` with a `Pay` button (DB-12) → `/pay/:orderId`; UPI claimed = `UPI · waiting for the seller`. Buttons: `View my orders` (primary → `/orders`) and `Continue shopping` (outline → `/shop`). Back button leaves to `/shop` (never back into checkout).

**API.** `GET /shop/checkouts/:id`.

**Acceptance.** [ ] A one-order COD checkout shows the singular title. [ ] Hardware back never returns to a checkout that has been placed.

## E4 · Orders list with needs-action
**Route** `/orders` (tab 4) · **Role** any signed-in user (buyer orders; a seller's shop orders live in My shop) · **Feature** `orders` · tab bar: shown · extends mockup 10.

**Layout** (padding `66 0 130`): Anton 40 `My orders` · filter chips with counts (§9.6): `All` · **`Needs action`** `[Designed here]` · `Awaiting payment` · `Placed` · `Accepted` · `Packed` · `Shipped` · `Delivered` · `Cancelled` · `Rejected` (filters by `status`; `Needs action` = `needs_action` true, i.e. unpaid UPI orders with time left) · order cards (§9.7): row 1 `{order_number} · {date}` + order chip (+ second payment chip when `claimed`/`refund_due`/`disputed`, doc 02 §3.2); row 2 overlapping thumbs (up to 3, category tint or `images`), `{shop_name}`, `{n} item(s)`, total; **needs-action footer** for awaiting UPI orders: countdown pill + `Pay now →` (tap goes to E1, rest of the card to E5).

**States.** Loading 3 skeletons · error `Couldn't load your orders` + `Tap to retry` · empty `No orders yet` / `No {filter} orders yet` + `Browse the marketplace` → `/shop`.

**Behaviour.** Refresh on focus and pull-to-refresh; poll the action count every 60 s (§ global rules) and refresh the list when it changes. Counts on chips are computed client-side from the (≤ 200) loaded orders.

**API.** `GET /shop/orders` → `orders[{id, order_number, checkout_id, shop_id, shop_name, status, payment_status, payment_method, total_paise, created_at, updated_at, pay_by, confirm_by, pay_seconds_left, needs_action, items[]}]` (buyer role; the server caps at 200) · `GET /shop/orders/action-count` → `{buyer, seller, admin_disputes, total}`.

**Tab badge.** The **Shop** tab badge (doc 02 §9.19) shows `action-count.total` (unpaid orders to pay + seller orders needing the shop's response + open disputes for admins). The Orders screen itself shows the per-order detail.

**Acceptance.** [ ] An unpaid order shows a live countdown and `Pay now`. [ ] Filter counts match the visible lists. [ ] The badge clears after the last unpaid order is paid or expires.

## E5 · Role-aware order detail (banners and actions)
**Route** `/orders/:id` · **Role** buyer, seller of the order's shop, or admin (admins are only linked here from the dispute queue) · **Feature** `orders` · tab bar: hidden · replaces mockups 11 and 16 · one screen, content by `viewer_role`.

**Layout** (padding `60 20 40`, sticky action bar at the bottom; content padding-bottom ≈ 170 when the bar is present).
1. **Header:** back · order number (mono) · order chip + payment chip side by side (doc 02 §3.2, both on this screen).
2. **Title block:** buyer sees shop name (Anton 34) and `Ordered {date}`; seller/admin see `@{customer_username}` (Anton 34) and the date.
3. **State banner** (table below).
4. **Timeline** (§9.23) for flowing orders: `Pay` (only while `pending_payment`) → `Placed` → `Accepted` → `Packed` → `Shipped` → `Delivered`. Hidden for cancelled/rejected/written-off (ended card instead).
5. **Items card:** rows `{product_title_snapshot}`, `₹{unit} × {qty}`, line total; footer rows `Subtotal`, `Shipping` (only if > 0), `TOTAL` (Anton 22).
6. **Payment & delivery card** (§9.30): `Method` (`UPI` / `Cash on delivery`) · `Payment` (payment chip text) · when `claim`: `UTR {4-4-4}` (mono, copy icon), `Claimed {time}`, and for refunds `Refund UTR {…}`, `Refunded {time}` · `Deliver to` `{full_name} · {phone}` / `{line1}, {line2}, {city}, {state} {pincode}` (seller and buyer see it; admin sees it in a dispute).
7. **Dispute card(s)** when `disputes[]` is non-empty: for each, `{reason label}` (§G2), `Opened by {buyer|seller} · {time}`, description, status `Open` / `Resolved: {resolution label} — {resolution_note}`; for an open seller-reported `not_received` show `Waiting for the buyer's proof — {proof_seconds_left} left` countdown.
8. **Evidence** section (E8) and **Chat** section (E7 preview with `Open chat`).
9. **Footer links:** buyer `Visit {shop_name}` → storefront (hidden if `shop_status ≠ approved`).
10. **Action bar:** buttons rendered from `allowed_actions` (mapping below).

**Rendering rule.** Never branch on `status`/`payment_status` to decide which *button* appears. Use them only to choose banner copy and chips. Unknown action tokens are ignored (forward compatibility).

**Action token → button.**
| Token | Who | Button (label) | Opens |
|---|---|---|---|
| `claim` | buyer | `Pay now` (primary) | E1 |
| `edit_claim` | buyer | `Edit reference` | E1 sheet |
| `cancel` | buyer | `Cancel order` (outline danger) | E6 cancel dialog |
| `dispute` | buyer, seller | `Report a problem` (outline) | E6 dispute sheet with `dispute_reasons` |
| `confirm` | seller | `Confirm payment received` (primary 56) | E9 |
| `reject` | seller | `Reject order` (outline danger) | E9 |
| `advance:accepted` / `advance:packed` / `advance:shipped` / `advance:delivered` | seller | `Accept order` / `Mark as packed` / `Mark as shipped` / `Mark as delivered` (primary 56) | E10 |
| `refund` | seller | `Record refund` (primary) | E9 |
| `resolve` | admin | `Resolve dispute` (primary) | F5 |
| `chat` | all | `Chat` (icon button in the Chat section) | E7 |
| `upload_evidence` | buyer, seller | `Add evidence` tile in the Evidence section | E8 |
At most one primary button per bar; extra actions sit beside it (outline, 120 wide for `Reject order`, as in the mockup).

**State banners.** Titles Archivo 700 14 / Anton for ended cards; bodies Archivo 400 12/1.5.
| Viewer | `payment_status` · `status` | Banner (kind) | Title / body |
|---|---|---|---|
| buyer | `awaiting_payment` | info + countdown | `Payment not confirmed yet` / `Pay the seller and enter your UPI reference number to place this order.` + `Pay now` |
| buyer | `claimed` | info + confirm countdown | `Waiting for the seller` / `You submitted UTR {utr}. The seller confirms once the money shows in their bank.` |
| buyer | `claimed`, `not_confirmed` ∈ reasons | warning | `The seller hasn't confirmed in time` / `You can ask in the chat or report it to an admin.` |
| buyer | `confirmed` | success (small) | `Payment confirmed` / `The seller is preparing your order.` |
| buyer | `cod_pending` | neutral | `Cash on delivery` / `Pay ₹{total} in cash to the seller when your order arrives.` |
| buyer | `cod_collected` | success | `Cash collected` / `Thanks! This order is complete.` |
| buyer | `disputed` | danger-tint | `In dispute` / `An admin is reviewing this. Add evidence or message the seller below.` |
| buyer | `refund_due` | warning | `Refund due` / `The seller must send ₹{total} back to your UPI account. Share your UPI ID in the chat.` + `Refund not received` if offered |
| buyer | `refunded` | neutral | `Refunded` / `Refund UTR {refund_utr}.` + `I didn't get it` while offered |
| buyer | `void` + `cancelled` | ended | `You cancelled this order` (`cancelled_by = buyer`) / `Payment window expired` (`system`) / `Cancelled by the shop` (`seller`) — body `Nothing was charged. Reserved stock went back on sale.`; if `paid_after_cancel` ∈ reasons add card `Already paid?` + `Report it` |
| buyer/seller | `status = rejected` | ended | `Rejected by the shop` / `“{cancel_reason}”` or `The shop could not fulfil this order.` (refund banner takes over when `refund_due`) |
| any | `written_off` | ended | `Closed by admin` / the resolution note |
| seller | `awaiting_payment` | info + countdown | `Waiting for the buyer to pay` / `The order is reserved for {mm:ss}. It cancels itself if no payment reference arrives.` |
| seller | `claimed` | action (accent-soft) | `Check your bank app` / `@{buyer} says they paid ₹{amount} by UPI, reference {utr}, at {claimed time}. Confirm only if you see exactly this amount and reference.` + confirm countdown `Confirm within` |
| seller | `confirmed` / `cod_pending` + `placed…shipped` | stage | stage line per E10 |
| seller | `refund_due` | warning | `Refund the buyer` / `Send ₹{total} back by UPI (ask for their UPI ID in the chat), then record the refund's reference number.` |
| seller | `disputed` | danger-tint | `In dispute` / `An admin is deciding. You can add evidence and chat.` |
| admin | any with an open dispute | danger-tint | `Dispute: {reason label}` / `Opened by {role} from "{origin_payment_status}". Read the chat and evidence, then resolve.` |

**Polling.** Poll `GET /shop/orders/:id` every 15 s while visible and `awaiting_payment`/`claimed`, otherwise only on pull-to-refresh, on resume and after any mutation (always replace the whole order from the mutation's response: every mutation returns the fresh order view).

**API.** `GET /shop/orders/:id` (404 `Order not found` if the viewer is not a party) + the mutation endpoints in E1, E6, E9, E10.

**Acceptance.** [ ] For every `(viewer_role, payment_status, status)` in the fixtures of doc 10 the banner and the exact set of buttons match this section. [ ] A button never appears that `allowed_actions` does not list. [ ] A seller never sees a payment form; a buyer never sees seller buttons. [ ] The admin sees chat and evidence only when `disputes[]` is non-empty (server-enforced; the UI does not link elsewhere).

## E6 · Cancel, dispute and refund sheets (buyer)
**Cancel order** (`cancel` ∈ actions). Dialog (§9.17): title `Cancel this order?`; body UPI: `The shop will be told straight away. Reserved stock goes back on sale. Already paid? Don't cancel — submit your reference number instead.` / COD: `The shop will be told straight away. Reserved stock goes back on sale.` (DB-10); buttons `Keep order` / `Cancel order` (danger). `PUT /shop/orders/:id/cancel` (optional `{reason}`); toast `Order cancelled`. Server 409 after a claim: `You already submitted a payment for this order. Ask the seller in the chat, or open a dispute after the confirmation window.` — shown verbatim.

**Report a problem sheet** (`dispute` ∈ actions; §9.16, title Anton 26 `Report a problem`). Radio rows are exactly the `dispute_reasons` the server returned, in this order, with labels (§G2):
| `reason` | Buyer label | Needs |
|---|---|---|
| `not_confirmed` | `The seller hasn't confirmed my payment` | **screenshot required** |
| `paid_after_cancel` | `I paid, but the order was cancelled` | **UTR + screenshot required** |
| `refund_not_received` | `I haven't received my refund` | description recommended |
| `not_delivered` | `I paid but my order hasn't arrived` | description recommended |
| `other` | `Something else` | description required (≥ 10 characters, client rule) |
Fields: description (textarea ≤ 1000), UTR input (only for `paid_after_cancel`), screenshot tile (required where shown above). Honest note card: `CYD can't move money between you and the seller. An admin can ask the seller to refund, suspend the shop and follow up through the parish.` CTA `Send to admin` → `POST /shop/orders/:id/dispute` `{reason, description, utr, screenshot}`; toast `Dispute opened. An admin will review it.`; the order flips to `disputed`. Server messages shown verbatim (e.g. `The seller still has time to confirm. You can open a dispute after the confirmation deadline.`, `Attach a screenshot of your UPI payment to open this dispute`, `This order already has an open dispute`, `Refunds can be disputed within 7 days`).

**Acceptance.** [ ] Only server-offered reasons appear. [ ] Screenshot/UTR requirements block submit client-side with the same wording as the server. [ ] After sending, the sheet closes and the dispute card appears.

## E7 · Order chat
**Route** `/orders/:id/chat` (child of the order route; **new route** to already in doc 01 §6) · **Role** buyer, seller, admin (only when a dispute exists) · tab bar: hidden · chat bubbles per doc 02 §9.24.

**Layout.** Header: back · `Chat` · order number · counter-party label (`Seller · {shop}` / `Buyer · @{username}` / for admin `Buyer and seller`). Message list (oldest at top, auto-scroll to the bottom on open and on new messages when already near the bottom, otherwise show a `New messages ↓` pill). Own = right, accent; counter-party = left, card; admin = left, accent-soft with `CYD ADMIN` tag; `system` messages centred mono (e.g. `Payment confirmed`, `Dispute resolved by an admin: …`). Composer: multiline field (max 1000, counter `{n}/1000` after 900) + send button. Placeholder: `Message the seller` / `Message the buyer`; buyer with `refund_due`: `Share your UPI ID for the refund`. Read-only (`read_only`/`chat_read_only`): composer replaced by `This chat is read-only. It closed 14 days after the order ended.`

**Behaviour.** Initial `GET /shop/orders/:id/messages` → `{messages[{id, sender_role, sender_user_id, sender_username, body, created_at}], read_only}` (max 200). Poll `?after={lastId}` every 5 s while the screen is visible (stop in background). Send `POST /shop/orders/:id/messages` `{body}` → 201 `message`; append immediately with a pending state; HTML tags are stripped by the server, so strip them client-side too and trim; empty is blocked. Errors: 429 `You are sending messages too quickly. Please wait a minute.` (keep the text in the field), 409 `This conversation is closed` (switch to read-only), 400 `Message is too long (max 1000 characters)`. The seller's phone number is never shown to the buyer (and is not in this payload).

**States.** Loading: 5 alternating bubble skeletons · error: `Couldn't load the chat` + `Tap to retry` · empty: centred mono `No messages yet. Say hello.`

**Acceptance.** [ ] Two devices (buyer and seller) see each other's messages within ~5 s. [ ] Sending 21 messages in a minute shows the 429 text and keeps the draft. [ ] The admin can open the chat only for an order with a dispute. [ ] System messages are not editable and carry no sender label.

## E8 · Evidence (payment and refund proof)
**Where.** A section inside E5 (`EVIDENCE` section label, thumbnails §9.25 in a horizontal strip) plus a full-screen viewer; no route.

**Data.** `GET /shop/orders/:id/evidence` → `evidence[{id, kind, created_at, uploader_user_id, uploader_username, url}]` (`url` is a **signed, private** image link valid ~10 minutes; never cache it to disk; on a 401/403/expired image refetch the list once). `kind` ∈ `payment_proof`, `refund_proof`, `other`. Screenshots uploaded while claiming a payment or opening a dispute appear here too.

**Add evidence** (`upload_evidence` ∈ actions): `+` tile → source sheet (`Take photo`, `Choose from gallery`) → kind chips (buyer: `Payment screenshot` / `Other`; seller: `Refund screenshot` / `Other`; the server coerces any other kind to `other`) → `POST /shop/orders/:id/evidence` `{image, kind}` (data URL ≤ 5 MB after resize) → 201; toast `Uploaded`; list refreshes and a system chat line is added by the server. 409 `This order is closed` hides the add tile. Admin and closed orders: view only.

**States.** Empty: dashed tile text `No evidence yet` (buyer/seller see the add tile). Error: `Couldn't load evidence` + retry. Image decode failure: placeholder with `Tap to reload`.

**Acceptance.** [ ] An image URL older than 10 minutes recovers via refetch, without leaving the screen. [ ] Only the roles listed can upload; admin sees the strip read-only. [ ] Payment screenshots are not shown in any list view or notification preview.

## E9 · Seller: confirm, not received, reject, refund
All four open from the E5 action bar (seller view), as sheets/dialogs, and end by replacing the order with the server's response.

**Confirm payment received** (`confirm`). Sheet title Anton 26 `Confirm payment`; body `Open your bank or UPI app and check that ₹{amount} arrived with this reference number.` · key/value: `AMOUNT ₹{amount_paise}` · `BUYER'S REFERENCE {utr 4-4-4}` (copy icon) · evidence thumbnails if the buyer attached a screenshot · **UTR input** labelled `TYPE THE REFERENCE FROM YOUR BANK APP` (empty; deliberate re-entry so the seller actually looks) · helper `Both numbers must match exactly.` · live check: when the typed digits ≠ `claim.utr` show `This doesn't match the buyer's reference. Check your bank app again, or report it as not received.` and keep the button disabled · CTA `Confirm payment received` (enabled only on a match) · secondary text button `I can't see this payment` → *Not received*. `POST /shop/orders/:id/payment-confirm` `{utr}`; toast `Payment confirmed`. Server 409 `The buyer has changed the UPI Ref No since you looked. Please check the new one in your bank app.` → refetch; the sheet shows the new reference highlighted and clears the input.

**Payment not received** (`dispute_reasons` contains `not_received` / `wrong_amount`). Sheet `Report a problem with this payment`: radio `I can't see this payment in my bank` (`not_received`) / `The amount is different` (`wrong_amount`, shown only if offered); optional description (≤ 1000); warning `An admin will review this. The buyer gets 24 hours to upload proof, otherwise the claim is rejected.` (value from `DISPUTE_PROOF_HOURS`; default 24). `not_received` → `POST /shop/orders/:id/payment-not-received` `{description}` (toast: server text `Reported to an admin. The buyer has been asked for proof.`); `wrong_amount` → `POST /shop/orders/:id/dispute` `{reason:"wrong_amount", description}` (toast `Dispute opened. An admin will review it.`).

**Reject order** (`reject`: allowed while awaiting payment, or confirmed/COD in `placed`/`accepted`). Dialog/sheet `Reject this order?` body `The buyer is notified and the reserved stock goes back into your catalogue.` + when payment is `confirmed`: ` The buyer has already paid, so you'll have to refund them.`; optional reason textarea (≤ 500; shown to the buyer); buttons `Back` / `Reject order` (danger). `PUT /shop/orders/:id/status` `{status:"rejected", reason}`; toast `Order rejected · stock restored`. A paid order moves to `refund_due`.

**Record refund** (`refund`). Sheet title `Record refund`; body `Send ₹{total} back to the buyer by UPI. Ask them for their UPI ID in the chat. Then enter the 12-digit reference number of **your refund** transaction.`; UTR input labelled `REFUND UPI REF NO`; optional `Add refund screenshot` (uploaded as `refund_proof` evidence after the refund is recorded); CTA `Record refund`. `POST /shop/orders/:id/refund` `{refund_utr}`; toast `Refund recorded`. Errors verbatim: `The refund UPI Ref No must be the refund transaction, not a payment` (400), `This refund UTR was already used` (409), `This order has no refund due` (409).

**Acceptance.** [ ] The seller cannot confirm with a mismatching re-typed UTR. [ ] A buyer edit during the seller's sheet is detected (409) and handled. [ ] The refund UTR equal to the payment UTR is refused with the server text. [ ] After a paid-order rejection the banner switches to *Refund the buyer*.

## E10 · Seller fulfilment
**Where.** The E5 action bar (seller view). Available only when the payment is `confirmed`, or for COD (`cod_pending`): the server offers `advance:*` tokens only then (DB-07).

| Order `status` | Stage line (above the bar) | Primary button (from token) | Secondary |
|---|---|---|---|
| `placed` | `New order · accept it to start` | `Accept order` (`advance:accepted`) | `Reject order` (120 wide) |
| `accepted` | `Accepted · pack it next` | `Mark as packed` | `Reject order` (text, only if offered) |
| `packed` | `Packed · hand it over for delivery` | `Mark as shipped` | — |
| `shipped` | `On its way · mark delivered when it arrives` | `Mark as delivered` | — |
| `delivered` | `Delivered · this order is complete` (+ for COD `Cash collected`) | — | — |
| `cancelled` | `The customer cancelled this order.` | — | — |
| `rejected` | `You rejected this order. Stock was restored.` | — | — |
Button heights 56 (primary) / 50 (secondary), as in the mockup. `PUT /shop/orders/:id/status` `{status}`; toast = server text (`Order marked as accepted` …). COD `delivered` also moves the payment to `cod_collected`. Server 409 `Confirm the payment before processing this order` and 400 `Cannot move order from "{from}" to "{to}"` are shown verbatim (and trigger a refetch).

**Acceptance.** [ ] A UPI order cannot be accepted before the seller confirmed payment (no button). [ ] A COD order can be accepted immediately. [ ] Buttons update from the response without a second fetch.

---

# F. Seller and admin extensions `[Designed here]`

## F1 · Seller application states
Fully specified in **screen 13** (§13.1–13.5): `none` (apply form), `pending`, `rejected`, `suspended`, `approved`, all derived from `GET /shop/shops/mine` → `data.shop` (`null` = none; DB-36). Fixtures for tests: one shop object per status with `rejection_reason` present for `rejected` and `suspended`. The seller row in Account (screen 14) and the redirect from `/account/sell` to `/my-shop` for `approved`/`suspended` both read the same provider.

## F2 · My shop — suspended (orders-only) mode
**Route** `/my-shop` when `shop.status == suspended` · **Role** owner.

**Why.** An admin suspends a shop to stop new sales, but orders already paid must still be shipped or refunded (DB-37, PAYMENTS.md "Suspended shops"). The server cancelled the shop's unpaid orders at suspension time and blocks new payment claims.

**Layout.** Same header as screen 15 with `‖ SUSPENDED SHOP`; a warning card at the top: title `Your shop is suspended`, body `Your products are hidden from the marketplace. You can still ship, refund and answer on orders you already have. {reason}` where `{reason}` is the admin's `rejection_reason` (the suspension reason), and `Contact the CYD office to reinstate the shop.` Stat tiles: `To confirm`, `To ship`, `Refunds due` (no `Products`). Tabs: **`Orders`** only, plus a read-only `Shop profile` summary. **No** `Products` tab and **no** `Add product` (the product endpoints answer 403 `Your shop is suspended. Only approved shops can manage products and orders.`; do not call them). Profile fields are read-only with helper `Editing is paused while the shop is suspended.`

**Orders.** `GET /shop/orders/shop` (allowed for `approved` and `suspended`). Order detail (E5) works unchanged: whatever `allowed_actions` the server returns is what the seller gets (confirm/ship/refund/chat/evidence/dispute); `claim` is never offered to buyers.

**Reinstatement.** On reinstatement the next `GET /shop/shops/mine` returns `approved`; the screen switches to the full layout without navigation. Pull-to-refresh rechecks.

**Acceptance.** [ ] A suspended seller can ship an already-paid order and record a refund. [ ] No call to `/shop/products/mine` is made while suspended. [ ] The reason text is shown exactly as the admin entered it.

## F3 · Shop profile tab — password-gated UPI change
**Where.** Screen 15, **Shop profile** tab. The UPI ID field shows the current ID and a lock hint `Changing this needs your password`.

**Flow.** When `Save changes` is pressed and the (trimmed) UPI value differs from the saved one — including clearing it — open a bottom sheet:
- Title `Confirm your password`.
- Body `Buyers send money straight to this UPI ID, so we need your password to change it. Orders already placed keep the UPI ID the buyer was told to pay.` When the field is being cleared add: `Clearing it makes your shop cash-on-delivery only.`
- Password field (obscured, show/hide), buttons `Back` / `Change UPI ID`.
- `PUT /shop/shops/mine` with the changed fields and `current_password`. Success toast `Shop updated`; the change is recorded server-side in the audit log (no UI).
- Failure `403 Enter your current password to change the UPI ID` → show under the password field (the server uses this text both for missing and wrong passwords); keep the sheet open.
- Client format check first (`^[\w.+-]{2,256}@[a-zA-Z]{2,64}$` → `Looks like name@bank`).
Other profile edits that don't touch the UPI ID save without a password prompt.

**Acceptance.** [ ] No request is sent for a UPI change without a password. [ ] A wrong password keeps the form values. [ ] After clearing the ID, new buyers see the shop as COD-only (verify with the seed accounts).

## F4 · Admin — payment disputes queue
**Route** `/admin/disputes` · **Role** `admin` only · **Feature** `admin` · tab bar: hidden.

**Layout** (padding `66 0 130`): mono `ADMIN` · Anton 40 `Payment` / `disputes` · filter chips `Open · n` (default) · `Resolved` · `All` (server filter `?status=open|resolved`; `All` = no param) · rows (card, padding 14): row 1 reason label (§G2, Archivo 700 14) + `Open`/`Resolved` chip · row 2 `{order_number}` mono + total · row 3 `{shop_name} · @{buyer_username} → @{seller_username}` (mono 10 `faint`) · row 4 `Opened by {buyer|seller} · {relative time}`; resolved rows show the resolution label. Tap → `/orders/:orderId` (admin view, F5). Sort as returned (open first, newest first).

**States.** Loading 3 skeletons · error `Couldn't load disputes` + `Tap to retry` · empty `No open disputes` / `Everything is resolved.` (`No disputes yet` for `All`).

**API.** `GET /shop/admin/disputes[?status=]` → `disputes[{id, order_id, reason, status, origin_payment_status, opened_by_role, description, resolution, resolution_note, opened_at, resolved_at, order_number, total_paise, payment_status, order_status, shop_name, buyer_username, seller_username}]` (max 500). The Account row hint `{n} open` and the Shop-tab badge use `action-count.admin_disputes`.

**Acceptance.** [ ] Non-admins are redirected. [ ] Resolving a dispute (F5) removes it from `Open` and decrements the badge on return.

## F5 · Admin — dispute detail and resolution
**Route** `/orders/:id` (admin variant of E5) · reached only from F4.

**Layout.** E5 with the admin banner (`Dispute: {reason label}` / `Opened by {role} from "{origin}".`), the claim and both parties' evidence and the chat (`Chat` shows the thread; the admin may also post, shown with the `CYD ADMIN` tag) — **only exists because a dispute exists**: the server refuses chat and evidence to an admin otherwise. Sticky bar: `Resolve dispute` (primary).

**Resolve sheet** (§9.16 86%, title `Resolve dispute`). Radio rows are chosen by the open dispute's **`origin_payment_status`** (from the dispute record), each with a consequence line:
| Opened from | Resolution (`resolution`) | Row label / consequence |
|---|---|---|
| `claimed` | `payment_confirmed` | `Payment confirmed` — the seller must fulfil the order |
| `claimed` | `claim_rejected` | `Claim rejected` — order cancelled, stock returned, no payment recognised |
| `claimed` | `refund_required` | `Refund required` — order cancelled, stock returned, the seller must refund the buyer |
| `void` (paid after cancel) | `refund_required` | `Refund required` — the seller must refund the buyer |
| `void` | `claim_rejected` | `Claim rejected` — no payment found |
| `confirmed` (not delivered) | `refund_required` | `Refund required` — order cancelled (stock returned if it was not shipped) |
| `confirmed` | `fulfilment_ordered` | `Seller must fulfil` — the order stays open |
| `refund_due` / `refunded` | `refund_confirmed` | `Refund confirmed` — case closed |
| `refund_due` / `refunded` | `refund_required` | `Refund still required` — the seller must refund again |
| `refund_due` / `refunded` | `closed_unrecoverable` | `Close as unrecoverable` — written off (use when the seller is unreachable) |
Required **note** (textarea, label `NOTE EXPLAINING THE DECISION · both sides see it`, ≥ 5 characters client-side, server: non-empty, ≤ 1000). Honest-limit card on refund outcomes: `The platform can't move money. If the seller won't refund, suspend the shop and follow up through the parish.` CTA `Resolve dispute` (danger-filled only for `closed_unrecoverable`; accent otherwise), disabled until a resolution and note exist.

`POST /shop/admin/disputes/:id/resolve` `{resolution, note}` → toast `Dispute resolved`; pop back to the queue and refetch. Server errors verbatim: `For this dispute, choose one of: …` (400; should not happen, but refetch the order if it does), `This dispute is already resolved` (409), `A note explaining the decision is required`.

**Automatic outcome (info only).** If a seller reports `not_received` and the buyer uploads no proof within the proof window, the server resolves it itself as `claim_rejected` with the note `The buyer did not upload payment proof in time.` — the dispute card shows `Resolved automatically`.

**Acceptance.** [ ] Only the resolutions in the matrix are offered for each origin. [ ] An admin cannot resolve without a note. [ ] After resolution the order view shows the new `payment_status` and the dispute as resolved with the note. [ ] The admin sees no chat/evidence for an order without a dispute.

---

# G. Cross-screen reference

## G1 · Seeded category → short name and hue (DB-38)
| Slug (`GET /shop/categories`) | Name | Short | Mark | Hue |
|---|---|---|---|---|
| `devotional-items` | Devotional Items | Devotional | D | 28 |
| `books-booklets` | Books & Booklets | Books | B | 205 |
| `apparel-merchandise` | Apparel & Merchandise | Apparel | A | 345 |
| `event-tickets` | Event Tickets | Tickets | T | 265 |
| `handmade-crafts` | Handmade & Crafts | Handmade | H | 150 |
| `food-snacks` | Food & Snacks | Food | F | 12 |
| `other` | Other | Other | O | 45 |
Any other category (an admin can add more): short = first word of the name, mark = its first letter, hue = `(id × 47) mod 360`. Tint fills and `markFg` come from doc 02 §2.5.

## G2 · Labels used by the order screens
**Dispute reasons** (`reason` → label): `not_received` → `Payment not received` · `wrong_amount` → `Wrong amount` · `not_confirmed` → `Seller hasn't confirmed` · `paid_after_cancel` → `Paid after the order was cancelled` · `refund_not_received` → `Refund not received` · `not_delivered` → `Paid order not delivered` · `other` → `Other problem`.
**Resolutions** (`resolution` → label): `payment_confirmed` → `Payment confirmed` · `claim_rejected` → `Claim rejected` · `refund_required` → `Refund required` · `fulfilment_ordered` → `Seller must fulfil` · `refund_confirmed` → `Refund confirmed` · `closed_unrecoverable` → `Closed as unrecoverable`.
**Cancelled-by** (`cancelled_by`): `buyer` → `You cancelled this order` · `system` → `Payment window expired` · `seller`/`admin` → `Cancelled by the shop` / `Cancelled by CYD`.
**Money:** always `formatPaise`; the amount in the UPI link is the integer rupees and two-digit paise built from `total_paise` (no floats).
**UTR display:** digits grouped `4-4-4` with spaces; copy puts the unspaced digits on the clipboard.

## G3 · Strings that are placeholders for the owner
Replace before launch (they are static app content, not API data): the Home promo cards (`5 parish shops just joined`, `From Amritsar to Kapurthala.`, `The Advent collection is here`, `Candles, wreaths and calendars →`), the support/contact line `Contact the Youth Directorate office at the Bishop's House.`, the seller-onboarding blurb `usually within a few days`, and the featured-shops heading. Keep them in one constants file so the owner can edit them without touching screens.
