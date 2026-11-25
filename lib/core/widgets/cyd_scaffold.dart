import 'package:flutter/material.dart';

import '../theme/cyd_tokens.dart';
import 'app_bars.dart';

/// Screen scaffold: page background (`bg` + the theme gradient), safe area,
/// an optional sub-screen bar ([title] -> back button + serif title; its
/// hairline fades in once the body has scrolled past 8 px) and an optional
/// sticky [bottom] bar.
class CydScaffold extends StatefulWidget {
  const CydScaffold({
    super.key,
    required this.body,
    this.title,
    this.trailing,
    this.onBack,
    this.bottom,
    this.top = true,
    this.resizeToAvoidBottomInset = true,
  });

  final Widget body;

  /// Sub-screen title; `null` = no bar (tab roots draw their own header).
  final String? title;
  final Widget? trailing;
  final VoidCallback? onBack;
  final Widget? bottom;

  /// Apply the top safe-area inset (turn off under a hero image).
  final bool top;
  final bool resizeToAvoidBottomInset;

  @override
  State<CydScaffold> createState() => _CydScaffoldState();
}

class _CydScaffoldState extends State<CydScaffold> {
  bool _scrolled = false;

  bool _onScroll(ScrollNotification n) {
    if (n.depth == 0 && n.metrics.axis == Axis.vertical) {
      final s = n.metrics.pixels > 8;
      if (s != _scrolled) setState(() => _scrolled = s);
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return Scaffold(
      backgroundColor: t.bg,
      resizeToAvoidBottomInset: widget.resizeToAvoidBottomInset,
      body: DecoratedBox(
        decoration: BoxDecoration(gradient: t.bgGrad),
        child: SafeArea(
          top: widget.top,
          bottom: widget.bottom != null,
          child: Column(
            children: [
              if (widget.title != null)
                CydSubBar(
                  title: widget.title!,
                  trailing: widget.trailing,
                  onBack: widget.onBack,
                  showDivider: _scrolled,
                ),
              Expanded(
                child: NotificationListener<ScrollNotification>(
                  onNotification: _onScroll,
                  child: widget.body,
                ),
              ),
              ?widget.bottom,
            ],
          ),
        ),
      ),
    );
  }
}
