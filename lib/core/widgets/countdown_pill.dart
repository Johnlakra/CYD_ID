import 'dart:async';

import 'package:flutter/material.dart';

import '../theme/cyd_tokens.dart';
import '../theme/cyd_type.dart';
import '../theme/status_styles.dart';
import 'cyd_icons.dart';

/// Countdown from the server's seconds-left value (`pay_seconds_left` /
/// `confirm_seconds_left`): ticks locally every second and re-syncs whenever
/// [secondsLeft] changes (every fetch). Never reads the device clock.
///
/// `mm:ss` under an hour, `h:mm:ss` above; accent fill, danger under five
/// minutes; "Time's up" at zero and [onExpired] fires once.
class CountdownPill extends StatefulWidget {
  const CountdownPill({
    super.key,
    required this.secondsLeft,
    this.onExpired,
    this.expiredLabel = "Time's up",
  });

  final int secondsLeft;
  final VoidCallback? onExpired;
  final String expiredLabel;

  /// `75` -> `01:15`, `3725` -> `1:02:05`.
  static String format(int seconds) {
    final s = seconds < 0 ? 0 : seconds;
    final h = s ~/ 3600;
    final m = (s % 3600) ~/ 60;
    final sec = s % 60;
    String two(int n) => n.toString().padLeft(2, '0');
    return h > 0 ? '$h:${two(m)}:${two(sec)}' : '${two(m)}:${two(sec)}';
  }

  @override
  State<CountdownPill> createState() => _CountdownPillState();
}

class _CountdownPillState extends State<CountdownPill> {
  late int _left = widget.secondsLeft;
  Timer? _timer;
  bool _expiredFired = false;

  @override
  void initState() {
    super.initState();
    _start();
  }

  void _start() {
    _timer?.cancel();
    _expiredFired = false;
    if (_left <= 0) {
      _fireExpired();
      return;
    }
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() => _left = _left - 1);
      if (_left <= 0) {
        _timer?.cancel();
        _fireExpired();
      }
    });
  }

  void _fireExpired() {
    if (_expiredFired) return;
    _expiredFired = true;
    final cb = widget.onExpired;
    if (cb != null) WidgetsBinding.instance.addPostFrameCallback((_) => cb());
  }

  @override
  void didUpdateWidget(CountdownPill old) {
    super.didUpdateWidget(old);
    if (old.secondsLeft != widget.secondsLeft) {
      _left = widget.secondsLeft;
      _start();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final type = context.type;
    final urgent = _left < 300;
    final expired = _left <= 0;
    final fg = urgent ? t.danger : t.accText;
    final bg = urgent ? t.danger.withValues(alpha: .14) : t.accSoft;
    final text = expired ? widget.expiredLabel : CountdownPill.format(_left);
    return Semantics(
      label: expired
          ? widget.expiredLabel
          : '${CountdownPill.format(_left)} left',
      excludeSemantics: true,
      child: Container(
        height: 28,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(99),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            StatusGlyphIcon(StatusGlyph.timelapse, size: 14, color: fg),
            const SizedBox(width: 6),
            Text(text, style: type.countdown.copyWith(color: fg)),
          ],
        ),
      ),
    );
  }
}
