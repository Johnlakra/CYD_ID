BATCH A — continue the CYD design file using the context above. Add NEW artboards only (do not touch existing ones), 390×844, dark and light side by side, each with a `data-screen-label` like "E1a Pay — awaiting". Use exactly the copy below; do not invent new copy. This batch is the peer-to-peer UPI payment flow: the buyer pays the seller's UPI ID directly in their own UPI app, then types the 12-digit UPI reference number (UTR); the seller confirms later. CYD never holds money. There is NO payment gateway, no "Opening UPI checkout…" screen and no "Switch to cash on delivery" button.

Sample data (use consistently): Shop 1 "St. Mary's Youth Shop", UPI ID `stmarysyouth@okaxis`, payee name "St Marys Youth Group". Shop 2 "Holy Family Candles" (cash on delivery only). Orders: CYD-240311-0042 (₹1,250.00, Shop 1), CYD-240311-0043 (₹320.50, Shop 2). UTR example `4021 8837 1190` (shown grouped 4-4-4; copy puts unspaced digits on the clipboard). Amounts formatted ₹ with Indian grouping.

Chips used in this batch (glyph + text, never colour alone; dark fg / light fg): Awaiting payment ◔ #FFC53D/#8A5A00 · Paid — awaiting seller ◔ #7CB2FF/#1F5FC4 · Payment confirmed ✓ #3DD68C/#1B7A3A · In dispute ! #FF6A55/#B82A18 · Cash on delivery ₹ #BBA2FF/#5B3BC4 · Placed ● #7CB2FF/#1F5FC4 · Accepted ✓ #FFB547/#A35400 · Packed ▣ #BBA2FF/#5B3BC4 · Shipped → #4FD1C5/#0F7A70 · Delivered ✓ #3DD68C/#1B7A3A · Cancelled × #A8A8B0/#55555C · Rejected ! #FF6A55/#B82A18. Chip fill = fg at 14% opacity (dark) / 20% (light).

Countdown pill: radius 99, height 28, padding 0 12, accent-soft fill, accent text, DM Mono 500 12 with tabular numbers. Format `mm:ss` under an hour, `h:mm:ss` over. Under 5 minutes the fill becomes danger at 14% and text danger. Text is always shown (never colour-only).

Copy-row component: label in DM Mono 10 uppercase `faint`; value row in a hairline card (radius 16, padding 14) with a trailing `Copy` text button; tapping shows toast "{label} copied". "Big" variant shows the value in Anton 24.

---
## E1 · Pay the seller   (route /pay/:orderId · role: buyer · tab bar HIDDEN)
Purpose: tell the buyer exactly who to pay, how much and with what reference, then collect the UTR. Padding 60 24 40, scrolls, sticky bottom CTA that rises above the keyboard.
Layout top→bottom:
1. Top row: back button · order number (DM Mono 11) · chip `Order 1 of 2` (only when opened from E2).
2. Hero: 64 px accent circle with `UPI` (Anton 30, on-accent) · amount Anton 44 `₹1,250.00` · `to St. Mary's Youth Shop` (Archivo 600 14) · countdown pill `Pay within 29:41`.
3. Section label `1 · PAY THE SELLER`:
   - Copy-row `UPI ID` (big variant) = `stmarysyouth@okaxis`; helper: `Copy this and paste it in your UPI app. Check the name shown matches St Marys Youth Group.`
   - Copy-row `AMOUNT` = `₹1,250.00`; helper: `Pay exactly this amount.`
   - Copy-row `PAYMENT NOTE` = `CYD-240311-0042`; helper: `Put this in the note so the seller can match your payment.`
   - Primary button `Open UPI app` (height 52). Text button `Show QR code` expands a QR card (white QR tile, caption "UPI payment QR code").
4. Section label `2 · TELL US YOU PAID`: UTR input (12 digits, monospace, grouped as typed), label `UPI REF NO (12 DIGITS)`; helper `This is the 12-digit "UPI Ref No" in your payment details, not the Transaction ID.` Optional screenshot tile (dashed, 96×96, label `Add screenshot (optional)`, helper `Helps the seller if there is any doubt. Crop out anything private.`).
5. Reassurance card (accent-soft): `You pay the seller directly. CYD never holds your money. Only pay the UPI ID shown here.`
6. Sticky CTA (56): `I've paid — submit` (disabled until 12 digits are typed).
Draw these artboards:
- E1a Awaiting payment: layout above, empty UTR, CTA disabled.
- E1b UTR typed: input filled `402188371190`, screenshot attached thumbnail, CTA enabled; also show the inline error `This UTR has already been used for another order` under the field as a variant.
- E1c Grace period: pill reads `Time's up — submit now if you've paid`; form still enabled.
- E1d Window closed: steps replaced by a banner `The payment window has closed. If you already paid, we'll show your options once the order updates.` plus a second variant for a suspended shop: `This shop is suspended and cannot take payments. Do not pay; the order will be cancelled.`
- E1e Waiting for the seller: tick tile, Anton 30 `Waiting for the seller`, body `You submitted 4021 8837 1190. The seller checks their bank and confirms.`, pill `Seller has 23h 41m to confirm`, buttons `Edit reference`, `Chat with seller`, `View order`, `Go to my orders`. Variant: banner `The seller hasn't confirmed in time.` with button `Report to admin`.
- E1f Edit reference bottom sheet (28 px top radius, grabber): UTR input + `Save`; toast `UPI reference updated`.
- E1g Payment confirmed: `Payment confirmed ✓` · `The seller will now prepare your order.` · `View order`.
- E1h In dispute: `In dispute` · `An admin is reviewing this order. You can add evidence and chat with the seller.` · `View order`.
- E1i Cancelled: `This order was cancelled.` · `Nothing was charged.` plus card `Already paid?` with button `Report it`.
Success toast after submit: `Payment submitted. The seller will confirm once it shows in their bank.` Other toasts: `No UPI app found. Copy the UPI ID and pay from your UPI app.`
Done when: copy is the primary path (Open UPI app is secondary in weight); countdown always has text; all nine states drawn in both themes.

## E2 · Pay your orders (multi-shop)   (route /pay-checkout/:checkoutId · buyer · tab bar HIDDEN)
Purpose: after a checkout that created several orders, pay each shop separately.
Layout: back · Anton 26 `Pay your orders` · info card `You placed 2 orders. Each shop is paid separately, so pay each one before its timer runs out.` · summary line `Still to pay ₹1,250.00` (hidden at 0) · one hairline card per order (gap 12): row 1 shop name (Archivo 700 15) + order chip; row 2 order number (DM Mono) + total; row 3 depends on state · footer outline button `Go to my orders`.
Row 3 by state: UPI awaiting → countdown pill + primary `Pay now` (46); UPI claimed → `Waiting for the seller ✓` (muted) + `View`; UPI confirmed → `Payment confirmed ✓` + `View`; cash on delivery → chip `Cash on delivery` + `Pay the seller when it arrives` + `View`; expired → `Expired — nothing was charged`.
Draw: E2a mixed (Shop 1 awaiting UPI with pill, Shop 2 COD); E2b all paid — success header `All paid ✓`, `Go to my orders` becomes the primary button; E2c one order expired.
Done when: each order has exactly one clear next action; the footer button is outline until everything is paid.

## E3 · Order placed   (route /order-placed/:checkoutId · buyer · tab bar HIDDEN)
Purpose: confirmation after checkout. Padding 90 22 40, centred.
Layout: 104 px accent circle with ✓ (Anton) · Anton 42 `Order placed!` (one order) or `2 orders placed!` · body `Each shop has been told. You pay the seller in cash when your order arrives.` (all cash on delivery) · one tappable card per order: order number (DM Mono), shop name, method line, total, `→` · buttons `View my orders` (primary) and `Continue shopping` (outline).
Method line: `Cash on delivery` · `UPI · pay the seller now` (with a small `Pay` button) · `UPI · waiting for the seller`.
Draw: E3a single COD order; E3b two orders, mixed (one COD, one UPI awaiting with `Pay` button).
Done when: singular and plural titles both appear; no back arrow to checkout (a close/continue affordance only).

## E4 · Orders list with needs-action   (route /orders · tab 4 · tab bar SHOWN)
Purpose: the buyer's order history with unpaid orders surfaced. Padding 66 0 130.
Layout: Anton 40 `My orders` · horizontally scrolling filter chips with counts: `All` · `Needs action` (new, accent-emphasised) · `Awaiting payment` · `Placed` · `Accepted` · `Packed` · `Shipped` · `Delivered` · `Cancelled` · `Rejected` · order cards (hairline, radius 20): row 1 `CYD-240311-0042 · 11 Mar` + order status chip (plus a second payment chip when payment is `Paid — awaiting seller`, `Refund due` or `In dispute`); row 2 up to 3 overlapping tinted thumbnails, shop name, `2 items`, total; for unpaid UPI orders a footer strip with countdown pill and `Pay now →`.
Draw: E4a populated, `All` selected — one awaiting-UPI card with footer pill, one claimed card with the second chip, one delivered, one cancelled; E4b `Needs action` selected with a single card; E4c loading (3 skeleton cards); E4d empty `No orders yet` / `No Shipped orders yet` with button `Browse the marketplace`; E4e error `Couldn't load your orders` / `Tap to retry`.
Tab bar for E4: 5 tabs [My ID · Shop · Cart · Orders · Account]; Orders selected; Shop tab shows a small danger badge with `1`.
Done when: Needs action is the only accented chip; footer pill ticks in the design notes; empty text switches between `No orders yet` and `No {filter} orders yet`.

Output: list the artboards you added (id, label) and note any copy you could not fit.
