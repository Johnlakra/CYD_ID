# M8 — Seller and admin (owner: shop-seller-admin-engineer)

Run milestone M8 per `docs/09-IMPLEMENTATION-PLAN.md (section M8)`.

**Agent:** `shop-seller-admin-engineer` (coordinate with `shop-customer-engineer` on the shared Order detail screen: add seller/admin parts without rewriting the buyer parts).
**Read:** `docs/03-SCREENS-SHOP.md` (seller, owner, admin), `docs/06-DOMAIN-RULES.md` (disputes matrix, refunds), `docs/05-API-CONTRACT.md` (shops/mine, my-shop, products, admin), `docs/08-DATA-MODELS.md`.
**Brief:** become-a-seller + five states → My Shop (stats, products, orders, profile/UPI) → product form → seller order handling (confirm with claimed UTR, not received, reject, refund, fulfilment) → admin shop applications → admin disputes (queue, detail, chat, evidence, resolve per origin) → suspended orders-only mode.
**You verify (seller1, seller2 COD-only, admin, buyer1):** each dispute origin resolved end to end; suspended seller can still ship/refund; admin sees chat only for orders with a dispute; the COD seller never shows UPI.
**Reviewers:** all three.
