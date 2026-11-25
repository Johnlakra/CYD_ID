import 'package:flutter/material.dart';

import '../strings.dart';
import '../theme/cyd_tokens.dart';
import '../theme/cyd_type.dart';
import 'cyd_button.dart';

/// Dashed rounded rectangle border (1.5 px, line2).
class _DashedBorder extends CustomPainter {
  _DashedBorder(this.color, this.radius);
  final Color color;
  final double radius;

  @override
  void paint(Canvas canvas, Size size) {
    final rrect = RRect.fromRectAndRadius(
      Offset.zero & size,
      Radius.circular(radius),
    ).deflate(.75);
    final path = Path()..addRRect(rrect);
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..color = color;
    for (final m in path.computeMetrics()) {
      var d = 0.0;
      while (d < m.length) {
        canvas.drawPath(m.extractPath(d, d + 6), paint);
        d += 10;
      }
    }
  }

  @override
  bool shouldRepaint(_DashedBorder old) =>
      old.color != color || old.radius != radius;
}

/// Dashed `sunk` container used by the empty and error cards (radius 20).
class DashedCard extends StatelessWidget {
  const DashedCard({super.key, required this.child, this.padding});

  final Widget child;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return CustomPaint(
      foregroundPainter: _DashedBorder(t.line2, 20),
      child: Container(
        width: double.infinity,
        padding:
            padding ?? const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
        decoration: BoxDecoration(
          color: t.sunk,
          borderRadius: BorderRadius.circular(20),
        ),
        child: child,
      ),
    );
  }
}

/// Empty state (dashed card). [icon] is rendered in a 56 dp tile; copy comes
/// from the screen spec.
class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.title,
    this.body,
    this.glyph,
    this.icon,
    this.actionLabel,
    this.onAction,
    this.accentTile = false,
  });

  final String title;
  final String? body;

  /// Serif glyph in the tile (`?`, a letter).
  final String? glyph;
  final IconData? icon;
  final String? actionLabel;
  final VoidCallback? onAction;

  /// Gold tile (no results = neutral, first-use = gold).
  final bool accentTile;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final type = context.type;
    return DashedCard(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (glyph != null || icon != null) ...[
            _Tile(
              fill: accentTile ? CydTokens.accent : t.card,
              child: icon != null
                  ? Icon(
                      icon,
                      size: 26,
                      color: accentTile ? CydTokens.onAccent : t.mute,
                    )
                  : Text(
                      glyph!,
                      style: type.sheetTitle.copyWith(
                        color: accentTile ? CydTokens.onAccent : t.mute,
                      ),
                    ),
            ),
            const SizedBox(height: 14),
          ],
          Text(title, textAlign: TextAlign.center, style: type.cardTitle),
          if (body != null) ...[
            const SizedBox(height: 6),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 250),
              child: Text(
                body!,
                textAlign: TextAlign.center,
                style: type.bodySmall,
              ),
            ),
          ],
          if (actionLabel != null) ...[
            const SizedBox(height: 14),
            CydButton(
              label: actionLabel!,
              onPressed: onAction,
              size: CydButtonSize.retry,
              expand: false,
            ),
          ],
        ],
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({required this.fill, required this.child});
  final Color fill;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return Container(
      width: 56,
      height: 56,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: fill,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: t.line),
        boxShadow: t.shadow,
      ),
      child: child,
    );
  }
}

/// Error card: danger "!" tile, title, body and a gold "Tap to retry"
/// button. Use [ErrorState.offline] for no connection.
class ErrorState extends StatelessWidget {
  const ErrorState({
    super.key,
    required this.title,
    this.body = 'Check your connection, then try again.',
    this.onRetry,
    this.retryLabel = Strings.tapToRetry,
  });

  /// "You're offline" with the standard wording.
  const ErrorState.offline({super.key, this.onRetry})
    : title = "You're offline",
      body = 'Check your connection and try again.',
      retryLabel = Strings.tapToRetry;

  final String title;
  final String body;
  final VoidCallback? onRetry;
  final String retryLabel;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final type = context.type;
    return DashedCard(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _Tile(
            fill: t.card,
            child: Text('!', style: type.sheetTitle.copyWith(color: t.danger)),
          ),
          const SizedBox(height: 14),
          Text(title, textAlign: TextAlign.center, style: type.cardTitle),
          const SizedBox(height: 6),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 250),
            child: Text(
              body,
              textAlign: TextAlign.center,
              style: type.bodySmall,
            ),
          ),
          if (onRetry != null) ...[
            const SizedBox(height: 14),
            CydButton(
              label: retryLabel,
              onPressed: onRetry,
              size: CydButtonSize.retry,
              expand: false,
            ),
          ],
        ],
      ),
    );
  }
}

/// "OFFLINE - SHOWING SAVED DATA" strip (28 dp, full width, `sunk`).
class OfflineStrip extends StatelessWidget {
  const OfflineStrip({super.key, this.label = 'OFFLINE — SHOWING SAVED DATA'});

  final String label;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return Semantics(
      liveRegion: true,
      child: Container(
        height: 28,
        width: double.infinity,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: t.sunk,
          border: Border.symmetric(horizontal: BorderSide(color: t.line)),
        ),
        child: Text(label, style: context.type.offline),
      ),
    );
  }
}
