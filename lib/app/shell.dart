import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/theme/cyd_tokens.dart';
import '../core/theme/cyd_type.dart';
import '../core/widgets/app_bars.dart';
import '../core/widgets/cyd_chrome.dart';
import '../core/widgets/cyd_icons.dart';

/// The five tab slots. The first slot is role-based (see [FirstTab]).
enum ShellTab { first, shop, cart, orders, account }

/// What the first tab is: **My Profile** for a profile holder (also sellers
/// who are holders) or **Profiles** for admin / CYD manager (`user` role).
enum FirstTab {
  myProfile('My Profile', CydTabIcons.myProfile),
  profiles('Profiles', CydTabIcons.profiles);

  const FirstTab(this.label, this.icon);
  final String label;
  final String icon;
}

/// Set by the auth/session layer from the signed-in role: holder ->
/// [FirstTab.myProfile], admin / user -> [FirstTab.profiles]. Defaults to My
/// Profile (the safest view for an unknown role).
class FirstTabController extends Notifier<FirstTab> {
  @override
  FirstTab build() => FirstTab.myProfile;

  void set(FirstTab tab) => state = tab;
}

final firstTabProvider = NotifierProvider<FirstTabController, FirstTab>(
  FirstTabController.new,
);

/// Badge counts for the tab bar. Feature agents write them:
/// `ref.read(tabBadgesProvider.notifier).setCart(totalQuantity)` and
/// `.setShop(actionCount)` (needs-action orders for sellers / admins).
/// A count of 0 hides the badge; 100+ shows "99+".
class TabBadges extends Notifier<Map<ShellTab, int>> {
  @override
  Map<ShellTab, int> build() => const {};

  void _set(ShellTab tab, int count) {
    final c = count < 0 ? 0 : count;
    if ((state[tab] ?? 0) == c) return;
    state = {...state, tab: c};
  }

  void setCart(int count) => _set(ShellTab.cart, count);
  void setShop(int count) => _set(ShellTab.shop, count);
}

final tabBadgesProvider = NotifierProvider<TabBadges, Map<ShellTab, int>>(
  TabBadges.new,
);

/// Floating frosted capsule of five icon-only circles. Presentational: it
/// knows nothing about routing (see [ShellScaffold]).
class CydTabBar extends StatelessWidget {
  const CydTabBar({
    super.key,
    required this.selectedIndex,
    required this.onSelected,
    this.firstTab = FirstTab.myProfile,
    this.badges = const {},
  });

  final int selectedIndex;
  final ValueChanged<int> onSelected;
  final FirstTab firstTab;
  final Map<ShellTab, int> badges;

  static const _size = 54.0;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final tabs = <(ShellTab, String, String)>[
      (ShellTab.first, firstTab.label, firstTab.icon),
      (ShellTab.shop, 'Shop', CydTabIcons.shop),
      (ShellTab.cart, 'Cart', CydTabIcons.cart),
      (ShellTab.orders, 'Orders', CydTabIcons.orders),
      (ShellTab.account, 'Account', CydTabIcons.account),
    ];
    return ClipRRect(
      borderRadius: BorderRadius.circular(99),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 22, sigmaY: 22),
        child: Container(
          key: const Key('cyd-tab-bar'),
          padding: const EdgeInsets.all(7),
          decoration: BoxDecoration(
            color: t.tabbg,
            borderRadius: BorderRadius.circular(99),
            border: Border.all(color: t.line2),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (var i = 0; i < tabs.length; i++) ...[
                if (i > 0) const SizedBox(width: 6),
                _TabItem(
                  key: Key('tab-${tabs[i].$1.name}'),
                  label: tabs[i].$2,
                  icon: tabs[i].$3,
                  selected: i == selectedIndex,
                  badge: badges[tabs[i].$1] ?? 0,
                  onTap: () => onSelected(i),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _TabItem extends StatelessWidget {
  const _TabItem({
    super.key,
    required this.label,
    required this.icon,
    required this.selected,
    required this.badge,
    required this.onTap,
  });

  final String label;
  final String icon;
  final bool selected;
  final int badge;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return Semantics(
      button: true,
      selected: selected,
      label: badge > 0 ? '$label, ${badge > 99 ? '99+' : badge}' : label,
      excludeSemantics: true,
      onTap: onTap,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: SizedBox(
          width: CydTabBar._size,
          height: CydTabBar._size,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                width: CydTabBar._size,
                height: CydTabBar._size,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: selected ? CydTokens.accent : Colors.transparent,
                  boxShadow: selected ? CydTokens.tabActiveGlow : const [],
                ),
                child: CydPathIcon(
                  icon,
                  color: selected ? t.tabActiveFg : t.mute,
                ),
              ),
              if (badge > 0)
                Positioned(top: 4, right: 4, child: CydCountBadge(badge)),
            ],
          ),
        ),
      ),
    );
  }
}

/// Shell around the five branches: the branch navigator plus the floating
/// tab bar. Screens that must hide the bar are pushed on the root navigator
/// (`parentNavigatorKey: rootNavigatorKey`, doc 01 §6), so they simply cover
/// the shell. The bar also hides while the keyboard is open.
class ShellScaffold extends ConsumerWidget {
  const ShellScaffold({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.tokens;
    final first = ref.watch(firstTabProvider);
    final badges = ref.watch(tabBadgesProvider);
    final mq = MediaQuery.of(context);
    final keyboardOpen = mq.viewInsets.bottom > 0;
    final bottom = mq.padding.bottom > 0 ? mq.padding.bottom + 12 : 22.0;

    return CydChrome(
      tabBarVisible: !keyboardOpen,
      child: Scaffold(
        backgroundColor: t.bg,
        resizeToAvoidBottomInset: false,
        body: Stack(
          children: [
            Positioned.fill(child: navigationShell),
            if (!keyboardOpen)
              Positioned(
                left: 0,
                right: 0,
                bottom: bottom,
                child: Center(
                  child: CydTabBar(
                    selectedIndex: navigationShell.currentIndex,
                    firstTab: first,
                    badges: badges,
                    onSelected: (i) => navigationShell.goBranch(
                      i,
                      initialLocation: i == navigationShell.currentIndex,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Stand-in for a tab root until its feature milestone builds the real one.
class TabRootPlaceholder extends StatelessWidget {
  const TabRootPlaceholder({super.key, required this.title, this.note});

  final String title;
  final String? note;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return DecoratedBox(
      decoration: BoxDecoration(gradient: t.bgGrad),
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CydPageHeader(title: title),
            if (note != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Text(note!, style: context.type.body),
              ),
          ],
        ),
      ),
    );
  }
}
