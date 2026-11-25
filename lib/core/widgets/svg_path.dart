import 'dart:ui';

/// Minimal SVG path-data parser (M m L l H h V v A a Z z, implicit repeats).
/// Enough for the prototype's 24x24 stroke icons; no external dependency.
Path parseSvgPath(String d) {
  final path = Path();
  final tokens = RegExp(
    r'([MmLlHhVvAaZzCcSsQqTt])|(-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)',
  ).allMatches(d).map((m) => m.group(0)!).toList();
  var i = 0;
  var cmd = '';
  var x = 0.0, y = 0.0, sx = 0.0, sy = 0.0;

  bool isCmd(String s) => RegExp('[A-Za-z]').hasMatch(s);
  double num_() => double.parse(tokens[i++]);
  bool hasNum() => i < tokens.length && !isCmd(tokens[i]);

  while (i < tokens.length) {
    if (isCmd(tokens[i])) cmd = tokens[i++];
    final rel = cmd == cmd.toLowerCase();
    switch (cmd.toUpperCase()) {
      case 'Z':
        path.close();
        x = sx;
        y = sy;
      case 'M':
        var first = true;
        while (first || hasNum()) {
          final nx = num_() + (rel ? x : 0);
          final ny = num_() + (rel ? y : 0);
          if (first) {
            path.moveTo(nx, ny);
            sx = nx;
            sy = ny;
          } else {
            path.lineTo(nx, ny);
          }
          x = nx;
          y = ny;
          first = false;
        }
      case 'L':
        while (hasNum()) {
          x = num_() + (rel ? x : 0);
          y = num_() + (rel ? y : 0);
          path.lineTo(x, y);
        }
      case 'H':
        while (hasNum()) {
          x = num_() + (rel ? x : 0);
          path.lineTo(x, y);
        }
      case 'V':
        while (hasNum()) {
          y = num_() + (rel ? y : 0);
          path.lineTo(x, y);
        }
      case 'A':
        while (hasNum()) {
          final rx = num_();
          final ry = num_();
          final rot = num_();
          final large = num_() != 0;
          final sweep = num_() != 0;
          final nx = num_() + (rel ? x : 0);
          final ny = num_() + (rel ? y : 0);
          path.arcToPoint(
            Offset(nx, ny),
            radius: Radius.elliptical(rx, ry),
            rotation: rot,
            largeArc: large,
            clockwise: sweep,
          );
          x = nx;
          y = ny;
        }
      default:
        throw FormatException('Unsupported SVG path command $cmd');
    }
  }
  return path;
}
