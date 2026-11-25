import 'package:flutter/material.dart';

/// Tap target with press feedback (opacity or scale), a >= 44 dp hit area and
/// button semantics. Shared by every tappable design-system widget.
class CydPressable extends StatefulWidget {
  const CydPressable({
    super.key,
    required this.child,
    this.onTap,
    this.semanticLabel,
    this.pressedOpacity = .7,
    this.pressedScale,
    this.minSize = 44,
    this.excludeChildSemantics = false,
    this.selected,
    this.toggled,
  });

  final Widget child;
  final VoidCallback? onTap;
  final String? semanticLabel;
  final double pressedOpacity;

  /// If set the child scales to this value while pressed (product cards and
  /// category tiles use .97, 180 ms) instead of fading.
  final double? pressedScale;
  final double minSize;
  final bool excludeChildSemantics;
  final bool? selected;
  final bool? toggled;

  @override
  State<CydPressable> createState() => _CydPressableState();
}

class _CydPressableState extends State<CydPressable> {
  bool _down = false;

  void _set(bool v) {
    if (_down != v && mounted) setState(() => _down = v);
  }

  @override
  Widget build(BuildContext context) {
    final enabled = widget.onTap != null;
    Widget body = widget.child;
    if (widget.pressedScale != null) {
      body = AnimatedScale(
        scale: _down ? widget.pressedScale! : 1,
        duration: const Duration(milliseconds: 180),
        child: body,
      );
    } else {
      body = AnimatedOpacity(
        opacity: _down ? widget.pressedOpacity : 1,
        duration: const Duration(milliseconds: 90),
        child: body,
      );
    }
    return Semantics(
      button: true,
      enabled: enabled,
      selected: widget.selected,
      toggled: widget.toggled,
      label: widget.semanticLabel,
      excludeSemantics: widget.excludeChildSemantics,
      onTap: widget.onTap,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: enabled ? (_) => _set(true) : null,
        onTapUp: enabled ? (_) => _set(false) : null,
        onTapCancel: enabled ? () => _set(false) : null,
        onTap: widget.onTap,
        child: ConstrainedBox(
          constraints: BoxConstraints(
            minWidth: widget.minSize,
            minHeight: widget.minSize,
          ),
          child: Center(widthFactor: 1, heightFactor: 1, child: body),
        ),
      ),
    );
  }
}
