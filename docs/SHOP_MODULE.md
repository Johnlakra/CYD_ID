# Shop Module — Frontend Notes

Full architecture + API reference lives in the backend repo:
`cyd_id_be/docs/SHOP_MODULE.md` (and `cyd_id_be/docs/PAYMENTS.md` for the payment-gateway risk
notes). This file only covers the frontend-specific pieces.

## Why this exists

The `shop-and-thought` branch existed before this work as an empty branch name — no prior shop
UI, no prior design doc. This is a from-scratch build of a multi-vendor marketplace on top of
the existing CYD ID Card Management System.

## Structure

- `src/pages/shop/ShopApp.jsx` — single entry point, wired into `src/components/Dashboard.jsx`'s
  menu under a `"Shop"` item visible to **every** role (shop ownership is an in-app capability,
  not a role — see the backend doc's "shop ownership is additive" design note). Owns its own
  internal view state; this app has no react-router anywhere and Shop doesn't introduce one.
- `src/pages/shop/AdminShopModeration.jsx` — wired separately into `Dashboard.jsx`, gated to
  `user.role === 'admin'`, for approving/rejecting/suspending shop applications.
- `src/components/shop/` — shared pieces (`ProductCard`, `OrderStatusChip`, `EmptyState`,
  `MoneyText`, etc.) reused across the shop screens.

## Conventions carried over from the rest of the app

- Visual language matches `Dashboard.jsx`: MUI `sx` prop, `borderRadius: 4` cards, soft
  `alpha(theme.palette.X.main, 0.1-0.2)` gradients, hover lift + glow.
- Image uploads reuse `src/components/EncodeBase64.jsx` to turn a selected file into the base64
  string the backend's `saveBase64Image`/Cloudinary pipeline expects.
- API calls go through `src/api/apiClient.js`'s shared `apiClient` (bearer token already
  attached via its interceptor).
- Feedback uses the app's existing single `react-toastify` `<ToastContainer />`.

## Money

All prices arrive from the API as integer **paise** in `*_paise` fields. Always display
`₹` + `(value_paise / 100).toFixed(2)`. When creating/editing a product, send **rupees** in
`price`/`compare_at_price` (e.g. `199.50`) — the backend converts to paise; never send a
`*_paise` field from the frontend.

## Cart

The cart is **client-side only** (no cart API) — persisted in `localStorage`, grouped by
`shop_id`. At checkout, a cart spanning multiple shops is split into one `POST /shop/orders`
call per shop (see the backend doc's "one order per shop" design note).

## UPI payment flow (YouPI-PG)

Read `cyd_id_be/docs/PAYMENTS.md` before touching this — YouPI-PG is explicitly an experimental,
non-bank-certified gateway. The payment-processing screen:
1. Calls `POST /shop/payments/initiate` with the order id.
2. Dynamically injects the returned `checkoutScriptUrl` as a `<script>` with
   `data-youpi-key`/`data-currency`, then calls `window.Youpi.pay(...)` once it loads.
3. Must degrade gracefully if that script fails to load (there is usually no real YouPI-PG
   server running) — show a retry state, never a blank crash.
4. Polls `GET /shop/payments/:orderId/status` regardless of script load success, since that's
   the real source of truth, not the script.
