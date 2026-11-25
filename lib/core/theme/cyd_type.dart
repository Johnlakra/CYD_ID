import 'package:flutter/material.dart';

import 'cyd_tokens.dart';

/// Bundled families (see `pubspec.yaml`; no runtime font fetching, so text
/// renders identically offline and in tests). Fallbacks cover glyphs the
/// fonts lack and the first frame on a device that fails to load an asset.
class CydFonts {
  const CydFonts._();

  /// Instrument Serif: titles, prices, initials (italic gold accent words).
  static const display = 'InstrumentSerif';

  /// Manrope: all UI text.
  static const ui = 'Manrope';

  /// DM Mono: small tracked uppercase labels, order numbers, countdowns.
  static const mono = 'DMMono';

  static const displayFallback = [ui, 'Georgia', 'serif'];
  static const uiFallback = ['Roboto', 'sans-serif'];
  static const monoFallback = ['Courier', 'monospace'];
}

/// The v2 type ladder (design prototype: serif 25/27/30/32/39/46/50,
/// Manrope 11-17, mono 8-12). Colours come from the active tokens.
@immutable
class CydType {
  const CydType(this.t);
  final CydTokens t;

  /// `context.type`.
  static CydType of(BuildContext context) => CydType(context.tokens);

  // ---- helpers -----------------------------------------------------------
  TextStyle serif(
    double size, {
    Color? color,
    double height = 1,
    double tracking = -.01,
    FontStyle? style,
  }) => TextStyle(
    fontFamily: CydFonts.display,
    fontFamilyFallback: CydFonts.displayFallback,
    fontSize: size,
    height: height,
    letterSpacing: tracking * size,
    fontWeight: FontWeight.w400,
    fontStyle: style,
    color: color ?? t.ink,
  );

  TextStyle ui(
    double size, {
    FontWeight weight = FontWeight.w400,
    Color? color,
    double height = 1.3,
    double tracking = 0,
  }) => TextStyle(
    fontFamily: CydFonts.ui,
    fontFamilyFallback: CydFonts.uiFallback,
    fontSize: size,
    fontWeight: weight,
    height: height,
    letterSpacing: tracking * size,
    color: color ?? t.ink,
  );

  TextStyle mono(
    double size, {
    FontWeight weight = FontWeight.w500,
    Color? color,
    double tracking = .1,
    double height = 1.2,
  }) => TextStyle(
    fontFamily: CydFonts.mono,
    fontFamilyFallback: CydFonts.monoFallback,
    fontSize: size,
    fontWeight: weight,
    height: height,
    letterSpacing: tracking * size,
    color: color ?? t.faint,
  );

  // ---- Instrument Serif --------------------------------------------------
  /// Home hero "Shop the *diocese.*" (50, line-height .98, tracking -.025em).
  TextStyle get hero => serif(50, height: .98, tracking: -.025);

  /// Large tile initial.
  TextStyle get tileInitial => serif(46);

  /// Large title (e.g. confirmation).
  TextStyle get titleLarge => serif(39, height: .98);

  /// Order status headings, big price.
  TextStyle get heading => serif(34);

  /// Tab-screen titles.
  TextStyle get title => serif(32, height: .98);

  /// Promo headline.
  TextStyle get promo => serif(30);

  /// Dialog / sheet titles and the empty-error tile glyph.
  TextStyle get sheetTitle => serif(27);

  /// Sub-screen titles.
  TextStyle get subTitle => serif(25);

  /// Totals.
  TextStyle get total => serif(22);

  /// Gold italic accent word inside a serif headline.
  TextStyle accentWord(TextStyle base) =>
      base.copyWith(fontStyle: FontStyle.italic, color: t.accText);

  // ---- Manrope -----------------------------------------------------------
  TextStyle get body => ui(13, color: t.mute, height: 1.5);
  TextStyle get bodySmall => ui(12, color: t.mute, height: 1.5);
  TextStyle get bodyStrong => ui(13, weight: FontWeight.w600);
  TextStyle get cardTitle => ui(15, weight: FontWeight.w700);
  TextStyle get inputText => ui(14, weight: FontWeight.w500, height: 1.2);
  TextStyle get error => ui(11, weight: FontWeight.w500, color: t.danger);
  TextStyle get price => ui(14, weight: FontWeight.w700);
  TextStyle get priceStrike => ui(11, color: t.faint);
  TextStyle get buttonPrimary => ui(15, weight: FontWeight.w700, height: 1);
  TextStyle get buttonSecondary => ui(13, weight: FontWeight.w600, height: 1);
  TextStyle get chip => ui(12, weight: FontWeight.w600, height: 1);
  TextStyle get statusChip => ui(10, weight: FontWeight.w700, height: 1);
  TextStyle get banner => ui(13, weight: FontWeight.w600, height: 1.4);
  TextStyle get badge => ui(9, weight: FontWeight.w700, height: 1.4);

  // ---- DM Mono -----------------------------------------------------------
  TextStyle get sectionLabel => mono(9, tracking: .16);
  TextStyle get inputLabel => mono(9, tracking: .14);
  TextStyle get meta => mono(10, tracking: .08);
  TextStyle get metaLarge => mono(11, color: t.mute);
  TextStyle get offline => mono(10, color: t.mute);
  TextStyle get photoCaption => mono(9, tracking: .14);
  TextStyle get countdown => mono(
    12,
    color: t.accText,
    tracking: 0,
  ).copyWith(fontFeatures: const [FontFeature.tabularFigures()]);
}

extension CydTypeContext on BuildContext {
  /// The v2 type ladder for the active theme.
  CydType get type => CydType.of(this);
}
