# 10 · Testing and QA

## 1. Strategy at a glance

| Layer | Tooling | What it proves | Where |
|---|---|---|---|
| Unit | `flutter_test`, `mocktail` | formatters, validators, cart maths, UTR normalisation, state-machine view logic, model `fromJson` | `test/core`, `test/models`, `test/features/*/application` |
| Repository | `dio` + `http_mock_adapter` (or a custom `HttpClientAdapter`) with **recorded-shape fixtures from doc 05** | request path/method/body/headers and response parsing, error mapping | `test/features/*/data` |
| Widget | `flutter_test` | each screen's loading / empty / error / data states, validation messages, button enablement, role gating | `test/features/*/presentation` |
| Golden | `flutter_test` goldens (fixed fonts, 390×844 and 360×800, dark + light) | pixel fidelity of design-system widgets, the ID card (5 fixtures) and key screens | `test/golden/` |
| Integration | `integration_test` on an emulator against the **local backend** seeded by `tools/seed-dev-data.js` | real flows per role (below) | `integration_test/` |
| Contract | the **api-contract-verifier** agent (read-only) + a small script that diffs `docs/05` paths vs repositories | no endpoint/field drift | run at every milestone |
| Manual QA | checklists in §5 on a real Android phone (and iOS before release) | what automation cannot see | owner / tester |

Rules: tests never hit production; fixtures contain no real personal data; screenshots/goldens never contain real photos; a
bug fix starts with a failing test.

## 2. Unit and repository test must-haves

- **Money**: `formatPaise(0)`, `5`, `100`, `12345`, `100000` (₹1,000.00), negatives rejected; no floats anywhere.
- **Dates**: `DD/MM/YYYY` (lists), `DD-MM-YYYY` (card), `MMM DD, YYYY` (joined); issue date + 2 years; validity edges (61 days left → valid, 60 → "Expires in 60 days" warning, the expiry day itself and the day after exactly as defined in doc 07, a null `issue_date` handled without crashing).
- **capitalizeName**: `JOHN DOE`, `o'neil`, `mary-ann`, multiple spaces, empty/null-safe.
- **UTR**: `4012 3456 7890` → `401234567890`; rejects 11/13 digits, letters; grouping `4012 3456 7890`.
- **Cart**: per-user keys; add/merge lines; clamp to stock and 99; `applyLookup` removes unavailable lines, updates price/stock/shop name, reports changes; sign-out clears only that user's cart.
- **Idempotency key**: stable across retries, rotated on cart or method change.
- **Validators**: every message verbatim from doc 06 (profile 14 fields, phone exactly 10 digits, password rules, address, shop apply, product).
- **Order view logic**: for a table of `OrderView` fixtures (each status × payment_status × viewer role), the visible buttons equal `allowed_actions` and nothing else.
- **Error mapping**: 400 with `errors[]`, 401 (login vs other), 403, 404, 409, 413, 429, 5xx, timeout, offline.
- **Repositories**: every endpoint in doc 05 has a request-shape test (path, method, query, body keys, headers incl. `Idempotency-Key`) and a response-parse test using the example JSON from doc 05.

## 3. Golden tests

1. Design-system gallery widgets (every state, dark/light).
2. **ID card** — six fixtures F1–F6 from doc 07 §14.3 (parish, deanery, dexco; very long name; very long parish + address; edge data; photo crop). Use the bundled fonts so goldens are stable across machines.
3. Key screens: Login, Profiles (data/empty), Profile form (error state), My ID, Shop home, Product, Cart, Checkout step 3, **Pay the seller**, Order detail (one fixture per payment state), Seller confirm sheet, Admin dispute resolve, Account (per role).
Update goldens only with an explicit reviewer-approved reason in the PR/commit message.

## 4. Integration tests (against the local backend)

Prereqs: local backend + seed (`tools/LOCAL-BACKEND.md`) with short timers
(`PAY_WINDOW_MINUTES=3`, `PAY_GRACE_MINUTES=1`, `CONFIRM_WINDOW_HOURS=1`). Each test logs in through the UI, never by injecting tokens.

| Test | Role(s) | Flow |
|---|---|---|
| `auth_flow` | all | login success/failure, session restore after app restart, sign-out clears data, forced expiry |
| `profiles_crud` | manager | create → credentials → find with search/filter → edit → delete → holder login blocked |
| `holder_card` | holder | login → My ID → card renders → share sheet opens → offline (airplane) still shows cached card |
| `shop_browse_cart` | buyer | browse → search → product → add → cart survives restart → price change on server → warning at checkout |
| `checkout_cod` | buyer + seller | COD order → seller advances to delivered → `cod_collected` |
| `p2p_happy_path` | buyer + seller | UPI checkout → copy UPI ID → submit UTR → seller confirms → fulfilment → delivered |
| `p2p_expiry` | buyer | place UPI order → wait window+grace → order cancelled, stock back, buyer sees "no longer waiting" |
| `p2p_dispute` | buyer, seller, admin | claim → seller "not received" → buyer proof → admin resolves (each resolution) |
| `p2p_refund` | buyer, seller | confirmed order → seller rejects → refund UTR → buyer sees refunded |
| `seller_onboarding` | seller + admin | apply → admin approves → add product (with images if Cloudinary configured) → appears in marketplace |
| `suspension` | seller + admin | suspend shop → unpaid order voided, paid order still fulfillable, shop hidden |
| `multi_shop_checkout` | buyer | cart across two shops → one checkout → two orders → pay both |
| `double_submit` | buyer | double-tap Place order → exactly one set of orders |

Run: `flutter test integration_test --dart-define=API_BASE_URL=http://10.0.2.2:3000` (Android emulator).

## 5. Manual QA checklists (per role) — use the seeded accounts

Accounts (from `tools/seed-dev-data.js`): `admin/admin123`, `cydmanager/Passw0rd1`, `seller1/Passw0rd1`,
`seller2/Passw0rd1` (COD-only), `buyer1/Passw0rd1`, holder `anil1304/9000000001`.
Mark each item ✔/✘ and record the device, OS, app version and backend commit.

### 5.1 Everyone
- [ ] First launch: splash → login; no flash of protected content.
- [ ] Wrong password shows `Invalid credentials`; 11 wrong attempts show the 15-minute message.
- [ ] Airplane mode on each tab shows the offline banner/error card with retry; recovers when back online.
- [ ] Dark and light themes both readable; System follows the OS; text scale 1.3 does not clip critical text.
- [ ] Rotate to landscape (if supported) does not crash; small phone (360 px) has no overflow.
- [ ] Sign out → relaunch → lands on login; cart and personal caches gone.
- [ ] Session expired (token removed/expired) returns to login with the toast.
- [ ] Back button behaviour is natural everywhere; no dead ends.
- [ ] Screen reader (TalkBack) can reach and operate primary actions; every icon button has a label.

### 5.2 Profile holder (`anil1304`)
- [ ] Lands on **My ID**; profile summary correct; card renders with the right level colour and values.
- [ ] Validity chip: Valid / Expires in N days / Expired (test by editing `issue_date` in the DB).
- [ ] Share PNG, save to gallery, print/PDF work; file name `{name}-{parish}-{phone}`.
- [ ] Update photo (needs Cloudinary): picker, resize, upload, card updates.
- [ ] Other fields are read-only with "Contact CYD Office to change".
- [ ] Change password: strength meter, rules verbatim, old password then fails, new works.
- [ ] Holder cannot see Profiles/Create user/admin rows.
- [ ] Shop tabs work as a buyer.

### 5.3 ID-card manager (`cydmanager`, role `user`)
- [ ] Lands on **Profiles**; sees only profiles they created.
- [ ] Search (debounced), each filter, parish disabled until deanery chosen, clear filters, pagination/infinite scroll.
- [ ] Create profile: all validation messages; parish list follows deanery; photo mandatory; success dialog shows credentials with copy buttons; the new holder can log in.
- [ ] Re-create a deleted profile with the same name + phone → restore notice behaviour; old login works with new phone as password.
- [ ] Edit prefill correct (father/mother/dob mapping); unchanged photo keeps working.
- [ ] Delete: confirm copy; holder can no longer log in.
- [ ] Stats area degrades gracefully for non-admin.
- [ ] Card preview/export for any profile.

### 5.4 Admin (`admin`)
- [ ] Sees all profiles; stats tiles show total / with photos / today / this week (note: includes deleted).
- [ ] Create user (`user`/`admin`); the new account logs in; `profile_holder` not offered.
- [ ] Shop applications: filters, review sheet, approve, reject (reason required), suspend (reason), reinstate.
- [ ] Shop disputes: queue open/resolved, detail shows order, UTR, screenshots (signed links), chat; each resolution requires a note and only offers valid options for the dispute's origin; action badge counts open disputes.
- [ ] Cannot read an order's chat when there is no dispute.

### 5.5 Buyer (`buyer1`)
- [ ] Shop home: skeleton → content; categories; search with filters; storefront; product (gallery, stock chip, quantity limits).
- [ ] Cart: add from two shops → multi-shop banner; quantity stepper clamps; remove + Undo; total correct; survives restart; separate from another user's cart.
- [ ] Change a price in the DB → open cart → change notice → totals updated.
- [ ] Checkout: address add/select, per-shop method, COD-only shop disables UPI, review totals, Place order once only.
- [ ] **Pay the seller**: UPI ID/amount/reference copy work; countdown ticks and matches the server; Open UPI app launches a UPI app (device with one) or fails gracefully; QR scans; UTR validation (12 digits, spaces ignored); duplicate UTR message; screenshot attach; submit → waiting state.
- [ ] Edit UTR while waiting; after the seller confirms the field is no longer editable.
- [ ] Let an order expire → "no longer waiting" + "Already paid? Report it" path (paid-after-cancel dispute).
- [ ] Chat with seller: send/receive (5 s poll), system messages styled, read-only after closure.
- [ ] Orders: filters, needs-action indicator, status chips (order + payment), cancel only when offered.
- [ ] Open a dispute after the confirm window (shorten timer) with screenshot.
- [ ] Addresses: add/edit/set default/delete; past orders keep their copy.
- [ ] Become a seller from Account.

### 5.6 Seller (`seller1` with UPI, `seller2` COD-only)
- [ ] Apply (blank UPI allowed → COD-only); states: pending, rejected (reason), suspended, approved; they appear from `GET /shop/shops/mine`.
- [ ] My shop: stats, products list with status chips; add product (up to 6 images, MRP < price rejected client-side, full-body update works); archive confirm.
- [ ] Orders tab: "needs action" first; open a claimed order: confirm requires seeing amount + UTR; confirming with a changed UTR is refused.
- [ ] "Not received" opens a dispute; reject a paid order → refund form requires a refund UTR different from the payment UTR.
- [ ] Fulfilment steps appear one at a time; after delivered nothing left to do.
- [ ] Change UPI ID asks for the password; wrong password refused; open orders keep the old payee.
- [ ] Suspended shop: banner + orders-only dashboard; can still ship/refund.

### 5.7 Payment-timer scripts (with the short-timer backend)
1. **Expiry**: place UPI order, do nothing for window + grace → order cancelled, stock returned (check product detail).
2. **Seller silence**: claim payment, wait `CONFIRM_WINDOW_HOURS` → buyer sees "not confirmed in time" and can dispute.
3. **No proof**: seller "not received", buyer uploads nothing for `DISPUTE_PROOF_HOURS` → claim rejected automatically.

## 6. Non-functional checks
- **Performance**: cold start < 3 s on a mid-range phone (excluding network); list scroll 60 fps with 1000 rows; ID card export < 2 s and no OOM at the largest export size in doc 07 (2744×4160); images are downscaled before decode.
- **Size**: release APK/AAB size noted; card backgrounds are the biggest assets (≈ 10.8 MB) — consider shipping a reduced-resolution copy for on-screen display and the full one for export.
- **Security**: no secrets in the repo; `adb logcat`/Xcode console shows no tokens, UTRs or base64; release build is HTTPS-only; backups exclude secure storage where possible.
- **Privacy**: no third-party SDKs; camera/photo permissions requested only when used, with clear rationale text.
- **Compatibility**: Android 8+ (API 26+) phones from at least two vendors; iOS 15+ (final matrix agreed with the owner).

## 7. Bug report template
```
Title:
Build/commit:            Backend commit/branch:
Device + OS:             Role/account:
Steps (numbered):
Expected:                Actual:
Evidence (screenshot with personal data blurred):
Spec reference (doc + section / DB-xx row):
Severity: blocker / major / minor / cosmetic
```

## 8. Release acceptance sign-off
All of: Definition of Done met for M0–M9; §4 integration suite green; §5 checklists complete with no open blocker/major; contract verifier clean against the **merged** backend; owner visual sign-off on the invented screens (ID-card area, P2P payment, chat, disputes); privacy/data-safety answers reviewed; release build smoke-tested on a clean device.
