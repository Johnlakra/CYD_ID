import 'package:flutter/material.dart';

import '../format/money.dart';
import '../theme/cyd_tokens.dart';
import '../theme/cyd_type.dart';

/// Price from int paise (`formatPaise`, never `double`). Optional struck-out
/// MRP when [comparePaise] > [paise] and a "{n}% off" pill.
class PriceText extends StatelessWidget {
  const PriceText(
    this.paise, {
    super.key,
    this.comparePaise,
    this.style,
    this.showDiscount = false,
  });

  final int paise;
  final int? comparePaise;

  /// Defaults to Manrope 700 14; pass `context.type.heading` etc. for the
  /// serif display prices.
  final TextStyle? style;
  final bool showDiscount;

  /// `round((1 - price/mrp) * 100)` with integer maths.
  static int discountPercent(int paise, int comparePaise) =>
      ((comparePaise - paise) * 100 / comparePaise).round();

  @override
  Widget build(BuildContext context) {
    final type = context.type;
    final t = context.tokens;
    final mrp = comparePaise;
    final hasStrike = mrp != null && mrp > paise;
    return Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 6,
      runSpacing: 2,
      children: [
        Text(formatPaise(paise), style: style ?? type.price),
        if (hasStrike)
          Text(
            formatPaise(mrp),
            style: type.priceStrike.copyWith(
              decoration: TextDecoration.lineThrough,
            ),
          ),
        if (hasStrike && showDiscount)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: t.accSoft,
              borderRadius: BorderRadius.circular(99),
            ),
            child: Text(
              '${discountPercent(paise, mrp)}% off',
              style: type.ui(
                10,
                weight: FontWeight.w700,
                color: t.accText,
                height: 1.2,
              ),
            ),
          ),
      ],
    );
  }
}
