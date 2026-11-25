import 'dart:async';

import 'package:flutter/material.dart';

import '../theme/cyd_tokens.dart';

/// One shimmer controller for a whole skeleton screen so every block pulses
/// in sync (opacity .45 -> .9 -> .45, 1400 ms). Static under reduced motion.
class SkeletonScope extends StatefulWidget {
  const SkeletonScope({
    super.key,
    required this.child,
    this.duration = const Duration(milliseconds: 1400),
  });

  final Widget child;
  final Duration duration;

  @override
  State<SkeletonScope> createState() => _SkeletonScopeState();
}

class _SkeletonScopeState extends State<SkeletonScope>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: widget.duration,
  );
  late final Animation<double> _opacity = TweenSequence<double>([
    TweenSequenceItem(
      tween: Tween(
        begin: .45,
        end: .9,
      ).chain(CurveTween(curve: Curves.easeInOut)),
      weight: 1,
    ),
    TweenSequenceItem(
      tween: Tween(
        begin: .9,
        end: .45,
      ).chain(CurveTween(curve: Curves.easeInOut)),
      weight: 1,
    ),
  ]).animate(_c);
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final reduce = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    if (reduce) {
      _c.stop();
      _started = false;
    } else if (!_started) {
      _c.repeat();
      _started = true;
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reduce = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    return Semantics(
      label: 'Loading',
      excludeSemantics: true,
      child: reduce
          ? Opacity(opacity: .7, child: widget.child)
          : FadeTransition(opacity: _opacity, child: widget.child),
    );
  }
}

/// A rounded `skel`-coloured block. Put blocks inside a [SkeletonScope].
class SkeletonBox extends StatelessWidget {
  const SkeletonBox({
    super.key,
    this.width,
    this.height,
    this.radius = 6,
    this.circle = false,
    this.aspectRatio,
  });

  final double? width;
  final double? height;
  final double radius;
  final bool circle;
  final double? aspectRatio;

  @override
  Widget build(BuildContext context) {
    final box = Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: context.tokens.skel,
        shape: circle ? BoxShape.circle : BoxShape.rectangle,
        borderRadius: circle ? null : BorderRadius.circular(radius),
      ),
    );
    return aspectRatio == null
        ? box
        : AspectRatio(aspectRatio: aspectRatio!, child: box);
  }
}

/// Product grid skeleton: 4/5 tile + three lines (90 %, 55 %, 38 %), gap
/// 12 x 16, same layout as the loaded grid.
class ProductGridSkeleton extends StatelessWidget {
  const ProductGridSkeleton({super.key, this.count = 4});

  final int count;

  @override
  Widget build(BuildContext context) {
    return SkeletonScope(
      child: LayoutBuilder(
        builder: (context, c) {
          final w = (c.maxWidth - 12) / 2;
          return Wrap(
            spacing: 12,
            runSpacing: 16,
            children: [
              for (var i = 0; i < count; i++)
                SizedBox(
                  width: w,
                  child: const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SkeletonBox(aspectRatio: 4 / 5, radius: 16),
                      SizedBox(height: 8),
                      FractionallySizedBox(
                        widthFactor: .9,
                        child: SkeletonBox(height: 12),
                      ),
                      SizedBox(height: 8),
                      FractionallySizedBox(
                        widthFactor: .55,
                        child: SkeletonBox(height: 10),
                      ),
                      SizedBox(height: 8),
                      FractionallySizedBox(
                        widthFactor: .38,
                        child: SkeletonBox(height: 12),
                      ),
                    ],
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

/// List skeleton: [count] card-height blocks (radius 20).
class ListSkeleton extends StatelessWidget {
  const ListSkeleton({
    super.key,
    this.count = 3,
    this.itemHeight = 96,
    this.gap = 10,
  });

  final int count;
  final double itemHeight;
  final double gap;

  @override
  Widget build(BuildContext context) {
    return SkeletonScope(
      child: Column(
        children: [
          for (var i = 0; i < count; i++) ...[
            if (i > 0) SizedBox(height: gap),
            SkeletonBox(height: itemHeight, radius: 20),
          ],
        ],
      ),
    );
  }
}

/// Shows [child] only after [delay] (default 150 ms) so fast responses do not
/// flash a skeleton.
class DelayedSkeleton extends StatefulWidget {
  const DelayedSkeleton({
    super.key,
    required this.child,
    this.delay = const Duration(milliseconds: 150),
  });

  final Widget child;
  final Duration delay;

  @override
  State<DelayedSkeleton> createState() => _DelayedSkeletonState();
}

class _DelayedSkeletonState extends State<DelayedSkeleton> {
  Timer? _timer;
  late bool _show = widget.delay == Duration.zero;

  @override
  void initState() {
    super.initState();
    if (!_show) {
      _timer = Timer(widget.delay, () {
        if (mounted) setState(() => _show = true);
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) =>
      _show ? widget.child : const SizedBox.shrink();
}
