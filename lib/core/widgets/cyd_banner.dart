import 'package:flutter/material.dart';

import '../theme/cyd_tokens.dart';
import '../theme/cyd_type.dart';

/// Tinted banner. Two shapes:
/// - [CydBanner] with title + body (payment banners on order detail; radius 18)
/// - [CydBanner.alert] one-line message with a border and a leading "!" (login
///   errors: "Session expired. Please login again.").
class CydBanner extends StatelessWidget {
  const CydBanner({
    super.key,
    required this.body,
    this.title,
    this.tone = CydTone.accent,
    this.child,
  }) : bordered = false;

  /// Bordered single-line alert (danger by default); announced as an alert.
  const CydBanner.alert(String message, {super.key, this.tone = CydTone.danger})
    : body = message,
      title = null,
      child = null,
      bordered = true;

  final String? title;
  final String body;
  final CydTone tone;
  final bool bordered;

  /// Extra content under the text (countdown pill, "Pay now" button).
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final type = context.type;
    final fg = t.bannerFg(tone);
    final bg = t.bannerBg(tone);

    if (bordered) {
      return Semantics(
        liveRegion: true,
        container: true,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: fg),
          ),
          child: Text('! $body', style: type.banner.copyWith(color: fg)),
        ),
      );
    }
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title != null) ...[
            Text(
              title!,
              style: type.ui(14, weight: FontWeight.w700, color: fg),
            ),
            const SizedBox(height: 8),
          ],
          Text(body, style: type.ui(12, color: fg, height: 1.5)),
          if (child != null) ...[const SizedBox(height: 8), child!],
        ],
      ),
    );
  }
}
