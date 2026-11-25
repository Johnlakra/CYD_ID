import 'dart:async';

import 'package:flutter/material.dart';

import '../theme/cyd_layout.dart';
import '../theme/cyd_tokens.dart';
import '../theme/cyd_type.dart';
import 'cyd_chrome.dart';
import 'cyd_sheet.dart';

/// Inverted-ink toast above the tab bar. One at a time (a new toast replaces
/// the old); auto-dismisses after 2.8 s, or 5 s when it has an action.
class CydToast {
  const CydToast._();

  static OverlayEntry? _entry;
  static Timer? _timer;

  /// [stickyBar] raises it above a screen's sticky bottom bar. Without it the
  /// offset is 104 when the tab bar is on screen (see `CydChrome`) else 30.
  static void show(
    BuildContext context,
    String message, {
    String? actionLabel,
    VoidCallback? onAction,
    bool stickyBar = false,
  }) {
    dismiss();
    final overlay = Overlay.of(context, rootOverlay: true);
    final bottom = stickyBar
        ? CydLayout.toastBottomStickyBar
        : CydChrome.tabBarVisibleOf(context)
        ? CydLayout.toastBottomWithTabs
        : CydLayout.toastBottomOther;
    final tokens = context.tokens;
    final entry = OverlayEntry(
      builder: (ctx) => _ToastView(
        message: message,
        actionLabel: actionLabel,
        bottom: bottom + MediaQuery.of(ctx).padding.bottom,
        tokens: tokens,
        onAction: () {
          dismiss();
          onAction?.call();
        },
      ),
    );
    _entry = entry;
    overlay.insert(entry);
    _timer = Timer(
      actionLabel != null
          ? const Duration(seconds: 5)
          : const Duration(milliseconds: 2800),
      dismiss,
    );
  }

  static void dismiss() {
    _timer?.cancel();
    _timer = null;
    _entry?.remove();
    _entry?.dispose();
    _entry = null;
  }
}

class _ToastView extends StatefulWidget {
  const _ToastView({
    required this.message,
    required this.actionLabel,
    required this.bottom,
    required this.tokens,
    required this.onAction,
  });

  final String message;
  final String? actionLabel;
  final double bottom;
  final CydTokens tokens;
  final VoidCallback onAction;

  @override
  State<_ToastView> createState() => _ToastViewState();
}

class _ToastViewState extends State<_ToastView>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 300),
  );
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    final reduce = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    if (reduce) {
      _c.value = 1;
    } else {
      unawaited(_c.forward());
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = widget.tokens;
    final type = CydType(t);
    final anim = CurvedAnimation(parent: _c, curve: cydCurve);
    return Positioned(
      left: 16,
      right: 16,
      bottom: widget.bottom,
      child: FadeTransition(
        opacity: anim,
        child: SlideTransition(
          position: Tween(
            begin: const Offset(0, .3),
            end: Offset.zero,
          ).animate(anim),
          child: Semantics(
            liveRegion: true,
            container: true,
            child: Material(
              color: Colors.transparent,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                decoration: BoxDecoration(
                  color: t.toastBg,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        widget.message,
                        style: type.ui(
                          13,
                          weight: FontWeight.w600,
                          color: t.toastFg,
                        ),
                      ),
                    ),
                    if (widget.actionLabel != null) ...[
                      const SizedBox(width: 10),
                      GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: widget.onAction,
                        child: ConstrainedBox(
                          constraints: const BoxConstraints(
                            minHeight: 44,
                            minWidth: 44,
                          ),
                          child: Center(
                            child: Text(
                              widget.actionLabel!,
                              style: type.ui(
                                13,
                                weight: FontWeight.w700,
                                color: CydTokens.toastAction,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// The toast surface without the overlay machinery (gallery / goldens).
class CydToastBody extends StatelessWidget {
  const CydToastBody(this.message, {super.key, this.actionLabel});

  final String message;
  final String? actionLabel;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final type = context.type;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: t.toastBg,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              message,
              style: type.ui(13, weight: FontWeight.w600, color: t.toastFg),
            ),
          ),
          if (actionLabel != null)
            Text(
              actionLabel!,
              style: type.ui(
                13,
                weight: FontWeight.w700,
                color: CydTokens.toastAction,
              ),
            ),
        ],
      ),
    );
  }
}
