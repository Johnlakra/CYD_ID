# M7 — Checkout, peer-to-peer payment, orders (buyer) (owner: shop-customer-engineer)

Run milestone M7 per `docs/09-IMPLEMENTATION-PLAN.md (section M7)`.

**Agent:** `shop-customer-engineer`.
**Read:** `docs/03-SCREENS-SHOP.md` (checkout, pay, orders, chat), `docs/06-DOMAIN-RULES.md` (all, esp. §Worked example), `docs/05-API-CONTRACT.md` (checkout, orders, actions, chat, evidence), `docs/08-DATA-MODELS.md`, `tools/LOCAL-BACKEND.md` (shortened timers).
**Brief:** checkout with a stable Idempotency-Key → Pay the seller (all states, countdown, `upi://`, UTR claim, screenshot) → Pay your orders (multi-shop) → orders list/detail (buyer) driven by `allowed_actions` → cancel, dispute, refund-not-received → chat (`?after=`) → evidence with signed URLs → action badge.
**You verify:** run the doc 06 worked example end to end on the local backend with the shortened timers (use `buyer1`, `seller1`, admin); double-tap Place order → one set of orders; let a payment window expire → the buyer sees the "no longer waiting" state; the buyer never sees a button the server did not offer.
**Reviewers:** all three. The Pay screen and Order detail are "Designed here (not in mockup)" — ask me for visual sign-off.
