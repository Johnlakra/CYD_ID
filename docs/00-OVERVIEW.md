# 00 · CYD app — Overview, scope and decisions

> Read this first. It tells you what the CYD app is, who uses it, what is in scope, which decisions are
> already made (so you do not re-open them), and where every other document lives.

## 1. What we are building

**CYD** is the mobile app for the **Catholic Yuva Dhara** (CYD, the youth directorate) of the
**Diocese of Jalandhar**, Punjab, India. It combines two products that already exist as a web app and a
backend, and puts them in one native Flutter app:

1. **ID cards.** The CYD office registers youth members of parishes and deaneries, issues each a
   printed-style digital **ID card** (valid two years), and gives each member a login to see their own
   profile and card.
2. **CYD Shop.** A multi-vendor marketplace inside the app. Parish youth groups or individuals open a
   shop (after admin approval), list products (rosaries, books, apparel, event tickets, crafts, food),
   and other members buy them. Payment is **peer-to-peer UPI**: the buyer pays the seller's own UPI ID
   directly, submits the 12-digit UTR, and the seller confirms. The platform never holds money.
   Cash on delivery also exists, per shop. Admins approve shops and resolve payment disputes.

The app must reproduce **every feature the current web frontend and backend have** (plus a small number
of deliberate improvements listed in §6), using the visual language of the **CYD Shop mobile mockup**
(a Claude Design project, bundled in `design/`).

## 2. Users and roles

| Role (`user.role`) | Who | First tab | Can do |
|---|---|---|---|
| `admin` | CYD office / diocesan staff | **Profiles** | Everything: manage all ID-card profiles, create user accounts, view stats, approve/reject/suspend shops, resolve payment disputes; also shop as a buyer, and own a shop |
| `user` | CYD volunteers (deanery/parish coordinators) | **Profiles** | Create and manage the profiles **they created**; filters/search over their own; shop as a buyer; own a shop |
| `profile_holder` | A youth member | **My ID** | See own profile and ID card (view/share/download), change own photo, change password; shop as a buyer; own a shop |

Extra *capabilities* (not roles): **shop owner** = any user with an approved shop (the web app does the
same: ownership is a row in `shops`, not a role), and **buyer** = any logged-in user.

There is **no self-registration**. Admins create `user`/`admin` accounts (`POST /auth/register`,
admin-only); `profile_holder` accounts are generated automatically when a profile is created
(username `{first4letters}{DD}{MM}` of the birth date, password = phone number).

## 3. Scope

### In scope (everything on the current backend branch and web frontend)
- Login (one endpoint for all roles), session restore, expiry, logout
- Profiles: list, search, filters, stats, create, edit, soft-delete (+ restore by re-creation), credentials hand-over
- ID card: render (3 level designs), preview, share/save PNG, print/PDF, validity (2 years, 60-day warning)
- Profile-holder self-service: view profile, **view ID card** (new on mobile), update photo, change password
- Account: own account info/edit, change password, create user (admin), appearance, sign out
- Shop browse: home, categories, search/filter, storefront, product detail, (local) wishlist
- Cart (client-side), addresses, checkout (one order per shop, idempotent)
- Peer-to-peer UPI payment: pay screen, UTR claim/edit, waiting, expiry, multi-shop "pay your orders"
- Orders (buyer and seller views from one role-aware screen), cancel, per-order chat, evidence screenshots, disputes, refunds
- Seller: apply, application states, my shop (products CRUD with up to 6 images, orders, profile incl. password-gated UPI change), fulfilment steps, confirm/reject/refund, suspended-shop orders-only mode
- Admin: shop applications (approve/reject/suspend/reinstate with reasons), payment disputes queue and resolution
- Action badge (orders needing the user), pull-to-refresh, skeleton/empty/error states everywhere, dark + light themes

### Out of scope (explicitly)
- **Anubhav 2026 event module** and **multi-diocese platform** branches (they exist in the repos as separate
  unmerged branches). See Appendix A for how they could be added later.
- Push notifications, in-app purchases, social features, reviews/ratings, wishlist sync, shipping-cost
  calculation, payouts (the platform never holds money), multi-language (English only; keep strings in one
  place so Hindi/Punjabi can be added).
- Any backend change. Backend improvements the app would benefit from are listed in `12-BACKEND-ASKS.md`
  but are *not* assumed.

## 4. Decisions already made (do not re-open)

| # | Decision | Why |
|---|---|---|
| D1 | **Flutter** (Dart 3, stable), Android first then iOS; package `cyd_app` | Owner's choice; the mockup's structure proposal is Flutter |
| D2 | **Role-based first tab.** Five tabs in the mockup's floating pill bar: **[My ID \| Profiles] · Shop · Cart · Orders · Account** | ID-card work needs a real home; keeps the shop mockup intact. The mockup's Home + Categories merge into the Shop tab (`/shop`, `/shop/categories`) |
| D3 | **Scope = ID cards + Shop.** Anubhav/platform out | Owner's choice |
| D4 | **Peer-to-peer UPI**, not a gateway. The mockup's gateway/polling payment screen is replaced | The backend was rebuilt that way; the old gateway was unusable and not permitted for marketplaces |
| D5 | **Cart is client-side**, persisted per user, revalidated with `POST /shop/products/lookup` | There is no cart API |
| D6 | **The server decides what is allowed.** Order screens render buttons only from `allowed_actions` / `dispute_reasons`; the app never re-derives order rules | Prevents drift; rules live in one backend file |
| D7 | **Money is `int` paise everywhere** and shown as `₹x.xx`. **One exception:** product create/update request bodies carry rupees as a two-decimal *string* built from int paise (`paiseToRupeesString`, never float math); everything the API returns is `*_paise` (doc 05 §products, doc 06 §7.1). | Backend contract; no floats |
| D8 | **Riverpod + go_router + dio**; hand-written models, no code generation | Matches the mockup's proposal; fewer moving parts |
| D9 | The mockup's **visual language** is the standard for *all* screens, including the ID-card screens it does not cover | Consistency; see `02-DESIGN-SYSTEM.md` |
| D10 | No Dart is claimed to compile in this kit | The kit was written without a Flutter toolchain; the first build (M0) is the first compile |

## 5. Document map

| Doc | Contents | Main readers |
|---|---|---|
| `00-OVERVIEW.md` | this file | everyone |
| `01-ARCHITECTURE.md` | stack, folders, state, networking, storage, routing, errors, offline, security | architect, all engineers |
| `02-DESIGN-SYSTEM.md` | tokens, type, spacing, motion, component catalogue | design-system, UI reviewers |
| `03-SCREENS-SHOP.md` | every shop screen (mockup 01–18 + new P2P screens) | shop engineers |
| `04-SCREENS-IDCARD.md` | login, My ID, Profiles, forms, account, users | idcard engineer |
| `05-API-CONTRACT.md` | every endpoint, request/response/errors, role matrix, quirks | everyone writing repositories |
| `06-DOMAIN-RULES.md` | order/payment state machine, timers, disputes, validation, formats | shop engineers, testers |
| `07-ID-CARD-RENDERING.md` | exact card layout, fonts, export | idcard engineer |
| `08-DATA-MODELS.md` | models, enums, JSON mapping | everyone |
| `09-IMPLEMENTATION-PLAN.md` | milestones M0–M10, tasks, acceptance | orchestrator |
| `10-TESTING-QA.md` | test strategy, checklists per role, local backend | test engineer |
| `11-DESIGN-VS-BACKEND.md` | every mockup ↔ backend conflict and its resolution | everyone |
| `12-BACKEND-ASKS.md` | optional backend improvements | owner |
| `13-RELEASE.md` | identifiers, signing, privacy, stores, CI | release engineer |
| `CYD-APP-SPEC-FULL.md` | all docs concatenated (for pasting into a normal chat) | owner |

Also: `design/` (mockup HTML, tokens, screen map), `assets/` (card backgrounds, fonts, data),
`tools/` (local backend guide, seed script), `.claude/agents` + `.claude/commands`, `prompts/`.

## 6. Deliberate improvements over the web app

| # | Web app today | Mobile app |
|---|---|---|
| I1 | Profile holders **cannot see their own ID card** (the button is commented out) | My ID shows the card, validity, share/save/print |
| I2 | PNG export only, no print/PDF | PNG share, save to gallery, exact-size PDF/print |
| I3 | Photo limits only in help text | Client-side resize (≤1600 px, ≤1 MB) before upload |
| I4 | Two password rules (complexity on `/auth`, min-6 on `/profile-holder`) | The stricter rule everywhere in the UI |
| I5 | Cart shared between users of one browser | Cart per user, cleared on sign-out |
| I6 | 401 redirects to a non-existent `/login` | Clean session-expired flow |
| I7 | No offline behaviour | Cached profile/ID card for offline viewing; clear offline banners |
| I8 | Dark mode absent | Dark + light, system-aware with manual override |

## 7. Glossary

- **CYD** — Catholic Yuva Dhara, the diocesan youth directorate. **CYD Office** — the staff users contact for renewals/changes.
- **Deanery / parish** — Church administrative units; every profile has one of each (16 deaneries, 154 parishes in the form data).
- **Level** — `parish`, `deanery` or `dexco`; selects the card design/colour.
- **DEXCO** — diocesan executive committee (top level).
- **UTR / UPI Ref No** — the 12-digit reference a UPI payment produces; the buyer submits it, the seller matches it in their bank app.
- **VPA / UPI ID** — `name@bank`, the seller's payment address.
- **Paise** — 1/100 rupee; all money fields are integers of paise.
- **Claim** — the buyer's "I have paid" record (UTR + amount). **Confirm** — the seller's acknowledgement.
- **Payee** — the seller's UPI details shown to the buyer, only for their own unpaid order.
- **Action badge** — count of orders waiting on the current user (to pay, to confirm, to ship, disputes for admins).

## 8. Honest limits of this kit

- It was written without Flutter installed: **nothing was compiled**. Dart appears only as labelled illustrations.
- The mockup covers shop screens only; ID-card screens and the P2P payment/chat/dispute screens are **designed here** in the mockup's language and need the owner's visual sign-off.
- The mockup HTML is reference data; it may need the original artifact link to render:
  `https://claude.ai/artifact/E64xhoEDc36L6xv5nhFeiY`.
- The backend branch with the shop and payments is open as pull requests (`cyd_Id_BE#1`, security hotfix `#2`; frontend `CYD_ID#2`). Until merged, develop against branch `claude/happy-bell-oy6or2`.

## Appendix A — adding Anubhav and the multi-diocese platform later

Both live on separate, unmerged branches in both repos and run on mock data by default in the web app.
If the owner wants them in the app:
1. Merge the backend branch first (`feature/anubhav-2026-event-module`, or `feature/multi-diocese-platform`, which contains it) **after re-applying the security fixes** (admin-only register, login rate limit, helmet/CORS) and reconcile `server.js`, `package.json`, `profileController.js`.
2. Make `/profiles` exclude independent entries (`is_independent = 0`) and gate card printing on `GET /profiles/:id/idcard-data`.
3. Re-run the same kit process for those modules: read `shared/API_CONTRACT.md` (Anubhav) and `API_CONTRACT_PLATFORM.md` (platform), write screen/contract docs, add milestones M11+.
4. Expect a different role model (`event_role`: loc/dexco, `super_admin`, permission matrix) and a hard-coded event/venue list in the Anubhav version.
