> **SUPERSEDED — historical reference only.** This proposal predates the peer-to-peer payment rebuild (it assumes a payment gateway, a server-side cart, `riverpod_annotation` code generation and `/orders/confirmed`). The authoritative structure is `docs/01-ARCHITECTURE.md`; every conflict is resolved in `docs/11-DESIGN-VS-BACKEND.md`.

# CYD Shop: Flutter project structure (proposal)

Visual reference: `CYD Shop Mobile.dc.html`. It uses Nitrogen's design language (Anton display type, Archivo UI type, DM Mono labels, hairline cards, 14–22 px radii, a pill-shaped floating tab bar) with the accent changed to CYD saffron `#FFA51F`. Light and dark themes both come from one token set.

## Packages
`go_router`, `flutter_riverpod` (+ `riverpod_annotation`), `dio`, `flutter_secure_storage`, `cached_network_image`, `google_fonts`, `image_picker`, `url_launcher` (opens the UPI intent / gateway URL), `intl`.

## Folder layout
```
lib/
  main.dart                      ProviderScope + MaterialApp.router
  app/
    router.dart                  go_router: StatefulShellRoute (5 tabs) + redirect guard (no token → /login)
    theme.dart                   CydColors (dark/light), CydType, CydRadii; ThemeExtension<CydTokens>
  core/
    config/env.dart              baseUrl (--dart-define)
    network/
      dio_provider.dart          one Dio; AuthInterceptor
      auth_interceptor.dart      attaches Bearer token; on 401 → clear storage → router.go('/login')  (mirrors src/api/apiClient.js)
      api_exception.dart         maps {success:false,message} and DioException → ApiException
    storage/token_store.dart     flutter_secure_storage wrapper
    money.dart                   formatPaise(int) => '₹${(p/100).toStringAsFixed(2)}'
    image_data_url.dart          XFile → 'data:image/jpeg;base64,…' (resize to ≤1600px first)
    widgets/                     CydButton, CydCard, StatusChip, SkeletonBox, EmptyState, ErrorState,
                                 AsyncListView<T> (loading→skeleton / empty / error+retry / data), PriceText, BottomSheetScaffold
  features/
    auth/        data/auth_repository.dart · presentation/login_screen.dart · authControllerProvider
    marketplace/ data/(products_repository, shops_repository, categories_repository)
                 presentation/(home, categories, search_filter, storefront, product_detail)
    cart/        data/cart_repository.dart · cart_controller.dart (AsyncNotifier) · cart_screen.dart
    checkout/    checkout_controller.dart (step, address, method) · checkout_screen.dart
    payments/    payment_repository.dart · payment_poller.dart · payment_screen.dart · confirmation_screen.dart
    orders/      orders_repository.dart · my_orders_screen.dart · order_detail_screen.dart · order_status.dart
    addresses/   addresses_repository.dart · addresses_screen.dart · address_form_screen.dart
    seller/      seller_repository.dart · become_seller_screen.dart
    owner/       owner_repository.dart · my_shop_screen.dart (tabs: products/orders/profile)
                 product_form_screen.dart · owner_order_detail_screen.dart
    admin/       admin_repository.dart · shop_applications_screen.dart · review_sheet.dart
  models/        product.dart, shop.dart, category.dart, cart_item.dart, order.dart, address.dart, payment_status.dart
                 (hand-written fromJson; every money field is an `int …Paise`)
```

## State management, by feature
- **Auth**: `authControllerProvider` (AsyncNotifier<User?>). Its state drives the router's `refreshListenable`.
- **Lists** (products, shop products, orders, addresses, owner products/orders, applications): `FutureProvider.family` keyed by the filter (query, category, status). Screens render through `AsyncListView`, which shows a skeleton while loading, an empty state, or an error with retry. Pull-to-refresh calls `ref.invalidate`.
- **Cart**: server-backed `AsyncNotifier`. Changes update the UI immediately and roll back if the request fails. The badge count is a derived `Provider<int>`.
- **Checkout**: a `Notifier` holding step, selected address and payment method. Placing the order makes one call. The backend splits a multi-shop cart into one order per shop and returns all of them.
- **Payments**: an `AutoDispose` `StreamProvider.family(orderId)` that polls `GET /shop/payments/:orderId/status` every 3 s and stops on `paid`/`failed` or after 2 min (then shows "still waiting"). The gateway checkout is opened with `url_launcher` behind an 8 s timeout. If the timeout hits, the screen shows "Payment page didn't open" while polling continues, since polling is the real source of truth. With several unpaid orders, the screen pays them one after another.
- **Orders state machine**: `order_status.dart` has a const `allowedTransitions` map copied verbatim from `controllers/orderController.js`. The owner screen builds its action buttons only from `allowedTransitions[order.status]`. Customer cancel shows only for `pending_payment`/`placed`.
- **Owner/Admin mutations**: small `Notifier`s that call the repository, then `invalidate` the affected list providers.

## Contract rules carried into code
- API money is always `*_paise` ints. The product form sends rupee `num` in `price`/`compare_at_price`.
- Images are base64 data URLs in the JSON body (`logo`, `banner`, `images[]`), never multipart.
- Role gating: the Account tab shows "Become a seller" or "My shop" depending on `/shop/my-shop` status (none/pending/rejected/suspended/approved), and "Shop applications" only when `user.role == admin`.

## Routes
`/` home · `/categories` · `/search?q&cat` · `/shops/:id` · `/products/:id` · `/cart` · `/checkout` · `/pay/:orderIds` · `/orders/confirmed` · `/orders` · `/orders/:id` · `/account` · `/account/addresses(/new|/:id)` · `/account/sell` · `/my-shop` · `/my-shop/products/new|:id` · `/my-shop/orders/:id` · `/admin/applications` · `/login`
