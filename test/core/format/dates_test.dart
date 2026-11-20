import 'package:cyd_app/core/format/dates.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('card and profile dates', () {
    test('formatCardDate', () {
      expect(formatCardDate('2000-01-05'), '05-01-2000');
      expect(formatCardDate(null), '—');
      expect(formatCardDate('garbage'), '—');
      expect(formatCardDate(''), '—');
      expect(formatCardDate('2000-02-31'), '—');
    });
    test('formatProfileDate', () {
      expect(formatProfileDate('2000-01-05'), '05/01/2000');
      expect(formatProfileDate(null), '—');
    });
    test('formatRequestDate', () {
      expect(formatRequestDate(DateTime(2000, 1, 5)), '2000-01-05');
    });
  });

  group('parseApiDate', () {
    test('plain date keeps the calendar date', () {
      final d = parseApiDate('2000-01-05')!;
      expect([d.year, d.month, d.day], [2000, 1, 5]);
    });
    test('ISO instant converts to local and keeps y/m/d', () {
      final d = parseApiDate('1999-12-31T18:30:00.000Z')!;
      final local = DateTime.utc(1999, 12, 31, 18, 30).toLocal();
      expect([d.year, d.month, d.day], [local.year, local.month, local.day]);
    });
    test('null, empty and garbage', () {
      expect(parseApiDate(null), isNull);
      expect(parseApiDate(''), isNull);
      expect(parseApiDate('nope'), isNull);
    });
  });

  group('timestamps (no zone suffix parses as local)', () {
    test(
      'lists',
      () => expect(formatOrderDate('2026-03-05T16:07:00'), '5 Mar 2026'),
    );
    test('detail', () {
      expect(formatOrderDateTime('2026-03-05T16:07:00'), '5 Mar 2026, 4:07 PM');
    });
    test('joined and updated', () {
      expect(formatJoinedDate('2026-03-05T16:07:00'), 'Mar 05, 2026');
      expect(
        formatUpdatedAt('2026-03-05T16:07:00'),
        'March 05, 2026 at 4:07 PM',
      );
    });
    test('missing is an em dash, never throws', () {
      expect(formatOrderDate(null), '—');
      expect(formatOrderDateTime('garbage'), '—');
    });
  });

  group('formatCountdown', () {
    final cases = {
      -5: '0:00',
      0: '0:00',
      59: '0:59',
      125: '2:05',
      1799: '29:59',
      3600: '1h 00m',
      3725: '1h 02m',
      86399: '23h 59m',
      90000: '1d 1h',
    };
    cases.forEach((secs, expected) {
      test('$secs -> $expected', () => expect(formatCountdown(secs), expected));
    });
  });
}
