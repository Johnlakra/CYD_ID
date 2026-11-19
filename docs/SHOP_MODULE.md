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
- `src/pages/shop/AdminDisputes.jsx` is wired into `Dashboard.jsx` for admins: the payment dispute queue.
- `src/components/shop/` holds shared pieces (`ProductCard`, `OrderStatusChip`, `PaymentStatusChip`,
  `OrderChat`, `EvidenceUpload`, `EmptyState`, `MoneyText`, etc.).

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

The cart is **client-side only** (no cart API). It is persisted in `localStorage` **per user**
(`cyd_shop_cart:<userId>`), grouped by `shop_id`, and cleared on logout. Cart and checkout
refresh prices, stock and UPI availability through `POST /shop/products/lookup`, so the totals
shown are the server's. Checkout sends the whole cart in one `POST /shop/checkout` with an
`Idempotency-Key`. The backend creates one order per shop in a single transaction, and a double
submit returns the same orders.

## Payments (peer-to-peer UPI)

The platform never receives money. A buyer pays the **seller's own UPI ID** directly, then submits
the 12-digit UPI Ref No (UTR), and the seller confirms receipt. Read
`cyd_id_be/docs/PAYMENTS.md` for the full rules: timers, disputes, refunds.

- `PayOrder.jsx` (buyer) shows:
  - the seller's UPI ID with a copy button (the main path, because UPI apps may block deep links to personal IDs);
  - the exact amount, the order reference and a countdown from `pay_seconds_left`;
  - an "Open UPI app" deep link and a QR code;
  - the UTR form, with an optional screenshot that is resized and uploaded privately;
  - after submitting, a "waiting for the seller" state.
- `PayCheckout.jsx` lists the orders from a multi-shop checkout, each paid separately.
- `OrderDetail.jsx` renders buttons **only** from the server's `allowed_actions` and
  `dispute_reasons`, never re-deriving the rules. It also hosts the seller's confirm dialog (match
  the amount and UTR in the bank app), the refund form, disputes, the order chat (`OrderChat.jsx`)
  and evidence uploads.
- `AdminDisputes.jsx` (admin menu → "Shop Disputes") is the dispute queue. Admins resolve from
  the order view with a resolution allowed for the dispute's origin and a required note.
- The Shop menu shows a badge from `GET /shop/orders/action-count`.
