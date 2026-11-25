import 'package:cyd_app/core/storage/prefs.dart';
import 'package:cyd_app/core/theme/theme_mode_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../support/scope.dart';

Future<ProviderContainer> _container(Map<String, Object> initial) async {
  SharedPreferences.setMockInitialValues(initial);
  final prefs = await SharedPreferences.getInstance();
  return testContainer(
    overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
  );
}

void main() {
  test('defaults to system', () async {
    final c = await _container({});
    addTearDown(c.dispose);
    expect(c.read(themeModeProvider), ThemeMode.system);
  });

  test('set persists and a new container restores it', () async {
    final c = await _container({});
    addTearDown(c.dispose);
    await c.read(themeModeProvider.notifier).set(ThemeMode.dark);
    expect(c.read(themeModeProvider), ThemeMode.dark);

    final prefs = c.read(sharedPreferencesProvider);
    expect(prefs.getString(Prefs.themeModeKey), 'dark');

    final c2 = testContainer(
      overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
    );
    addTearDown(c2.dispose);
    expect(c2.read(themeModeProvider), ThemeMode.dark);
  });

  test('every mode round-trips; an unknown stored value falls back', () async {
    for (final m in ThemeMode.values) {
      final c = await _container({Prefs.themeModeKey: m.name});
      expect(c.read(themeModeProvider), m);
      c.dispose();
    }
    final c = await _container({Prefs.themeModeKey: 'sepia'});
    addTearDown(c.dispose);
    expect(c.read(themeModeProvider), ThemeMode.system);
  });
}
