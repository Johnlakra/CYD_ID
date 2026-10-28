# Claude Code Prompt — Build the CYD Shop Flutter App

Paste this into a Claude Code session (ideally with the `cyd_id_be` repo attached for API
reference, and your exported Claude Design screens/design-system attached as images) when
you're ready to build the native app.

---

## Prompt to paste

> Build a Flutter app called **CYD Shop** — the mobile client for the Shop module of the CYD ID
> platform (a multi-vendor marketplace for Catholic youth in the Diocese of Jalandhar: parish
> youth groups and individuals run shops, other members buy from them).
>
> **Backend**: the API already exists and is finished — Node/Express/MySQL, documented in full
> in `docs/SHOP_MODULE.md` and `docs/PAYMENTS.md` in the `cyd_id_be` repo. Read both before
> writing any code. Base URL and auth: reuse the existing CYD ID auth system — `POST /auth/login`
> with `{username, password}` returns `{token, user}`; store the JWT securely
> (`flutter_secure_storage`) and attach it as `Authorization: Bearer <token>` on every request
> (build one Dio/http interceptor for this, mirroring what `src/api/apiClient.js` does in the
> existing React app — read that file for the exact pattern: token refresh on 401 redirects to
> login).
>
> **Design**: I have a Claude Design output for every screen (attached as reference images /
> a design system export) built from `docs/design/SHOP_UI_CLAUDE_DESIGN_PROMPT.md` in this repo
> — match it exactly: color tokens, type scale, corner radii, button/card/chip styles, light
> and dark mode, the bottom navigation (Home/Categories/Cart/Orders/Account). Don't invent a
> different visual language — implement the attached design.
>
> **Scope — build all of these screens, wired into one real navigation flow** (use `go_router`
> for navigation, `riverpod` for state management, `dio` for networking, `flutter_secure_storage`
> for the JWT, `cached_network_image` for product/shop images):
>
> Customer: Marketplace Home, Search & Filter, Shop Storefront, Product Detail, Cart, Checkout
> (address + payment method, splitting a multi-shop cart into one order per shop), Payment
> Processing (UPI via the gateway described in `docs/PAYMENTS.md` — degrade gracefully if its
> checkout step is unreachable, and poll `GET /shop/payments/:orderId/status` as the real source
> of truth), Order Confirmation, My Orders (list + status-filtered tabs), Order Detail (with a
> status timeline and a conditional Cancel action), Addresses (CRUD), Become a Seller
> (application form + pending/rejected/suspended states).
>
> Shop Owner: My Shop dashboard (Products tab with add/edit/archive + image upload, Orders tab
> with status-appropriate action buttons only — Accept/Reject on `placed`, Mark Packed on
> `accepted`, Mark Shipped on `packed`, Mark Delivered on `shipped` — never show a transition the
> backend's `ALLOWED_TRANSITIONS` map in `controllers/orderController.js` would reject, Shop
> Profile tab).
>
> Admin: Shop Applications queue (filter by status, Approve/Reject-with-reason/Suspend).
>
> **Non-negotiables**:
> - All money fields from the API are integer paise (`*_paise`) — display as
>   `₹${(paise / 100).toStringAsFixed(2)}`; when creating/editing a product, send plain rupee
>   numbers in `price`/`compare_at_price`, never paise.
> - Every list screen needs a real loading (skeleton, not just a spinner), empty, and error
>   state — not just the happy path.
> - Image uploads are sent as base64 data URLs in the JSON body (same convention as the
>   existing web app's `photo`/`logo`/`banner`/`images` fields) — not multipart.
> - Respect the order status state machine exactly as documented; don't let the UI offer an
>   action the backend will reject.
> - Treat the YouPI-PG payment integration as experimental (per `docs/PAYMENTS.md`) — never let
>   a slow/failed payment-gateway script load block the rest of the app; the polling endpoint is
>   the real truth.
>
> Start by reading `docs/SHOP_MODULE.md`, `docs/PAYMENTS.md`, and the attached design images in
> full, then propose the project structure (folder layout, state-management approach per
> feature) before writing screens, so I can confirm it matches what I expect.

---

## Before you paste this

1. Export your finished Claude Design screens (or at minimum the design-system sheet: colors,
   type scale, component styles) and attach them to the Claude Code session, or paste their
   Artifact link if you used one.
2. Make sure the Claude Code session has both `cyd_id_be` (for the API docs) and, if useful,
   `cyd_id` (for the existing web app's conventions — auth flow, image-upload pattern) attached.
3. Decide to whom the Flutter app logs in — it's the same `users` table/JWT system as the web
   app, so any existing admin/user/profile_holder account works; shop ownership is still just an
   approved row in `shops`, same as on the web.
