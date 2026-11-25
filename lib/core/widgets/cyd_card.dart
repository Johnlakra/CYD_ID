import 'package:flutter/material.dart';

import '../theme/cyd_tokens.dart';
import 'cyd_pressable.dart';

/// Base card: `card` fill, 1 px hairline, radius 24, soft lifted shadow.
/// Tappable cards fade slightly when pressed and expose button semantics.
class CydCard extends StatelessWidget {
  const CydCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
    this.radius = 24,
    this.semanticLabel,
    this.shadow = true,
    this.color,
    this.borderColor,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final double radius;
  final String? semanticLabel;

  /// Lifted shadow (off for nested / dense cards).
  final bool shadow;
  final Color? color;
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final box = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color ?? t.card,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: borderColor ?? t.line),
        boxShadow: shadow ? t.shadow : null,
      ),
      child: child,
    );
    if (onTap == null) return box;
    return CydPressable(
      onTap: onTap,
      semanticLabel: semanticLabel,
      minSize: 0,
      pressedOpacity: .8,
      child: box,
    );
  }
}

/// Notice card: `accSoft` fill, no border, radius 16 (awaiting / pending).
class CydInfoCard extends StatelessWidget {
  const CydInfoCard({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.tokens.accSoft,
        borderRadius: BorderRadius.circular(16),
      ),
      child: child,
    );
  }
}

/// Ended card: `sunk` fill, hairline, radius 16 (cancelled / rejected
/// explanations).
class CydEndedCard extends StatelessWidget {
  const CydEndedCard({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: t.sunk,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: t.line),
      ),
      child: child,
    );
  }
}
