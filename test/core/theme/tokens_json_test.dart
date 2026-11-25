import 'dart:convert';
import 'dart:io';

import 'package:cyd_app/app/theme.dart';
import 'package:cyd_app/core/widgets/cyd_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// `#RRGGBB` or `rgba(r,g,b,a)` -> Color.
Color parseCss(String css) {
  if (css.startsWith('#')) {
    return Color(0xFF000000 | int.parse(css.substring(1), radix: 16));
  }
  final m = RegExp(r'rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)')
      .firstMatch(css)!;
  return Color.fromRGBO(
    int.parse(m[1]!),
    int.parse(m[2]!),
    int.parse(m[3]!),
    double.parse(m[4]!),
  );
}

void main() {
  final json = jsonDecode(
    File('design/tokens.json').readAsStringSync(),
  ) as Map<String, dynamic>;

  Map<String, dynamic> set(String k) => json[k] as Map<String, dynamic>;

  void expectSet(String name, CydTokens t) {
    final j = set(name);
    final expected = <String, Color>{
      'bg': t.bg,
      'card': t.card,
      'raised': t.raised,
      'sunk': t.sunk,
      'ink': t.ink,
      'mute': t.mute,
      'faint': t.faint,
      'line': t.line,
      'line2': t.line2,
      'accSoft': t.accSoft,
      'accText': t.accText,
      'danger': t.danger,
      'ok': t.ok,
      'tabbg': t.tabbg,
      'skel': t.skel,
      'likedHeart': t.likedHeart,
      'soldOutOverlay': t.soldOutOverlay,
      'sheetScrim': t.sheetScrim,
      'dialogScrim': t.dialogScrim,
      'toastBg': t.toastBg,
      'toastFg': t.toastFg,
      'tabActiveFg': t.tabActiveFg,
      'toastAction': t.toastAction,
      'onDanger': t.onDanger,
      'bannerDanger': t.bannerDanger,
      'bannerOk': t.bannerOk,
      'bannerCod': t.bannerCod,
      'codFg': t.codFg,
    };
    for (final e in expected.entries) {
      expect(
        e.value.toARGB32(),
        parseCss(j[e.key] as String).toARGB32(),
        reason: '$name.${e.key}',
      );
    }
    expect(t.statusChipBgAlpha, (j['statusChipBgAlpha'] as num).toDouble());
  }

  test(
    'dark tokens match tokens.json',
    () => expectSet('dark', CydTokens.dark),
  );
  test(
    'light tokens match tokens.json',
    () => expectSet('light', CydTokens.light),
  );

  test('accent and on-accent match tokens.json', () {
    expect(
      CydTokens.accent.toARGB32(),
      parseCss(json['accent'] as String).toARGB32(),
    );
    expect(
      CydTokens.onAccent.toARGB32(),
      parseCss(json['onAccent'] as String).toARGB32(),
    );
  });

  test('every status chip in tokens.json exists with the same colours', () {
    final chips = json['statusChips'] as Map<String, dynamic>;
    expect(cydStatusStyles.keys.toSet(), chips.keys.toSet());
    for (final e in chips.entries) {
      final j = e.value as Map<String, dynamic>;
      final s = cydStatusStyles[e.key]!;
      expect(s.label, j['label'], reason: e.key);
      expect(s.darkFg.toARGB32(), parseCss(j['darkFg'] as String).toARGB32());
      expect(s.lightFg.toARGB32(), parseCss(j['lightFg'] as String).toARGB32());
      expect(s.scope, j['scope']);
    }
  });

  test('tab icons match tokens.json', () {
    final tabs = (json['tabBar'] as Map<String, dynamic>)['tabs'] as List;
    final byKey = {
      for (final t in tabs.cast<Map<String, dynamic>>())
        t['key'] as String: t['icon'] as String,
    };
    expect(byKey['myProfile'], CydTabIcons.myProfile);
    expect(byKey['profiles'], CydTabIcons.profiles);
    expect(byKey['shop'], CydTabIcons.shop);
    expect(byKey['cart'], CydTabIcons.cart);
    expect(byKey['orders'], CydTabIcons.orders);
    expect(byKey['account'], CydTabIcons.account);
  });

  test('font families match tokens.json', () {
    final fam =
        (json['type'] as Map<String, dynamic>)['families']
            as Map<String, dynamic>;
    expect((fam['display'] as Map)['asset'], CydFonts.display);
    expect((fam['ui'] as Map)['asset'], CydFonts.ui);
    expect((fam['mono'] as Map)['asset'], CydFonts.mono);
  });

  test('theme carries the tokens extension and Manrope', () {
    for (final b in Brightness.values) {
      final theme = cydTheme(b);
      final t = theme.extension<CydTokens>()!;
      expect(t.brightness, b);
      expect(theme.scaffoldBackgroundColor, t.bg);
      expect(theme.textTheme.bodyMedium!.fontFamily, CydFonts.ui);
    }
  });

  test('pubspec bundles every font file', () {
    final pubspec = File('pubspec.yaml').readAsStringSync();
    for (final f in Directory('assets/fonts').listSync()) {
      if (f.path.endsWith('.ttf')) {
        expect(pubspec, contains(f.path.split('/').last));
      }
    }
  });
}
