import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/cyd_tokens.dart';
import '../theme/cyd_type.dart';
import 'cyd_pressable.dart';
import 'cyd_toast.dart';

/// Label + value + copy action. Tapping anywhere copies the value, gives
/// light haptic feedback and toasts "{label} copied". The value wraps
/// anywhere (UPI IDs are long). Never log or persist the copied value.
class CopyRow extends StatelessWidget {
  const CopyRow({
    super.key,
    required this.label,
    required this.value,
    this.big = false,
    this.mono = false,
    this.toastLabel,
  });

  final String label;
  final String value;

  /// Serif 24 value (seller UPI ID).
  final bool big;

  /// DM Mono value (references).
  final bool mono;

  /// Name used in the toast; defaults to [label] in sentence case.
  final String? toastLabel;

  Future<void> _copy(BuildContext context) async {
    await Clipboard.setData(ClipboardData(text: value));
    unawaited(HapticFeedback.lightImpact());
    if (context.mounted) {
      CydToast.show(context, '${toastLabel ?? _sentence(label)} copied');
    }
  }

  static String _sentence(String s) =>
      s.isEmpty ? s : s[0].toUpperCase() + s.substring(1).toLowerCase();

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final type = context.type;
    final valueStyle = big
        ? type.serif(24)
        : mono
        ? type.mono(14, color: t.ink, tracking: .02)
        : type.cardTitle;
    return CydPressable(
      onTap: () => _copy(context),
      semanticLabel: 'Copy $label',
      excludeChildSemantics: true,
      minSize: 0,
      pressedOpacity: .8,
      child: Container(
        padding: const EdgeInsets.fromLTRB(14, 12, 8, 12),
        constraints: const BoxConstraints(minHeight: 64),
        decoration: BoxDecoration(
          color: t.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: t.line),
          boxShadow: t.shadow,
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label.toUpperCase(), style: type.inputLabel),
                  const SizedBox(height: 6),
                  Text(value, style: valueStyle, softWrap: true),
                ],
              ),
            ),
            SizedBox(
              width: 44,
              height: 44,
              child: Icon(Icons.content_copy, size: 18, color: t.accText),
            ),
          ],
        ),
      ),
    );
  }
}
