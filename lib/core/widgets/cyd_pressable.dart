import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

/// Tap target with press feedback (opacity or scale), button semantics and a
/// hit area of at least [minSize] dp. The hit area grows by hit-test slop
/// only: the layout size stays the visual size, so 36 dp chips keep the
/// prototype's spacing but are still easy to hit. The slop only works inside
/// the parent's bounds (gaps between siblings, padding), not beyond them.
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

  /// Minimum hit-test size (both axes); 0 disables the extra slop.
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
    final detector = GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: enabled ? (_) => _set(true) : null,
      onTapUp: enabled ? (_) => _set(false) : null,
      onTapCancel: enabled ? () => _set(false) : null,
      onTap: widget.onTap,
      child: body,
    );
    final semantic = Semantics(
      button: true,
      enabled: enabled,
      selected: widget.selected,
      toggled: widget.toggled,
      label: widget.semanticLabel,
      excludeSemantics: widget.excludeChildSemantics,
      onTap: widget.onTap,
      child: detector,
    );
    // Outermost, so no proxy ancestor rejects a tap in the slop area.
    return widget.minSize > 0
        ? HitSlop(minSize: widget.minSize, child: semantic)
        : semantic;
  }
}

/// Extends the hit-test area of [child] to at least [minSize] x [minSize]
/// (centred) without changing its layout size.
class HitSlop extends SingleChildRenderObjectWidget {
  const HitSlop({super.key, required this.minSize, super.child});

  final double minSize;

  @override
  RenderObject createRenderObject(BuildContext context) =>
      _RenderHitSlop(minSize);

  @override
  void updateRenderObject(BuildContext context, RenderObject renderObject) {
    (renderObject as _RenderHitSlop).minSize = minSize;
  }
}

class _RenderHitSlop extends RenderProxyBox {
  _RenderHitSlop(this.minSize);

  double minSize;

  @override
  bool hitTest(BoxHitTestResult result, {required Offset position}) {
    final dx = size.width < minSize ? (minSize - size.width) / 2 : 0.0;
    final dy = size.height < minSize ? (minSize - size.height) / 2 : 0.0;
    final inflated = Rect.fromLTRB(-dx, -dy, size.width + dx, size.height + dy);
    if (!inflated.contains(position)) return false;
    // Forward the nearest point 2 dp inside the box (a border or padding
    // strip at the very edge would swallow the tap).
    final mx = size.width < 4 ? size.width / 2 : 2.0;
    final my = size.height < 4 ? size.height / 2 : 2.0;
    final inside = Offset(
      position.dx.clamp(mx, size.width - mx),
      position.dy.clamp(my, size.height - my),
    );
    return child?.hitTest(result, position: inside) ?? false;
  }
}
