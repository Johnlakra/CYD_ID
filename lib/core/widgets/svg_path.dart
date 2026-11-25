import 'dart:ui';

final RegExp _command = RegExp('[A-Za-z]');
final RegExp _number = RegExp(r'^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?');

/// Minimal SVG path-data parser (M m L l H h V v A a Z z, implicit repeats).
/// Enough for the prototype's 24x24 stroke icons; no external dependency.
///
/// Throws [FormatException] on malformed or unsupported data (never hangs and
/// never throws a RangeError).
Path parseSvgPath(String d) {
  final path = Path();
  // Arc flags may be written without separators ("a1 1 0 011 1"), so the
  // tokenizer works on a mutable cursor over the source instead of a regex
  // match list.
  var pos = 0;
  var x = 0.0, y = 0.0, sx = 0.0, sy = 0.0;
  var cmd = '';

  void skipSep() {
    while (pos < d.length &&
        (d[pos] == ' ' || d[pos] == ',' || '\t\n\r'.contains(d[pos]))) {
      pos++;
    }
  }

  bool atNumber() {
    skipSep();
    return pos < d.length && !_command.hasMatch(d[pos]);
  }

  double num_() {
    skipSep();
    final m = _number.firstMatch(d.substring(pos));
    if (m == null) throw FormatException('Expected a number', d, pos);
    pos += m.end;
    return double.parse(m.group(0)!);
  }

  bool flag() {
    skipSep();
    if (pos >= d.length || (d[pos] != '0' && d[pos] != '1')) {
      throw FormatException('Expected an arc flag (0 or 1)', d, pos);
    }
    return d[pos++] == '1';
  }

  skipSep();
  while (pos < d.length) {
    final before = pos;
    if (_command.hasMatch(d[pos])) {
      cmd = d[pos++];
    } else if (cmd.isEmpty) {
      throw FormatException('Path data must start with a command', d, pos);
    }
    final rel = cmd == cmd.toLowerCase();
    switch (cmd.toUpperCase()) {
      case 'Z':
        path.close();
        x = sx;
        y = sy;
        if (atNumber()) {
          throw FormatException('Numbers after Z', d, pos);
        }
      case 'M':
        var first = true;
        while (first || atNumber()) {
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
        do {
          x = num_() + (rel ? x : 0);
          y = num_() + (rel ? y : 0);
          path.lineTo(x, y);
        } while (atNumber());
      case 'H':
        do {
          x = num_() + (rel ? x : 0);
          path.lineTo(x, y);
        } while (atNumber());
      case 'V':
        do {
          y = num_() + (rel ? y : 0);
          path.lineTo(x, y);
        } while (atNumber());
      case 'A':
        do {
          final rx = num_();
          final ry = num_();
          final rot = num_();
          final large = flag();
          final sweep = flag();
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
        } while (atNumber());
      default:
        throw FormatException('Unsupported SVG path command $cmd', d, pos);
    }
    if (pos == before) {
      throw FormatException('Parser made no progress', d, pos);
    }
    skipSep();
  }
  return path;
}
