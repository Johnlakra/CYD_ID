import 'package:flutter/material.dart';

import '../theme/cyd_tokens.dart';
import '../theme/cyd_type.dart';
import 'cyd_pressable.dart';

/// 40 dp circle with a 1 px line2 border and a back arrow (44 dp hit area).
/// [hero] variant (over banners / galleries): `card` fill, no border.
/// Pops the current route unless [onPressed] is given.
class CydBackButton extends StatelessWidget {
  const CydBackButton({super.key, this.onPressed, this.hero = false});

  final VoidCallback? onPressed;
  final bool hero;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return CydPressable(
      semanticLabel: 'Back',
      excludeChildSemantics: true,
      onTap: onPressed ?? () => Navigator.of(context).maybePop(),
      child: Container(
        width: 40,
        height: 40,
        margin: const EdgeInsets.all(2),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: hero ? t.card : Colors.transparent,
          border: hero ? null : Border.all(color: t.line2),
          boxShadow: hero ? t.shadow : null,
        ),
        child: Icon(Icons.arrow_back, size: 18, color: t.ink),
      ),
    );
  }
}

/// 44 dp circle action button (cart on Home, filter, close): icon or serif
/// glyph, 1 px line2 border. [badge] shows a red count.
class CydCircleButton extends StatelessWidget {
  const CydCircleButton({
    super.key,
    required this.semanticLabel,
    required this.onPressed,
    this.icon,
    this.glyph,
    this.badge = 0,
    this.size = 44,
  });

  final String semanticLabel;
  final VoidCallback? onPressed;
  final IconData? icon;

  /// Serif glyph instead of an icon (e.g. the rupee sign).
  final String? glyph;
  final int badge;
  final double size;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final type = context.type;
    return CydPressable(
      semanticLabel: semanticLabel,
      excludeChildSemantics: true,
      onTap: onPressed,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: size,
            height: size,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: t.line2),
            ),
            child: glyph != null
                ? Text(glyph!, style: type.serif(18))
                : Icon(icon, size: 20, color: t.ink),
          ),
          if (badge > 0)
            Positioned(top: -2, right: -2, child: CydCountBadge(badge)),
        ],
      ),
    );
  }
}

/// Red count badge (min 17 dp, "99+" cap, hidden at 0).
class CydCountBadge extends StatelessWidget {
  const CydCountBadge(this.count, {super.key, this.ringColor});

  final int count;

  /// Ring colour that separates the badge from what is behind it.
  final Color? ringColor;

  @override
  Widget build(BuildContext context) {
    if (count <= 0) return const SizedBox.shrink();
    final t = context.tokens;
    return Semantics(
      label: '$count',
      excludeSemantics: true,
      child: Container(
        constraints: const BoxConstraints(minWidth: 17, minHeight: 17),
        padding: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          color: t.danger,
          borderRadius: BorderRadius.circular(99),
          border: Border.all(color: ringColor ?? t.raised, width: 2),
        ),
        child: Center(
          widthFactor: 1,
          child: Text(
            count > 99 ? '99+' : '$count',
            style: context.type.badge.copyWith(
              color: CydTokens.badgeFg,
              height: 1,
            ),
          ),
        ),
      ),
    );
  }
}

/// Sub-screen bar: back button, serif 25 title, optional trailing widget.
/// A hairline fades in under it once the content has scrolled.
class CydSubBar extends StatelessWidget {
  const CydSubBar({
    super.key,
    required this.title,
    this.trailing,
    this.onBack,
    this.showDivider = false,
  });

  final String title;
  final Widget? trailing;
  final VoidCallback? onBack;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      padding: const EdgeInsets.fromLTRB(18, 8, 18, 10),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: showDivider ? t.line : Colors.transparent),
        ),
      ),
      child: Row(
        children: [
          CydBackButton(onPressed: onBack),
          const SizedBox(width: 10),
          Expanded(
            child: Semantics(
              header: true,
              child: Text(
                title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: context.type.subTitle,
              ),
            ),
          ),
          ?trailing,
        ],
      ),
    );
  }
}

/// Tab-root page title: serif 32 (optionally with a gold italic word) and an
/// optional right-side action.
class CydPageHeader extends StatelessWidget {
  const CydPageHeader({
    super.key,
    required this.title,
    this.accentWord,
    this.trailing,
    this.padding = const EdgeInsets.fromLTRB(20, 12, 20, 16),
  });

  final String title;

  /// Italic gold word after [title] ("Shop the" + "diocese.").
  final String? accentWord;
  final Widget? trailing;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final type = context.type;
    return Padding(
      padding: padding,
      child: Row(
        children: [
          Expanded(
            child: Semantics(
              header: true,
              child: Text.rich(
                TextSpan(
                  style: type.title,
                  children: [
                    TextSpan(text: title),
                    if (accentWord != null) ...[
                      const TextSpan(text: ' '),
                      TextSpan(
                        text: accentWord,
                        style: type.accentWord(type.title),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
          ?trailing,
        ],
      ),
    );
  }
}
