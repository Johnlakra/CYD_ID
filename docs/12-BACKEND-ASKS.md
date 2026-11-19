# 12 · Backend asks (optional improvements)

The app is built against the backend **as it is** (docs 05/06/08). Nothing here blocks M0–M10. These are changes that would
make the app better, safer or simpler, each with the **workaround the app uses today**, so the owner can schedule backend work
independently. Priority: **P1** = worth doing before public launch, **P2** = soon after, **P3** = nice to have.
Items marked *(verify)* were observed in the code during the kit's preparation; confirm against the backend commit you target.

| # | Ask | Why | App workaround today | Prio |
|---|---|---|---|---|
| B1 | **Refresh tokens / sliding sessions** (or a longer-lived mobile token with server-side revocation) | The JWT lasts 24 h with no refresh; phone users get "Session expired" daily | Re-login prompt; credentials are not stored | P1 |
| B2 | **Logout / token revocation** and "revoke all sessions" after password change | A stolen token stays valid for 24 h | Token deleted locally only | P1 |
| B3 | **Push notifications** (FCM/APNs): device-token registration endpoint + events for the shop (payment claimed, payment confirmed/not received, order shipped, dispute opened/resolved, chat message, shop approved/suspended) | Sellers must confirm payments within 24 h and buyers within 30 min; without push they only see it when they open the app | Action badge from `action-count` polled every 60 s while foregrounded; in-app banners | P1 |
| B4 | **Master-data endpoint** for deaneries/parishes/designations/levels (`GET /meta/diocese`) | The lists are constants inside the web form; the app bundles a copy (`assets/data/deaneries.json`, with known quirks) that will drift | Bundled JSON + `GET /profiles/filter-options` for filters | P1 |
| B5 | **Make `date_of_birth` consistently required** (validator says optional, create returns 500 without it) — or make it genuinely optional | A 500 on a user error | App requires it in the form | P1 *(verify)* |
| B6 | **Consistent field names** between write and read for profiles (`father_name`/`father`, `mother_name`/`mother`, `date_of_birth`/`dob`) — accept both on write, or return both on read | Easy source of bugs | Mapping inside the Profile model only | P2 |
| B7 | **Deleted-profiles view and an explicit restore endpoint** (`GET /profiles?deleted=true`, `POST /profiles/:id/restore`) | Today restoring means re-creating a profile with the same normalised name + phone, which silently issues new credentials | Notice in the create dialog; no deleted view | P2 |
| B8 | **Stats that exclude soft-deleted profiles** (or return both counts) | `GET /profiles/stats` counts deleted rows *(verify)* | Shown as returned with doc 04 wording | P2 |
| B9 | **Enforce photo limits and type server-side with clear messages** (≤5 MB, JPEG/PNG/WebP, minimum dimensions) | Only a body-size limit exists on the profile photo path *(verify)* | Client resizes to ≤1600 px / ≤1 MB | P2 |
| B10 | **Password policy parity**: the same complexity rules on `/auth/change-password` and `/profile-holder/change-password` (and on registration) | Rules differ per endpoint *(verify)* | App applies the stricter set to both | P2 |
| B11 | **Holder first-login password change** (force change of the phone-number initial password) | Initial password equals the phone number, which is guessable | Not enforced; copy in the credentials dialog advises changing it | P1 |
| B12 | **Pagination metadata on every list** (`page`, `limit`, `total`, `has_next`) and the same query names everywhere | Some lists return less metadata than others | App infers `hasNext` from page size where metadata is missing | P3 |
| B13 | **Richer product listing**: `sort` (price, newest), `min_price`/`max_price`, `in_stock`, `deanery` | `/shop/products` supports only `q`, `category_id`, `shop_id`, `page`, `limit` | Client-side sort/filter on the loaded page (incomplete across pages) | P2 |
| B14 | **Server-side cart** (optional) | Client cart cannot sync across devices | Local cart per user with lookup revalidation | P3 |
| B15 | **Order-total preview endpoint** (shipping, per-shop split) before checkout | Totals are computed at checkout; the review step shows client estimates | Estimate from `lookup` data, final amounts from the checkout response | P3 |
| B16 | **Seller UPI ID verification** (e.g. penny-drop / name match via a licensed provider) | A wrong UPI ID sends money to the wrong person; the platform cannot prevent it | Strong warning copy + copy-and-verify UI on the seller's profile and pay screen | P2 |
| B17 | **Account deletion / data export endpoint** | Needed for store policies and privacy law expectations | Deletion by contacting the CYD Office (doc 13 §5) | P1 |
| B18 | **Audit log of admin actions** (dispute resolutions, shop suspensions, profile deletes) | Accountability for a moderation role | None | P2 |
| B19 | **Rate-limit headers** (`Retry-After`, `RateLimit-*`) on 429 | The app shows fixed 15-minute copy | Fixed copy from doc 04 | P3 |
| B20 | **API versioning prefix** (`/api/v1`) and an OpenAPI document generated from the code | Lets the app and docs evolve safely; the contract verifier could diff mechanically | Doc 05 maintained by hand | P2 |
| B21 | **Backend `GET /health` with a version/commit field** | The app and QA could show/verify the backend build in use | Plain `/health` only | P3 |
| B22 | **Image delivery**: Cloudinary transformations in returned URLs (thumbnails) or a `thumb_url` field | Lists load full-size images on mobile data | `cached_network_image` with `memCacheWidth`; URL transformation by string insertion if the URL is a Cloudinary one | P2 |
| B24 | **Password reset / credential re-issue** for profile holders (admin-triggered, returns a new one-time password) | The holder's credentials are returned only once at creation; a forgotten password has no recovery path in the API | Admin deletes and re-creates the profile (restore-by-recreation issues new credentials) — see doc 04 | P1 |

## How to use this list
1. Decide with the CYD Office which P1 items must precede store submission (B1, B3, B4, B5, B11, B17 are the usual launch blockers or near-blockers).
2. When a backend item ships, the **api-contract-verifier** will report the doc/app drift; update `docs/05`, `docs/08`, remove the workaround, and note the change in `docs/11-DESIGN-VS-BACKEND.md`.
3. Never rely on an unshipped ask in app code. Features that depend on one (push, refresh) are built behind an interface with a no-op implementation, so shipping the backend side later needs no redesign.
