import 'package:flutter/material.dart';

import '../theme/cyd_tokens.dart';
import '../theme/cyd_type.dart';
import '../theme/status_styles.dart';
import 'cyd_icons.dart';

enum StatusChipSize {
  /// 24 dp, list rows.
  list(24, 10),

  /// 26 dp, detail headers.
  detail(26, 11),

  /// 22 dp, dense rows.
  compact(22, 10);

  const StatusChipSize(this.height, this.fontSize);
  final double height;
  final double fontSize;
}

/// Status chip: glyph + text on a tinted pill (never colour alone). One
/// widget covers order status, payment status, card validity, shop status and
/// product status / stock; the named constructors document which server value
/// each takes. Unknown values render their raw text on a neutral chip.
class StatusChip extends StatelessWidget {
  const StatusChip(
    this.status, {
    super.key,
    this.size = StatusChipSize.list,
    this.days,
    this.count,
  });

  /// `order.status` (placed, accepted, ...).
  const StatusChip.order(
    String status, {
    Key? key,
    StatusChipSize size = StatusChipSize.list,
  }) : this(status, key: key, size: size);

  /// `order.payment_status` (awaiting_payment, claimed, confirmed, disputed,
  /// refund_due, refunded, void, written_off, cod_pending, cod_collected).
  const StatusChip.payment(
    String status, {
    Key? key,
    StatusChipSize size = StatusChipSize.list,
  }) : this(status, key: key, size: size);

  /// Card validity: `valid`, `expiring` (give [days]) or `expired`.
  const StatusChip.validity(
    String status, {
    Key? key,
    int? days,
    StatusChipSize size = StatusChipSize.list,
  }) : this(status, key: key, size: size, days: days);

  /// `shop.status` (pending, approved, suspended).
  const StatusChip.shop(
    String status, {
    Key? key,
    StatusChipSize size = StatusChipSize.list,
  }) : this(status, key: key, size: size);

  /// `product.status` (active, draft, archived) or stock (`out`,
  /// `stock_low` with [count], `stock_ok`).
  const StatusChip.product(
    String status, {
    Key? key,
    int? count,
    StatusChipSize size = StatusChipSize.list,
  }) : this(status, key: key, size: size, count: count);

  final String status;
  final StatusChipSize size;

  /// Day count for `expiring`.
  final int? days;

  /// Remaining units for `stock_low`.
  final int? count;

  /// Visible label for [status] (public so tests and exports can reuse it).
  static String labelFor(String status, {int? days, int? count}) {
    final s = cydStatusStyles[status];
    if (s == null) return status;
    return s.label
        .replaceAll('{n}', '${days ?? 0}')
        .replaceAll('Only N left', 'Only ${count ?? 0} left');
  }

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final style = cydStatusStyles[status] ?? cydUnknownStatus;
    final fg = style.fg(t.brightness);
    final bg = style.bg(t.brightness, t.statusChipBgAlpha);
    final label = labelFor(status, days: days, count: count);
    return Semantics(
      label: label,
      excludeSemantics: true,
      child: Container(
        height: size.height,
        padding: const EdgeInsets.symmetric(horizontal: 9),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(99),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            StatusGlyphIcon(style.glyph, size: size.fontSize + 2, color: fg),
            const SizedBox(width: 4),
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: context.type.statusChip.copyWith(
                  color: fg,
                  fontSize: size.fontSize,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
