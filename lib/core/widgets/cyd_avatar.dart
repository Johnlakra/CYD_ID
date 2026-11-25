import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../theme/cyd_tokens.dart';
import '../theme/cyd_type.dart';

/// Circle avatar: initials in Instrument Serif until a photo exists.
/// [gold] = accent fill (account), [hue] tints it like a category tile,
/// default is the neutral `sunk` fill with a hairline.
class CydAvatar extends StatelessWidget {
  const CydAvatar({
    super.key,
    required this.initials,
    this.size = 42,
    this.imageUrl,
    this.gold = false,
    this.hue,
    this.semanticLabel,
  });

  final String initials;
  final double size;
  final String? imageUrl;
  final bool gold;
  final num? hue;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final type = context.type;
    final Color fg = gold
        ? CydTokens.onAccent
        : hue != null
        ? t.categoryMark(hue!)
        : t.ink;
    final initialsWidget = Text(
      initials.length > 2 ? initials.substring(0, 2) : initials,
      style: type.serif(size * .4, color: fg),
    );
    return Semantics(
      label: semanticLabel,
      image: true,
      child: Container(
        width: size,
        height: size,
        alignment: Alignment.center,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: gold ? CydTokens.accent : t.sunk,
          gradient: !gold && hue != null ? t.categoryTile(hue!) : null,
          border: gold ? null : Border.all(color: t.line),
        ),
        child: imageUrl == null
            ? initialsWidget
            : CachedNetworkImage(
                imageUrl: imageUrl!,
                width: size,
                height: size,
                fit: BoxFit.cover,
                placeholder: (_, _) => initialsWidget,
                errorWidget: (_, _, _) => initialsWidget,
              ),
      ),
    );
  }
}
