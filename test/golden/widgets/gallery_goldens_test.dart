import 'package:cyd_app/app/debug/gallery_sections.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../support/golden_harness.dart';

/// Sections that are dense (chips, tab bar) are also captured at 360 px.
const _dense = {
  'chips',
  'status_order',
  'status_payment',
  'status_other',
  'tab_bar',
  'inputs',
};

void main() {
  for (final section in gallerySections) {
    for (final brightness in Brightness.values) {
      final name = brightness.name;
      for (final width in [390.0, if (_dense.contains(section.id)) 360.0]) {
        testWidgets('${section.id} · $name · ${width.toInt()}', (tester) async {
          final boundary = await pumpGolden(
            tester,
            Builder(builder: section.builder),
            brightness: brightness,
            width: width,
          );
          await expectLater(
            boundary,
            matchesGoldenFile('${section.id}_${name}_${width.toInt()}.png'),
          );
        });
      }
    }
  }
}
