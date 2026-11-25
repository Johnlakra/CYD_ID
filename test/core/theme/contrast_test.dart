import 'dart:math' as math;

import 'package:cyd_app/app/theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

double _lin(double c) =>
    c <= .03928 ? c / 12.92 : math.pow((c + .055) / 1.055, 2.4).toDouble();

double _luminance(Color c) =>
    .2126 * _lin(c.r) + .7152 * _lin(c.g) + .0722 * _lin(c.b);

/// Paints [fg] (may be translucent) over the opaque [bg].
Color _over(Color fg, Color bg) => Color.alphaBlend(fg, bg);

/// WCAG contrast ratio of [fg] over [bg].
double contrast(Color fg, Color bg) {
  final a = _luminance(_over(fg, bg));
  final b = _luminance(bg);
  final hi = math.max(a, b), lo = math.min(a, b);
  return (hi + .05) / (lo + .05);
}

Color _gradientTop(Gradient g) => g.colors.first;

void main() {
  const min = 4.5;

  test('contrast helper matches known values', () {
    expect(contrast(const Color(0xFF000000), const Color(0xFFFFFFFF)), 21);
    expect(
      contrast(const Color(0xFFFFFFFF), const Color(0xFFFFFFFF)),
      closeTo(1, 1e-9),
    );
  });

  for (final t in [CydTokens.dark, CydTokens.light]) {
    final name = t.brightness.name;
    final surfaces = <String, Color>{
      'bg': t.bg,
      'card': t.card,
      'raised': t.raised,
      'sunk': t.sunk,
      'page gradient top': _gradientTop(t.bgGrad),
    };

    test('$name: ink, mute and faint text pass 4.5:1 on every surface', () {
      for (final s in surfaces.entries) {
        for (final fg in {
          'ink': t.ink,
          'mute': t.mute,
          'faint': t.faint,
        }.entries) {
          expect(
            contrast(fg.value, s.value),
            greaterThanOrEqualTo(min),
            reason: '$name ${fg.key} on ${s.key}',
          );
        }
      }
    });

    test('$name: faint is not lighter-weight than mute, never darker', () {
      expect(t.faint.a, lessThanOrEqualTo(t.mute.a));
    });

    test('$name: accent text passes on bg, card and its own tint', () {
      expect(contrast(t.accText, t.bg), greaterThanOrEqualTo(min));
      expect(contrast(t.accText, t.card), greaterThanOrEqualTo(min));
      expect(
        contrast(t.accText, _over(t.accSoft, t.bg)),
        greaterThanOrEqualTo(min),
      );
    });

    test('$name: toast action text passes on the toast background', () {
      expect(contrast(t.toastAction, t.toastBg), greaterThanOrEqualTo(min));
      expect(contrast(t.toastFg, t.toastBg), greaterThanOrEqualTo(min));
    });

    test('$name: text on a danger fill passes (badge, destructive button)', () {
      expect(contrast(t.onDanger, t.danger), greaterThanOrEqualTo(min));
    });

    test('$name: danger, ok and gold labels pass on bg and card', () {
      for (final fg in [t.danger, t.ok]) {
        expect(contrast(fg, t.bg), greaterThanOrEqualTo(min));
        expect(contrast(fg, t.card), greaterThanOrEqualTo(min));
      }
    });
  }

  test('on-accent text passes on the gold fill', () {
    expect(
      contrast(CydTokens.onAccent, CydTokens.accent),
      greaterThanOrEqualTo(min),
    );
  });
}
