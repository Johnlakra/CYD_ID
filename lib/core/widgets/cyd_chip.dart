import 'package:flutter/material.dart';

import '../theme/cyd_tokens.dart';
import '../theme/cyd_type.dart';
import 'cyd_pressable.dart';

/// How a selected filter chip is painted.
enum CydChipStyle {
  /// Ink fill (search / filter sheets, form chips).
  ink,

  /// Gold fill (order filters).
  gold,
}

/// Filter pill (height 36, radius 99). Selected = ink or gold fill;
/// unselected = outlined (line2). [attention] paints the unselected chip in
/// `accSoft` ("Needs action"). [count] renders as " · n".
class CydFilterChip extends StatelessWidget {
  const CydFilterChip({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
    this.count,
    this.style = CydChipStyle.ink,
    this.attention = false,
    this.height = 36,
  });

  final String label;
  final bool selected;
  final VoidCallback? onTap;
  final int? count;
  final CydChipStyle style;
  final bool attention;

  /// 36 for filters, 34 for form chips.
  final double height;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final gold = style == CydChipStyle.gold;
    final Color bg;
    final Color fg;
    final Color? bd;
    if (selected) {
      bg = gold ? CydTokens.accent : t.ink;
      fg = gold ? CydTokens.onAccent : t.bg;
      bd = bg;
    } else if (attention) {
      bg = t.accSoft;
      fg = t.accText;
      bd = null;
    } else {
      bg = Colors.transparent;
      fg = gold ? t.ink : t.mute;
      bd = t.line2;
    }
    final text = count == null ? label : '$label · $count';
    return CydPressable(
      onTap: onTap,
      selected: selected,
      semanticLabel: text,
      excludeChildSemantics: true,
      child: Container(
        height: height,
        padding: const EdgeInsets.symmetric(horizontal: 13),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(99),
          border: bd == null ? null : Border.all(color: bd),
        ),
        child: Center(
          widthFactor: 1,
          child: Text(
            text,
            maxLines: 1,
            style: context.type.chip.copyWith(color: fg),
          ),
        ),
      ),
    );
  }
}

/// Removable chip: `accSoft` fill, trailing x (height 30).
class CydRemovableChip extends StatelessWidget {
  const CydRemovableChip({
    super.key,
    required this.label,
    required this.onRemove,
  });

  final String label;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return CydPressable(
      onTap: onRemove,
      semanticLabel: 'Remove $label',
      excludeChildSemantics: true,
      child: Container(
        height: 30,
        padding: const EdgeInsets.only(left: 12, right: 8),
        decoration: BoxDecoration(
          color: t.accSoft,
          borderRadius: BorderRadius.circular(99),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(label, style: context.type.chip.copyWith(color: t.accText)),
            const SizedBox(width: 6),
            Icon(Icons.close, size: 14, color: t.accText),
          ],
        ),
      ),
    );
  }
}

/// Info chip (parish / deanery on a storefront): height 26, card fill.
class CydInfoChip extends StatelessWidget {
  const CydInfoChip(this.label, {super.key, this.icon});

  final String label;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return Container(
      height: 26,
      padding: const EdgeInsets.symmetric(horizontal: 10),
      decoration: BoxDecoration(
        color: t.card,
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: t.line),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 13, color: t.mute),
            const SizedBox(width: 5),
          ],
          Text(
            label,
            style: context.type.ui(11, weight: FontWeight.w600, height: 1),
          ),
        ],
      ),
    );
  }
}

/// Solid gold "DEFAULT" pill.
class CydDefaultPill extends StatelessWidget {
  const CydDefaultPill({super.key, this.label = 'DEFAULT'});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: CydTokens.accent,
        borderRadius: BorderRadius.circular(99),
      ),
      child: Text(
        label,
        style: context.type.ui(
          9,
          weight: FontWeight.w700,
          color: CydTokens.onAccent,
          tracking: .06,
          height: 1.2,
        ),
      ),
    );
  }
}
