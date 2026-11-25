import 'dart:io';

import 'package:cyd_app/core/theme/font_licenses.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('every bundled font family has a licence file', () {
    for (final path in fontLicenseAssets.values) {
      final f = File(path);
      expect(f.existsSync(), isTrue, reason: path);
      expect(f.readAsStringSync(), contains('SIL OPEN FONT LICENSE'));
      expect(f.readAsStringSync(), startsWith('Copyright'));
    }
    final pubspec = File('pubspec.yaml').readAsStringSync();
    for (final path in fontLicenseAssets.values) {
      expect(pubspec, contains(path));
    }
  });

  test('registerFontLicenses adds one licence per family', () async {
    registerFontLicenses();
    final entries = <LicenseEntry>[];
    await for (final e in LicenseRegistry.licenses) {
      entries.add(e);
    }
    final packages = entries.expand((e) => e.packages).toSet();
    for (final name in fontLicenseAssets.keys) {
      expect(packages, contains(name));
    }
  });
}
