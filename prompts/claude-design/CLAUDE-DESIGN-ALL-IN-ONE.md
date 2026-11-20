# CYD — all Claude Design prompts in one file

Paste in order. If your tool truncates, use the separate files instead (see README.md in this folder).


=====================================================

# CYD — shared design context (paste ONCE, first)

You are continuing the design of the **CYD mobile app**. The existing design file **"CYD Shop Mobile"** has 19 artboards (01–18 and 12b), each a 390×844 frame labelled like `01 Home`, `12b Address form`. **Only ADD new artboards. Never modify, re-style or delete the existing ones.** Match their frame size, label style, fonts, tokens and component look exactly. Each new screen is drawn **twice, dark and light** (two frames, labelled `<id> <title> · dark` / `· light`; the file's existing artboards switch theme with one toggle, so keep the same two token sets).

## Product (5 lines)
CYD = Catholic Yuva Dhara, Diocese of Jalandhar (India). The app has (1) **ID cards** for youth members and the staff who manage them, and (2) a **multi-vendor shop** run by parishes. Payments are **peer-to-peer UPI**: the buyer pays the *seller's own UPI ID* directly outside the app, enters the **12-digit UTR** (bank reference), and the **seller confirms** receipt; the platform never holds money. Roles: **admin**, **CYD manager**, **profile holder** (a member who views their own card), **buyer** (any user), **seller** (owns an approved shop). Money is shown as `₹1,250.00` with Indian digit grouping (₹1,25,000.00 for lakhs).

## Tokens (use exactly)
| name | dark | light |
|---|---|---|
| bg | #0A0A0B | #F2F0EA |
| card | #141417 | #FFFFFF |
| raised | #1E1E22 | #FFFFFF |
| sunk | #101012 | #E9E6DD |
| ink | #F5F5F0 | #0A0A0B |
| mute | white 58% | ink 60% |
| faint | white 40% | ink 45% |
| line (hairline) | white 8% | ink 9% |
| line2 (emphasis hairline) | white 14% | ink 15% |
| accent (both) | #FFA51F, text on accent #0A0A0B | same |
| accSoft | accent 14% | accent 20% |
| accText | #FFB547 | #9A5200 |
| danger | #FF6A55 | #C8321F |
| ok | #3DD68C | #1B7A3A |
| tab bar fill | #1E1E22 at 88% | white at 90% |
| skeleton | white 7% | ink 7% |
| toast | bg #F5F5F0 / text #0A0A0B | bg #0A0A0B / text #F2F0EA |
| scrims | sheet black 55%, dialog black 60% | same |

**Fonts.** Display **Anton** (single weight; never bold) for titles and money: 40 tab-screen titles (line-height .95), 34 status headings/prices, 26 sub-screen titles, 24 dialog titles, 22 totals, 44 big payment amount. **Archivo** (400–800) for UI: body 13/1.5 `mute`; card title 700 15; input text 500 14; button 700 14 (secondary 600 13); chip 600 12. **DM Mono** 500 for tiny tracked uppercase labels: section label 9px +0.16em `faint`; input label 9px +0.14em `faint`; meta 10px +0.08em.

**Shape and space.** Screen side padding 20; section gap 24; card padding 16; grid gaps 12/18. Radii: cards 20, tiles 18, buttons 16, inputs 14, sheet top 28, dialog 24, pills/chips 99, small buttons 14. Cards are flat: 1px `line` border, **no shadows**. The only glow is the primary CTA: `0 10px 24px -12px rgba(255,165,31,.8)`. Hairline 1px, emphasis 1.5px, dashed `1.5px dashed line2` for empty states.

**Tab bar.** Floating pill at the bottom (outer padding 10/14/18, pill padding 8, radius 22, blurred fill, 1px `line`), **5 tabs**: first tab is role-based **[My ID | Profiles]** (holders see *My ID*, admin/manager see *Profiles*), then **Shop · Cart · Orders · Account**. Each item: Anton 14 mark above Archivo 600 9 label (marks ID/P · S · ₹ · O · A). Selected = solid accent pill with dark text; unselected = transparent, `mute`. Red `danger` count badge (min 16, Archivo 700 9, white) on **Cart** (quantity) and **Shop** (items needing action). Total height 92. Sub-screens such as detail, forms, checkout and chat hide the bar and use a 40×40 back button.

## Status chips (pill, 24 high in lists, 26 on detail; Archivo 700 10; glyph + text; background = text colour at 14% dark / 20% light)
| label (glyph) | dark text | light text |
|---|---|---|
| Awaiting payment ◔ · Refund due ↺ · Expires in N days ◔ · Pending review ◔ · Only N left ! | #FFC53D | #8A5A00 |
| Paid — awaiting seller ◔ · Placed ● | #7CB2FF | #1F5FC4 |
| Payment confirmed ✓ · Delivered ✓ · Approved ✓ · Active ● · Valid ✓ · Cash collected ✓ · In stock ✓ | #3DD68C | #1B7A3A |
| In dispute ! · Rejected ! · Expired ! · Out of stock ! | #FF6A55 | #B82A18 |
| Accepted ✓ | #FFB547 | #A35400 |
| Packed ▣ · Cash on delivery ₹ | #BBA2FF | #5B3BC4 |
| Shipped → | #4FD1C5 | #0F7A70 |
| Cancelled × · Suspended ‖ · Refunded ↺ · No payment ○ · Closed by admin ▤ · Draft ○ · Archived ▤ | #A8A8B0 | #55555C |

## Components and key measurements
- **Buttons:** primary = accent fill, dark text, radius 16, height 54–56 (inline 50, compact 46), CTA glow; secondary = transparent, 1px `line2`, `ink`; destructive = `danger` text on transparent with `danger` 1px border; disabled 40% opacity. Sticky bottom action bar: padding 16, `bg` with top hairline.
- **Inputs:** height 50, radius 14, fill `card`, 1px `line` (focus: 1.5px accent), mono uppercase label above (9px), error text Archivo 500 11 `danger` below. Mark required with `*`.
- **Cards:** `card` fill, 1px `line`, radius 20, padding 16. **List row:** 56–72 high, hairline divider, trailing chevron `›` in `faint`. **Stat tile:** `card`, radius 16, padding 14, Anton 28 number over mono 9 label (three in a row, gap 8).
- **Price text:** Archivo 700 14 (Anton 34 on detail); strike-through MRP Archivo 400 11 `faint`.
- **Countdown pill:** radius 99, height 26, mono 500 11, clock glyph ◔, text `mm:ss` (or `Xh Ym` over an hour); turns `danger` under 5 minutes.
- **Copy-row:** label (mono 9) over value (Archivo 700 15, UPI IDs in DM Mono) with a trailing `Copy` text button (accText) inside a `sunk` rounded 14 field; toast `Copied` after tapping.
- **Bottom sheet:** top radius 28, grabber 40×4, `sheetScrim`, title Anton 26, content padding 20, full-width action stack. **Dialog:** radius 24, padding 24, title Anton 24, scrim 60%, two buttons.
- **Toast:** pill at the bottom (above the tab bar when it is visible), `toastBg`/`toastFg`, Archivo 600 13.
- **Skeleton:** shapes of the real content filled with the `skel` colour, line radius 6. **Empty state:** dashed card, centred 48px glyph circle, Anton 22 title, body 13 `mute`, one button. **Error card:** `card`, `danger` glyph, message, `Tap to retry` secondary button (44 high).
- **Segmented filters:** pills height 36, radius 99; selected = accent fill with dark text, others 1px `line2`; horizontally scrollable with counts in mono.
- **Avatar:** circle with Anton initials (42 / 56). Section label above groups of rows. Stepper: height 34, buttons 32×32, radius 10.

## Global rules
1. **Frames:** 390×844 only, status bar and home indicator areas respected; keep 130px bottom padding on scrolling screens that show the tab bar. Long screens may be drawn as taller frames (same width) labelled `… (scroll)`.
2. Draw **dark and light** for every screen, with identical layout.
3. **No emoji.** Use the simple glyphs in the chip table or plain line icons. Status always shown as **text + glyph**, never by colour alone.
4. Touch targets **≥ 44×44**. Contrast must pass WCAG AA in both themes.
5. **Use only the copy given in the batch prompts. Never invent business copy, numbers, rules or policies.** If something needed is missing, write `[copy needed]` in that spot and list it in your closing notes. Use realistic *fake* sample data (names like Anil Masih, parish St. Mary's, ₹ amounts) but never real personal data.
6. Keep the editorial look: big Anton titles, mono micro-labels, hairline cards, single saffron accent used for the one primary action per screen.
7. Artboard labels: `<id> <title>` using the id from the batch prompt (e.g. `E1 Pay the seller · dark`), consistent with the existing `01 Home` style.

## Output contract
For every screen: produce the artboard(s) named as above **plus any state variants the batch prompt lists** (loading skeleton, empty, error, etc.), each in dark and light. End **every** message with a short bullet list: *what was drawn* (ids and variants), *assumptions you made*, and *anything marked `[copy needed]`*. If the message is getting long, **finish the screens you have completed, stop, and say which remain** so I can ask for them next — do not rush or drop states.

**Reply "READY" and wait for the batch prompts.**


=====================================================

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


=====================================================

BATCH B — continue the CYD design file using the context above. Add NEW artboards only; do not touch existing ones. Every artboard in dark AND light, 390×844, titled "B · <id> <name> · <variant>". Buttons shown must be only those the server would offer in that state (the server sends an `allowed_actions` list; never invent a button for a state). Strings below are verbatim; `{x}` = sample data to fill in.

Sample data: buyer @anil1304, seller shop "St. Mary's Youth Shop" (seller @seller1), order #CYD-1042, 2 × Rosary (Olive wood) ₹250.00 + 1 × Youth Cap ₹400.00 = TOTAL ₹900.00, UPI, UTR 4829 1033 7761, deliver to Anil Masih · 9000000001, Church Road, Jalandhar, Punjab 144001.

## E5 · Order detail (one screen, content by viewer) — route /orders/:id, tab bar hidden
Layout (padding 60 20 40): header = back · order number (mono) · order chip + payment chip side by side. Title block: buyer sees shop name (Anton 34) + "Ordered {date}"; seller/admin see "@{customer_username}" (Anton 34) + date. Then state banner → timeline (Pay [only while pending payment] → Placed → Accepted → Packed → Shipped → Delivered; hidden for cancelled/rejected/written-off) → Items card (rows "{title}", "₹{unit} × {qty}", line total; footer Subtotal, Shipping only if > 0, TOTAL in Anton 22) → Payment & delivery card (Method "UPI"/"Cash on delivery" · Payment {chip text} · UTR {4-4-4} mono with copy icon · "Claimed {time}" · refunds: "Refund UTR …", "Refunded {time}" · "Deliver to" name · phone / address) → Dispute card(s) → "EVIDENCE" strip → Chat preview with "Open chat" → buyer footer link "Visit {shop_name}". Sticky bottom action bar (content padding-bottom ≈170): at most one primary button, others outline beside it.
Banner = tinted card, title Archivo 700 14, body Archivo 400 12/1.5 (ended cards use Anton titles).
Artboards (9):
1. Buyer · awaiting_payment — info banner + countdown pill; title "Payment not confirmed yet"; body "Pay the seller and enter your UPI reference number to place this order."; bar: `Pay now` (primary), `Cancel order` (outline danger).
2. Buyer · claimed — "Waiting for the seller" / "You submitted UTR 4829 1033 7761. The seller confirms once the money shows in their bank."; bar: `Edit reference`, `Cancel order` not shown (cancelling is blocked after a claim). Variant 2b (overdue): warning "The seller hasn't confirmed in time" / "You can ask in the chat or report it to an admin."; bar: `Report a problem`.
3. Seller · claimed — action banner (accent-soft): "Check your bank app" / "@anil1304 says they paid ₹900.00 by UPI, reference 4829 1033 7761, at {time}. Confirm only if you see exactly this amount and reference." + "Confirm within 23:41:10" countdown; bar: `Confirm payment received` (primary, 56 high), `Reject order` (outline danger, 120 wide).
4. Seller · confirmed, status placed — stage line "New order · accept it to start"; bar `Accept order` (primary 56) + `Reject order`.
5. Buyer · disputed — danger-tint "In dispute" / "An admin is reviewing this. Add evidence or message the seller below."; dispute card shows reason, "Opened by buyer · {time}", description, status "Open"; bar `Chat` icon, `Add evidence` tile in the Evidence strip.
6. Seller · disputed (seller-reported not received) — same banner; dispute card countdown "Waiting for the buyer's proof — 23:12:40 left".
7. Admin · disputed — danger-tint "Dispute: Seller hasn't confirmed" / "Opened by buyer from "claimed". Read the chat and evidence, then resolve."; shows chat + evidence sections; bar: `Resolve dispute` (primary) (its sheet is drawn in another batch).
8. Seller · refund_due — warning "Refund the buyer" / "Send ₹900.00 back by UPI (ask for their UPI ID in the chat), then record the refund's reference number."; bar `Record refund` (primary).
9. Buyer · void + cancelled (payment window expired) — ended card, Anton title "Payment window expired", body "Nothing was charged. Reserved stock went back on sale."; no timeline; plus card "Already paid?" with button `Report it`.
Also draw small banner strips (no full screen) for: buyer confirmed "Payment confirmed" / "The seller is preparing your order."; buyer cod_pending "Cash on delivery" / "Pay ₹900.00 in cash to the seller when your order arrives."; buyer refund_due "Refund due" / "The seller must send ₹900.00 back to your UPI account. Share your UPI ID in the chat." (+ `Refund not received`); buyer refunded "Refunded" / "Refund UTR {refund_utr}."; "Rejected by the shop" / "“{reason}”"; "Closed by admin" / {note}; seller awaiting "Waiting for the buyer to pay" / "The order is reserved for {mm:ss}. It cancels itself if no payment reference arrives."
Button labels by action: claim `Pay now` · edit_claim `Edit reference` · cancel `Cancel order` · dispute `Report a problem` · confirm `Confirm payment received` · reject `Reject order` · accept `Accept order` · packed `Mark as packed` · shipped `Mark as shipped` · delivered `Mark as delivered` · refund `Record refund` · resolve `Resolve dispute`.

## E6 · Buyer sheets — draw over a dimmed E5 (artboard 1 behind)
- Cancel dialog: title "Cancel this order?"; body (UPI) "The shop will be told straight away. Reserved stock goes back on sale. Already paid? Don't cancel — submit your reference number instead."; (COD) "The shop will be told straight away. Reserved stock goes back on sale."; buttons `Keep order` / `Cancel order` (danger). Toast "Order cancelled".
- Report-a-problem sheet (title Anton 26 "Report a problem"): radio rows = reasons the server offered, in order: "The seller hasn't confirmed my payment" (screenshot required) · "I paid, but the order was cancelled" (UTR + screenshot required) · "I haven't received my refund" · "I paid but my order hasn't arrived" · "Something else" (description required, ≥10 characters). Fields: description textarea (≤1000), UTR input (only for "paid after cancel"), screenshot tile. Note card: "CYD can't move money between you and the seller. An admin can ask the seller to refund, suspend the shop and follow up through the parish." CTA `Send to admin`. Toast "Dispute opened. An admin will review it." Draw 2 artboards: reason list; "paid after cancel" selected with UTR + screenshot missing (inline errors "Attach a screenshot of your UPI payment to open this dispute"). Server errors to show in a banner variant: "The seller still has time to confirm. You can open a dispute after the confirmation deadline." · "This order already has an open dispute" · "Refunds can be disputed within 7 days".

## E7 · Order chat — route /orders/:id/chat, tab bar hidden
Header: back · "Chat" · order number · label "Seller · St. Mary's Youth Shop" / "Buyer · @anil1304" / admin "Buyer and seller". Messages oldest at top: own = right, accent bubble; other party = left, card bubble; admin = left, accent-soft bubble with "CYD ADMIN" tag; system = centred mono line (e.g. "Payment confirmed", "Dispute resolved by an admin: …"). "New messages ↓" pill when scrolled up. Composer: multiline field + send; counter "{n}/1000" after 900. Placeholders: "Message the seller" / "Message the buyer" / (buyer, refund due) "Share your UPI ID for the refund". Read-only: "This chat is read-only. It closed 14 days after the order ended." Loading: 5 alternating bubble skeletons. Error: "Couldn't load the chat" + "Tap to retry". Empty: "No messages yet. Say hello." Errors: "You are sending messages too quickly. Please wait a minute." (draft kept), "This conversation is closed", "Message is too long (max 1000 characters)".
Artboards: buyer view with 6 sample messages incl. a refund-UPI-ID exchange; admin view with CYD ADMIN message + system line; read-only; loading; empty.

## E8 · Evidence — section inside E5 + full-screen viewer
EVIDENCE section label; horizontal strip of 72 px thumbnails (kind chip under each: payment_proof "Payment", refund_proof "Refund", other "Other"; uploader @username, time) + dashed `+` tile "Add evidence" (only if allowed). Add flow: source sheet "Take photo" / "Choose from gallery" → kind chips (buyer: "Payment screenshot" / "Other"; seller: "Refund screenshot" / "Other") → upload; toast "Uploaded". Viewer: full-screen dark, pinch-zoom hint, close, uploader + time. States: empty "No evidence yet"; error "Couldn't load evidence" + retry; image failure "Tap to reload"; admin = view only (no + tile); closed order hides the + tile. Draw: strip with 3 items, add sheet, viewer.

## E9 · Seller sheets — over dimmed E5 (artboard 3 behind)
- Confirm payment (title Anton 26 "Confirm payment"): body "Open your bank or UPI app and check that ₹900.00 arrived with this reference number."; rows AMOUNT ₹900.00 · BUYER'S REFERENCE 4829 1033 7761 (copy); buyer screenshot thumbnail; input labelled "TYPE THE REFERENCE FROM YOUR BANK APP" (empty); helper "Both numbers must match exactly."; mismatch error "This doesn't match the buyer's reference. Check your bank app again, or report it as not received." with CTA disabled; CTA `Confirm payment received` (enabled on match); text button "I can't see this payment". Toast "Payment confirmed". Server case: "The buyer has changed the UPI Ref No since you looked. Please check the new one in your bank app." (new reference highlighted, input cleared). Artboards: empty input, mismatch, match.
- Payment problem sheet "Report a problem with this payment": radios "I can't see this payment in my bank" / "The amount is different"; optional description; warning "An admin will review this. The buyer gets 24 hours to upload proof, otherwise the claim is rejected."; toast "Reported to an admin. The buyer has been asked for proof."
- Reject dialog "Reject this order?": "The buyer is notified and the reserved stock goes back into your catalogue." (+ if already paid: " The buyer has already paid, so you'll have to refund them."); optional reason textarea ≤500 (shown to the buyer); buttons `Back` / `Reject order` (danger); toast "Order rejected · stock restored".
- Record refund sheet "Record refund": "Send ₹900.00 back to the buyer by UPI. Ask them for their UPI ID in the chat. Then enter the 12-digit reference number of your refund transaction."; input "REFUND UPI REF NO"; optional `Add refund screenshot`; CTA `Record refund`; toast "Refund recorded". Errors: "The refund UPI Ref No must be the refund transaction, not a payment" · "This refund UTR was already used" · "This order has no refund due".

## E10 · Fulfilment stage line + bar (seller; only after payment confirmed, or COD)
Stage line above the bar → primary button: placed "New order · accept it to start" → `Accept order` (+ `Reject order` 120 wide) · accepted "Accepted · pack it next" → `Mark as packed` · packed "Packed · hand it over for delivery" → `Mark as shipped` · shipped "On its way · mark delivered when it arrives" → `Mark as delivered` · delivered "Delivered · this order is complete" (COD adds "Cash collected") · cancelled "The customer cancelled this order." · rejected "You rejected this order. Stock was restored." Heights: primary 56, secondary 50. Errors: "Confirm the payment before processing this order". Draw a stage strip for each of the 7 rows plus one full screen (shipped).

Done when: every artboard exists in both themes; banner/button sets match the lists above exactly (no extra buttons); every sheet is drawn over a dimmed order screen; amounts in ₹ with en-IN grouping; statuses use text + glyph, not colour alone; copy is character-for-character as written.


=====================================================

BATCH C — continue the CYD design file using the context above. Add the artboards below to the existing file. Do not redraw or edit existing artboards 13 (Become a seller), 15 (My shop), 17 (Product form) or 18 (Shop applications): F1–F3 add states and sheets to 13/15, so **match the look of existing artboards 13, 15 and 18** exactly (header pattern, stat tiles, filter chips, rows, sheets). Draw every artboard in dark and light. Use the copy below word for word; do not invent other copy.

Sample data: shops "St. Mary's Youth Shop" (owner seller1, UPI stmarysyouth@okaxis, Jalandhar City deanery) and "Holy Family Candles" (owner seller2, cash-on-delivery only, no UPI); buyer buyer1; admin account "admin". Order numbers like CYD-240318-0042, totals like ₹1,250.00, shop-reason quotes like “Photos of the shop are missing.”

## F1 · Become a seller: five states (extends artboard 13)
Route /account/sell · Role: any signed-in user · Account tab selected. Header: back + mono `SELL ON CYD SHOP`. Draw five artboards from the same screen:
1. **none** (apply form): Anton 40 `Open your` / `parish shop`; body `Youth groups and individual members can apply. The diocesan office reviews every application, usually within a few days.` Logo picker row (64 tile with `+`, `Shop logo` / `Optional · square image works best`). Fields: `SHOP NAME *` (placeholder `e.g. Holy Family Candles`, error `Shop name is required`), `WHAT WILL YOU SELL?` (textarea), `PARISH`, `DEANERY` (picker), `CONTACT PHONE *` (error `Contact phone is required`), `UPI ID (OPTIONAL)` (error `Looks like name@bank`; helper `Add it to accept UPI payments. Leave it blank to sell cash-on-delivery only.`). Primary CTA `Submit application`; success toast `Application submitted`.
2. **pending**: centred card, glyph `◔` tile, Anton 34 `Application` / `in review`, body `The diocesan office is checking your details. You'll be able to add products as soon as it's approved.` Below, a key/value card: `SHOP`, `PARISH`, `PHONE`.
3. **rejected**: glyph `!`, Anton 34 `Not approved`, quote `“{reason}” · CYD office`, body `Questions? Contact the Youth Directorate office at the Bishop's House.` **No "apply again" button** (a rejected applicant cannot reapply; the office may reconsider).
4. **suspended**: glyph `‖`, Anton 34 `Shop suspended`, reason quote, body `Your products are hidden from the marketplace. Open orders can still be completed. Contact the CYD office to reinstate the shop.` Button `Open my orders`.
5. **approved**: glyph `✓`, Anton 34 `You're approved`, button `Open my shop`.
Done when: five artboards share one layout; no state has an apply-again button; the form shows one error state.

## F2 · My shop, suspended (orders-only) mode (extends artboard 15)
Route /my-shop · Role: owner of a suspended shop. Same header as artboard 15 but the mono line reads `‖ SUSPENDED SHOP` in `mute`. Top warning card: title `Your shop is suspended`, body `Your products are hidden from the marketplace. You can still ship, refund and answer on orders you already have. {reason}` then `Contact the CYD office to reinstate the shop.` Three stat tiles: `To confirm` (2), `To ship` (1), `Refunds due` (1); no Products tile. Tab chips: `Orders` only plus a read-only `Shop profile`; **no Products tab and no "Add product" button**. Profile fields are read-only with helper `Editing is paused while the shop is suspended.` Orders tab shows 3 order cards in the artboard-15 style (one with the `Needs your response →` footer). Draw: Orders tab; Shop profile tab (read-only).
Done when: nothing on screen offers adding or editing products.

## F3 · Shop profile tab, password-gated UPI change (extends artboard 15)
Route /my-shop, Shop profile tab · Role: seller (approved). Fields: banner picker (full width, 120 high, `Change banner`), logo picker (`Change logo`), `SHOP NAME`, `DESCRIPTION`, `PARISH`, `DEANERY`, `CONTACT PHONE`, `UPI ID` with lock hint `Changing this needs your password`; CTA `Save changes`; toast `Shop updated`; no-changes toast `Nothing to save`. When the UPI ID changed, a bottom sheet: title `Confirm your password`; body `Buyers send money straight to this UPI ID, so we need your password to change it. Orders already placed keep the UPI ID the buyer was told to pay.`; obscured password field with show/hide; buttons `Back` / `Change UPI ID`. Variant when clearing the field adds: `Clearing it makes your shop cash-on-delivery only.` Error under the field: `Enter your current password to change the UPI ID`. Draw: profile tab with the lock hint; sheet default; sheet error; sheet clearing variant.
Done when: the sheet appears only for a UPI change; the error sits under the password field and the sheet stays open.

## F4 · Admin: payment disputes queue
Route /admin/disputes · Role: admin only · tab bar hidden. Back button; mono `ADMIN`; Anton 40 `Payment` / `disputes`; filter chips `Open · 3` (selected), `Resolved`, `All`. Rows (cards, padding 14): line 1 reason label (Archivo 700 14) + `Open` / `Resolved` chip; line 2 order number (mono) + total; line 3 `{shop} · @{buyer} → @{seller}` (mono 10, faint); line 4 `Opened by buyer · 2 h ago` (resolved rows show the resolution label instead). Sample open rows: `Payment not received` (St. Mary's Youth Shop · @buyer1 → @seller1, ₹1,250.00, opened by seller); `Wrong amount`; `Seller hasn't confirmed`. Resolved row: `Refund not received` with `Refund confirmed`, and one with `Resolved automatically`. States: loading (3 skeletons); error `Couldn't load disputes` + `Tap to retry`; empty `No open disputes` / `Everything is resolved.` (`No disputes yet` under All). Draw: Open list; Resolved list; loading; empty; error.
Done when: all three filters and the loading, empty and error states exist; rows match the artboard-18 row style.
Reason labels used across the app: `Payment not received`, `Wrong amount`, `Seller hasn't confirmed`, `Paid after the order was cancelled`, `Refund not received`, `Paid order not delivered`, `Other problem`.

## F5 · Admin: dispute detail and resolve sheet
Route /orders/:id (admin variant of the order detail) · reached from F4; tab bar hidden. Order-detail layout with a banner `Dispute: Payment not received` / `Opened by seller from "claimed".`; sections: payment claim (UPI Ref No grouped `4-4-4`, amount, time), evidence from both sides (image tiles with kind chips `Payment proof`, `Refund proof`, `Other`), and the chat thread; admin messages carry a `CYD ADMIN` tag. Sticky bottom bar: primary `Resolve dispute`.
**Resolve sheet** (86% height): title `Resolve dispute`; radio rows, each a title plus one consequence line; options depend on where the dispute started. Draw one sheet per origin:
- **Opened from a payment claim:** `Payment confirmed` (the seller must fulfil the order) · `Claim rejected` (order cancelled, stock returned, no payment recognised) · `Refund required` (order cancelled, stock returned, the seller must refund the buyer).
- **Paid after the order was cancelled:** `Refund required` (the seller must refund the buyer) · `Claim rejected` (no payment found).
- **Paid order not delivered:** `Refund required` (order cancelled; stock returned if it was not shipped) · `Seller must fulfil` (the order stays open).
- **Refund dispute:** `Refund confirmed` (case closed) · `Refund still required` (the seller must refund again) · `Close as unrecoverable` (written off; use when the seller is unreachable).
Below the options: textarea label `NOTE EXPLAINING THE DECISION · both sides see it`, minimum 5 characters. On refund outcomes show an info card: `The platform can't move money. If the seller won't refund, suspend the shop and follow up through the parish.` CTA `Resolve dispute` (disabled until an option and a note exist; danger-filled only for `Close as unrecoverable`). Success toast `Dispute resolved`; errors shown inline: `A note explaining the decision is required`, `This dispute is already resolved`. Also draw the resolved state: banner `Resolved: Claim rejected` with the note, and the auto-resolved variant `Resolved automatically` with note `The buyer did not upload payment proof in time.`
Done when: each origin shows only its own options; the CTA is disabled without a note; the resolved and auto-resolved variants exist.


=====================================================

BATCH D — continue the CYD design file using the context above. Add new artboards only; do not change existing ones. Draw every screen at 390×844, dark and light side by side, named "<id> <title>". Use the exact copy below (✎ = new wording). I may paste D1, D2, D3, D4 as separate messages; do them one at a time.

These screens did not exist in the shop mockup. Roles: admin and user (CYD manager) manage member profiles; profile_holder is the youth member. Sample data (use everywhere): member "Anil Masih", father Joseph Masih, mother Mary Masih, phone 9000000001, born 13/04/2001, baptised 02/06/2001, qualification B.Com, involvement since 2019, deanery Amritsar, parish Lahorigate, level parish, designation Member, issue date 10/03/2026 (expires 10/03/2028). Other deaneries: Ajnala, Dhariwal. Other parishes: Chamiyari, Gumtala, Qadian. Designations: Member, President, Secretary, Treasurer.

THE ID CARD: portrait 146.3 × 221.8 mm (aspect 0.66), always light, rounded 12, 1px hairline border outside it. Draw it as a placeholder: level background artwork, photo box (58:67) near the top, name large below, then label/value rows (Phone, Date of Birth, Qualification, Father's Name, Address, Designation, Deanery/Parish, Issue/Valid dates). I will upload the real Parish, Deanery and Dexco background JPGs in this chat — use them as the card background if provided.

VALIDITY CHIP (text + glyph, 24–26 high): Valid (green) · Expires in 12 days (amber) · Expired (red). Valid 2 years from issue date; amber when ≤ 60 days remain.

=== D1 — Login, Splash, My ID, Card preview, Update photo ===

ID-01 Login · /login · signed-out. Hero image area top (max(260, 34% height)) fading into bg; mono label "CATHOLIC YUVA DHARA · JALANDHAR"; Anton 40 title "SIGN IN"; Archivo 13 muted "Welcome back! Please sign in to your account". Fields USERNAME, PASSWORD (show/hide). Primary 56 "Sign in" (loading "Logging in…"). Under it, muted 12 ✎ "Profile holders: use the username and password given to you by the CYD Office." Variants: idle; error banner (danger, 1px danger border) "Invalid credentials"; "Too many failed login attempts. Please try again in 15 minutes."; "Could not reach the server. Check your connection and try again."; cold start ✎ "Waking up the server… this can take up to a minute."
ID-02 Splash · centred CYD wordmark (Anton) on bg, thin accent progress line; no text.
ID-03 My ID · tab 1 for holders (tab label "My ID"; tabs: My ID · Shop · Cart · Orders · Account). Anton 40 "MY ID"; muted "View your profile information and ID card". Card at width 350, tappable. "STATUS": chip left, mono "Expires 10/03/2028" right, tinted message box: valid "Your ID card is valid and in good standing." / amber "Your ID card will expire in 12 days. Please contact CYD Office for renewal." / expired "Your ID card has expired. Please contact CYD Office for renewal." Primary 56 "View full card", outline 50 "Update photo". Section "MY DETAILS": name Anton 24 + chip "Amritsar · Lahorigate", rows Phone · Date of Birth · Qualification · Father's Name · Address · Mother's Name · Designation · Level · Date of Baptism · Involvement since · Issue Date. Variants: loading; empty "No profile found / Please contact CYD Office."; error "Couldn't load your ID"; offline banner "OFFLINE · UPDATED 4:12 PM"; no photo: ✎ "Your card has no photo yet. Add one so it can be shared or printed." and "Add photo".
ID-10 Card preview/export · always dark surface (bg #0A0A0B), bar hidden. Top: back, mono "ID CARD", overflow ⋯. Name Archivo 700 15 + validity chip; mono "Issued 10/03/2026 · Expires 10/03/2028". Card stage centred, pinch-zoom hint ✎ "Pinch to zoom". Sticky bottom: primary 56 "Share card", two outline 50 "Save PDF" · "Print", link ✎ "Print tip: choose "Actual size / 100 %" so the card prints at its real size." Banners: expired (red tint) "This ID card has expired on 10/03/2024"; expiring (amber) "This ID card will expire in 12 days". Variants: exporting (spinner + "Preparing…", 2px accent bar); More sheet (Share as JPG (smaller) · Share original quality · Print on A4 (card centred) · Edit profile · Delete profile).
ID-04 Update photo · bar hidden · title "UPDATE PHOTO". Info card: "Limited Access: You can only edit your photo. For other changes, please contact CYD Office." Photo tile 200×231 radius 16. Outline buttons "Take photo", "Choose from gallery". Sticky primary "Update photo" (disabled until a photo is picked; loading "Updating…"). Also draw the crop screen (dark, fixed 58:67 frame, mono ✎ "PINCH AND DRAG TO FIT THE FACE", "Cancel" / "Use photo") and dialog "DISCARD THIS PHOTO?" — "Your new photo has not been saved." — "Keep editing" / "Discard".

=== D2 — Profiles list, filter sheet, Profile detail ===

ID-05 Profiles · tab 1 for admin/user (tab label "Profiles"). Title row: Anton 40 "PROFILES" + 44 accent circle "+" (single accent control). Section "OVERVIEW": admin 2×2 stat tiles (Anton 28, mono 9 label): TOTAL PROFILES 184 · WITH PHOTOS 171 · CREATED TODAY 3 · THIS WEEK 17; user variant one wide tile ✎ "PROFILES YOU CREATED" 42. Search field 48 "Search profiles…" + 48 outline filter button (accent dot when active). Active-filters row: mono "ACTIVE FILTERS", removable chips "Search: "Anil"" · "Deanery: Amritsar" · "Parish: Lahorigate", text button "Clear all". Line "Showing 25 of 184 profiles". Member row (radius 20, padding 14, min height 84): photo thumb 56×70, name Archivo 700 15, "Member · parish" muted 12, mono 10 "Amritsar · Lahorigate", validity chip top right, overflow ⋯ 44×44; level chips: parish green, deanery amber, dexco blue. Draw 5 rows with mixed chips (one without photo). Variants: loading skeleton (6 rows); empty ✎ "No profiles yet" / "Create the first ID card to see it here." + "Create ID card"; filtered-empty "No profiles found" + "Clear filters to see all profiles"; error "Failed to fetch profiles" + "Tap to retry"; offline banner; row action sheet: Preview ID card · Edit · Share card · Delete (danger).
ID-06 Filter sheet · title "FILTERS", "Reset" top right, sticky "Apply filters" + "Cancel". DEANERY (first row "All deaneries"), PARISH (disabled with "Choose a deanery first" until chosen, first row "All parishes"), LEVEL chips parish / deanery / dexco, DESIGNATION select, SORT BY radios: Newest first · Oldest first · Name A–Z · Name Z–A · Deanery A–Z · Parish A–Z. Show Amritsar chosen with its parish list open.
ID-07 Profile detail · bar hidden, back button over photo. Photo full width (aspect 58:67, radius 20); name Anton 32; chips: level, designation, validity, mono "Issued 10/03/2026 · Expires 10/03/2028". Details card rows: Phone · Father's Name · Mother's Name · Date of Birth · Date of Baptism · Educational Qualification · Involvement since · Deanery · Parish · Postal Address · Issue Date; admin also ✎ "Created by" and "Created on". Collapsed row ✎ "Holder login" expanding to "The username is the first four letters of the name plus the day and month of birth (for example anil1304). The password starts as the holder's phone number until they change it." Sticky bar: primary "ID card", outline "Edit", danger text "Delete profile". Variants: loading; 404 "Profile not found" / "It may have been deleted, or it belongs to another user." + "Back to profiles".

=== D3 — Profile form, Credentials dialog, Delete ===

ID-08 Profile form · create "NEW ID CARD" (right "Reset") / edit "EDIT PROFILE" · bar hidden. Sections: PHOTO — tile 96×111 radius 14, dashed when empty with "+" and "Add photo", filled shows "Change"; helper "JPG, PNG, GIF, BMP or WebP. The app shrinks large photos for you." PERSONAL — Name, Father's Name, Mother's Name, Date of Birth (DD/MM/YYYY picker), Date of Baptism, Educational Qualification, Phone (helper ✎ "Also the holder's first password."), Involvement since (helper ✎ "For example: 2019"). CHURCH — Deanery, Parish (dependent select), Level chips Parish / Deanery / Dexco (helper ✎ "Decides the card design: Parish, Deanery or Dexco."), Designation. ADDRESS — Postal Address (multi-line). CARD — Issue Date (default today; helper ✎ "The card is valid for two years from this date."). Sticky primary 56 "Generate ID Card" (loading "Submitting…") / "Update Profile". Draw: empty create; edit prefilled; all-errors state (each field "<Label> is required.", e.g. "Name is required.", plus "Invalid phone number format." and photo "Please upload a photo"); server banner "Validation failed" above the button; dialog "DISCARD CHANGES?" — ✎ "Your changes will be lost." — "Keep editing" / "Discard".
ID-09 Credentials dialog · over the form, inset 24, radius 24. Title "PROFILE CREATED"; text "Login credentials were generated for the profile holder:"; ok-tinted card, label "LOGIN CREDENTIALS CREATED", two copy-rows USERNAME anil1304 · PASSWORD 9000000001 (DM Mono 15, tap copies; toasts "Username copied to clipboard" / "Password copied to clipboard"). Caption "Please share these credentials with the profile holder securely." + ✎ "You will not be able to see this password again." Buttons stacked: primary "Preview ID card", outline "Share credentials", text "Close". Second variant: title "PROFILE RESTORED" with ✎ "A deleted profile with the same name and phone number was found and has been restored. The holder's login was re-activated and its password was reset to their phone number."
ID-11 Delete dialog · "DELETE PROFILE"; ✎ "Anil Masih's profile will be removed from the list and their login will stop working. To bring it back, create the profile again with the same name and phone number."; "Keep it" / danger "Delete profile".

=== D4 — Account, Change password, Create user, Appearance, Sign out, global states ===

ID-12 Account · tab 5. Anton 40 "ACCOUNT". Identity card: avatar 56 initials, username "anil1304", subline "Amritsar · Lahorigate" (admin/user: role label), role chip "Profile holder" / "Administrator" / "Standard user", mono "JOINED MAR 10, 2026". Row groups (row height 56, label Archivo 600 14 + muted 12 + chevron): ACCOUNT — Profile information "Username and email" (admin, user) · Update photo "Change the photo on your ID card" (holder) · Change password · Create user "Add an administrator or standard user" (admin) · Appearance "System, light or dark"; SHOP — My addresses · Become a seller or My shop · Shop applications (admin) · Payment disputes (admin, badge 2); ABOUT — Privacy policy · App version "v1.0.0 (1)". Outline danger button 50 "Sign out". Draw holder, user, admin variants.
ID-13 Account information · view: avatar 80, username Anton 24, role chip; rows Username · Email Address · Account Type · Member Since · Last Updated; text button "Edit Profile". Edit: info card "Update your profile information below. Changes will be saved immediately."; fields USERNAME, EMAIL ADDRESS; "Cancel" / "Save Changes". Errors: "Must be a valid email address" · "Username or email already exists".
ID-14 Change password · title "CHANGE PASSWORD", muted "Update your account password for security". Info card "Password Requirements: • At least 6 characters long • Contains uppercase and lowercase letters • Contains at least one number". Fields CURRENT PASSWORD, NEW PASSWORD, CONFIRM NEW PASSWORD (show/hide each). Strength meter under the new field: mono "STRENGTH: Weak" with a 3-segment bar (1 red, 2 amber "Medium", 3 green "Strong"). Primary 56 "Change Password" (loading "Changing…"). Errors: "Current password is required" · "Password must contain at least one uppercase letter, one lowercase letter, and one number" · "Passwords must match" · "Current password is incorrect". Success card "Your password has been changed successfully!". Draw weak, medium, strong, error, success.
ID-15 Create user · admin only · title "CREATE NEW USER", muted "Add a new user to the system (Admin Only)"; amber warning "Admin Privileges: You are creating a new user account. Please ensure the user information is correct before proceeding." Fields USERNAME, EMAIL ADDRESS, PASSWORD, USER ROLE radios "Standard User" (default) / "Administrator"; "Reset Form" text + primary "Create User" (loading "Creating…"). Success card "User has been created successfully! They can now login with their credentials." Dialog ✎ "CREATE AN ADMINISTRATOR?" — "Administrators can see every profile and manage all users and shops." — "Back" / "Create administrator".
ID-16 Appearance sheet · "APPEARANCE", radios System · Light · Dark. ID-17 Sign out dialog · "SIGN OUT" — ✎ "You will need to sign in again. The cart on this device will be cleared." — "Stay signed in" / "Sign out".
ID-18 Global states (one artboard, four panels): login banner "Session expired. Please login again."; ✎ "Your account is no longer active. Please contact CYD Office."; offline strip (28 high, mono 10) "OFFLINE — SHOWING SAVED DATA"; error card "You're offline" / "Check your connection and try again." + "Tap to retry"; toast ✎ "You don't have access to that screen."
Done when: every ID-01…ID-18 artboard exists in both themes, with the variants listed.
