import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Design v2 tokens (mirror of `design/tokens.json`; the test
/// `tokens_json_test.dart` fails if the two drift apart).
///
/// Widgets read them with `context.tokens` and never hard-code colours.
@immutable
class CydTokens extends ThemeExtension<CydTokens> {
  const CydTokens({
    required this.brightness,
    required this.bg,
    required this.bgGrad,
    required this.heroGrad,
    required this.ph,
    required this.card,
    required this.raised,
    required this.sunk,
    required this.ink,
    required this.mute,
    required this.faint,
    required this.line,
    required this.line2,
    required this.accSoft,
    required this.accText,
    required this.danger,
    required this.ok,
    required this.tabbg,
    required this.skel,
    required this.shadow,
    required this.likedHeart,
    required this.soldOutOverlay,
    required this.sheetScrim,
    required this.dialogScrim,
    required this.toastBg,
    required this.toastFg,
    required this.tabActiveFg,
    required this.toastAction,
    required this.onDanger,
    required this.bannerDanger,
    required this.bannerOk,
    required this.bannerCod,
    required this.codFg,
    required this.statusChipBgAlpha,
  });

  // ---- Theme independent -------------------------------------------------
  static const Color accent = Color(0xFFE8B04B);
  static const Color onAccent = Color(0xFF0A0A0B);
  static const Color white = Color(0xFFFFFFFF);

  /// `0 16px 30px -12px rgba(232,176,75,.8)`: the one primary CTA per screen.
  static const List<BoxShadow> accentGlow = [
    BoxShadow(
      color: Color.fromRGBO(232, 176, 75, .8),
      offset: Offset(0, 16),
      blurRadius: 30,
      spreadRadius: -12,
    ),
  ];

  /// Active tab circle glow (`0 10px 26px -6px rgba(232,176,75,.75)`).
  static const List<BoxShadow> tabActiveGlow = [
    BoxShadow(
      color: Color.fromRGBO(232, 176, 75, .75),
      offset: Offset(0, 10),
      blurRadius: 26,
      spreadRadius: -6,
    ),
  ];

  /// Top highlight of gold surfaces (`inset 0 1px 0 rgba(255,255,255,.5)`),
  /// drawn as a gradient overlay by the gold button.
  static const Color accentHighlight = Color.fromRGBO(255, 255, 255, .5);

  // ---- Theme dependent ---------------------------------------------------
  final Brightness brightness;
  final Color bg;
  final Gradient bgGrad;
  final Gradient heroGrad;

  /// Photo placeholder gradient.
  final Gradient ph;
  final Color card;
  final Color raised;
  final Color sunk;
  final Color ink;
  final Color mute;
  final Color faint;
  final Color line;
  final Color line2;
  final Color accSoft;
  final Color accText;
  final Color danger;
  final Color ok;
  final Color tabbg;
  final Color skel;

  /// Soft lifted shadow of cards (the inset highlight of the dark theme is
  /// approximated by the hairline border).
  final List<BoxShadow> shadow;
  final Color likedHeart;
  final Color soldOutOverlay;
  final Color sheetScrim;
  final Color dialogScrim;
  final Color toastBg;
  final Color toastFg;
  final Color tabActiveFg;

  /// Action text on the toast (gold on the dark toast, deep gold on the
  /// light dark-theme toast).
  final Color toastAction;

  /// Text / glyphs on a `danger` fill (count badge, destructive buttons).
  final Color onDanger;
  final Color bannerDanger;
  final Color bannerOk;
  final Color bannerCod;
  final Color codFg;
  final double statusChipBgAlpha;

  bool get isDark => brightness == Brightness.dark;

  static const CydTokens dark = CydTokens(
    brightness: Brightness.dark,
    bg: Color(0xFF0C0C0E),
    bgGrad: RadialGradient(
      radius: 1,
      transform: _EllipseTransform(1.3, .55, .5, -.08),
      colors: [Color(0xFF2B2416), Color(0xFF121110), Color(0xFF0C0C0E)],
      stops: [0, .42, .7],
    ),
    heroGrad: RadialGradient(
      radius: 1,
      transform: _EllipseTransform(.9, .8, .7, .2),
      colors: [Color(0xFF3A2C14), Color(0xFF141210), Color(0xFF0C0C0E)],
      stops: [0, .55, 1],
    ),
    ph: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFF1D1E22), Color(0xFF16171A)],
    ),
    card: Color(0xFF151518),
    raised: Color(0xFF1B1B20),
    sunk: Color(0xFF101013),
    ink: Color(0xFFF4F1EA),
    mute: Color.fromRGBO(244, 241, 234, .6),
    faint: Color.fromRGBO(244, 241, 234, .5),
    line: Color.fromRGBO(255, 255, 255, .07),
    line2: Color.fromRGBO(255, 255, 255, .13),
    accSoft: Color.fromRGBO(232, 176, 75, .13),
    accText: Color(0xFFF0C77A),
    danger: Color(0xFFFF6A55),
    ok: Color(0xFF3DD68C),
    tabbg: Color.fromRGBO(24, 24, 28, .72),
    skel: Color.fromRGBO(255, 255, 255, .07),
    shadow: [
      BoxShadow(
        color: Color.fromRGBO(0, 0, 0, .9),
        offset: Offset(0, 24),
        blurRadius: 44,
        spreadRadius: -26,
      ),
    ],
    likedHeart: Color(0xFFFF5A45),
    soldOutOverlay: Color.fromRGBO(10, 10, 11, .5),
    sheetScrim: Color.fromRGBO(0, 0, 0, .55),
    dialogScrim: Color.fromRGBO(0, 0, 0, .6),
    toastBg: Color(0xFFF4F1EA),
    toastFg: Color(0xFF0C0C0E),
    tabActiveFg: Color(0xFF141416),
    toastAction: Color(0xFF7E5410),
    onDanger: Color(0xFF0A0A0B),
    bannerDanger: Color.fromRGBO(255, 106, 85, .14),
    bannerOk: Color.fromRGBO(61, 214, 140, .14),
    bannerCod: Color.fromRGBO(187, 162, 255, .14),
    codFg: Color(0xFFBBA2FF),
    statusChipBgAlpha: .14,
  );

  static const CydTokens light = CydTokens(
    brightness: Brightness.light,
    bg: Color(0xFFFFFFFF),
    bgGrad: LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: [Color(0xFFEEF1F5), Color(0xFFFBFBFA), Color(0xFFFFFFFF)],
      stops: [0, .28, .55],
    ),
    heroGrad: RadialGradient(
      radius: 1,
      transform: _EllipseTransform(.9, .8, .72, .22),
      colors: [Color(0xFFFFF1D2), Color(0xFFFAF8F4), Color(0xFFFFFFFF)],
      stops: [0, .52, 1],
    ),
    ph: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFFF1F2F4), Color(0xFFE6E8EC)],
    ),
    card: Color(0xFFFFFFFF),
    raised: Color(0xFFFFFFFF),
    sunk: Color(0xFFF4F3F0),
    ink: Color(0xFF141416),
    mute: Color.fromRGBO(20, 20, 22, .6),
    faint: Color.fromRGBO(20, 20, 22, .6),
    line: Color.fromRGBO(20, 20, 22, .08),
    line2: Color.fromRGBO(20, 20, 22, .14),
    accSoft: Color.fromRGBO(232, 176, 75, .2),
    accText: Color(0xFF7E5410),
    danger: Color(0xFFC8321F),
    ok: Color(0xFF1B7A3A),
    tabbg: Color.fromRGBO(255, 255, 255, .72),
    skel: Color.fromRGBO(20, 20, 22, .07),
    shadow: [
      BoxShadow(
        color: Color.fromRGBO(20, 22, 30, .04),
        offset: Offset(0, 1),
        blurRadius: 2,
      ),
      BoxShadow(
        color: Color.fromRGBO(40, 44, 60, .26),
        offset: Offset(0, 20),
        blurRadius: 40,
        spreadRadius: -22,
      ),
    ],
    likedHeart: Color(0xFFFF5A45),
    soldOutOverlay: Color.fromRGBO(10, 10, 11, .5),
    sheetScrim: Color.fromRGBO(0, 0, 0, .55),
    dialogScrim: Color.fromRGBO(0, 0, 0, .6),
    toastBg: Color(0xFF141416),
    toastFg: Color(0xFFFFFFFF),
    tabActiveFg: Color(0xFF141416),
    toastAction: Color(0xFFE8B04B),
    onDanger: Color(0xFFFFFFFF),
    bannerDanger: Color.fromRGBO(255, 106, 85, .12),
    bannerOk: Color.fromRGBO(61, 214, 140, .16),
    bannerCod: Color.fromRGBO(187, 162, 255, .2),
    codFg: Color(0xFF5B3BC4),
    statusChipBgAlpha: .2,
  );

  /// Category tile gradient for hue [h] (0-360), see tokens.json.
  Gradient categoryTile(num h) {
    final hue = h.toDouble();
    if (isDark) {
      return RadialGradient(
        radius: 1,
        transform: const _EllipseTransform(1.2, .95, .5, .12),
        colors: [_hsl(hue, .2, .24), _hsl(hue, .16, .11)],
        stops: const [0, 1],
      );
    }
    return RadialGradient(
      radius: 1,
      transform: const _EllipseTransform(1.2, .95, .5, .1),
      colors: [const Color(0xFFFFFFFF), _hsl(hue, .28, .89)],
      stops: const [0, 1],
    );
  }

  /// Initial / glyph colour on a category tile.
  Color categoryMark(num h) =>
      isDark ? _hsl(h.toDouble(), .7, .72) : _hsl(h.toDouble(), .55, .30);

  static Color _hsl(double h, double s, double l) =>
      HSLColor.fromAHSL(1, h % 360, s, l).toColor();

  /// Tint of the banner for [tone].
  Color bannerBg(CydTone tone) => switch (tone) {
    CydTone.danger => bannerDanger,
    CydTone.ok => bannerOk,
    CydTone.cod => bannerCod,
    CydTone.accent => accSoft,
  };

  Color bannerFg(CydTone tone) => switch (tone) {
    CydTone.danger => danger,
    CydTone.ok => ok,
    CydTone.cod => codFg,
    CydTone.accent => accText,
  };

  @override
  CydTokens copyWith({Color? bg, Color? accSoft}) => CydTokens(
    brightness: brightness,
    bg: bg ?? this.bg,
    bgGrad: bgGrad,
    heroGrad: heroGrad,
    ph: ph,
    card: card,
    raised: raised,
    sunk: sunk,
    ink: ink,
    mute: mute,
    faint: faint,
    line: line,
    line2: line2,
    accSoft: accSoft ?? this.accSoft,
    accText: accText,
    danger: danger,
    ok: ok,
    tabbg: tabbg,
    skel: skel,
    shadow: shadow,
    likedHeart: likedHeart,
    soldOutOverlay: soldOutOverlay,
    sheetScrim: sheetScrim,
    dialogScrim: dialogScrim,
    toastBg: toastBg,
    toastFg: toastFg,
    tabActiveFg: tabActiveFg,
    toastAction: toastAction,
    onDanger: onDanger,
    bannerDanger: bannerDanger,
    bannerOk: bannerOk,
    bannerCod: bannerCod,
    codFg: codFg,
    statusChipBgAlpha: statusChipBgAlpha,
  );

  /// Only two token sets exist, so interpolation snaps at the midpoint.
  @override
  CydTokens lerp(ThemeExtension<CydTokens>? other, double t) {
    if (other is! CydTokens) return this;
    return t < .5 ? this : other;
  }
}

/// Banner / notice tones (design `ban` helper).
enum CydTone { danger, ok, cod, accent }

/// `BuildContext.tokens`: the active [CydTokens].
extension CydTokensContext on BuildContext {
  CydTokens get tokens {
    final t = Theme.of(this).extension<CydTokens>();
    assert(t != null, 'CydTokens missing: build the app with cydTheme()');
    return t ?? CydTokens.light;
  }
}

/// CSS `radial-gradient(rx% ry% at cx% cy%, ...)` is elliptical with radii
/// that are fractions of the box width / height. Flutter's [RadialGradient]
/// is circular (radius 1 = shortest side), so this [GradientTransform]
/// stretches and moves it.
class _EllipseTransform extends GradientTransform {
  const _EllipseTransform(this.rx, this.ry, this.cx, this.cy);
  final double rx;
  final double ry;
  final double cx;
  final double cy;

  @override
  Matrix4? transform(Rect bounds, {TextDirection? textDirection}) {
    // The shader is built with centre = bounds centre and radius =
    // shortestSide; move the centre to (cx, cy) and scale to (rx*w, ry*h).
    final r0 = bounds.shortestSide;
    if (r0 == 0) return null;
    final c0 = bounds.center;
    final target = Offset(
      bounds.left + cx * bounds.width,
      bounds.top + cy * bounds.height,
    );
    final sx = rx * bounds.width / r0;
    final sy = ry * bounds.height / r0;
    final m = Matrix4.identity()
      ..translateByDouble(target.dx, target.dy, 0, 1)
      ..scaleByDouble(math.max(sx, .0001), math.max(sy, .0001), 1, 1)
      ..translateByDouble(-c0.dx, -c0.dy, 0, 1);
    return m;
  }
}
