import 'package:cyd_app/core/widgets/cyd_icons.dart';
import 'package:cyd_app/core/widgets/svg_path.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('parses every tab icon', () {
    for (final d in [
      CydTabIcons.myProfile,
      CydTabIcons.profiles,
      CydTabIcons.shop,
      CydTabIcons.cart,
      CydTabIcons.orders,
      CydTabIcons.account,
    ]) {
      expect(parseSvgPath(d).getBounds().isEmpty, isFalse, reason: d);
    }
  });

  test('numbers after Z throw instead of hanging', () {
    expect(() => parseSvgPath('M0 0Z 3 4'), throwsFormatException);
  }, timeout: const Timeout(Duration(seconds: 5)));

  test('truncated data throws FormatException, not RangeError', () {
    expect(() => parseSvgPath('M1'), throwsFormatException);
    expect(() => parseSvgPath('M1 2 L3'), throwsFormatException);
    expect(() => parseSvgPath('a1 1 0 1'), throwsFormatException);
  });

  test('leading number without a command throws', () {
    expect(() => parseSvgPath('1 2'), throwsFormatException);
  });

  test('unsupported commands throw', () {
    expect(() => parseSvgPath('M0 0 C1 1 2 2 3 3'), throwsFormatException);
  });

  test('exponents and leading plus are numbers', () {
    final b = parseSvgPath('M+1e1 2E0 L1.5e1 +4').getBounds();
    expect(b.left, 10);
    expect(b.right, 15);
    expect(b.top, 2);
    expect(b.bottom, 4);
  });

  test('compact arc flags are read as single characters', () {
    // "a1 1 0 011 1": large=0, sweep=1, then dx=1, dy=1.
    final b = parseSvgPath('M0 0 a1 1 0 011 1').getBounds();
    expect(b.right, closeTo(1, 1e-6));
    expect(b.bottom, closeTo(1, 1e-6));
  });

  test('implicit lineto after M and repeated args', () {
    final b = parseSvgPath('M0 0 5 5 10 0').getBounds();
    expect(b.right, 10);
    expect(b.bottom, 5);
  });

  test('empty data is an empty path', () {
    expect(parseSvgPath('').getBounds().isEmpty, isTrue);
  });
}
