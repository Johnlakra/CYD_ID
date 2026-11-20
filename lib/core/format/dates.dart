/// Date/time helpers (doc 06 §7.2, §7.3; doc 07 §6.2, §7.4). Explicit patterns
/// only; never locale-dependent `yMd`. Missing/invalid input renders `—`.
library;

import 'package:intl/intl.dart';

const String emDash = '—';

// Fixed en_US (the only locale intl bundles without async init) with explicit
// patterns keeps output identical on every device, independent of the
// default locale.
const String _locale = 'en_US';

final RegExp _plainDate = RegExp(r'^\d{4}-\d{2}-\d{2}$');

/// API date string -> calendar date (time 00:00 local), or `null`.
/// Plain `YYYY-MM-DD` is that calendar date; an ISO instant is converted to
/// local time and its y/m/d kept (doc 07 §7.4).
DateTime? parseApiDate(String? s) {
  if (s == null || s.trim().isEmpty) return null;
  final t = s.trim();
  if (_plainDate.hasMatch(t)) {
    final y = int.parse(t.substring(0, 4));
    final m = int.parse(t.substring(5, 7));
    final d = int.parse(t.substring(8, 10));
    final date = DateTime(y, m, d);
    // Reject overflow such as 2000-02-31.
    if (date.year != y || date.month != m || date.day != d) return null;
    return date;
  }
  final parsed = DateTime.tryParse(t);
  if (parsed == null) return null;
  final local = parsed.toLocal();
  return DateTime(local.year, local.month, local.day);
}

/// API timestamp (orders, chat) -> local instant, or `null`. Display only;
/// never derive deadlines from this (use `*_seconds_left`).
DateTime? parseApiTimestamp(String? s) {
  if (s == null || s.trim().isEmpty) return null;
  return DateTime.tryParse(s.trim())?.toLocal();
}

String _fmt(DateTime? d, String pattern) =>
    d == null ? emDash : DateFormat(pattern, _locale).format(d);

/// ID card: `05-01-2000`.
String formatCardDate(String? apiDate) =>
    _fmt(parseApiDate(apiDate), 'dd-MM-yyyy');

/// Profile screens: `05/01/2000`.
String formatProfileDate(String? apiDate) =>
    _fmt(parseApiDate(apiDate), 'dd/MM/yyyy');

/// Request bodies: `2000-01-05`.
String formatRequestDate(DateTime date) =>
    DateFormat('yyyy-MM-dd', _locale).format(date);

/// "Joined" line: `Mar 05, 2026`.
String formatJoinedDate(String? apiDate) =>
    _fmt(parseApiTimestamp(apiDate), 'MMM dd, yyyy');

/// "Updated" line: `March 05, 2026 at 4:07 PM`.
String formatUpdatedAt(String? apiDate) =>
    _fmt(parseApiTimestamp(apiDate), "MMMM dd, yyyy 'at' h:mm a");

/// Order/chat/dispute lists: `5 Mar 2026`.
String formatOrderDate(String? apiDate) =>
    _fmt(parseApiTimestamp(apiDate), 'd MMM yyyy');

/// Order/chat/dispute detail: `5 Mar 2026, 4:07 PM`.
String formatOrderDateTime(String? apiDate) =>
    _fmt(parseApiTimestamp(apiDate), 'd MMM yyyy, h:mm a');

/// Countdown from server `*_seconds_left` (doc 06 §7.3).
String formatCountdown(int seconds) {
  if (seconds <= 0) return '0:00';
  if (seconds < 3600) {
    final m = seconds ~/ 60;
    final s = (seconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }
  if (seconds < 86400) {
    final h = seconds ~/ 3600;
    final m = ((seconds % 3600) ~/ 60).toString().padLeft(2, '0');
    return '${h}h ${m}m';
  }
  final d = seconds ~/ 86400;
  final h = (seconds % 86400) ~/ 3600;
  return '${d}d ${h}h';
}
