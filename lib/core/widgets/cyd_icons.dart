import 'package:flutter/material.dart';

import '../theme/cyd_tokens.dart';
import '../theme/cyd_type.dart';
import '../theme/status_styles.dart';
import 'svg_path.dart';

/// Tab icon path data from the v2 prototype (24x24 viewBox, 1.8 stroke).
class CydTabIcons {
  const CydTabIcons._();

  static const myProfile =
      'M4 4h16v16H4zM12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM7 18a5 5 0 0 1 10 0';
  static const profiles =
      'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M21 20a6 6 0 0 0-4-5.6';
  static const shop =
      'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z';
  static const cart = 'M6 7h12l-1 13H7zM9 7a3 3 0 0 1 6 0';
  static const orders = 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6';
  static const account =
      'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0';
}

/// A stroked 24x24 SVG path scaled to [size].
class CydPathIcon extends StatelessWidget {
  const CydPathIcon(
    this.pathData, {
    super.key,
    this.size = 22,
    this.color,
    this.strokeWidth = 1.8,
  });

  final String pathData;
  final double size;
  final Color? color;
  final double strokeWidth;

  /// Parsed paths are immutable once built; parse each icon once.
  static final Map<String, Path> _cache = {};
  static Path _parsed(String d) => _cache.putIfAbsent(d, () => parseSvgPath(d));

  @override
  Widget build(BuildContext context) {
    final c = color ?? IconTheme.of(context).color ?? context.tokens.ink;
    return ExcludeSemantics(
      child: SizedBox(
        width: size,
        height: size,
        child: CustomPaint(
          painter: _PathPainter(pathData, _parsed(pathData), c, strokeWidth),
        ),
      ),
    );
  }
}

class _PathPainter extends CustomPainter {
  _PathPainter(this.data, this.path, this.color, this.stroke);
  final String data;
  final Path path;
  final Color color;
  final double stroke;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.scale(size.width / 24, size.height / 24);
    canvas.drawPath(
      path,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round
        ..color = color,
    );
  }

  @override
  bool shouldRepaint(_PathPainter old) =>
      old.color != color || old.stroke != stroke || old.data != data;
}

/// The glyph of a status chip as a small icon (icons render identically on
/// every device; font glyphs such as the half circle are often missing).
class StatusGlyphIcon extends StatelessWidget {
  const StatusGlyphIcon(this.glyph, {super.key, this.size = 12, this.color});

  final StatusGlyph glyph;
  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? context.tokens.ink;
    if (glyph == StatusGlyph.rupee) {
      return ExcludeSemantics(
        child: Text(
          '\u20B9',
          style: context.type.ui(size, weight: FontWeight.w700, color: c),
        ),
      );
    }
    final (IconData icon, double scale) = switch (glyph) {
      StatusGlyph.timelapse => (Icons.timelapse, 1),
      StatusGlyph.dot => (Icons.circle, .6),
      StatusGlyph.check => (Icons.check, 1),
      StatusGlyph.packed => (Icons.inventory_2_outlined, 1),
      StatusGlyph.arrow => (Icons.arrow_forward, 1),
      StatusGlyph.cross => (Icons.close, 1),
      StatusGlyph.alert => (Icons.priority_high, 1),
      StatusGlyph.pause => (Icons.pause, 1),
      StatusGlyph.ring => (Icons.circle_outlined, .7),
      StatusGlyph.archive => (Icons.archive_outlined, 1),
      StatusGlyph.undo => (Icons.undo, 1),
      StatusGlyph.rupee => (Icons.circle, 0),
    };
    return ExcludeSemantics(
      child: Icon(icon, size: size * scale, color: c),
    );
  }
}
