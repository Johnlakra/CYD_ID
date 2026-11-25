import 'package:cyd_app/app/debug/gallery_sections.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../support/golden_harness.dart';

/// Doc 02 §8: every widget must survive text scale 1.3 without overflow.
void main() {
  for (final section in gallerySections) {
    for (final brightness in Brightness.values) {
      testWidgets('${section.id} at 1.3x text, 360 px, ${brightness.name}', (
        tester,
      ) async {
        await pumpGolden(
          tester,
          Builder(builder: section.builder),
          brightness: brightness,
          width: 360,
          textScale: 1.3,
        );
        expect(tester.takeException(), isNull);
      });
    }
  }
}
