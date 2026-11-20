import 'package:cyd_app/core/format/text.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('capitalizeName', () {
    test(
      'basic',
      () => expect(capitalizeName('john paul singh'), 'John Paul Singh'),
    );
    test('only after a single space', () {
      expect(capitalizeName("MARY-ANNE d'souza"), "Mary-anne D'souza");
    });
    test('null and empty', () {
      expect(capitalizeName(null), '');
      expect(capitalizeName(''), '');
    });
    test('double space keeps the empty word', () {
      expect(capitalizeName('a  b'), 'A  B');
    });
  });

  group('UTR', () {
    test('normalizeUtr strips spaces and hyphens', () {
      expect(normalizeUtr(' 4291 8830 1127 '), '429188301127');
      expect(normalizeUtr('4291-8830-1127'), '429188301127');
    });
    test('isValidUtr needs exactly 12 digits', () {
      expect(isValidUtr('429188301127'), isTrue);
      expect(isValidUtr(normalizeUtr('UTR429')), isFalse);
      expect(isValidUtr('42918830112'), isFalse);
    });
    test('groupUtr', () {
      expect(groupUtr('429188301127'), '4291 8830 1127');
      expect(groupUtr('42918'), '4291 8');
      expect(groupUtr('429188'), '4291 88');
      expect(groupUtr(''), '');
      expect(groupUtr('42a91'), '4291');
    });
  });

  group('normalizePhone', () {
    test('digits only', () {
      expect(normalizePhone('98765 43210'), '9876543210');
      expect(normalizePhone('+91 98765-43210'), '919876543210');
    });
  });
}
