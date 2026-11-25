import 'package:cyd_app/app/shell.dart';
import 'package:cyd_app/app/theme.dart';
import 'package:cyd_app/core/widgets/widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import '../support/scope.dart';

final _rootKey = GlobalKey<NavigatorState>();

GoRouter _router() => GoRouter(
  navigatorKey: _rootKey,
  initialLocation: '/id',
  routes: [
    // Pushed on the root navigator = covers the shell and its tab bar.
    GoRoute(
      path: '/checkout',
      parentNavigatorKey: _rootKey,
      builder: (context, state) => const Scaffold(body: Text('Checkout page')),
    ),
    StatefulShellRoute.indexedStack(
      builder: (context, state, shell) => ShellScaffold(navigationShell: shell),
      branches: [
        for (final p in ['id', 'shop', 'cart', 'orders', 'account'])
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/$p',
                builder: (context, state) => Scaffold(
                  body: Column(
                    children: [
                      Text('root:$p'),
                      TextButton(
                        onPressed: () => context.push('/checkout'),
                        child: const Text('open checkout'),
                      ),
                      const TextField(key: Key('field')),
                    ],
                  ),
                ),
              ),
            ],
          ),
      ],
    ),
  ],
);

Future<ProviderContainer> _pump(
  WidgetTester tester, {
  Brightness brightness = Brightness.light,
}) async {
  tester.view.devicePixelRatio = 1;
  tester.view.physicalSize = const Size(390, 844);
  addTearDown(tester.view.reset);
  final container = testContainer();
  addTearDown(container.dispose);
  final router = _router();
  addTearDown(router.dispose);
  await tester.pumpWidget(
    UncontrolledProviderScope(
      container: container,
      child: MaterialApp.router(
        theme: cydTheme(brightness),
        routerConfig: router,
      ),
    ),
  );
  await tester.pumpAndSettle();
  return container;
}

Color? _fill(WidgetTester tester, String key) {
  final box = tester.widget<AnimatedContainer>(
    find.descendant(
      of: find.byKey(Key(key)),
      matching: find.byType(AnimatedContainer),
    ),
  );
  return (box.decoration! as BoxDecoration).color;
}

void main() {
  testWidgets('shows five icon-only tabs with semantic labels', (tester) async {
    final handle = tester.ensureSemantics();
    await _pump(tester);
    for (final k in [
      'tab-first',
      'tab-shop',
      'tab-cart',
      'tab-orders',
      'tab-account',
    ]) {
      expect(find.byKey(Key(k)), findsOneWidget, reason: k);
    }
    for (final label in ['My Profile', 'Shop', 'Cart', 'Orders', 'Account']) {
      expect(find.bySemanticsLabel(label), findsOneWidget, reason: label);
    }
    // Icon-only: no visible tab text.
    expect(find.text('Shop'), findsNothing);
    handle.dispose();
  });

  testWidgets('tapping a tab selects it (gold circle) and switches branch', (
    tester,
  ) async {
    await _pump(tester);
    expect(find.text('root:id'), findsOneWidget);
    expect(_fill(tester, 'tab-first'), CydTokens.accent);
    expect(_fill(tester, 'tab-shop'), Colors.transparent);

    await tester.tap(find.byKey(const Key('tab-shop')));
    await tester.pumpAndSettle();
    expect(find.text('root:shop'), findsOneWidget);
    expect(_fill(tester, 'tab-shop'), CydTokens.accent);
    expect(_fill(tester, 'tab-first'), Colors.transparent);

    await tester.tap(find.byKey(const Key('tab-account')));
    await tester.pumpAndSettle();
    expect(find.text('root:account'), findsOneWidget);
  });

  testWidgets('selected semantics follow the active tab', (tester) async {
    final handle = tester.ensureSemantics();
    await _pump(tester);
    expect(
      tester.getSemantics(find.bySemanticsLabel('My Profile')),
      matchesSemantics(
        label: 'My Profile',
        isButton: true,
        isSelected: true,
        hasSelectedState: true,
        hasTapAction: true,
      ),
    );
    handle.dispose();
  });

  testWidgets('badges: cart quantity and shop needs-action, hidden at 0', (
    tester,
  ) async {
    final c = await _pump(tester);
    expect(find.byType(CydCountBadge), findsNothing);

    c.read(tabBadgesProvider.notifier)
      ..setCart(3)
      ..setShop(12);
    await tester.pump();
    expect(
      find.descendant(
        of: find.byKey(const Key('tab-cart')),
        matching: find.text('3'),
      ),
      findsOneWidget,
    );
    expect(
      find.descendant(
        of: find.byKey(const Key('tab-shop')),
        matching: find.text('12'),
      ),
      findsOneWidget,
    );
    expect(
      find.descendant(
        of: find.byKey(const Key('tab-orders')),
        matching: find.byType(CydCountBadge),
      ),
      findsNothing,
    );

    c.read(tabBadgesProvider.notifier)
      ..setCart(120)
      ..setShop(0);
    await tester.pump();
    expect(find.text('99+'), findsOneWidget);
    expect(
      find.descendant(
        of: find.byKey(const Key('tab-shop')),
        matching: find.byType(CydCountBadge),
      ),
      findsNothing,
    );
  });

  testWidgets('first tab follows the role: Profiles for admin / user', (
    tester,
  ) async {
    final handle = tester.ensureSemantics();
    final c = await _pump(tester);
    expect(find.bySemanticsLabel('My Profile'), findsOneWidget);
    c.read(firstTabProvider.notifier).set(FirstTab.profiles);
    await tester.pump();
    expect(find.bySemanticsLabel('Profiles'), findsOneWidget);
    expect(find.bySemanticsLabel('My Profile'), findsNothing);
    handle.dispose();
  });

  testWidgets('hidden on a screen pushed over the shell, back restores it', (
    tester,
  ) async {
    await _pump(tester);
    expect(find.byKey(const Key('cyd-tab-bar')), findsOneWidget);
    await tester.tap(find.text('open checkout'));
    await tester.pumpAndSettle();
    expect(find.text('Checkout page'), findsOneWidget);
    expect(find.byKey(const Key('cyd-tab-bar')).hitTestable(), findsNothing);

    _rootKey.currentState!.pop();
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('cyd-tab-bar')), findsOneWidget);
  });

  testWidgets('hidden while the keyboard is open', (tester) async {
    await _pump(tester);
    tester.view.viewInsets = const FakeViewPadding(bottom: 300);
    addTearDown(tester.view.resetViewInsets);
    await tester.pump();
    expect(find.byKey(const Key('cyd-tab-bar')), findsNothing);
    tester.view.resetViewInsets();
    await tester.pump();
    expect(find.byKey(const Key('cyd-tab-bar')), findsOneWidget);
  });

  testWidgets('tab circles are at least 44 dp and the bar fits 360 px', (
    tester,
  ) async {
    await _pump(tester);
    for (final k in [
      'tab-first',
      'tab-shop',
      'tab-cart',
      'tab-orders',
      'tab-account',
    ]) {
      final size = tester.getSize(find.byKey(Key(k)));
      expect(size.width, greaterThanOrEqualTo(44));
      expect(size.height, greaterThanOrEqualTo(44));
    }
    expect(
      tester.getSize(find.byKey(const Key('cyd-tab-bar'))).width,
      lessThanOrEqualTo(360),
    );
  });

  testWidgets('re-tapping the active tab pops to its root', (tester) async {
    await _pump(tester);
    await tester.tap(find.byKey(const Key('tab-first')));
    await tester.pumpAndSettle();
    expect(find.text('root:id'), findsOneWidget);
  });

  testWidgets('works in dark theme', (tester) async {
    await _pump(tester, brightness: Brightness.dark);
    expect(_fill(tester, 'tab-first'), CydTokens.accent);
  });
}
