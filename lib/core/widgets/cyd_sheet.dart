import 'package:flutter/material.dart';

import '../theme/cyd_tokens.dart';
import '../theme/cyd_type.dart';

/// Motion curve shared by sheets, dialogs and toasts (`cubic-bezier(.19,1,.22,1)`).
const Curve cydCurve = Cubic(.19, 1, .22, 1);

/// Shows a bottom sheet in the design-system style (scrim, `raised` surface,
/// radius 28 top, grabber, title, scrolling content, sticky [footer]).
///
/// [dismissible] false (a request is in flight) blocks drag, scrim tap and
/// the back button.
Future<T?> showCydSheet<T>(
  BuildContext context, {
  String? title,
  required WidgetBuilder builder,
  Widget? footer,
  bool dismissible = true,
  double maxHeightFactor = .8,
}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useRootNavigator: true,
    backgroundColor: Colors.transparent,
    elevation: 0,
    barrierColor: context.tokens.sheetScrim,
    isDismissible: dismissible,
    enableDrag: dismissible,
    sheetAnimationStyle: const AnimationStyle(
      duration: Duration(milliseconds: 420),
      reverseDuration: Duration(milliseconds: 250),
      curve: cydCurve,
      reverseCurve: Curves.easeIn,
    ),
    builder: (ctx) => PopScope(
      canPop: dismissible,
      child: CydSheet(
        title: title,
        footer: footer,
        maxHeightFactor: maxHeightFactor,
        child: Builder(builder: builder),
      ),
    ),
  );
}

/// The sheet surface. Use through [showCydSheet]; exposed so it can be
/// rendered in the gallery and goldens.
class CydSheet extends StatelessWidget {
  const CydSheet({
    super.key,
    required this.child,
    this.title,
    this.footer,
    this.maxHeightFactor = .8,
  });

  final Widget child;
  final String? title;
  final Widget? footer;
  final double maxHeightFactor;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final mq = MediaQuery.of(context);
    return Padding(
      padding: EdgeInsets.only(bottom: mq.viewInsets.bottom),
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: (mq.size.height - mq.viewInsets.bottom) * maxHeightFactor,
        ),
        child: Container(
          decoration: BoxDecoration(
            color: t.raised,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            border: Border(top: BorderSide(color: t.line2)),
          ),
          padding: EdgeInsets.fromLTRB(20, 12, 20, 30 + mq.padding.bottom),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: t.line2,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              if (title != null) ...[
                Semantics(
                  header: true,
                  child: Text(title!, style: context.type.sheetTitle),
                ),
                const SizedBox(height: 14),
              ],
              Flexible(child: SingleChildScrollView(child: child)),
              if (footer != null) ...[const SizedBox(height: 14), footer!],
            ],
          ),
        ),
      ),
    );
  }
}
