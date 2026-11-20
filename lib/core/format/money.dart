/// Money is always `int` paise (doc 06 §7.1). Never use `double`.
library;

const String _rupee = '₹';

/// `125050` -> `₹1,250.50` (Indian grouping). `null` -> `₹0.00`;
/// negatives -> `-₹x.xx`.
String formatPaise(int? paise) {
  final p = paise ?? 0;
  final negative = p < 0;
  final abs = p.abs();
  final whole = _groupIndian((abs ~/ 100).toString());
  final frac = (abs % 100).toString().padLeft(2, '0');
  return '${negative ? '-' : ''}$_rupee$whole.$frac';
}

/// Plain decimal for UPI links / copy rows: `125050` -> `1250.50`.
String paiseToUpiAmount(int paise) => paiseToRupeesString(paise);

/// Two-decimal rupee string built from int paise (no float math). Used for
/// the product create/update request bodies (the one rupee exception).
String paiseToRupeesString(int paise) {
  final negative = paise < 0;
  final abs = paise.abs();
  final frac = (abs % 100).toString().padLeft(2, '0');
  return '${negative ? '-' : ''}${abs ~/ 100}.$frac';
}

final RegExp _rupeesPattern = RegExp(r'^\d+(\.\d{1,2})?$|^\.\d{1,2}$');

/// Parses a user-entered rupee amount into paise by string split, or `null`
/// if invalid (commas, letters, negatives, more than 2 decimals, empty).
int? parseRupees(String input) {
  final s = input.trim();
  if (!_rupeesPattern.hasMatch(s)) return null;
  final parts = s.split('.');
  final whole = parts[0].isEmpty ? 0 : int.tryParse(parts[0]);
  if (whole == null) return null;
  final frac = parts.length > 1 ? int.parse(parts[1].padRight(2, '0')) : 0;
  return whole * 100 + frac;
}

String _groupIndian(String digits) {
  if (digits.length <= 3) return digits;
  final last3 = digits.substring(digits.length - 3);
  var rest = digits.substring(0, digits.length - 3);
  final groups = <String>[];
  while (rest.length > 2) {
    groups.insert(0, rest.substring(rest.length - 2));
    rest = rest.substring(0, rest.length - 2);
  }
  if (rest.isNotEmpty) groups.insert(0, rest);
  return '${groups.join(',')},$last3';
}
