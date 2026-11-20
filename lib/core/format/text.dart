/// Text helpers (doc 06 §7.4, doc 07 §6.1).
library;

/// Display-only: lower-case, then upper-case the first letter after each
/// single space. Never send the result to the server.
String capitalizeName(String? name) {
  if (name == null || name.isEmpty) return '';
  return name
      .toLowerCase()
      .split(' ')
      .map((w) => w.isEmpty ? w : w[0].toUpperCase() + w.substring(1))
      .join(' ');
}

final RegExp _utrStrip = RegExp(r'[\s-]');
final RegExp _utrValid = RegExp(r'^\d{12}$');

/// Removes whitespace and `-`. Submittable only if [isValidUtr].
String normalizeUtr(String input) => input.replaceAll(_utrStrip, '');

bool isValidUtr(String normalized) => _utrValid.hasMatch(normalized);

/// `429188301127` -> `4291 8830 1127`; shorter input groups what it has.
/// Non-digits are dropped.
String groupUtr(String input) {
  final digits = input.replaceAll(RegExp(r'\D'), '');
  final buf = StringBuffer();
  for (var i = 0; i < digits.length; i++) {
    if (i > 0 && i % 4 == 0) buf.write(' ');
    buf.write(digits[i]);
  }
  return buf.toString();
}

/// Digits only. The forms require exactly 10.
String normalizePhone(String input) => input.replaceAll(RegExp(r'\D'), '');
