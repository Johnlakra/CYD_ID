import 'package:cyd_app/core/format/money.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('formatPaise', () {
    test('zero', () => expect(formatPaise(0), '₹0.00'));
    test('sub-rupee', () {
      expect(formatPaise(5), '₹0.05');
      expect(formatPaise(99), '₹0.99');
    });
    test('whole rupee', () => expect(formatPaise(100), '₹1.00'));
    test('typical', () {
      expect(formatPaise(34950), '₹349.50');
      expect(formatPaise(15000), '₹150.00');
    });
    test('thousands', () => expect(formatPaise(125050), '₹1,250.50'));
    test('lakh grouping', () {
      expect(formatPaise(10000000), '₹1,00,000.00');
      expect(formatPaise(123456789), '₹12,34,567.89');
    });
    test('crore', () => expect(formatPaise(1000000000), '₹1,00,00,000.00'));
    test('null', () => expect(formatPaise(null), '₹0.00'));
    test('negative', () => expect(formatPaise(-125050), '-₹1,250.50'));
    test('line total uses integer math', () {
      expect(formatPaise(34950 * 2), '₹699.00');
    });
  });

  group('paiseToUpiAmount / paiseToRupeesString', () {
    test('plain decimal, no symbol or grouping', () {
      expect(paiseToUpiAmount(125050), '1250.50');
      expect(paiseToUpiAmount(5), '0.05');
      expect(paiseToUpiAmount(100), '1.00');
      expect(paiseToRupeesString(1999), '19.99');
    });
  });

  group('parseRupees', () {
    test('valid', () {
      expect(parseRupees('199.50'), 19950);
      expect(parseRupees('19.99'), 1999);
      expect(parseRupees('0.1'), 10);
      expect(parseRupees('.5'), 50);
      expect(parseRupees('150'), 15000);
      expect(parseRupees(' 150 '), 15000);
    });
    test('invalid', () {
      for (final s in ['', 'abc', '1,250', '-5', '1.234', '.', '1.']) {
        expect(parseRupees(s), isNull, reason: 'input "$s"');
      }
    });
  });
}
