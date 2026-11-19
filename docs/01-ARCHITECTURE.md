# 01 · Architecture

Applies decisions D1–D10 from `00-OVERVIEW.md`. Dart snippets here are **illustrations, not compiled
code**: the first real compile happens in milestone M0. Package versions are not pinned in this kit:
add each with `flutter pub add <name>` so the toolchain resolves compatible versions, then commit
`pubspec.lock`.

## 1. Stack

| Concern | Choice | Notes |
|---|---|---|
| Language / SDK | Dart 3, Flutter stable | Android first, iOS second |
| State | `flutter_riverpod` (no code-gen: no `riverpod_generator`) | `Notifier`/`AsyncNotifier`/`FutureProvider.family`/`StreamProvider` |
| Routing | `go_router` | `StatefulShellRoute.indexedStack` for the 5 tabs; redirect guard for auth |
| HTTP | `dio` | one instance, interceptors for auth, error mapping, logging (dev only) |
| Secure storage | `flutter_secure_storage` | JWT + user JSON only |
| Preferences/cache | `shared_preferences` + app documents directory | theme, recent searches, wishlist, cart, last profile page, card cache |
| Images | `cached_network_image`, `image_picker`, `image` (resize in isolate) | base64 data URLs for uploads |
| Fonts | UI: `google_fonts` (Anton, Archivo, DM Mono). ID card: **bundled assets** (Vidaloka, Roboto, Gafata in `assets/fonts/`) | card export must not need the network; see doc 02 §fonts and doc 07 |
| Intents | `url_launcher` | `upi://pay?...` deep link, `tel:`/`mailto:` |
| Sharing/printing | `share_plus`, `pdf`, `printing`, `gal` (or `image_gallery_saver`) for save-to-gallery | pick the maintained one at M4 |
| Formatting | `intl` | en-IN number grouping, dates |
| Lint | `flutter_lints` + project rules (§12) | CI fails on warnings |
| Tests | `flutter_test`, `mocktail`, `http_mock_adapter` (or a fake `HttpClientAdapter`), `integration_test`, golden tests | see doc 10 |

No analytics or crash-reporting SDK is assumed (privacy; see doc 13). A crash reporter can be added in M10 behind a single interface.

## 2. Folder layout (feature-first)

```
lib/
  main.dart                       ProviderScope → CydApp (MaterialApp.router)
  app/
    app.dart                      MaterialApp.router, theme mode, localizations stub
    router.dart                   go_router config, shell branches, redirect, route names
    theme.dart                    CydTokens (ThemeExtension), ThemeData builders for dark/light
    shell.dart                    ShellScaffold + floating pill tab bar (role-aware first tab)
  core/
    config/env.dart               API_BASE_URL, flavor, via String.fromEnvironment
    network/
      dio_provider.dart           the one Dio
      auth_interceptor.dart       Bearer header; 401 → session expired
      error_mapper.dart           DioException/envelope → ApiException subclasses
      api_exception.dart
      api_envelope.dart           parse {success,message,data} / {success:false,message,errors[]}
    storage/
      token_store.dart            secure storage wrapper (token + user)
      prefs.dart                  typed shared_preferences wrapper
      cache_store.dart            JSON file cache with timestamps (profile list page, own profile/card)
    format/
      money.dart                  formatPaise(int) → '₹1,250.50'
      dates.dart                  DD/MM/YYYY, DD-MM-YYYY, 'MMM DD, YYYY', relative countdown
      text.dart                   capitalizeName, normalizeUtr, groupUtr
    media/
      image_data_url.dart         XFile → resized JPEG data URL (≤1600 px, ≤1 MB)
    widgets/                      CydButton, CydCard, StatusChip, SkeletonBox, EmptyState, ErrorState,
                                  AsyncListView<T>, PriceText, BottomSheetScaffold, ConfirmDialog, CydToast,
                                  CopyRow, SectionLabel, CountdownPill, QuantityStepper, CydTextField …
    session/
      session_controller.dart     AsyncNotifier<Session?> (token + user), restore, logout, expire
  features/
    auth/            data/ application/ presentation/   (login, splash)
    idcard/          profiles list/filters/stats, profile form, card render/export, my ID, holder photo
    account/         account info, change password, create user, appearance
    marketplace/     shop home, categories, search, storefront, product detail, wishlist
    cart/            local cart repository, controller, screen
    addresses/       list, form
    checkout/        controller, screen
    payments/        pay order, pay-your-orders, claim/edit UTR, evidence upload
    orders/          lists, order detail (role-aware), chat, disputes
    seller/          apply + status
    owner/           my shop (products, orders, profile), product form
    admin/           shop applications, disputes queue
  models/            hand-written: user, profile, shop, product, category, cart_line, address, order, claim, dispute,
                     message, evidence, paging, action_counts … (see 08-DATA-MODELS.md)
test/                mirrors lib/; golden/ for card + key screens
integration_test/    per-role flows against the local backend
assets/              idcard/*.jpg, fonts/, data/*.json  (registered in pubspec)
```

Within a feature folder: `data/` = repository + request/response mapping (talks to `dio`, returns models);
`application/` = Riverpod providers and controllers (business logic, no widgets); `presentation/` =
screens and feature widgets. **Widgets never call `dio`.** Repositories never import Flutter UI.

## 3. State management rules

- **Session**: `sessionControllerProvider` = `AsyncNotifier<Session?>` (`Session{token, user}`); the router listens to it (`refreshListenable`) to redirect.
- **Lists/detail reads**: `FutureProvider.autoDispose.family` keyed by the query object (immutable, with `==`/`hashCode`). Screens render through `AsyncListView`: skeleton → data | empty | error with retry. Pull-to-refresh = `ref.invalidate`.
- **Paged lists** (profiles, shop products): an `AsyncNotifier` holding `{items, page, hasNext, loadingMore, error}`; `loadMore()` appends; changing the query resets.
- **Mutations** (create profile, claim payment, confirm…): a small `Notifier`/function in `application/` that calls the repository, then `ref.invalidate` the affected providers. Show success/errors with `CydToast`; surface field errors from `ApiException.fieldErrors`.
- **Cart**: local `Notifier<List<CartLine>>` persisted per user (`cyd_cart:<userId>`); derived providers for count/total; `applyLookup` merges server data (see doc 06).
- **Order detail**: `FutureProvider.family<OrderView,int>`; polling is explicit (`Timer.periodic` inside an auto-dispose provider) and only while the screen is visible and the state is waiting (`awaiting_payment`, `claimed`).
- **Countdowns**: derive from server `*_seconds_left` captured with a local monotonic timestamp; never from the device clock vs server dates. Refresh the order when a countdown reaches zero.
- **Action badge**: `actionCountsProvider` refreshed every 60 s while the app is in the foreground and after any order mutation.
- **No global mutable singletons** except the Dio instance and storage wrappers, supplied by providers (overridable in tests).

## 4. Networking

- `Dio(BaseOptions(baseUrl: Env.apiBaseUrl, connectTimeout: 15 s, receiveTimeout: 30 s, sendTimeout: 60 s, contentType: json, headers: {'Accept':'application/json'}))`. Render's free tier can take 30–60 s on a cold start: show a "Waking up the server…" hint if the first request exceeds ~8 s; retry **GET** once on timeout; never auto-retry POST/PUT/PATCH/DELETE (use the user's retry, with the same Idempotency-Key for checkout).
- **AuthInterceptor**: attaches `Authorization: Bearer <token>`; on `401` from any non-login call → `sessionController.expire()` → toast `Session expired. Please login again.` → `/login`. On `/auth/login` or `/profile-holder/login` a 401 is just "Invalid credentials".
- **Error mapping**: every failure becomes an `ApiException`:
  `ValidationFailed(fieldMessages)` (400 with `errors[]`), `Unauthorized` (401), `Forbidden` (403), `NotFound` (404), `Conflict` (409), `RateLimited` (429), `PayloadTooLarge` (413), `ServerError` (5xx), `Offline`/`Timeout`, `Unknown`. Keep the server `message` verbatim for display (it is already user-facing English).
- **Envelope**: success = `{success:true, message, data}`; failure = `{success:false, message, errors?[]}`. Repositories return `data` only. Validation `errors` is a list of plain strings, not keyed by field: show them as a list under the form or map by keyword.
- **Logging**: `LogInterceptor` only in debug, with `Authorization`, request/response bodies containing `photo`, `image`, `screenshot`, `password`, `utr` **redacted**. Never log tokens or base64.
- **Uploads**: images are base64 data URLs inside JSON (not multipart). Backend limits: body ≤ 10 MB, image ≤ 5 MB. Resize on a background isolate before encoding (`image_data_url.dart`).
- **Idempotency**: `POST /shop/checkout` requires `Idempotency-Key` (8–64 chars `[\w-]`): generate one per checkout *attempt*, keep it across network retries, rotate it when the cart or choices change (doc 03/06).
- **Base URL**: `--dart-define=API_BASE_URL=...` (dev defaults in `tools/LOCAL-BACKEND.md`). Release builds must be HTTPS.

## 5. Storage and caching

| Data | Where | Lifetime |
|---|---|---|
| JWT, user JSON (`{id, username, email, role}`) | `flutter_secure_storage` | until logout/expiry (24 h token) |
| Theme mode, recent searches, wishlist ids, last-used filters | `shared_preferences` (per user key where personal) | until cleared |
| Cart | `shared_preferences` key `cyd_cart:<userId>` | cleared on sign-out |
| Last profile-list page 1 (+ filters), own profile, own card data, filter-options | `cache_store` JSON files with `savedAt` | stale-while-revalidate; show cached with an "Offline · updated <time>" banner |
| Card photo | `cached_network_image` disk cache | LRU |
| Shop browse data | no persistent cache (network required) | — |

Sign-out clears token, user, the user's cart and wishlist, and cache files containing personal data
(profile lists, own profile). Theme and recent searches may stay.

## 6. Routing

`go_router` with `StatefulShellRoute.indexedStack` and **5 branches**. The first branch is `/id`; its root
screen is chosen by role (`MyIdScreen` for `profile_holder`, `ProfilesScreen` for `admin`/`user`) — the
branch list itself does not change per role.

| Route | Screen | Tab | Notes |
|---|---|---|---|
| `/splash` | Session restore | — | read secure storage, decide |
| `/login` | Login | — | public |
| `/id` | MyId / Profiles | 1 | role-based root |
| `/id/card` | Own ID card (holder) | 1 | full-screen preview/export |
| `/id/photo` | Update photo (holder) | 1 | |
| `/id/profiles/new` | Profile form (create) | 1 | admin, user |
| `/id/profiles/:id` | Profile detail | 1 | admin, user |
| `/id/profiles/:id/edit` | Profile form (edit) | 1 | admin, user |
| `/id/profiles/:id/card` | Card preview/export | 1 | admin, user |
| `/shop` | Shop home | 2 | |
| `/shop/categories` | Categories | 2 | |
| `/shop/search` | Search & filter | 2 | `?q=&cat=` |
| `/shop/shops/:id` | Storefront | 2 | |
| `/shop/products/:id` | Product detail | 2 | |
| `/cart` | Cart | 3 | |
| `/checkout` | Checkout | 3 | hides tab bar |
| `/pay/:orderId` | Pay the seller | 3 | hides tab bar |
| `/pay-checkout/:checkoutId` | Pay your orders | 3 | multi-shop |
| `/order-placed/:checkoutId` | Confirmation | 3 | |
| `/orders` | My orders | 4 | |
| `/orders/:id` | Order detail (buyer/seller/admin) | 4 | one role-aware screen |
| `/orders/:id/chat` | Order chat | 4 | hides tab bar |
| `/account` | Account | 5 | |
| `/account/profile` | Account info/edit | 5 | |
| `/account/password` | Change password | 5 | |
| `/account/users/new` | Create user | 5 | admin only |
| `/account/addresses`, `/account/addresses/new`, `/account/addresses/:id` | Addresses | 5 | |
| `/account/sell` | Become a seller / status | 5 | |
| `/my-shop` | My shop (products/orders/profile) | 5 | approved or suspended |
| `/my-shop/products/new`, `/my-shop/products/:id` | Product form | 5 | |
| `/admin/shops` | Shop applications | 5 | admin |
| `/admin/disputes` | Payment disputes | 5 | admin |

- **Debug-only routes** (not in release): `/debug/health` (M0) and `/debug/gallery` (M1 design gallery).
- **Redirect guard**: not logged in → `/login`; logged in on `/login`/`/splash` → `/id`; role-gated routes redirect to `/account` with a toast.
- The tab bar hides on the screens listed as such in `design/SCREEN-MAP.md` (storefront-hero screens, product detail, search, checkout/pay/confirmation, order detail and chat, addresses/forms, product form, admin disputes, ID sub-screens).
- **Hiding the bar = pushing on the root navigator.** Declare every tab-less route with `parentNavigatorKey: rootNavigatorKey` so it is pushed *over* the shell instead of switching branch; this keeps back-navigation correct when such a screen is opened from another tab (e.g. `/orders/:id` from `/my-shop` or `/admin/disputes`, `/pay/:orderId` from `/orders`, `/account/addresses/new` from checkout). The "Tab" column in the route table and SCREEN-MAP means the tab highlighted at the origin, not branch ownership.
- Deep links: `cyd://orders/:id` etc. are not required; keep route names stable so they can be added.
- Back behaviour: system back pops within a branch; at a branch root it exits the app (Android) — do not hijack.

## 7. Theming and design tokens

`CydTokens extends ThemeExtension<CydTokens>` carries every token in `design/tokens.json` (dark and
light). `ThemeData` is built from it; widgets read `Theme.of(context).extension<CydTokens>()!` — never
hard-coded colours. Theme mode: system by default with manual override (Account → Appearance: System /
Light / Dark), persisted. Details in `02-DESIGN-SYSTEM.md`.

## 8. Forms and validation

- Plain `Form`/`TextFormField` (or the `CydTextField` wrapper) with validators from one `validators.dart` that mirrors the backend rules in `06-DOMAIN-RULES.md` (messages verbatim).
- Validate on submit and on blur after first interaction; clear a field's error when edited.
- Server-side validation errors are shown inline when mappable, otherwise as a banner list.
- Keyboards: `TextInputType.phone` (digits only formatter), `number`, `numberWithOptions(decimal: true)`, `emailAddress`; autofill hints where sensible; `textInputAction` chains.

## 9. Images and the ID card

- Photos: pick/capture via `image_picker`, fix EXIF orientation, resize to ≤1600 px long side, JPEG quality 0.85→0.55 until ≤1 MB (the web helper `src/utils/image.js` does exactly this), send as `data:image/jpeg;base64,...`.
- Card: a `RepaintBoundary` around a fixed-aspect widget tree (146.3 × 221.8 mm) over the level's background image; exported with `toImage(pixelRatio)`. Exact spec in `07-ID-CARD-RENDERING.md`.

## 10. Errors, loading and offline UX (universal rules)

Every screen that loads data implements the four states with the shared widgets: **loading** (skeleton
shaped like the content, never a lone spinner except inside buttons), **empty** (dashed card with
copy from the spec), **error** (card with `Tap to retry`), **data**. Mutations disable their button and
show an inline spinner; double taps must not double-submit. Offline: show a persistent banner on screens
that have cached data; screens without cache show the error card with the offline wording. A toast
(`CydToast`) confirms every successful mutation (copy from the specs).

## 11. Security

- Token and user in secure storage only. No tokens, passwords, UTRs, base64 or full addresses in logs/analytics.
- `FlutterSecureStorage` Android options with encrypted shared preferences; iOS keychain `first_unlock`.
- Plain HTTP only in **debug** manifests/Info.plist exceptions; release must be HTTPS. Consider certificate pinning only if the owner asks (Render certificates rotate).
- Screenshots of payments are private on the server (signed 10-minute URLs): do not cache them to disk beyond the session; do not put the signed URL in logs.
- Copy/clipboard: only on explicit tap (UPI ID, amount, reference, credentials). Clear nothing automatically but never read the clipboard.
- Hiding sensitive screens from screenshots and the app switcher (Android `FLAG_SECURE`, an iOS privacy overlay) for the credentials dialog and the UTR entry is **optional and off by default**; raise it with the owner.
- Obey the role gates in the UI **and** assume the server enforces them (never rely on hiding a button for security).

## 12. Lint and code rules (enforced by the reviewer agent)

1. `flutter analyze` clean; `dart format` applied.
2. No `dio` calls outside repositories; no `BuildContext` across async gaps without `mounted` checks.
3. No `double` for money; no string-built money except through `formatPaise`.
4. No hard-coded colours/sizes that exist as tokens; no magic strings for enums (use the enums in `models/`).
5. All user-visible strings live in `lib/core/strings.dart` (or ARB) — English now, ready for Hindi/Punjabi.
6. Every provider that holds user data is invalidated on sign-out (`ref.invalidate` in one place).
7. Public widgets have `Key`s only where tests need them; golden tests use stable fonts.
8. Files < 400 lines; screens split into private widgets.

## 13. Flavors and configuration

Two configurations via `--dart-define` (`FLAVOR=dev|prod`, `API_BASE_URL`): dev shows a small "DEV" ribbon and enables the (redacted) HTTP log. The launcher name is "CYD" for both; a separate "CYD Dev" label/app id would need Android `productFlavors` and iOS schemes, which are optional and decided in `13-RELEASE.md` with the identifiers.

## 14. Illustrative skeletons (uncompiled)

```dart
// core/network/dio_provider.dart (illustration)
final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(baseUrl: Env.apiBaseUrl, connectTimeout: const Duration(seconds: 15)));
  dio.interceptors.addAll([AuthInterceptor(ref), ErrorMapperInterceptor(), if (kDebugMode) RedactedLog()]);
  return dio;
});

// features/orders/data/orders_repository.dart (illustration)
class OrdersRepository {
  OrdersRepository(this._dio);
  final Dio _dio;
  Future<OrderView> get(int id) async =>
      OrderView.fromJson(unwrap(await _dio.get('/shop/orders/$id'))['order']);
  Future<OrderView> confirmPayment(int id, String utr) async =>
      OrderView.fromJson(unwrap(await _dio.post('/shop/orders/$id/payment-confirm', data: {'utr': utr}))['order']);
}

// app/router.dart (illustration): five branches, role-based root of branch 0
StatefulShellRoute.indexedStack(
  builder: (c, s, shell) => ShellScaffold(shell: shell),
  branches: [
    StatefulShellBranch(routes: [GoRoute(path: '/id', builder: (c, s) => const IdHomeByRole(), routes: [...])]),
    StatefulShellBranch(routes: [GoRoute(path: '/shop', builder: (c, s) => const ShopHomeScreen(), routes: [...])]),
    // /cart, /orders, /account …
  ],
)
```
