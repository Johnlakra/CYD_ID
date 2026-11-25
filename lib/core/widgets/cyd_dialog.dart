import 'dart:async';

import 'package:flutter/material.dart';

import '../theme/cyd_tokens.dart';
import '../theme/cyd_type.dart';
import 'cyd_button.dart';
import 'cyd_sheet.dart';

/// Confirm dialog. Resolves `true` when confirmed, `false`/`null` otherwise.
///
/// The left button is the safe choice (wording must match the action: "Back",
/// "Not now", "Keep it" for delete flows). [onConfirm] may be async: the
/// confirm button shows a spinner, the dialog cannot be dismissed meanwhile
/// and it closes with `true` when the future completes. If it throws, the
/// dialog stays open and the error propagates to the caller's zone.
Future<bool?> showCydDialog(
  BuildContext context, {
  required String title,
  required String body,
  required String confirmLabel,
  String cancelLabel = 'Back',
  bool destructive = false,
  FutureOr<void> Function()? onConfirm,
}) {
  return showGeneralDialog<bool>(
    context: context,
    barrierDismissible: true,
    barrierLabel: 'Dismiss',
    barrierColor: context.tokens.dialogScrim,
    transitionDuration: const Duration(milliseconds: 300),
    transitionBuilder: (ctx, anim, _, child) {
      final scale = TweenSequence<double>([
        TweenSequenceItem(tween: Tween(begin: .6, end: 1.04), weight: 70),
        TweenSequenceItem(tween: Tween(begin: 1.04, end: 1), weight: 30),
      ]).chain(CurveTween(curve: cydCurve)).animate(anim);
      return FadeTransition(
        opacity: anim,
        child: ScaleTransition(scale: scale, child: child),
      );
    },
    pageBuilder: (ctx, _, _) => CydDialog(
      title: title,
      body: body,
      confirmLabel: confirmLabel,
      cancelLabel: cancelLabel,
      destructive: destructive,
      onConfirm: onConfirm,
    ),
  );
}

/// Dialog surface (inset 24, `raised`, line2 border, radius 24).
class CydDialog extends StatefulWidget {
  const CydDialog({
    super.key,
    required this.title,
    required this.body,
    required this.confirmLabel,
    this.cancelLabel = 'Back',
    this.destructive = false,
    this.onConfirm,
  });

  final String title;
  final String body;
  final String confirmLabel;
  final String cancelLabel;
  final bool destructive;
  final FutureOr<void> Function()? onConfirm;

  @override
  State<CydDialog> createState() => _CydDialogState();
}

class _CydDialogState extends State<CydDialog> {
  bool _busy = false;

  Future<void> _confirm() async {
    setState(() => _busy = true);
    try {
      await widget.onConfirm?.call();
      if (mounted) Navigator.of(context, rootNavigator: true).pop(true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final type = context.type;
    return PopScope(
      canPop: !_busy,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Material(
            color: Colors.transparent,
            child: Semantics(
              scopesRoute: true,
              explicitChildNodes: true,
              namesRoute: true,
              label: widget.title,
              child: Container(
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  color: t.raised,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: t.line2),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.title, style: type.sheetTitle),
                    const SizedBox(height: 10),
                    Text(widget.body, style: type.body),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: CydButton.secondary(
                            label: widget.cancelLabel,
                            size: CydButtonSize.dialog,
                            padding: 8,
                            onPressed: _busy
                                ? null
                                : () => Navigator.of(
                                    context,
                                    rootNavigator: true,
                                  ).pop(false),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: CydButton(
                            label: widget.confirmLabel,
                            size: CydButtonSize.dialog,
                            padding: 8,
                            variant: widget.destructive
                                ? CydButtonVariant.destructiveFilled
                                : CydButtonVariant.primary,
                            loading: _busy,
                            onPressed: _confirm,
                          ),
                        ),
                      ],
                    ),
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
