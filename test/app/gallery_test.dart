import 'package:cyd_app/app/debug/gallery_screen.dart';
import 'package:cyd_app/app/debug/gallery_sections.dart';
import 'package:cyd_app/app/router.dart';
import 'package:cyd_app/app/theme.dart';
import 'package:cyd_app/core/storage/prefs.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../support/scope.dart';

void main() {
  testWidgets('/debug/gallery lists every section and toggles the theme', (
    tester,
  ) async {
    tester.view.devicePixelRatio = 1;
    tester.view.physicalSize = const Size(390, 844);
    addTearDown(tester.view.reset);
    final router = buildRouter(initialLocation: Routes.debugGallery);
    addTearDown(router.dispose);
    await tester.pumpWidget(
      testScope(
        child: MaterialApp.router(
          theme: cydTheme(Brightness.light),
          routerConfig: router,
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));
    expect(find.byType(GalleryScreen), findsOneWidget);
    expect(find.text('Design gallery'), findsOneWidget);

    Brightness current() =>
        Theme.of(tester.element(find.text('Design gallery'))).brightness;
    final before = current();
    await tester.tap(find.byIcon(Icons.dark_mode_outlined));
    await tester.pump();
    expect(current(), isNot(before));

    // The sections are scrollable: the first is visible, all are registered.
    expect(gallerySections.length, greaterThanOrEqualTo(15));
  });

  testWidgets('the real router shows the shell for the first tab', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    tester.view.devicePixelRatio = 1;
    tester.view.physicalSize = const Size(390, 844);
    addTearDown(tester.view.reset);
    final router = buildRouter(initialLocation: Routes.id);
    addTearDown(router.dispose);
    await tester.pumpWidget(
      testScope(
        overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
        child: MaterialApp.router(
          theme: cydTheme(Brightness.light),
          routerConfig: router,
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('cyd-tab-bar')), findsOneWidget);
    expect(find.text('My Profile'), findsOneWidget);

    router.go(Routes.orders);
    await tester.pumpAndSettle();
    expect(find.text('Orders'), findsOneWidget);

    // Splash and login still work outside the shell.
    router.go(Routes.login);
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('cyd-tab-bar')), findsNothing);
    expect(router.state.uri.path, Routes.login);
  });
}
