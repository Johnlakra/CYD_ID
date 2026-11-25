import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/cyd_tokens.dart';
import '../theme/cyd_type.dart';
import 'cyd_pressable.dart';
import 'cyd_toast.dart';

/// Label above a card with the value and a "Copy" text button; an optional
/// [helper] line sits under the card. Tapping anywhere on the card copies the
/// value, gives light haptic feedback and toasts "{label} copied". The value
/// wraps anywhere (UPI IDs are long). Never log or persist the copied value.
///
/// The semantic label is "{label} {value}, copy". Pass [secret] for values
/// that must not be read out or exposed to accessibility services.
class CopyRow extends StatelessWidget {
  const CopyRow({
    super.key,
    required this.label,
    required this.value,
    this.big = false,
    this.mono = false,
    this.toastLabel,
    this.helper,
    this.secret = false,
  });

  final String label;
  final String value;

  /// Serif 27 value (seller UPI ID).
  final bool big;

  /// DM Mono 15 value (payment note, references).
  final bool mono;

  /// Name used in the toast; defaults to [label] in sentence case.
  final String? toastLabel;
  final String? helper;
  final bool secret;

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
        ? type.serif(27, height: 1.1)
        : mono
        ? type.mono(15, color: t.ink, tracking: 0, height: 1)
        : type.ui(15, weight: FontWeight.w700, height: 1);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label.toUpperCase(), style: type.mono(10, tracking: .12)),
        const SizedBox(height: 6),
        CydPressable(
          onTap: () => _copy(context),
          semanticLabel: secret ? '$label, copy' : '$label $value, copy',
          excludeChildSemantics: true,
          minSize: 0,
          pressedOpacity: .8,
          child: Container(
            padding: const EdgeInsets.fromLTRB(14, 0, 2, 0),
            constraints: const BoxConstraints(minHeight: 58),
            decoration: BoxDecoration(
              color: t.card,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: t.line),
              boxShadow: t.shadow,
            ),
            child: Row(
              children: [
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    child: Text(value, style: valueStyle),
                  ),
                ),
                const SizedBox(width: 10),
                SizedBox(
                  height: 44,
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text(
                        'Copy',
                        style: type.ui(
                          13,
                          weight: FontWeight.w700,
                          color: t.accText,
                          height: 1,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        if (helper != null) ...[
          const SizedBox(height: 6),
          Text(helper!, style: type.bodySmall.copyWith(height: 1.45)),
        ],
      ],
    );
  }
}
