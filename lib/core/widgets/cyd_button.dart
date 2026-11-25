import 'dart:async';

import 'package:flutter/material.dart';

import '../theme/cyd_tokens.dart';
import '../theme/cyd_type.dart';
import 'cyd_pressable.dart';

enum CydButtonVariant {
  /// Gold fill. One per screen.
  primary,

  /// Outlined (line2).
  secondary,

  /// Outlined red (Reject, Cancel order, Sign out).
  destructive,

  /// Solid red (confirm a destructive action).
  destructiveFilled,

  /// Text only (accText), 44 dp tall.
  text,
}

/// Height / radius pairs of the prototype (56 pill CTA, 50 pill, 46 and 48
/// with radius 14, 44 with radius 12 for "Tap to retry").
enum CydButtonSize {
  cta(56, 99, 15),
  regular(50, 99, 14),
  compact(46, 14, 14),
  dialog(48, 14, 13),
  retry(44, 12, 13);

  const CydButtonSize(this.height, this.radius, this.fontSize);
  final double height;
  final double radius;
  final double fontSize;
}

/// The design system's button. Taps are ignored while [loading] or while an
/// async [onPressed] is still running (no double submit); `onPressed: null`
/// disables it.
class CydButton extends StatefulWidget {
  const CydButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = CydButtonVariant.primary,
    this.size = CydButtonSize.cta,
    this.loading = false,
    this.loadingLabel,
    this.icon,
    this.expand = true,
    this.glow,
    this.semanticLabel,
    this.padding = 22,
  });

  const CydButton.secondary({
    super.key,
    required this.label,
    required this.onPressed,
    this.size = CydButtonSize.regular,
    this.loading = false,
    this.loadingLabel,
    this.icon,
    this.expand = true,
    this.semanticLabel,
    this.padding = 22,
  }) : variant = CydButtonVariant.secondary,
       glow = false;

  const CydButton.destructive({
    super.key,
    required this.label,
    required this.onPressed,
    this.size = CydButtonSize.regular,
    this.loading = false,
    this.loadingLabel,
    this.icon,
    this.expand = true,
    this.semanticLabel,
    this.padding = 22,
  }) : variant = CydButtonVariant.destructive,
       glow = false;

  const CydButton.text({
    super.key,
    required this.label,
    required this.onPressed,
    this.loading = false,
    this.semanticLabel,
  }) : variant = CydButtonVariant.text,
       size = CydButtonSize.retry,
       loadingLabel = null,
       icon = null,
       expand = false,
       glow = false,
       padding = 12;

  final String label;

  /// `null` = disabled. May return a Future: the button stays busy until it
  /// completes.
  final FutureOr<void> Function()? onPressed;
  final CydButtonVariant variant;
  final CydButtonSize size;
  final bool loading;

  /// Text shown next to the spinner ("Placing order...").
  final String? loadingLabel;
  final IconData? icon;

  /// Fill the available width (default) or hug the label.
  final bool expand;

  /// Gold glow; defaults to on for a primary [CydButtonSize.cta] only.
  final bool? glow;
  final String? semanticLabel;
  final double padding;

  @override
  State<CydButton> createState() => _CydButtonState();
}

class _CydButtonState extends State<CydButton> {
  bool _busy = false;

  bool get _loading => widget.loading || _busy;

  Future<void> _tap() async {
    if (_loading || widget.onPressed == null) return;
    final r = widget.onPressed!();
    if (r is Future<void>) {
      setState(() => _busy = true);
      try {
        await r;
      } finally {
        if (mounted) setState(() => _busy = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final type = context.type;
    final s = widget.size;
    final v = widget.variant;
    final enabled = widget.onPressed != null;

    final Color fg = switch (v) {
      CydButtonVariant.primary => CydTokens.onAccent,
      CydButtonVariant.secondary => t.ink,
      CydButtonVariant.destructive => t.danger,
      CydButtonVariant.destructiveFilled => CydTokens.white,
      CydButtonVariant.text => t.accText,
    };
    final Color? fill = switch (v) {
      CydButtonVariant.primary => CydTokens.accent,
      CydButtonVariant.destructiveFilled => t.danger,
      _ => null,
    };
    final Color? border = switch (v) {
      CydButtonVariant.secondary => t.line2,
      CydButtonVariant.destructive => t.danger,
      _ => null,
    };
    final glow =
        (widget.glow ??
            (v == CydButtonVariant.primary && s == CydButtonSize.cta)) &&
        enabled &&
        !_loading;
    final disabledOpacity = switch (v) {
      CydButtonVariant.primary => .35,
      CydButtonVariant.destructiveFilled => .4,
      _ => .4,
    };

    final textStyle = (v == CydButtonVariant.primary
        ? type.ui(s.fontSize, weight: FontWeight.w700, color: fg, height: 1)
        : type.ui(
            s.fontSize,
            weight:
                v == CydButtonVariant.secondary || v == CydButtonVariant.text
                ? FontWeight.w600
                : FontWeight.w700,
            color: fg,
            height: 1,
          ));

    final label = _loading && widget.loadingLabel != null
        ? widget.loadingLabel!
        : widget.label;
    final content = Row(
      mainAxisSize: widget.expand ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (_loading) ...[
          SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(strokeWidth: 2, color: fg),
          ),
          const SizedBox(width: 10),
        ] else if (widget.icon != null) ...[
          Icon(widget.icon, size: 18, color: fg),
          const SizedBox(width: 8),
        ],
        Flexible(
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: textStyle,
          ),
        ),
      ],
    );

    final radius = BorderRadius.circular(s.radius);
    final isText = v == CydButtonVariant.text;
    final body = Container(
      height: isText ? null : s.height,
      constraints: BoxConstraints(minHeight: isText ? 44 : s.height),
      padding: EdgeInsets.symmetric(horizontal: isText ? 12 : widget.padding),
      alignment: Alignment.center,
      decoration: isText
          ? null
          : BoxDecoration(
              color: fill,
              borderRadius: radius,
              border: border == null ? null : Border.all(color: border),
              boxShadow: glow ? CydTokens.accentGlow : null,
            ),
      foregroundDecoration: v == CydButtonVariant.primary && !isText
          ? BoxDecoration(
              borderRadius: radius,
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: const [
                  CydTokens.accentHighlight,
                  Color(0x00FFFFFF),
                  Color(0x00FFFFFF),
                ],
                stops: [0, 1 / s.height, 1],
              ),
            )
          : null,
      child: content,
    );

    return CydPressable(
      onTap: enabled && !_loading ? _tap : null,
      semanticLabel: widget.semanticLabel ?? label,
      excludeChildSemantics: true,
      pressedOpacity: .85,
      child: Opacity(opacity: enabled ? 1 : disabledOpacity, child: body),
    );
  }
}
