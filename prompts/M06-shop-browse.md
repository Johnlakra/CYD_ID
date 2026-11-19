# M6 — Shop browse, cart, addresses (owner: shop-customer-engineer)

Run milestone M6 per `docs/09-IMPLEMENTATION-PLAN.md (section M6)`.

**Agent:** `shop-customer-engineer`.
**Read:** `docs/03-SCREENS-SHOP.md` (home, categories, search, storefront, product, cart, addresses), `docs/05-API-CONTRACT.md` (shop, products, lookup, addresses), `docs/06-DOMAIN-RULES.md` (cart), `docs/08-DATA-MODELS.md`.
**Brief:** repositories → shop home/categories/search/storefront/product detail/wishlist → client-side cart (per user, lookup revalidation, change notices, multi-shop grouping, undo) → addresses (landmark → `line2`).
**You verify (buyer1 + seeded products):** browse, search, filter; add to cart; restart the app → cart persists; log in as another user → separate cart; sign out → cart cleared; change a price/stock on the server → the cart shows the change notice; address CRUD works.
**Reviewers:** all three.
