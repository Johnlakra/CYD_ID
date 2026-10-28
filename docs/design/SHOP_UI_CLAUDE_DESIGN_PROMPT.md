# Claude Design Prompt — CYD Shop (paste this whole thing into Claude Design)

Design a modern, award-winning-quality mobile-first e-commerce app UI called **"CYD Shop"** —
a multi-vendor marketplace serving Catholic youth across the Diocese of Jalandhar, where parish
youth groups and individuals run small shops (devotional items, books, apparel, event tickets,
handmade crafts, snacks) and other members buy from them. Think **Meesho/Etsy energy** — warm,
community-driven, trustworthy, a little joyful — not a cold corporate storefront. This is for a
youth audience, so it should feel contemporary and alive, but it also carries faith-community
trust, so keep it clean and credible rather than loud or gimmicky.

Design **every screen below** at high fidelity, as a connected flow (not isolated screens) for
three roles: **Customer**, **Shop Owner**, **Admin**. This will later be rebuilt as a real
Flutter app from your screens, so be exact and complete: real copy (no "Lorem ipsum"), real
component states (loading/empty/error, not just the happy path), exact spacing/typography
decisions, and clear visual hierarchy. Treat this as production UI design, not a mood board.

---

## 1. Design direction

- **Mood**: warm, community, trustworthy, youthful, optimistic. Not minimal-cold, not
  loud-gimmicky. Somewhere between a modern DTC storefront and a community marketplace.
- **Color system**: a warm primary (terracotta/saffron/marigold range — nods to the
  diocese/community context without being literally religious-iconographic) paired with a deep,
  trustworthy ink/navy for text and a clean neutral off-white background. One confident accent
  for calls-to-action. Define the full scale: primary (50–900), neutral/gray (50–900), success,
  warning, error, info — and show both **light and dark mode** for every screen.
- **Typography**: one expressive display typeface for headings/hero moments (something with
  warmth and a little personality, not generic sans), one highly legible workhorse sans for
  body/UI text. Define a full type scale (display, h1–h4, body-lg, body, body-sm, caption,
  overline) with weights and line-heights.
- **Shape language**: generously rounded corners (16–24px on cards, fully rounded pills on
  buttons/chips/badges), soft layered shadows (not flat material-default shadows — give depth
  with warmth, e.g. a soft colored shadow under primary buttons/cards), generous whitespace.
  Micro-interactions: gentle scale/lift on tap, skeleton loading (shimmer) instead of spinners
  wherever a list is loading, satisfying success states (confetti-adjacent but tasteful — e.g. a
  warm checkmark animation on order placed/payment success, not literal confetti every time).
- **Imagery**: product photography in clean, consistent card crops (1:1 or 4:5), category icons
  as friendly rounded glyphs (not photographic), empty-state illustrations that feel hand-drawn
  and warm rather than generic stock "empty box" clipart.
- **Accessibility**: minimum AA contrast everywhere, tap targets ≥44px, never color-only status
  (always pair a status color with an icon/label), readable at default phone font sizes.

Show a short **design system sheet** first: color tokens (light+dark), type scale, button
variants (primary/secondary/text/destructive, each in default/hover/pressed/disabled), form
field states (default/focused/error/disabled), badge/chip styles for order status, card
anatomy, spacing scale (4/8/12/16/24/32/48).

---

## 2. Information architecture (so you design the right navigation)

Bottom navigation (customer view, mobile): **Home** (marketplace) · **Categories** ·
**Cart** (with item-count badge) · **Orders** · **Account**.
The "Account" area is where role-specific entry points live: "My Addresses", "Become a Seller"
/ "My Shop" (depending on status), and for admins, "Shop Applications". Design the bottom nav
itself, including its active/inactive icon states and the cart badge.

---

## 3. Customer screens — design every one of these, in order, as a flow

### 3.1 Marketplace Home
- Top bar: location/greeting ("Hi Anil 👋"), search bar (tappable, leads to search screen),
  notification bell.
- Horizontally scrollable **category rail** (Devotional Items, Books & Booklets, Apparel &
  Merchandise, Event Tickets, Handmade & Crafts, Food & Snacks, Other) — rounded icon + label
  chips.
- A **hero/promo banner carousel** (e.g. "New shops just joined!", "Advent collection is here").
- **Featured shops** horizontal rail — shop logo, name, parish/deanery tag, "Visit Shop" tap
  target.
- **Product grid** (2-column on mobile): image, title (2-line clamp), shop name (small, muted),
  price with strikethrough compare-at price when present, a small heart/wishlist icon top-right
  of the image (optional nice-to-have, show it even if wishlist isn't in the API spec below —
  design it as a future-ready affordance).
- Infinite-scroll loading skeletons for the grid.
- **Empty/error state**: a friendly illustration + "Couldn't load products — tap to retry."

### 3.2 Search & Filter
- Search field with live suggestions (recent searches, trending categories).
- Results grid (same product card as Home) with a **filter/sort bottom sheet**: category,
  parish/deanery, price range slider, sort (Newest, Price low→high, Price high→low).
- Empty state for "no results for 'X'" with a suggestion to browse categories instead.

### 3.3 Shop Storefront
- Banner image behind a logo + shop name + small "Approved Seller" trust badge + parish/deanery
  tag + a short description.
- Category tabs scoped to this shop's own products.
- Product grid (same card component as Home, reused).
- Sticky "Back to marketplace" affordance.

### 3.4 Product Detail
- Swipeable image gallery with dot indicator (support up to 6 images).
- Title, shop name (tappable → storefront), price (large, with compare-at price struck through
  beside it if present), stock indicator ("Only 3 left!" urgency state vs. "In stock" vs.
  "Out of stock" disabled state).
- Full description, expandable if long.
- Quantity stepper.
- Sticky bottom bar: "Add to Cart" (secondary style) + "Buy Now" (primary style), both full
  width on mobile, side by side.
- A toast/snackbar design for "Added to cart ✓" with a "View Cart" action.

### 3.5 Cart
- Items grouped **by shop**, each group with its own shop header and subtotal.
- Per-item row: thumbnail, title, unit price, quantity stepper (+/-), remove (swipe-to-delete on
  mobile or an explicit trash icon), line total.
- Price summary card: subtotal, (shipping — show as "Arranged directly with seller" since this
  marketplace has no shipping-cost calculation), grand total.
- Empty cart state: friendly illustration + "Your cart is empty" + "Browse Shops" CTA.
- Sticky bottom "Proceed to Checkout" button showing the grand total inline on the button itself.

### 3.6 Checkout
- Step indicator: Address → Payment → Review.
- **Address step**: list of saved addresses as selectable cards (radio-style selection, default
  address pre-selected), "+ Add new address" opens an inline form/sheet (full name, phone, line
  1, line 2, city, state, pincode, label, "set as default" toggle).
- **Payment step**: two large selectable cards — "Pay by UPI" (with a small "Powered by UPI"
  mark) and "Cash on Delivery" — each with a one-line description. If the cart has items from
  multiple shops, show a clear note: "Your order will be placed as N separate orders — one per
  shop."
- **Review step**: order summary per shop (collapsed/expandable), address recap, payment method
  recap, final "Place Order" button.

### 3.7 Payment Processing (UPI)
- Centered state: animated pulsing UPI/payment icon, "Waiting for payment confirmation…",
  secondary text: "This can take a minute or two." (be honest that this can be slow — the real
  gateway behind this detects payment via SMS reading, not an instant bank API).
- A manual "I've paid — check again" button below the spinner.
- **Failure/unavailable state**: if the payment service itself can't be reached — a calm error
  illustration, "Payment service is temporarily unavailable", "Retry" + "Switch to Cash on
  Delivery" buttons.
- **Timeout state** (if polling runs long with no confirmation): "Still waiting — you can keep
  this open, or we'll notify you when it's confirmed" with a "Go to My Orders" escape hatch.

### 3.8 Order Confirmation
- Big warm success check animation, "Order placed!", order number, estimated "the seller will
  confirm your order soon" message, "View Order" + "Continue Shopping" buttons.

### 3.9 My Orders (list)
- Tabs or filter chips: All / Pending Payment / Placed / Accepted / Packed / Shipped /
  Delivered / Cancelled / Rejected.
- Order card: shop name, order number, date, item thumbnails (stacked/overlapping preview),
  total, a status chip (color-coded — design a distinct color+icon per status).
- Empty state per filter ("No delivered orders yet").

### 3.10 Order Detail
- Status **timeline/stepper** across the top (Placed → Accepted → Packed → Shipped →
  Delivered), with Cancelled/Rejected as an alternate red end-state design.
- Item list (thumbnail, title, qty, price).
- Delivery address card.
- Payment summary (method, status, UTR if available).
- Conditional action button: "Cancel Order" only when status allows it (pending_payment/placed)
  — show it, then show a confirmation dialog ("Are you sure you want to cancel this order?").

### 3.11 Addresses (manage)
- List of address cards with Edit/Delete, "Set as default" affordance, "+ Add Address" button,
  same add/edit form as the checkout inline version but as a full screen here.

### 3.12 Become a Seller (application)
- Warm, inviting intro ("Start your own shop on CYD Shop"), short benefits list (reach youth
  across the diocese, manage your own catalog, get paid directly).
- Form: shop name, description, parish, deanery, contact phone, UPI ID (for payouts), logo
  upload (circular preview).
- Submit → **Pending Review state**: illustration + "Your application is under review" +
  summary of what was submitted + expected next steps.
- **Rejected state**: shown with the admin's rejection reason and a "Contact support" link.
- **Suspended state**: a clear, serious-but-calm notice.

---

## 4. Shop Owner screens

### 4.1 My Shop — Dashboard (approved shop)
- Header: shop logo/banner, name, status badge ("Approved ✓").
- Quick stats row: total products, pending orders count, this week's orders — card tiles with
  the same warm gradient-card style as the rest of the app.
- Three-tab layout: **Products** / **Orders** / **Shop Profile**.

### 4.2 My Shop — Products tab
- Product list (own card layout — slightly denser than the customer grid, show stock count and
  status badge: Draft/Active/Out of Stock/Archived).
- "+ Add Product" floating action button → **Add/Edit Product form**: title, description,
  price, compare-at price (optional), stock quantity, category picker (chips or dropdown from
  the category list), up to 6 image uploads (drag-to-reorder, first = primary), status toggle.
- Archive action with confirmation ("This removes it from the marketplace, but keeps its order
  history.").

### 4.3 My Shop — Orders tab
- List of incoming orders (same status-chip language as customer Order list), newest first.
- Order detail (shop-owner view): items, customer's delivery address, payment status, and
  **only the valid next-action buttons for the current status** — e.g. status "Placed" shows
  big "Accept Order" (primary) and "Reject" (destructive/text) buttons; "Accepted" shows "Mark
  as Packed"; "Packed" shows "Mark as Shipped"; "Shipped" shows "Mark as Delivered". Design each
  of these 4 button-states distinctly so it's obvious only one stage's actions are ever visible.

### 4.4 My Shop — Profile tab
- Editable shop name/description/parish/deanery/contact/UPI ID, logo + banner upload.

---

## 5. Admin screens

### 5.1 Shop Applications (moderation queue)
- Filter tabs: Pending / Approved / Rejected / Suspended / All.
- Each row: shop name, owner username/email, parish/deanery, submitted date, status badge.
- Tap → detail sheet: full application details + logo preview + **Approve** (primary, green
  accent), **Reject** (opens a reason text field, required before confirming), **Suspend**
  (for already-approved shops, with its own reason field) actions.

---

## 6. Deliverable format

Produce high-fidelity screens for all of the above (customer: 12, shop owner: 4, admin: 1 = 17
screens minimum, each with light + dark mode = 34 total surfaces), plus the design-system sheet
from Section 1. Show key states (loading/empty/error/success) inline next to their screen,
not as an afterthought. Keep every screen consistent with the shared design system — same
corner radii, same card anatomy, same button styles, same status-chip colors — so this reads as
one coherent app, not 17 unrelated mockups.
