import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'debug/gallery_screen.dart';
import 'debug/health_screen.dart';
import 'placeholder_screens.dart';
import 'shell.dart';

/// Route paths (doc 01 §6). Keep stable; feature agents add their own.
class Routes {
  const Routes._();

  static const splash = '/splash';
  static const login = '/login';
  static const debugHealth = '/debug/health';
  static const debugGallery = '/debug/gallery';

  // Tab roots (doc 01 §6). Feature milestones add their sub-routes.
  static const id = '/id';
  static const shop = '/shop';
  static const cart = '/cart';
  static const orders = '/orders';
  static const account = '/account';
}

/// Root navigator key: tab-less routes use `parentNavigatorKey` with it
/// (doc 01 §6). Used from M1 when the shell exists.
final rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');

GoRouter buildRouter({String initialLocation = Routes.splash}) {
  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: initialLocation,
    routes: [
      GoRoute(
        path: Routes.splash,
        builder: (context, state) => const SplashPlaceholder(),
      ),
      GoRoute(
        path: Routes.login,
        builder: (context, state) => const LoginPlaceholder(),
      ),
      // Debug-only: not registered in release builds.
      if (!kReleaseMode) ...[
        GoRoute(
          path: Routes.debugHealth,
          builder: (context, state) => const HealthScreen(),
        ),
        GoRoute(
          path: Routes.debugGallery,
          builder: (context, state) => const GalleryScreen(),
        ),
      ],
      // The five tabs. The first branch's root is role-based (doc 01 §6):
      // feature milestones replace the placeholders below.
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) =>
            ShellScaffold(navigationShell: shell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.id,
                builder: (context, state) => const _FirstTabRoot(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.shop,
                builder: (context, state) =>
                    const TabRootPlaceholder(title: 'Shop'),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.cart,
                builder: (context, state) =>
                    const TabRootPlaceholder(title: 'Cart'),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.orders,
                builder: (context, state) =>
                    const TabRootPlaceholder(title: 'Orders'),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.account,
                builder: (context, state) =>
                    const TabRootPlaceholder(title: 'Account'),
              ),
            ],
          ),
        ],
      ),
    ],
  );
}

/// The router lives in a provider so later milestones can attach the session
/// `refreshListenable` and redirect guard.
final routerProvider = Provider<GoRouter>((ref) {
  final router = buildRouter();
  ref.onDispose(router.dispose);
  return router;
});

/// Role-based root of the first tab (My Profile / Profiles) until M4/M5.
class _FirstTabRoot extends ConsumerWidget {
  const _FirstTabRoot();

  @override
  Widget build(BuildContext context, WidgetRef ref) =>
      TabRootPlaceholder(title: ref.watch(firstTabProvider).label);
}
