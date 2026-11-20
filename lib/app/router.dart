import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'debug/health_screen.dart';
import 'placeholder_screens.dart';

/// Route paths (doc 01 §6). Keep stable; feature agents add their own.
class Routes {
  const Routes._();

  static const splash = '/splash';
  static const login = '/login';
  static const debugHealth = '/debug/health';
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
      if (!kReleaseMode)
        GoRoute(
          path: Routes.debugHealth,
          builder: (context, state) => const HealthScreen(),
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
