import 'package:flutter/material.dart';

import '../core/theme/cyd_tokens.dart';
import '../core/theme/cyd_type.dart';

export '../core/theme/cyd_tokens.dart';
export '../core/theme/cyd_type.dart';
export '../core/theme/status_styles.dart';

/// `ThemeData` for [brightness], carrying [CydTokens] as a theme extension
/// (doc 01 §7). Widgets read tokens from the extension, never from
/// `ColorScheme`; the scheme only keeps stock Material widgets (text
/// selection, scrollbars, date pickers) on-brand.
ThemeData cydTheme(Brightness brightness) {
  final t = brightness == Brightness.dark ? CydTokens.dark : CydTokens.light;
  final scheme = ColorScheme(
    brightness: brightness,
    primary: CydTokens.accent,
    onPrimary: CydTokens.onAccent,
    secondary: CydTokens.accent,
    onSecondary: CydTokens.onAccent,
    error: t.danger,
    onError: CydTokens.white,
    surface: t.card,
    onSurface: t.ink,
    surfaceContainerHighest: t.sunk,
    outline: t.line2,
    outlineVariant: t.line,
  );
  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: scheme,
    scaffoldBackgroundColor: t.bg,
    canvasColor: t.bg,
    dividerColor: t.line,
    fontFamily: CydFonts.ui,
    fontFamilyFallback: CydFonts.uiFallback,
    textTheme: ThemeData(brightness: brightness).textTheme.apply(
      fontFamily: CydFonts.ui,
      fontFamilyFallback: CydFonts.uiFallback,
      bodyColor: t.ink,
      displayColor: t.ink,
    ),
    splashFactory: NoSplash.splashFactory,
    highlightColor: Colors.transparent,
    textSelectionTheme: TextSelectionThemeData(
      cursorColor: CydTokens.accent,
      selectionColor: CydTokens.accent.withValues(alpha: .3),
      selectionHandleColor: CydTokens.accent,
    ),
    dividerTheme: DividerThemeData(color: t.line, thickness: 1, space: 1),
    iconTheme: IconThemeData(color: t.ink),
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: CydTokens.accent,
    ),
    extensions: [t],
  );
}
