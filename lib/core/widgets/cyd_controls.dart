import 'package:flutter/material.dart';

import '../theme/cyd_tokens.dart';
import '../theme/cyd_type.dart';
import 'cyd_pressable.dart';

/// Radio row: 20 px ring (2 px border, accent when selected) with a 10 px
/// accent dot; the whole row is the tap target.
class CydRadioRow<T> extends StatelessWidget {
  const CydRadioRow({
    super.key,
    required this.value,
    required this.groupValue,
    required this.label,
    required this.onChanged,
    this.subtitle,
    this.height = 46,
  });

  final T value;
  final T? groupValue;
  final String label;
  final String? subtitle;
  final ValueChanged<T>? onChanged;
  final double height;

  bool get selected => value == groupValue;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return CydPressable(
      selected: selected,
      semanticLabel: label,
      excludeChildSemantics: true,
      onTap: onChanged == null ? null : () => onChanged!(value),
      minSize: height,
      child: ConstrainedBox(
        constraints: BoxConstraints(minHeight: height),
        child: Row(
          children: [
            _RadioDot(selected: selected),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    label,
                    style: context.type.ui(14, weight: FontWeight.w500),
                  ),
                  if (subtitle != null)
                    Text(
                      subtitle!,
                      style: context.type.bodySmall.copyWith(color: t.mute),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RadioDot extends StatelessWidget {
  const _RadioDot({required this.selected});
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return Container(
      width: 20,
      height: 20,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: selected ? CydTokens.accent : t.line2,
          width: 2,
        ),
      ),
      alignment: Alignment.center,
      child: selected
          ? Container(
              width: 10,
              height: 10,
              decoration: const BoxDecoration(
                color: CydTokens.accent,
                shape: BoxShape.circle,
              ),
            )
          : null,
    );
  }
}

/// Switch: 44x26 pill, 22 px white knob, 200 ms. Off = line2 track, on =
/// accent track. Prefer [CydSwitchRow] for settings.
class CydSwitch extends StatelessWidget {
  const CydSwitch({
    super.key,
    required this.value,
    required this.onChanged,
    this.semanticLabel,
  });

  final bool value;
  final ValueChanged<bool>? onChanged;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final track = AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      width: 44,
      height: 26,
      padding: const EdgeInsets.all(2),
      alignment: value ? Alignment.centerRight : Alignment.centerLeft,
      decoration: BoxDecoration(
        color: value ? CydTokens.accent : t.line2,
        borderRadius: BorderRadius.circular(99),
      ),
      child: Container(
        width: 22,
        height: 22,
        decoration: const BoxDecoration(
          color: CydTokens.white,
          shape: BoxShape.circle,
        ),
      ),
    );
    return Semantics(
      toggled: value,
      enabled: onChanged != null,
      label: semanticLabel,
      onTap: onChanged == null ? null : () => onChanged!(!value),
      excludeSemantics: true,
      child: HitSlop(
        minSize: 44,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: onChanged == null ? null : () => onChanged!(!value),
          child: track,
        ),
      ),
    );
  }
}

/// Settings row with a [CydSwitch]: height 56, radius 14, card fill.
class CydSwitchRow extends StatelessWidget {
  const CydSwitchRow({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
  });

  final String label;
  final bool value;
  final ValueChanged<bool>? onChanged;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return CydPressable(
      toggled: value,
      semanticLabel: label,
      excludeChildSemantics: true,
      minSize: 56,
      onTap: onChanged == null ? null : () => onChanged!(!value),
      child: Container(
        height: 56,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: t.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: t.line),
        ),
        child: Row(
          children: [
            Expanded(child: Text(label, style: context.type.bodyStrong)),
            const SizedBox(width: 10),
            CydSwitch(value: value, onChanged: onChanged),
          ],
        ),
      ),
    );
  }
}

/// Quantity stepper. [compact] is the cart variant (34 dp, radius 10); the
/// default is the product bar (52 dp, radius 14). At [min] / [max] the
/// matching button is inert at .35 opacity.
class QuantityStepper extends StatelessWidget {
  const QuantityStepper({
    super.key,
    required this.value,
    required this.onChanged,
    this.min = 1,
    this.max = 99,
    this.compact = false,
  });

  final int value;
  final ValueChanged<int>? onChanged;
  final int min;
  final int max;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final h = compact ? 34.0 : 52.0;
    final bw = compact ? 32.0 : 40.0;
    final cw = compact ? 20.0 : 22.0;
    final canDec = onChanged != null && value > min;
    final canInc = onChanged != null && value < max;
    Widget btn(String label, IconData icon, bool on, int next) => Opacity(
      opacity: on ? 1 : .35,
      child: CydPressable(
        semanticLabel: label,
        excludeChildSemantics: true,
        onTap: on ? () => onChanged!(next) : null,
        child: SizedBox(
          width: bw,
          height: h,
          child: Icon(icon, size: compact ? 16 : 18, color: t.ink),
        ),
      ),
    );
    final box = Container(
      height: h,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(compact ? 10 : 14),
        border: Border.all(color: t.line2),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          btn('Decrease quantity', Icons.remove, canDec, value - 1),
          SizedBox(
            width: cw,
            child: Semantics(
              liveRegion: true,
              label: 'Quantity $value',
              excludeSemantics: true,
              child: Text(
                '$value',
                textAlign: TextAlign.center,
                style: context.type.ui(
                  compact ? 13 : 15,
                  weight: FontWeight.w700,
                ),
              ),
            ),
          ),
          btn('Increase quantity', Icons.add, canInc, value + 1),
        ],
      ),
    );
    // The compact (cart) stepper is smaller than a finger: widen its hit area
    // as a whole so the 32 dp buttons stay easy to hit.
    return compact ? HitSlop(minSize: 44, child: box) : box;
  }
}
