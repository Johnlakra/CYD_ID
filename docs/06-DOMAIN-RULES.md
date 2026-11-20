# 06 · Domain rules

Business rules the app must respect. **The backend is the source of truth**; this file records what the code does
(verified against `cyd_id_be` and the web app `cyd_id` unless marked *unverified*). When code and this file disagree, fix this file
and log the difference in `11-DESIGN-VS-BACKEND.md`.

## Contents
1. Order and payment state machine
2. Timers and the sweep
3. Disputes and refunds
4. Cash on delivery
5. Cart and checkout rules
6. Validation rules (verbatim messages)
7. Formats  *(referenced as "doc 06 §Formats")*
8. ID-card validity rule
9. Worked example  *(referenced as "doc 06 §Worked example")*

---

## 1. Order and payment state machine

Verified against `cyd_id_be/services/orderLifecycle.js` (the only code that changes state), `services/orderQueries.js`
(`allowedActions`) and `cyd_id_be/docs/PAYMENTS.md` (backend repo).

**The app never re-derives these rules.** `GET /shop/orders/:id` returns `allowed_actions`, `dispute_reasons`, `chat_read_only`,
`viewer_role`, `pay_seconds_left`, `confirm_seconds_left` and (for the buyer while unpaid) `payee`. Render buttons from those only.
This section exists so you can build correct labels, banners, chips and tests.

### 1.1 Two status fields

`shop_orders.status` (fulfilment): `pending_payment` · `placed` · `accepted` · `packed` · `shipped` · `delivered` · `cancelled` · `rejected`

`shop_orders.payment_status`: `awaiting_payment` · `claimed` · `confirmed` · `disputed` · `refund_due` · `refunded` · `void` · `written_off` · `cod_pending` · `cod_collected`

`payment_method`: `upi` | `cod`. `cancelled_by`: `buyer` | `seller` | `system` | `admin` (null when not cancelled).

| `payment_status` | Meaning | Terminal? |
|---|---|---|
| `awaiting_payment` | UPI order placed, no UTR yet | no |
| `claimed` | Buyer submitted a UTR; seller must check their bank | no |
| `confirmed` | Seller confirmed the money arrived | terminal only once `status = delivered` |
| `disputed` | Admin must decide (an open dispute exists) | no |
| `refund_due` | Seller must refund the buyer and enter the refund UTR | no |
| `refunded` | Seller recorded the refund | yes |
| `void` | No money moved (expired, cancelled before paying, claim rejected, COD cancelled) | yes |
| `written_off` | Admin closed an unrecoverable case | yes |
| `cod_pending` | Cash on delivery, not yet delivered | no |
| `cod_collected` | COD delivered and cash collected | yes |

"Terminal" for the chat/evidence rules = `payment_status ∈ {void, refunded, written_off, cod_collected}` **or** (`confirmed` and `status = delivered`).

### 1.2 Fulfilment transitions (seller)

```
placed ──► accepted ──► packed ──► shipped ──► delivered
```
Only these four forward steps exist (`ALLOWED_FULFILMENT`); the server offers each as an action string `advance:<next>`
(e.g. `advance:accepted`). They are available only when `payment_status ∈ {confirmed, cod_pending}`. A UPI order sits in
`pending_payment` until the seller confirms the payment, which moves it to `placed`. A COD order is created directly in `placed`.
When a COD order reaches `delivered`, `payment_status` becomes `cod_collected` in the same update.

### 1.3 Payment transitions (who triggers, from → to)

| # | Trigger (endpoint) | Actor | From (`payment_status` / `status`) | To | Side effects |
|---|---|---|---|---|---|
| 1 | `POST /shop/checkout` (UPI shop) | buyer | — | `awaiting_payment` / `pending_payment` | stock decremented; `pay_by = now + PAY_WINDOW`; seller UPI ID + address snapshotted; system chat message |
| 2 | `POST /shop/checkout` (COD shop) | buyer | — | `cod_pending` / `placed` | stock decremented |
| 3 | `POST /shop/orders/:id/payment-claim` `{utr, screenshot?}` (`screenshot` = base64 data URL) | buyer | `awaiting_payment` (UPI, shop `approved`, within `pay_by + grace`) | `claimed` | claim row inserted; `confirm_by = now + CONFIRM_WINDOW`; optional screenshot saved |
| 3a | `PATCH /shop/orders/:id/payment-claim` `{utr}` | buyer | `claimed` | `claimed` (UTR replaced) | system message; only "before the seller responds" |
| 4 | `PUT /shop/orders/:id/cancel` | buyer | UPI `awaiting_payment`, or COD `cod_pending` with `status = placed` | `void` / `cancelled` (`cancelled_by = buyer`) | stock returned once |
| 5 | background sweep / opening an overdue order | system | `awaiting_payment` and `pay_by + grace ≤ now` | `void` / `cancelled` (`cancelled_by = system`, reason "Payment window expired") | stock returned once |
| 6 | `POST /shop/orders/:id/payment-confirm` `{utr}` | seller | `claimed` and `utr` equals the **current** claim UTR | `confirmed` (`status` `pending_payment` → `placed`) | `confirmed_at = now` |
| 7 | `PUT /shop/orders/:id/status` `{status:'rejected', reason}` | seller | `awaiting_payment` | `void` / `rejected` | stock returned |
| 7a | same | seller | `cod_pending` with `status ∈ {placed, accepted}` | `void` / `rejected` | stock returned |
| 7b | same | seller | `confirmed` with `status ∈ {placed, accepted}` | `refund_due` / `rejected` | stock returned; seller must refund |
| 8 | `PUT /shop/orders/:id/status` `{status:<next>}` | seller | `confirmed` or `cod_pending` | unchanged (`cod_pending`→`cod_collected` on `delivered`) | fulfilment advances |
| 9 | `POST /shop/orders/:id/refund` `{refund_utr}` | seller | `refund_due` | `refunded` | refund UTR + `refunded_at` stored |
| 10 | `POST /shop/orders/:id/dispute` `{reason, description?, utr?, screenshot?}` | buyer or seller | see §3.1 | `disputed` | dispute row stores `origin_payment_status` |
| 10a | `POST /shop/orders/:id/payment-not-received` `{description?}` | seller | `claimed` | `disputed` (reason `not_received`) | shortcut for #10 |
| 11 | `POST /shop/admin/disputes/:id/resolve` `{resolution, note}` | admin | `disputed` | see §3.2 | note required; stock returned where listed |
| 12 | sweep: seller reported `not_received`, buyer uploaded no proof within `DISPUTE_PROOF_HOURS` | system | `disputed` (origin `claimed`) | resolves as `claim_rejected` → `void` / `cancelled` | stock returned |
| 13 | admin suspends a shop | admin | each of that shop's `awaiting_payment` orders | `void` / `cancelled` (`cancelled_by = admin`, "Shop suspended") | stock returned; **already-paid orders are untouched** |

There is **no** buyer-triggered cancel after a claim (`claimed`): the server answers *"You already submitted a payment for this order. Ask the seller in the chat, or open a dispute after the confirmation window."*
Nobody and nothing ever auto-confirms a payment. Sellers cannot buy from their own shop.

### 1.4 Concurrency and idempotency guarantees (for client behaviour)

- Every transition locks the order row, re-checks state, and updates with `WHERE payment_status = <expected>`. A lost race returns **409** *"This order changed in the meantime. Please refresh and try again."* → the app refetches the order and re-renders from `allowed_actions`.
- **Stock is returned at most once** per order (`stock_released_at`), however many times cancel / expiry / reject / dispute-resolution run.
- A deadlock is retried once on the server; clients need no special handling.
- One UTR is unique **platform-wide** (`uniq_claim_utr`): a reused UTR → 409 *"This UTR has already been used for another order"*.
- Every state change writes a system chat message and an `audit_log` row; the app shows the system messages in the chat (sender role `system`, no user).

### 1.5 What a buyer sees (state → UI intent)

Use for chips/banners; the *actions* still come from the server.

| State | Buyer chip / banner meaning | Seller chip / banner meaning |
|---|---|---|
| `awaiting_payment` + `pay_seconds_left > 0` | "Pay by …" with countdown, pay screen | "Waiting for buyer's payment" |
| `awaiting_payment` + `pay_seconds_left ≤ 0` (still inside grace) | "Payment window ending — submit your UTR now" (claim still accepted until `pay_by + grace`) | same as above |
| `claimed` | "Waiting for the seller to confirm" + `confirm_seconds_left` | "Check your bank app for ₹x and UTR …" → Confirm / Not received |
| `claimed` + `confirm_seconds_left ≤ 0` | "Seller hasn't confirmed — you can open a dispute" | overdue |
| `confirmed` | "Payment confirmed" + fulfilment steps | "Process order" |
| `disputed` | "An admin is reviewing" | same |
| `refund_due` | "Seller must refund you" (+ can report refund not received) | "Refund ₹x and enter the refund UTR" |
| `refunded` | "Refunded" (+ 7-day window to say it never arrived) | "Refund recorded" |
| `void` | "Cancelled — no money moved" (+ 48 h "I paid anyway" if cancelled by system/buyer and no claim exists) | "Cancelled" |
| `written_off` | "Closed by admin" | "Closed by admin" |
| `cod_pending` / `cod_collected` | "Cash on delivery" / "Paid in cash" | same |

> Quirk to handle: `pay_seconds_left` counts to `pay_by`, **not** `pay_by + grace`, and can be negative while the claim is still accepted. Show "0:00" and a "finishing up" hint; do not disable the claim button on the client — only the server's `allowed_actions` (`claim`) decides.
> `claim` is withdrawn from `allowed_actions` when the shop is not `approved` (suspended shop): the server's message is *"This shop is suspended and cannot take payments. Do not pay; the order will be cancelled."* The `payee` block is also hidden.

### 1.6 `allowed_actions` vocabulary (as of this backend)

`claim`, `edit_claim`, `cancel`, `confirm`, `reject`, `advance:accepted`, `advance:packed`, `advance:shipped`, `advance:delivered`, `refund`, `dispute`, `resolve`, `chat`, `upload_evidence`.
`dispute_reasons` (a subset per viewer): `not_received`, `wrong_amount`, `not_confirmed`, `paid_after_cancel`, `refund_not_received`, `not_delivered`, `other`.
Unknown action strings must be ignored (forward compatibility), never crash.

---

## 2. Timers and the sweep

| Timer | Default | Env var (backend) | Local test value (see `tools/LOCAL-BACKEND.md`) | Effect |
|---|---|---|---|---|
| Pay window | 30 min | `PAY_WINDOW_MINUTES` | 3 | Buyer must submit a UTR by `pay_by` |
| Grace | 10 min | `PAY_GRACE_MINUTES` | 1 | Expiry runs at `pay_by + grace`; claims are still accepted until then |
| Confirm window | 24 h | `CONFIRM_WINDOW_HOURS` | 1 h *(minimum is 1 h — `positiveInt`; fractions are not possible)* | `confirm_by = claimed time + window`; afterwards buyer may open `not_confirmed` |
| Proof window | 24 h | `DISPUTE_PROOF_HOURS` | 1 h | After seller reports `not_received`, buyer must upload proof or the claim is auto-rejected |
| Paid-after-cancel | 48 h | fixed | fixed | Buyer may report "I paid but the order was cancelled" within 48 h of `cancelled_at` |
| Not delivered | 7 days | fixed | fixed | `not_delivered` allowed 7 days after `confirmed_at` while not delivered |
| Refund dispute | 7 days | fixed | fixed | `refund_not_received` allowed while `refund_due`, or ≤ 7 days after the recorded refund |
| Chat read-only | 14 days | fixed | fixed | Chat closes when the order is terminal **and** `updated_at` is older than 14 days |
| Max open UPI orders | 3 | `MAX_OPEN_UPI_ORDERS` | — | Counted over `awaiting_payment` + `claimed` |

The three minute/hour values are server config the app cannot read directly; `GET /shop/config` may expose some of them (see doc 05). **Never hard-code the defaults in the app** — use the `*_seconds_left` fields and `allowed_actions`.

### 2.1 Sweep behaviour
- Runs every 60 s on the server, and (throttled to once per 30 s) opportunistically on checkout, product lookup and order reads, because the free host sleeps.
- Opening an overdue order expires it **on the spot**: the first `GET /shop/orders/:id` after the deadline returns the already-cancelled order.
- Expiry: `awaiting_payment` + `pay_by + grace ≤ now` → `void`/`cancelled` (system), stock returned, system message *"The payment window expired, so the order was cancelled. Already paid? Open a "paid after cancel" dispute with your UTR within 48 hours."*
- Auto-reject: open `not_received` dispute, `opened_at + proof window ≤ now`, and the buyer uploaded **no** evidence since it opened → resolves `claim_rejected` with note *"The buyer did not upload payment proof in time."*
- The sweep handles at most 200 rows per pass per kind; heavy backlogs drain over successive passes.

### 2.2 Client countdown rules
- Use `pay_seconds_left`, `confirm_seconds_left`, and `disputes[].proof_seconds_left` from the response, captured with a monotonic local timestamp; never compare device clock to server timestamps.
- When a countdown reaches 0, refetch the order (it may have expired or become disputable); do not flip state locally.
- Poll the order detail only while visible and in `awaiting_payment` or `claimed` (suggested every 10–15 s); stop on terminal states. The tab badge uses `GET /shop/orders/action-count` every 60 s in the foreground.

---

## 3. Disputes and refunds

### 3.1 Who may open which dispute, and when

Server checks (`disputeEligibility`), shown with the server's refusal messages. The UI shows only the reasons in `dispute_reasons`.

| Reason | Who | Allowed when | Extra requirements | Refusal message (409 unless noted) |
|---|---|---|---|---|
| `not_received` | seller | `claimed` | — | "Only the seller can report this, while a payment claim is waiting" |
| `wrong_amount` | seller | `claimed` | — | same |
| `not_confirmed` | buyer | `claimed` and `confirm_by < now` | payment screenshot required (an existing `payment_proof` upload counts) | "There is no payment claim waiting for the seller" (not `claimed`, or not the buyer) / "The seller still has time to confirm. You can open a dispute after the confirmation deadline." / 400 "Attach a screenshot of your UPI payment to open this dispute" |
| `paid_after_cancel` | buyer | `void` + `cancelled` + `cancelled_by ∈ {system, buyer}` + within 48 h + no claim row | **UTR (12 digits) + screenshot** | "This applies only to UPI orders that were cancelled before you could submit your payment" / "This must be reported within 48 hours of the cancellation" / "A payment is already recorded for this order" |
| `refund_not_received` | buyer | `refund_due`, or `refunded` within 7 days of `refunded_at` | — | 403 "Only the buyer can report a missing refund" / "Refunds can be disputed within 7 days" / "There is no refund on this order" |
| `not_delivered` | buyer | `confirmed`, status not in `{delivered, cancelled, rejected}`, ≥ 7 days after `confirmed_at` | — | "This applies only to paid orders that have not been delivered" / "You can report non-delivery 7 days after the seller confirmed payment" |
| `other` | either | `claimed`, `confirmed` or `refund_due` (buyer also within 7 days after refund) | — | "This order cannot be disputed in its current state" |

General: COD orders have **no** payment disputes (400 *"Cash-on-delivery orders have no payment disputes; use the chat or contact an admin"*). Only one **open** dispute per order; a later one after resolution is allowed. Because an open dispute sets `payment_status = disputed`, a second attempt normally fails the reason's own eligibility check above (e.g. "There is no refund on this order", "This order cannot be disputed in its current state"); 409 *"This order already has an open dispute"* only appears on a race. `description` max 1000 chars: longer → 400 `Validation failed` (`Invalid value`) on `POST …/dispute`; only `POST …/payment-not-received` (no validator) truncates at 1000. `utr` is read only for `paid_after_cancel`. Unknown reason → 400 `Validation failed` + `Choose a dispute reason` (the service's "Unknown dispute reason" is unreachable over HTTP). Checks run in this order: role (admin → 403 "You cannot do this on this order"), COD, the reason's eligibility, then the screenshot requirement, then (for `paid_after_cancel`) the UTR.
(The server also accepts seller `other` while `claimed`, but `allowed_actions` does not offer it — follow `dispute_reasons`.)

### 3.2 Admin resolution matrix (origin → allowed resolutions → result)

Keyed by `origin_payment_status` (the state the order was in when the dispute opened; see `GET /shop/admin/disputes`).
A non-empty **note** is mandatory (400 `Validation failed` + *"A note explaining the decision is required"*; a note over 1000 chars is rejected by the validator with `Invalid value`, the server's own truncation at 1000 is only a safety net). Resolving a dispute that is no longer open → 409 *"This dispute is already resolved"*. A resolution outside the row's list → 400 *"For this dispute, choose one of: …"*.

| Origin | Resolution | Resulting `payment_status` | Resulting `status` | Stock |
|---|---|---|---|---|
| `claimed` | `payment_confirmed` | `confirmed` | `pending_payment` → `placed` (else unchanged) | kept |
| `claimed` | `claim_rejected` | `void` | `cancelled` (`cancelled_by = admin`, "Payment claim rejected in dispute") | returned |
| `claimed` | `refund_required` | `refund_due` | `cancelled` ("Refund ordered in dispute") | returned |
| `void` (paid after cancel) | `refund_required` | `refund_due` | unchanged (`cancelled`) | not touched again (already released) |
| `void` | `claim_rejected` | `void` | unchanged | — |
| `confirmed` (not delivered / other) | `refund_required` | `refund_due` | `cancelled` unless already `delivered` | returned only if status was `placed`/`accepted`/`packed` (not if `shipped`) |
| `confirmed` | `fulfilment_ordered` | `confirmed` | unchanged | — |
| `refund_due` / `refunded` | `refund_confirmed` | `refunded` (`refunded_at` set if empty) | unchanged | — |
| `refund_due` / `refunded` | `refund_required` | `refund_due` (`refunded_at` cleared; the old `refund_utr` stays on the claim and is overwritten by the next refund) | unchanged | — |
| `refund_due` / `refunded` | `closed_unrecoverable` | `written_off` | unchanged | — |

Note: after `payment_confirmed` and `fulfilment_ordered`, the seller continues the normal fulfilment chain.
The platform cannot force a refund; if a seller will not refund, the admin's levers are `closed_unrecoverable`, suspending the shop, and following up through the diocese. The UI says so in plain words (copy in doc 03).

### 3.3 Refund rules
- Only the seller records refunds (`refund_due` → `refunded`) with `refund_utr` (the **refund** transaction's 12-digit reference).
- The refund UTR must differ from every payment UTR on the platform (400 *"The refund UPI Ref No must be the refund transaction, not a payment"*) and may not be reused as a refund UTR (409 *"This refund UTR was already used"*).
- Errors: 409 *"This order has no refund due"*, 409 *"No payment was recorded for this order"*.
- `refund_due` arises from: seller rejects a confirmed order (7b), or admin resolution `refund_required`.
- A buyer who did not receive the refund opens `refund_not_received` (§3.1); evidence kinds: buyer `payment_proof` / `other`; seller `refund_proof` / `other` (the other role's vocabulary value is stored as `other`; a value outside the three kinds is rejected with 400 `Validation failed`).
- Evidence/chat: screenshots are private (Cloudinary `authenticated`), delivered as **signed URLs valid 10 minutes**; only buyer, seller, and (when any dispute exists) admin can see them. Chat: HTML stripped, max 1000 chars, empty → 400 "Message cannot be empty", too long → 400 "Message is too long (max 1000 characters)", closed → 409 "This conversation is closed". The seller's phone is never shown to the buyer.

---

## 4. Cash on delivery (COD)

- A shop offers COD always; UPI only if it has a valid `upi_id`. Per shop in a multi-shop checkout the buyer picks `upi` or `cod` (`payment_methods` map keyed by shop id). A shop without a valid UPI ID → 400 *`"<shop>" only accepts cash on delivery`*; neither chosen → 400 *`Choose UPI or cash on delivery for "<shop>"`*.
- COD order: `payment_status = cod_pending`, `status = placed`; **no** `pay_by`, no claim, no payee, no countdown, **no payment disputes**.
- Buyer may cancel while `status = placed` (→ `void`/`cancelled`, stock returned). After the seller accepts, the buyer can only use chat.
- Seller flow: `placed → accepted → packed → shipped → delivered`; `delivered` flips `payment_status` to `cod_collected`.
- Seller may reject a COD order while `placed`/`accepted` (→ `void`/`rejected`, stock returned).
- COD orders do not count toward the 3-open-UPI-orders limit.
- Copy: buyer sees "Pay ₹x in cash when it arrives"; never show a UPI screen or QR for COD.

---

## 5. Cart and checkout rules

Verified against `cyd_id/src/utils/cart.js` (web behaviour to reproduce), `POST /shop/products/lookup`
(`productController.lookupProducts`) and `orderLifecycle.createCheckout`.

### 5.1 The cart is local
- There is **no cart API**. The app keeps the cart on the device under the key `cyd_cart:<userId>` (web: `cyd_shop_cart:<userId|guest>`), so two people sharing a phone never see each other's cart. Sign-out deletes that user's cart.
- A line stores: `product_id`, `title`, `price_paise`, `image_url`, `shop_id`, `shop_name`, `stock_quantity`, `quantity`, and (after a lookup) `accepts_upi`. Prices in the cart are **only a preview**.
- `quantity` is clamped to `1 … min(stock_quantity, 99)` (if stock is unknown/0 the cap is 99). Adding an existing product adds to its quantity (then clamps). Backend hard limits: **≤ 50 distinct products per checkout, ≤ 99 per line**.
- Lines are grouped by `shop_id`; each group has its own subtotal (`Σ price_paise × quantity`). A multi-shop cart is allowed: the checkout creates **one order per shop**.
- Cart count badge = Σ quantity.
- Clearing: after a successful checkout clear the cart (or the shops that were ordered, when only some were placed — see the order list in the checkout response); "remove" has an undo (UX, doc 03).

### 5.2 Lookup revalidation (`POST /shop/products/lookup`, body `{ids:[…1–100 ints…]}`)
Call it when the cart screen opens and again right before placing the order. Response rows:
`{ id, title, price_paise, stock_quantity, status, shop_id, shop_name, shop_status, accepts_upi, available, image_url }`
where `available = status==='active' && shop_status==='approved' && stock_quantity>0` and `accepts_upi = shop has a UPI ID && shop approved`.
Apply it like the web `applyLookup`:

| Situation | Action | Notice shown to the buyer |
|---|---|---|
| Product missing from the response or `available = false` | **remove** the line | "{title} is no longer available and was removed." |
| `price_paise` differs from the cart | take the new price | "Price of {title} changed from ₹a to ₹b." |
| `quantity > min(stock, 99)` | clamp the quantity | "Only {n} of {title} left; quantity reduced." |
| title / shop name / image / stock differ | silently refresh | — |

If any notice exists at checkout time, **stop and show the notices** — do not place the order until the buyer confirms the new totals.

### 5.3 Checkout request and rules (`POST /shop/checkout`)
Body: `{ address_id, items:[{product_id, quantity}], payment_methods:{ "<shopId>": "upi"|"cod" }, payment_method?, notes? }`
(`payment_method` is a fallback for shops missing from the map; `notes` ≤ 500 chars — longer is rejected by the validator with 400 `Validation failed`, the server's own truncation is a safety net. Bad `payment_methods`/`payment_method` values → `payment_methods must map shop ids to "upi" or "cod"` / `Payment method must be upi or cod`.)
Header: `Idempotency-Key` — **required**, 8–64 chars `[A-Za-z0-9_-]` (400 *"A valid Idempotency-Key header (8-64 letters, digits, - or _) is required"*).

Server rules, in order (messages verbatim, all 400 unless noted). The route validator runs first, so over HTTP the "items not a list", "bad id/qty", "empty" and "> 50 distinct" rows are normally pre-empted by `Validation failed` (`Your cart must have between 1 and 50 products`, `Invalid product`, `Quantity must be between 1 and 99`, `Choose a delivery address`); the merged "qty > 99" row (same product on several lines) is reachable. The `Idempotency-Key` check is in the service, i.e. after the validator:

| Rule | Message |
|---|---|
| items not a list | `items must be a list` |
| item with bad id/qty | `Each item needs a valid product_id and a quantity of at least 1` |
| empty | `Your cart is empty` |
| > 50 distinct | `A checkout can contain at most 50 different products` |
| qty > 99 (after merging duplicates) | `Quantity for product {id} cannot exceed 99` |
| address not the buyer's (404) | `Delivery address not found` |
| product inactive / shop not approved / missing | `Product {id} is no longer available` |
| buyer owns the shop | `You cannot buy from your own shop ("{shop}")` |
| not enough stock | `Only {n} left of "{title}"` |
| no method for a shop | `Choose UPI or cash on delivery for "{shop}"` |
| UPI chosen but shop has no valid UPI ID | `"{shop}" only accepts cash on delivery` |
| too many unpaid UPI orders | `You can have at most 3 unpaid UPI orders at a time. Pay or cancel an existing order first.` (open = `awaiting_payment` + `claimed`, plus the new UPI orders in this checkout) |
| stock race lost (409) | `"{title}" just sold out` |

- All orders of one checkout are created in **one transaction**: either every order exists or none (a failure rolls back the stock reservations).
- Products are locked in ascending id order (no deadlocks); stock is **reserved** at order time (that reservation is the "escrow") and returned once if the order dies.
- Each order snapshots the seller's UPI ID (`payee_upi_id`), the shop name (`payee_name`) and the delivery address; later edits do not change existing orders.
- `shipping_paise` is **always 0**; `total_paise = subtotal_paise`. Order number format `CYD-<base36 time>-<6 hex>`.
- Success: **201** `data: { checkout_id, replayed:false, orders:[{id, order_number, shop_id, shop_name, total_paise, status, payment_status, payment_method, pay_by}] }`.

### 5.4 Idempotency (what the app must do)
- Generate **one key per checkout attempt** (e.g. a UUID without braces; ≥ 8 chars). Keep it across timeouts/retries of the *same* cart and choices — the server returns **200** `replayed:true` with the same orders (message *"This checkout was already placed"*) instead of creating duplicates.
- **Rotate** the key whenever the cart, address, notes or payment choices change: reusing a key with a different request → **409** *"This checkout key was already used for a different cart. Please refresh and try again."*
- The request fingerprint covers: `address_id`, merged sorted lines (`[productId, qty]`), the `payment_methods` map and `payment_method` — not `notes`.
- Disable the Place-order button while the request is in flight; a double tap must produce one set of orders.
- After success: route to Pay (one UPI order) / Pay-your-orders (several UPI orders; `GET /shop/checkouts/:id` lists them with `pay_seconds_left`) / confirmation (COD only). Never navigate on a replay as if it were new money — show the orders the server returned.

### 5.5 Buyer-side limits and visibility
- A buyer may hold at most **3** orders in `awaiting_payment`/`claimed` at once (`GET /shop/config` returns `max_open_upi_orders`, `pay_window_minutes`, `confirm_window_hours`, `payment_methods`).
- `needs_action` (buyer list) = `awaiting_payment` with `pay_seconds_left > 0`. Seller `needs_action` = `claimed`, `refund_due`, or (`confirmed`/`cod_pending` and status in placed/accepted/packed/shipped).
- `GET /shop/orders/action-count` → `{buyer, seller, admin_disputes, total}` (admin sees open disputes). Badge = `total`.

---

## 6. Validation rules (verbatim messages)

Rules the server enforces are marked **S**; rules only the web form enforces are marked **W** — the app should apply both (the server is the final judge; show server messages verbatim). Validation failures return **400** `{success:false, message:"Validation failed", errors:[…plain strings…]}` — `errors` is a list, **not** keyed by field. Map by keyword or show as a list.

### 6.1 Login and accounts
| Field | Rule | Message | |
|---|---|---|---|
| login `username` | non-empty (username **or email**) | `Username or email is required` | S |
| login `password` | non-empty | `Password is required` | S |
| wrong credentials | 401 | `Invalid credentials` | S |
| rate limit | **10 failed attempts per 15 min per IP + username** (successes don't count; the 11th is blocked) → 429 | `Too many failed login attempts. Please try again in 15 minutes.` | S |
| register `username` | 3–50 chars | `Username must be between 3 and 50 characters` | S |
| | `[a-zA-Z0-9_-]+` | `Username can only contain letters, numbers, hyphens, and underscores` | S |
| register `email` | valid email (normalised by the server) | `Must be a valid email address` | S |
| register `password` | ≥ 6 chars | `Password must be at least 6 characters long` | S |
| | contains lower + upper + digit | `Password must contain at least one uppercase letter, one lowercase letter, and one number` | S |
| register `role` | one of `admin`,`user`,`profile_holder` | `Role must be admin, user, or profile_holder` | S |
| update account `username` / `email` | same rules as register (both optional) | same messages | S |

Registration is **admin-only** (`POST /auth/register`); the app has no self-signup.

### 6.2 Passwords — the two change-password endpoints differ
| Endpoint | Who | Server rule |
|---|---|---|
| `PUT /auth/change-password` `{currentPassword,newPassword}` | admin, user | `currentPassword` required (`Current password is required`); `newPassword` ≥ 6 (`New password must be at least 6 characters long`) **and** lower + upper + digit (`New password must contain at least one uppercase letter, one lowercase letter, and one number`); wrong current → 400 `Current password is incorrect` |
| `PUT /profile-holder/change-password` `{currentPassword,newPassword}` | profile holders | `currentPassword` required (`Current password is required`); `newPassword` **only** ≥ 6 (`New password must be at least 6 characters`); wrong current → `Current password is incorrect` |

**App decision:** enforce the stricter rule (≥ 6, one lower, one upper, one digit) in the UI for **both** — holders' initial password is their phone digits, so any strong new password is an improvement and still passes the holder endpoint. Show a strength meter. Show the server's message verbatim if it still rejects. Success message: `Password changed successfully`.

### 6.3 Profile (the 14 form fields + photo)
Server rules (`validateProfile`, applies to create **and** update) vs the web form (`yup`):

| Field (write name) | Server **S** | Web form **W** (message) | App rule |
|---|---|---|---|
| `name` | required, ≤ 100 (`Name is required` / `Name must not exceed 100 characters`) | required `Name is required.` | required, ≤ 100 |
| `father_name` | optional ≤ 100 (`Father name must not exceed 100 characters`) | required `Father's name is required.` | required, ≤ 100 |
| `mother_name` | optional ≤ 100 (`Mother name must not exceed 100 characters`) | required `Mother's name is required.` | required, ≤ 100 |
| `date_of_birth` | optional ISO date (`Date of birth must be a valid date (YYYY-MM-DD)`) — **but create fails with a 500 if absent** (username generation reads it) | required `Date of Birth is required.` | **required** |
| `date_of_baptism` | optional ISO date (`Date of baptism must be a valid date (YYYY-MM-DD)`) | required `Date of Baptism is required.` | required |
| `issue_date` | optional ISO date (`issue_date must be a valid date (YYYY-MM-DD)`) | required `Issue Date is required.` | required (default today) |
| `postal_address` | optional | required `Postal Address is required.` | required |
| `parish` | optional | required `Parish is required.` | required, from `assets/data/deaneries.json` filtered by deanery |
| `deanery` | optional | required `Deanery is required.` | required |
| `qualification` | optional | required `Educational Qualification is required.` | required |
| `phone` | required (`phone is required`), no format check | required `Phone is required.` and `/^[0-9]{10}$/` → `Invalid phone number format.` | required, **exactly 10 digits** |
| `involvement` | optional | required `Involvement since is required.` | required |
| `level` | optional ≤ 50 (`Level must not exceed 50 characters`) | required `Level is required.` (options `parish`/`deanery`/`dexco`) | required, one of `assets/data/levels.json` |
| `designation` | optional ≤ 100 (`Designation must not exceed 100 characters`) | required `Designation is required.` (13 options) | required, one of `assets/data/designations.json` |
| `photo` | optional; `http(s)` URL kept as-is, else base64 data URL `data:image/(jpeg|jpg|png|gif|bmp|webp);base64,…` (`Photo must be a valid base64 image (jpeg, png, gif, bmp, webp)`); size ≤ 5 MB (`Image too large. Maximum size: 5MB`); other errors `Invalid image format`, `Invalid base64 format`, `Unsupported image type`, `No image data found` | web blocks submit without a photo: `Please upload a photo` | **required on create; optional on edit** (keep the existing URL); resize ≤ 1600 px / ≤ 1 MB JPEG |
| `email` | optional valid email | not in form | not sent |

Behaviours the app must know (all verified in `profileController`):
- **Write vs read names:** send `father_name`, `mother_name`, `date_of_birth`; the API returns `father`, `mother`, `dob`.
- **Name storage:** on **create/restore** the server trims, whitespace-collapses and **lower-cases** the name (`normalizeName`); `PUT /profiles/:id` saves the name exactly as sent (not normalised, so send it trimmed). Display with `capitalizeName` (doc 07 §6.1).
- **Dates** are sent as `YYYY-MM-DD`.
- **Create also creates the holder's login:** username = first 4 **letters** of the name (letters only, lower-case) + `DD` + `MM` of the date of birth (e.g. *Anil Masih*, 13-04-… → `anil1304`); on collision `1`, `2`, … is appended. The initial **password is the phone number's digits**. The response returns `credentials {username, password(=phone as typed), message}` once — show a credentials dialog (copy/share).
- **Restore by recreation:** if a **deleted** profile has the same normalised name **and** the same phone, `POST /profiles` restores it (message `Profile restored successfully`, 201), reactivates/recreates the holder account and returns credentials again (password reset to the phone digits). There is no "restore" endpoint.
- **Ownership:** `admin` sees/edits all; `user` only profiles whose `created_by` is them (others → 404 `Profile not found or access denied`).
- Delete is a **soft delete** (`status = 0`) and also disables the holder's login. Profile statistics count soft-deleted rows too (show numbers as given; see doc 04 wording).
- Holder self-service (`PUT /profile-holder/update-profile`, `PUT /profiles/update-limited`): only `photo`, `qualification` (≤ 200: `Qualification must not exceed 200 characters`), `postal_address` (≤ 500: `Postal address must not exceed 500 characters`).
- List defaults: `page=1`, `limit=10` (app uses 25; max 100: `Limit must be between 1 and 100`), `page ≥ 1` (`Page must be a positive integer`), sort `created_at DESC`; `search` is case-insensitive over several fields.

### 6.4 Shop, products, addresses
| Entity / field | Rule | Message |
|---|---|---|
| Shop `name` | required, ≤ 150 | `Shop name is required` (update: `Shop name cannot be empty`) |
| Shop `description` | ≤ 2000 | — |
| Shop `parish` / `deanery` | ≤ 100 | — |
| Shop `contact_phone` | required on apply, ≤ 20 | `Contact phone is required` |
| Shop `upi_id` | optional; `^[\w.+-]{2,256}@[a-zA-Z]{2,64}$` after trim | `UPI ID must look like name@bank` |
| Change UPI ID | requires `current_password`; unchanged value needs none | 403 `Enter your current password to change the UPI ID`; audited |
| Apply when one exists | one shop per user | 400 `You already have a shop application (status: …).` |
| Admin review `status` | `approved`/`rejected`/`suspended` | `Invalid review status` |
| Admin `rejection_reason` | required for `rejected`/`suspended`, ≤ 500 | `Please give a reason when rejecting or suspending a shop` |
| Product `title` | required, ≤ 150 | `Product title is required` |
| Product `description` | ≤ 5000 | — |
| Product `price` (**rupees** string/number in the request!) | float ≥ 0.01 → stored as paise `round(price×100)` | `Price must be a positive number` |
| Product `compare_at_price` (MRP, rupees) | optional float ≥ 0 → paise | — (no server check that MRP ≥ price; the app requires MRP > price when set) |
| Product `stock_quantity` | integer ≥ 0 | `Stock quantity must be 0 or more` |
| Product `category_id` | optional int ≥ 1 | — |
| Product `status` | `draft`/`active`/`out_of_stock`/`archived` | — |
| Product `images` | array ≤ 6 (base64) | `Up to 6 images allowed` |
| Address `full_name` | required ≤ 100 | `Full name is required` |
| Address `phone` | required ≤ 20 (no format check; the app requires 10 digits) | `Phone is required` |
| Address `line1` | required ≤ 200 | `Address line 1 is required` |
| Address `line2` | optional ≤ 200 (**also where a landmark goes** — there is no landmark field) | — |
| Address `city` / `state` | required ≤ 100 | `City is required` / `State is required` |
| Address `pincode` | `^\d{4,10}$` | `Pincode must be numeric` (app: require 6 digits for India) |
| Address `label`, `is_default` | label defaults `Home`; setting `is_default` clears the others | — |
| Product list query | `page ≥ 1`, `limit 1–100`, `category_id`, `shop_id` ints | — |

> **Money direction:** requests for products send **rupees** (`price: "199.50"`); everything the API **returns** is `*_paise` integers. The only place the app converts is the product form (parse the decimal string manually — see `parseRupees` in §7.1; never multiply a float, because `19.99*100 = 1998.9999…`).

### 6.5 Orders, payments, disputes, chat
| Field | Rule | Message / note |
|---|---|---|
| `utr` (claim, confirm, `paid_after_cancel` dispute) | after removing spaces **and hyphens**, exactly 12 digits (`^\d{12}$`) | 400 `UTR must be the 12-digit UPI reference number (UPI Ref No), not the transaction ID` (body-level: `The 12-digit UPI Ref No is required` if not a string) |
| `refund_utr` | same, label "Refund UTR" | `Refund UTR must be the 12-digit UPI reference number (UPI Ref No), not the transaction ID` |
| UTR uniqueness | unique across **all** orders | 409 `This UTR has already been used for another order` |
| Normalisation (client) | strip whitespace and `-`, show grouped `1234 5678 9012`; reject letters before sending | `normalizeUtr` in doc 01 `core/format/text.dart` |
| UPI ID (payee) | same regex as shops | used to build `upi://pay?pa=…&pn=…&am=<rupees>&tn=<order no>&cu=INR` — the server already returns `payee.upi_link`; use it |
| `screenshot` / evidence `image` | base64 data URL ≤ 5 MB; stored private | upload failure 502 `Could not upload the screenshot. Please try again.` |
| Evidence `kind` | `payment_proof`/`refund_proof`/`other` (buyer: payment_proof/other; seller: refund_proof/other; the other role's value → stored as `other`; a value outside the three → 400 `Validation failed` + `Invalid value`) | `An image is required` if `image` is not a string |
| Dispute `reason` | one of the 7 values | `Choose a dispute reason` |
| Dispute `description` | ≤ 1000 | — |
| Order status update `status` | `accepted`/`packed`/`shipped`/`delivered`/`rejected` | `Invalid order status`; illegal step → 400 `Cannot move order from "{from}" to "{to}"`; before payment → 409 `Confirm the payment before processing this order` |
| Reject (`PUT …/status`) `reason` | optional, ≤ 500 — longer → 400 `Validation failed` (`Invalid value`) | — |
| Cancel (`PUT …/cancel`) `reason` | optional, no validator; stored truncated at 500 | — |
| Chat `body` | string; HTML tags stripped; 1–1000 chars | `Message is required` / `Message cannot be empty` / `Message is too long (max 1000 characters)` |
| Admin resolve `resolution` / `note` | resolution string from the matrix; note required, ≤ 1000 | `Choose a resolution` / `A note explaining the decision is required` |
| Order/entity ids | positive ints where validated (orders, checkouts, product GET, admin shop review/dispute resolve); product PUT/DELETE, addresses, `shops/:id` and `profiles/:id` have no id validator (non-numeric → 404/500) | `Invalid id` |

**Required reasons (app UX):** the server only *requires* a note for admin resolutions and a reason for admin shop reject/suspend. For seller **reject**, buyer **cancel**, dispute **description**: optional on the server — the app should still ask for a short reason on seller reject (≥ 3 chars suggested; not enforced by the backend) because the buyer sees it.

### 6.6 Other limits
- Request body ≤ 10 MB (413 `Request body is too large`); malformed JSON → 400 `Malformed JSON in request body`.
- Chat posting is rate limited to **20 messages per minute per user** (429 `You are sending messages too quickly. Please wait a minute.`); disable the send button briefly after a 429. Chat polling uses `GET /shop/orders/:id/messages?after=<lastId>` (≤ 200 rows per call).
- JWT lasts 24 h, no refresh: a 401 on any non-login call = session expired.

---

## 7. Formats

> Referenced as **"doc 06 §Formats"** by `09-IMPLEMENTATION-PLAN.md` (M0 task 6). The helpers live in `lib/core/format/`
> (`money.dart`, `dates.dart`, `text.dart` — doc 01 §2) and **must have the unit tests below** before any screen uses them.
> Card-specific formats (`DD-MM-YYYY` on the card, `capitalizeName`, `safeFileName`, `parseApiDate`) are specified in
> `07-ID-CARD-RENDERING.md` §5–§7 and §12; they are summarised here for completeness and tested from there.

### 7.1 Money — `formatPaise(int paise)`
- Input is an **`int` number of paise** (never `double`). Output: `₹` + rupees with **Indian digit grouping** (`en_IN`: last three digits, then groups of two) + `.` + exactly two paise digits.
- `null` or a non-int → `₹0.00` (the web: `Number(paise) || 0`). Negative values (should not occur) → `-₹x.xx`.
- Do **not** use the web's `toFixed(2)` without grouping for lists; grouping is a deliberate improvement. Chat/system messages come from the server **without** grouping (`₹1250.50`) — render them verbatim.
- Never compute with floating point: add/subtract/multiply integers only; format at the edge.
- `paiseToUpiAmount(int)` → plain decimal for the UPI link, **no symbol, no grouping, two decimals** (`125050` → `1250.50`). The server already provides `payee.upi_link`; use this only for display of "Amount to pay" copy-rows (copy the plain `1250.50`).
- `parseRupees(String)` → `int?` paise, used only by the product form: trim; accept `^\d+(\.\d{1,2})?$` (also `.50`); reject commas/letters/negatives/>2 decimals with the inline error `Enter an amount like 199.50`; convert by **string split** (`whole*100 + frac` padded to 2 digits) — not `parseFloat*100` (`19.99*100 = 1998.9999…`).

| Unit test | Input → expected |
|---|---|
| zero | `formatPaise(0)` → `₹0.00` |
| sub-rupee | `5` → `₹0.05`; `99` → `₹0.99` |
| whole rupee | `100` → `₹1.00` |
| typical | `34950` → `₹349.50`; `15000` → `₹150.00` |
| thousands | `125050` → `₹1,250.50` |
| lakh grouping | `10000000` → `₹1,00,000.00`; `123456789` → `₹12,34,567.89` |
| crore | `1000000000` → `₹1,00,00,000.00` |
| null / bad | `null` → `₹0.00` |
| UPI amount | `125050` → `1250.50`; `5` → `0.05`; `100` → `1.00` |
| parseRupees ok | `"199.50"` → `19950`; `"19.99"` → `1999`; `"0.1"` → `10`; `".5"` → `50`; `"150"` → `15000` |
| parseRupees bad | `""`, `"abc"`, `"1,250"`, `"-5"`, `"1.234"` → `null` |
| line total | `34950 * 2` formatted → `₹699.00` (integer math) |

### 7.2 Dates and times
| Where | Pattern | Example | Notes |
|---|---|---|---|
| ID card | `dd-MM-yyyy` (hyphens, zero-padded, Gregorian, **no locale**) | `05-01-2000` | doc 07 §5 |
| Screens showing profile dates (My ID, profile detail, validity block, forms display) | `dd/MM/yyyy` | `05/01/2000` | web `dayjs().format('DD/MM/YYYY')` |
| Request bodies | `yyyy-MM-dd` | `2000-01-05` | all three profile dates |
| "Joined"/"Updated" lines | `MMM dd, yyyy` / `MMMM dd, yyyy 'at' h:mm a` | `Mar 05, 2026` | web `ProfileInfo` |
| Orders, chat, disputes (lists) | `d MMM yyyy` | `5 Mar 2026` | **mobile decision** (web uses the device-locale `toLocaleDateString`) |
| Orders, chat, disputes (detail/timestamps) | `d MMM yyyy, h:mm a` (local time) | `5 Mar 2026, 4:07 PM` | same |
| Missing / unparsable | `—` (em dash) | | never throw |

- Use explicit patterns with `DateFormat(pattern, 'en_US')` (month names are English either way; `en_IN` would need async locale initialisation — see `docs/DECISIONS.md`); never `yMd(locale)`. Indian money grouping is implemented by hand in `core/format/money.dart`.
- API date strings: follow `parseApiDate` in doc 07 §7.4 (plain `YYYY-MM-DD` = that calendar date; ISO instants → `toLocal()`). The **server time zone is unverified** (see doc 07); verify against the live backend once (create a profile with DOB `2000-01-01`, read the raw JSON).
- Order timestamps (`created_at`, `confirmed_at`, …) are MySQL `DATETIME` serialised by `mysql2`; whether they carry a `Z` is *unverified*. **Never** derive deadlines from them: use `pay_seconds_left`, `confirm_seconds_left`, `proof_seconds_left` (computed by the database clock). Use timestamps for display only.

### 7.3 Countdown — `formatCountdown(int seconds)`
| Seconds | Output |
|---|---|
| `< 0` or `0` | `0:00` |
| `1 … 3599` | `m:ss` (`2:05`, `29:59`) |
| `3600 … 86399` | `Hh MMm` (`1h 02m`, `23h 59m`) |
| `≥ 86400` | `Dd Hh` (`1d 4h`) |
Tests: `-5`→`0:00`; `0`→`0:00`; `59`→`0:59`; `125`→`2:05`; `1799`→`29:59`; `3600`→`1h 00m`; `3725`→`1h 02m`; `86399`→`23h 59m`; `90000`→`1d 1h`.

### 7.4 Text
- **`capitalizeName`** — doc 07 §6.1 (lower-case, then upper-case the first letter after each **single space**; keep the rest). Tests there. It is **display-only**: never send the capitalised value (the server lower-cases anyway).
- **`normalizeUtr(String)`** — remove all whitespace and `-`; result must match `^\d{12}$` to be submittable. **`groupUtr`** — `429188301127` → `4291 8830 1127`; shorter input groups what it has (`4291 88` for `429188`); non-digits are dropped by the input formatter.
- **`normalizePhone`** — digits only; the form requires exactly 10 digits; display `98765 43210` in lists (optional) or raw as stored on the card (doc 07 prints it raw).
- **Username display** — as stored (lower-case). **Order numbers** — `CYD-<BASE36>-<HEX6>` shown verbatim, copyable.
- **`safeFileName`** — doc 07 §12.1 (`{Name}-{Parish}-{phone}` sanitised, ≤ 80 chars).
- Names and free-text fields are trimmed on submit; never lower-case/upper-case on the client except for display helpers.

| Unit test | Input → expected |
|---|---|
| normalizeUtr | `" 4291 8830 1127 "` → `429188301127`; `"4291-8830-1127"` → `429188301127`; `"UTR429"` → not 12 digits (invalid) |
| groupUtr | `429188301127` → `4291 8830 1127`; `42918` → `4291 8`; `""` → `""` |
| normalizePhone | `"98765 43210"` → `9876543210`; `"+91 98765-43210"` → `919876543210` (11+ digits → form error) |

---

## 8. ID-card validity rule

Authoritative detail and tests: **`07-ID-CARD-RENDERING.md` §7 and §14.2**. Summary the whole app uses (My ID, preview, profile detail, Profiles list chip):

```
issue   = issue_date (calendar date; parseApiDate rule)
expiry  = issue + 2 calendar years       // Feb 29 → Feb 28 (clamp the day; do NOT use DateTime(y+2,m,d))
now     = injected clock (local time)
isValid = now is before expiry            // expiry = 00:00 local of the expiry date → the card is already
                                          //   "Expired" at any time during the expiry date itself
days    = max(0, trunc((expiry − now) / 24 h))
chip    = !isValid → "Expired" (red)
          days > 60 → "Valid" (green)
          else      → "Expires in {days} days" (amber)     // exactly 60.0 days → "Expires in 60 days"
issue_date null → no validity block at all
```

- **Do not use the backend's `GET /profile-holder/my-id-card` `validity` object** for display. It differs from the web rule: `isValid = now <= expiry` (so the expiry day is "valid" there), `daysUntilExpiry = ceil(...)`, `setFullYear(+2)` (Feb 29 → **Mar 1**), and a `null` issue date becomes 1970 → "expired". The app computes locally so it also works offline and in lists. (Logged in `11-DESIGN-VS-BACKEND.md`.)
- Copy: *"Your ID card is valid and in good standing."* · *"Your ID card will expire in {n} days. Please contact CYD Office for renewal."* · *"Your ID card has expired. Please contact CYD Office for renewal."* (doc 07 §7.1).
- The card itself prints only "Valid for two years" and the issue date; it never prints an expiry date.
- New profiles default `issue_date` to **today** in the form; legacy rows may have `null` (handled above).
- Test vectors: doc 07 §14.2 (inject the clock; run with `TZ` set to `Asia/Kolkata` and `UTC` for the parse test).

---

## 9. Worked example

> Referenced as **"doc 06 §Worked example"** by `09-IMPLEMENTATION-PLAN.md` (M7 acceptance) and `10-TESTING-QA.md`.
> It exercises every state in §1 on the **local backend** with the **shortened timers** from `tools/LOCAL-BACKEND.md`:
> `PAY_WINDOW_MINUTES=3`, `PAY_GRACE_MINUTES=1`, `CONFIRM_WINDOW_HOURS=1`, `DISPUTE_PROOF_HOURS=1`.
> Accounts (`tools/seed-dev-data.js`, password `Passw0rd1` unless noted): `buyer1`, `seller1` (St. Mary's Youth Shop, UPI `stmarysyouth@okaxis`),
> `seller2` (Holy Family Candles, **COD only**), `admin` (`admin`/`admin123`). Products: Wooden Rosary ₹150.00 (stock 20) · Retreat T-shirt ₹349.50 (stock 10)
> · Youth Day Cap ₹220.00 (stock **0** → unavailable) · Beeswax Candle set ₹280.00 · Advent Wreath ₹650.00.
> Use a **fresh UTR for every run** (UTRs are globally unique and never reusable): the examples below use `4291 8830 11xx`; pick new digits each time.
> Clock `T0` = the moment you start (server clock; times below are relative). Rows show what the **buyer app** and **seller app** must render — buttons come from `allowed_actions`.

### 9.1 Scenario A — multi-shop checkout, happy UPI path, COD path
| # | Time | Actor / action | Server result | Buyer's `allowed_actions` | Seller's `allowed_actions` |
|---|---|---|---|---|---|
| A1 | T0 | `buyer1` carts 2 × Wooden Rosary + 1 × T-shirt (seller1) and 1 × Beeswax set (seller2), opens cart → lookup shows no changes. Checkout: seller1 = `upi`, seller2 = `cod`, key `K1` | **201** two orders. Order **A** (seller1): `awaiting_payment`/`pending_payment`, total **64950** (`₹649.50`), `pay_by = T0+3 min`. Order **B** (seller2): `cod_pending`/`placed`, total **28000**. Stock: Rosary 18, T-shirt 9 | A: `claim`, `cancel`, `chat`, `upload_evidence` · B: `cancel`, `chat`, `upload_evidence` | A: `reject`, `chat`, `upload_evidence` · B: `reject`, `advance:accepted`, `chat`, `upload_evidence` |
| A2 | T0+0:05 | Buyer retries the same checkout (airplane-mode glitch), same key `K1` | **200** `replayed:true`, same two orders; no extra stock taken | — | — |
| A3 | T0+0:10 | Buyer reuses `K1` after adding a Rosary | **409** `This checkout key was already used for a different cart…` → app rotates the key | — | — |
| A4 | T0+1:00 | Buyer opens Pay screen for A: shows `payee.upi_id`, amount `₹649.50`, countdown ≈ 2:00, UPI link | — | `claim`, `cancel` | — |
| A5 | T0+2:10 | Buyer submits UTR `429188301127` (+ optional screenshot) | `claimed`, `confirm_by = T0+2:10+1 h`; system message in chat | `edit_claim`, `chat`, `upload_evidence`, `dispute` (`other` only; no `cancel`) | `confirm`, `chat`, `upload_evidence`, `dispute` (`not_received`, `wrong_amount`) |
| A6 | T0+2:30 | Buyer notices a typo and edits to `429188301172` (`PATCH payment-claim`) | still `claimed`; UTR replaced | same | same |
| A7 | T0+2:40 | Seller (screen still showing the old UTR) taps Confirm with `429188301127` | **409** `The buyer has changed the UPI Ref No since you looked. Please check the new one in your bank app.` → app refetches the order, shows the new UTR | — | `confirm` |
| A8 | T0+3:00 | Seller confirms with `429188301172` | `confirmed`, `status = placed`; `confirmed_at` set | `chat`, `upload_evidence`, `dispute` (`other`) | `advance:accepted`, `reject`, `chat`, `upload_evidence`, `dispute` (`other`) |
| A9 | later | Seller advances A: `accepted → packed → shipped → delivered`; and B: `accepted → … → delivered` | A ends `confirmed`/`delivered` (terminal); B `delivered` flips `cod_pending → cod_collected` | chips update after each step (polling/refresh) | A (UPI, `confirmed`/`delivered`): `chat` + `dispute` (`other`) for both buyer and seller (`upload_evidence` is gone: terminal). B (COD, `cod_collected`): only `chat` |
| A10 | any | Admin opens order A | `viewer_role = admin`, no chat (no dispute exists), `allowed_actions = []` | — | — |

Assertions: stock after A1 = Rosary 18, T-shirt 9; no stock change after A8/A9; 3 buyers' unpaid UPI orders limit not hit; action-count badge: buyer = 1 after A1 (order A waiting), 0 after A5; seller1 = 1 after A5.

### 9.2 Scenario B — payment window expires, buyer paid anyway, admin orders a refund
| # | Time | Actor / action | Server result |
|---|---|---|---|
| B1 | T1 | `buyer1` buys 1 Wooden Rosary, UPI, key `K2` | `awaiting_payment`; `pay_by = T1+3 min`; Rosary stock −1 |
| B2 | T1+3:30 | Buyer does nothing; app countdown hits `0:00` | `pay_seconds_left ≤ 0`; claim still allowed until `pay_by + 1 min` (the `claim` action is still offered) |
| B3 | T1+4:00 (sweep ≤ 60 s later, or on opening the order) | Expiry | `void`/`cancelled`, `cancelled_by = system`, reason "Payment window expired"; stock restored (**once**); chat message about the 48 h dispute |
| B4 | T1+10 min | Buyer's open-order chip shows "Cancelled"; `dispute_reasons = ['paid_after_cancel']` (no claim exists, within 48 h) | — |
| B5 | T1+12 min | Buyer: "I paid anyway": UTR `429188309901` + screenshot (required) | `disputed` (origin `void`); dispute row; admin badge +1 |
| B6 | T1+14 min | Admin → Shop disputes → opens it: sees chat + evidence (signed URL); only `refund_required` and `claim_rejected` offered; resolves `refund_required` with note | `refund_due`; status stays `cancelled`; stock **not** restored again |
| B7 | T1+15 min | Seller: `allowed_actions` includes `refund`; records refund UTR `529188300001` (must differ from every payment UTR) | `refunded`; refund UTR stored |
| B8 | T1+16 min | Buyer: `dispute_reasons = ['refund_not_received', 'other']` for 7 days | order terminal (`refunded`) |
| B9 | negative | Seller tries refund UTR `429188309901` | **400** `The refund UPI Ref No must be the refund transaction, not a payment` |

### 9.3 Scenario C — seller says "not received"; buyer proves; admin confirms (and the auto-reject variant)
| # | Time | Actor / action | Server result |
|---|---|---|---|
| C1 | T2 | Buyer orders 1 T-shirt (key `K3`), claims `429188301500` at T2+1:00 | `claimed`; `confirm_by = T2+1:00+1 h` |
| C2 | T2+5 min | Seller → "Payment not received" with a description | `disputed` (origin `claimed`, reason `not_received`); `proof_seconds_left ≈ 3600` shown to the buyer as "Upload your payment proof within 59:xx" |
| C3a | T2+20 min | Buyer uploads a payment screenshot (kind `payment_proof`) | evidence stored; system message; sweep will **not** auto-reject |
| C4a | T2+25 min | Admin reviews chat + evidence; offered `payment_confirmed`, `claim_rejected`, `refund_required`; resolves `payment_confirmed` with note | `confirmed`, `status` `pending_payment → placed`; seller continues fulfilment |
| C3b *(variant)* | T2+65 min | Buyer uploaded **nothing** | sweep resolves `claim_rejected` automatically, note "The buyer did not upload payment proof in time."; order `void`/`cancelled` (`cancelled_by = admin` — system-resolved), stock restored |

### 9.4 Scenario D — seller silent; buyer disputes after the confirm deadline
| # | Time | Actor / action | Server result |
|---|---|---|---|
| D1 | T3 | Buyer orders + claims `429188301800` | `claimed`, `confirm_by = T3+1 h` |
| D2 | T3+30 min | Buyer: `dispute_reasons = ['other']` only (`not_confirmed` is not offered yet — still inside the window) | the "seller hasn't confirmed" option must be absent/disabled with "You can raise this after {time}"; `other` stays available |
| D3 | T3+61 min | `confirm_seconds_left ≤ 0` → `dispute_reasons = ['not_confirmed', 'other']`; opening **without** a screenshot | **400** `Attach a screenshot of your UPI payment to open this dispute`; with screenshot → `disputed` |
| D4 | T3+70 min | Admin resolves `payment_confirmed` (seller was away) or `claim_rejected` / `refund_required` | per §3.2 |

### 9.5 Scenario E — guard rails (run once)
| # | Action | Expected |
|---|---|---|
| E1 | Buyer places 4 UPI orders without paying (4 separate checkouts from seller1, each with a new key) | 4th: **400** `You can have at most 3 unpaid UPI orders at a time. Pay or cancel an existing order first.` |
| E2 | `seller1` tries to buy from their own shop | **400** `You cannot buy from your own shop ("St. Mary's Youth Shop")` |
| E3 | Cart contains Youth Day Cap (stock 0) | lookup → `available:false` → line removed with notice; direct checkout → **400** `Product {id} is no longer available` |
| E4 | Choose UPI for seller2 | **400** `"Holy Family Candles" only accepts cash on delivery` (the app should not offer UPI: `accepts_upi=false`) |
| E5 | Admin suspends seller1 while buyer has an unpaid UPI order and a confirmed one | the unpaid order → `void`/`cancelled` ("Shop suspended", stock restored); the confirmed order is untouched and seller1 can still ship it; the buyer's `claim` is withdrawn if they were mid-payment ("This shop is suspended…") |
| E6 | Buyer double-taps "Place order" | exactly one set of orders (idempotency) |
| E7 | Two devices: seller taps Confirm while buyer taps Edit UTR | exactly one wins; the other gets **409** and refetches |
| E8 | Session expiry mid-flow (token removed) | next call 401 → toast `Session expired. Please login again.` → `/login`; cart for that user is still on the device until sign-out |

### 9.6 What "pass" means (M7 acceptance)
Scenarios A–D complete on the emulator against the local backend, with every button taken from `allowed_actions`, every chip matching §1.5, countdowns driven by `*_seconds_left`, and no client-side derivation of order rules. Record the order ids and the outcome of each row in the QA log (`docs/10-TESTING-QA.md` §7 template for failures).
