import 'dart:convert';
import 'dart:ui' as ui;

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  for (final name in ['Parish', 'Deanery', 'Dexco']) {
    test('card background $name.jpg decodes', () async {
      final data = await rootBundle.load('assets/idcard/$name.jpg');
      final codec = await ui.instantiateImageCodec(data.buffer.asUint8List());
      final frame = await codec.getNextFrame();
      expect(frame.image.width, greaterThan(0));
      expect(frame.image.height, greaterThan(frame.image.width));
      frame.image.dispose();
    });
  }

  test('login-overlay.jpg is bundled', () async {
    final data = await rootBundle.load('assets/idcard/login-overlay.jpg');
    expect(data.lengthInBytes, greaterThan(0));
  });

  test('Gafata font file is bundled', () async {
    final data = await rootBundle.load('assets/fonts/Gafata-Regular.ttf');
    expect(data.lengthInBytes, greaterThan(1000));
  });

  test('levels.json parses with the three levels', () async {
    final m = jsonDecode(
      await rootBundle.loadString('assets/data/levels.json'),
    ) as Map<String, dynamic>;
    expect(m['values'], ['parish', 'deanery', 'dexco']);
  });

  test('designations.json parses with 13 values', () async {
    final m = jsonDecode(
      await rootBundle.loadString('assets/data/designations.json'),
    ) as Map<String, dynamic>;
    expect((m['values'] as List), hasLength(13));
  });

  test('deaneries.json parses and is non-empty', () async {
    final m = jsonDecode(
      await rootBundle.loadString('assets/data/deaneries.json'),
    ) as Map<String, dynamic>;
    expect((m['deaneries'] as Object), isNotEmpty);
  });
}
