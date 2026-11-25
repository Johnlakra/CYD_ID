import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/format/money.dart';
import '../../core/widgets/widgets.dart';
import '../shell.dart';

/// One block of the design gallery. The same builders feed the gallery
/// screen and the golden tests.
class GallerySection {
  const GallerySection(this.id, this.title, this.builder);

  /// File-name safe id (used for golden names).
  final String id;
  final String title;
  final WidgetBuilder builder;
}

Widget _dialogBox(Widget dialog) => SizedBox(height: 230, child: dialog);

Widget _gap([double h = 12]) => SizedBox(height: h);

Widget _wrap(List<Widget> children, {double spacing = 8}) =>
    Wrap(spacing: spacing, runSpacing: spacing, children: children);

/// Every design-system widget, grouped. Sample data only (no real people).
final List<GallerySection> gallerySections = [
  GallerySection('type', 'Type ladder', (c) {
    final type = c.type;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text.rich(
          TextSpan(
            style: type.hero,
            children: [
              const TextSpan(text: 'Shop the\n'),
              TextSpan(text: 'diocese.', style: type.accentWord(type.hero)),
            ],
          ),
        ),
        _gap(),
        Text('Title 32', style: type.title),
        Text('Sub-title 25', style: type.subTitle),
        Text(formatPaise(125050), style: type.heading),
        _gap(),
        Text('Card title 15 bold', style: type.cardTitle),
        Text(
          'Body 13, muted. The platform never holds money: buyers pay sellers '
          'directly.',
          style: type.body,
        ),
        Text('Body strong 13', style: type.bodyStrong),
        _gap(),
        Text('SECTION LABEL · DM MONO 9', style: type.sectionLabel),
        Text('ORDER #CYD-0042 · META 10', style: type.meta),
      ],
    );
  }),
  GallerySection('buttons', 'Buttons', (c) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        CydButton(label: 'Place order', onPressed: () {}),
        _gap(),
        CydButton(
          label: 'Place order',
          loadingLabel: 'Placing order…',
          loading: true,
          onPressed: () {},
        ),
        _gap(),
        const CydButton(label: 'Place order', onPressed: null),
        _gap(),
        CydButton.secondary(label: 'Cancel', onPressed: () {}),
        _gap(),
        CydButton.destructive(label: 'Reject order', onPressed: () {}),
        _gap(),
        CydButton(
          label: 'Delete profile',
          variant: CydButtonVariant.destructiveFilled,
          size: CydButtonSize.regular,
          onPressed: () {},
        ),
        _gap(),
        Wrap(
          spacing: 12,
          runSpacing: 8,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            CydButton(
              label: 'Pay now',
              size: CydButtonSize.compact,
              expand: false,
              onPressed: () {},
            ),
            CydButton(
              label: 'Tap to retry',
              size: CydButtonSize.retry,
              expand: false,
              onPressed: () {},
            ),
            CydButton.text(label: 'Copy', onPressed: () {}),
          ],
        ),
      ],
    );
  }),
  GallerySection('chips', 'Chips and pills', (c) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _wrap([
          CydFilterChip(label: 'Any', selected: true, onTap: () {}),
          CydFilterChip(label: 'Books', selected: false, onTap: () {}),
          CydFilterChip(label: 'Apparel', selected: false, onTap: () {}),
        ]),
        _gap(),
        _wrap([
          CydFilterChip(
            label: 'All',
            count: 12,
            selected: true,
            style: CydChipStyle.gold,
            onTap: () {},
          ),
          CydFilterChip(
            label: 'Needs action',
            count: 2,
            selected: false,
            attention: true,
            onTap: () {},
          ),
          CydFilterChip(
            label: 'Shipped',
            count: 3,
            selected: false,
            style: CydChipStyle.gold,
            onTap: () {},
          ),
        ]),
        _gap(),
        _wrap([
          CydRemovableChip(label: 'Jalandhar', onRemove: () {}),
          const CydInfoChip('St. Mary Church', icon: Icons.church_outlined),
          const CydDefaultPill(),
        ]),
      ],
    );
  }),
  GallerySection('status_order', 'Status chips · order', (c) {
    const keys = [
      'pending_payment',
      'placed',
      'accepted',
      'packed',
      'shipped',
      'delivered',
      'cancelled',
      'rejected',
    ];
    return _wrap([for (final k in keys) StatusChip.order(k)]);
  }),
  GallerySection('status_payment', 'Status chips · payment', (c) {
    const keys = [
      'awaiting_payment',
      'claimed',
      'confirmed',
      'disputed',
      'refund_due',
      'refunded',
      'void',
      'written_off',
      'cod_pending',
      'cod_collected',
    ];
    return _wrap([for (final k in keys) StatusChip.payment(k)]);
  }),
  GallerySection('status_other', 'Status chips · validity, shop, product', (c) {
    return _wrap([
      const StatusChip.validity('valid'),
      const StatusChip.validity('expiring', days: 12),
      const StatusChip.validity('expired'),
      const StatusChip.shop('pending'),
      const StatusChip.shop('approved'),
      const StatusChip.shop('suspended'),
      const StatusChip.product('active'),
      const StatusChip.product('draft'),
      const StatusChip.product('archived'),
      const StatusChip.product('out'),
      const StatusChip.product('stock_low', count: 3),
      const StatusChip.product('stock_ok'),
      const StatusChip.order('placed', size: StatusChipSize.detail),
      const StatusChip.order('delivered', size: StatusChipSize.compact),
    ]);
  }),
  GallerySection('cards', 'Cards and banners', (c) {
    final type = c.type;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        CydCard(
          child: Row(
            children: [
              const CydAvatar(initials: 'AJ', size: 44),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Anil Joseph', style: type.cardTitle),
                    Text('Youth · Parish', style: type.bodySmall),
                  ],
                ),
              ),
              const StatusChip.validity('valid'),
            ],
          ),
        ),
        _gap(),
        CydCard(
          onTap: () {},
          semanticLabel: 'Tappable card',
          child: Text('Tappable card (press to fade)', style: type.bodyStrong),
        ),
        _gap(),
        CydInfoCard(
          child: Text(
            'You placed 2 orders. Each shop is paid separately, so pay each '
            'one before its timer runs out.',
            style: type.bodySmall.copyWith(color: c.tokens.accText),
          ),
        ),
        _gap(),
        CydEndedCard(
          child: Text('This order was cancelled.', style: type.bodyStrong),
        ),
        _gap(),
        const CydBanner(
          title: 'Waiting for the seller',
          body: 'The seller checks their bank app and confirms.',
        ),
        _gap(8),
        const CydBanner(
          title: 'Payment disputed',
          body: 'An admin will review the evidence.',
          tone: CydTone.danger,
        ),
        _gap(8),
        const CydBanner(
          title: 'Payment confirmed',
          body: 'The seller will pack your order.',
          tone: CydTone.ok,
        ),
        _gap(8),
        const CydBanner(
          title: 'Cash on delivery',
          body: 'Pay the seller in cash when the order arrives.',
          tone: CydTone.cod,
        ),
        _gap(8),
        const CydBanner.alert('Session expired. Please login again.'),
      ],
    );
  }),
  GallerySection('inputs', 'Inputs', (c) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const CydTextField(label: 'Username', hint: 'anil1304'),
        _gap(),
        CydTextField(
          label: 'Full name',
          controller: TextEditingController(text: 'Anil Joseph'),
        ),
        _gap(),
        const CydTextField(
          label: 'Mobile',
          hint: '98765 43210',
          errorText: 'Enter a 10-digit mobile number',
        ),
        _gap(),
        CydTextField(
          label: 'Password',
          obscure: true,
          controller: TextEditingController(text: 'secret-pass'),
        ),
        _gap(),
        const CydTextField(label: 'Locked', enabled: false, hint: 'Read only'),
        _gap(),
        const CydTextField(
          label: 'Description',
          hint: 'Tell buyers about it',
          maxLines: 4,
        ),
        _gap(),
        CydSearchField(
          controller: TextEditingController(text: 'rosary'),
          hint: 'Search products and shops',
        ),
        _gap(),
        CydUtrField(controller: TextEditingController(text: '429188301127')),
      ],
    );
  }),
  GallerySection('controls', 'Radio, switch, stepper, price', (c) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        CydRadioRow<int>(
          value: 1,
          groupValue: 1,
          label: 'Newest first',
          onChanged: (_) {},
        ),
        CydRadioRow<int>(
          value: 2,
          groupValue: 1,
          label: 'Price: low to high',
          onChanged: (_) {},
        ),
        _gap(),
        CydSwitchRow(label: 'Profile active', value: true, onChanged: (_) {}),
        _gap(8),
        CydSwitchRow(
          label: 'Cash on delivery',
          value: false,
          onChanged: (_) {},
        ),
        _gap(),
        Row(
          children: [
            QuantityStepper(value: 2, onChanged: (_) {}),
            const SizedBox(width: 16),
            QuantityStepper(value: 1, compact: true, onChanged: (_) {}),
            const SizedBox(width: 16),
            QuantityStepper(value: 5, max: 5, compact: true, onChanged: (_) {}),
          ],
        ),
        _gap(),
        const PriceText(24900),
        const PriceText(124500, comparePaise: 149900, showDiscount: true),
        PriceText(125050, style: c.type.heading),
      ],
    );
  }),
  GallerySection('feedback', 'Empty, error, offline, toast', (c) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        EmptyState(
          title: 'No orders yet',
          body: "New orders appear here as soon as they're placed.",
          glyph: '?',
          actionLabel: 'Browse shop',
          onAction: () {},
        ),
        _gap(),
        ErrorState(title: "Couldn't load products", onRetry: () {}),
        _gap(),
        ErrorState.offline(onRetry: () {}),
        _gap(),
        const OfflineStrip(),
        _gap(),
        const CydToastBody("You don't have access to that screen."),
        _gap(8),
        const CydToastBody('Removed from cart', actionLabel: 'Undo'),
      ],
    );
  }),
  GallerySection('skeletons', 'Skeletons', (c) {
    return const Column(
      children: [
        ProductGridSkeleton(),
        SizedBox(height: 16),
        ListSkeleton(count: 2),
      ],
    );
  }),
  GallerySection('async_states', 'AsyncListView · four states', (c) {
    Widget box(String label, AsyncValue<List<String>> v) => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionLabel(label),
        SizedBox(
          height: 250,
          child: AsyncListView<String>(
            value: v,
            padding: EdgeInsets.zero,
            skeletonDelay: Duration.zero,
            skeleton: const ListSkeleton(count: 2, itemHeight: 70),
            empty: const EmptyState(
              title: 'Nothing here yet',
              body: 'Items appear here.',
              glyph: '?',
            ),
            onRetry: () {},
            itemBuilder: (ctx, item, i) => CydCard(
              padding: const EdgeInsets.all(14),
              child: Text(item, style: ctx.type.cardTitle),
            ),
          ),
        ),
      ],
    );
    return Column(
      children: [
        box('Loading', const AsyncLoading()),
        box('Empty', const AsyncData(<String>[])),
        box('Error', AsyncError(Exception('x'), StackTrace.empty)),
        box('Data', const AsyncData(['Rosary beads', 'Parish calendar'])),
      ],
    );
  }),
  GallerySection('identity', 'Avatar, photo, label, copy, countdown', (c) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionLabel('Avatars', trailing: '3 shown'),
        Row(
          children: [
            const CydAvatar(initials: 'AJ'),
            const SizedBox(width: 12),
            const CydAvatar(initials: 'MS', size: 56, gold: true),
            const SizedBox(width: 12),
            const CydAvatar(initials: 'D', size: 52, hue: 28),
          ],
        ),
        _gap(20),
        const SectionLabel('Photo placeholders'),
        const PhotoPlaceholder(
          label: 'Product photos · swipe',
          aspectRatio: 4 / 3,
        ),
        _gap(8),
        const PhotoPlaceholder(label: 'Banner photo · 16:9', height: 120),
        _gap(20),
        const SectionLabel('Copy rows', trailing: 'Edit'),
        const CopyRow(label: 'UPI ID', value: 'stmarys.shop@okbank', big: true),
        _gap(8),
        const CopyRow(label: 'Amount', value: '₹1,250.50'),
        _gap(8),
        const CopyRow(label: 'Reference', value: '429188301127', mono: true),
        _gap(20),
        const SectionLabel('Countdown'),
        _wrap(const [
          CountdownPill(secondsLeft: 1725),
          CountdownPill(secondsLeft: 3725),
          CountdownPill(secondsLeft: 200),
          CountdownPill(secondsLeft: 0),
        ]),
      ],
    );
  }),
  GallerySection('bars', 'App bars and badges', (c) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const CydPageHeader(
          title: 'Shop the',
          accentWord: 'diocese.',
          padding: EdgeInsets.zero,
          trailing: CydCircleButton(
            semanticLabel: 'Cart',
            onPressed: null,
            glyph: '₹',
            badge: 3,
          ),
        ),
        _gap(),
        const CydSubBar(title: 'Checkout', showDivider: true),
        _gap(),
        const Row(
          children: [
            CydBackButton(),
            SizedBox(width: 12),
            CydBackButton(hero: true),
            SizedBox(width: 12),
            CydCountBadge(7),
            SizedBox(width: 12),
            CydCountBadge(120),
          ],
        ),
      ],
    );
  }),
  GallerySection('sheet', 'Bottom sheet', (c) {
    return ClipRect(
      child: CydSheet(
        title: 'Filters',
        footer: CydButton(
          label: 'Apply filters',
          size: CydButtonSize.regular,
          onPressed: () {},
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SectionLabel('Sort'),
            CydRadioRow<int>(
              value: 1,
              groupValue: 1,
              label: 'Newest first',
              onChanged: (_) {},
            ),
            CydRadioRow<int>(
              value: 2,
              groupValue: 1,
              label: 'Name A to Z',
              onChanged: (_) {},
            ),
          ],
        ),
      ),
    );
  }),
  GallerySection('dialog', 'Dialog', (c) {
    return Column(
      children: [
        _dialogBox(
          CydDialog(
            title: 'Sign out?',
            body: 'You will need to log in again to use the app.',
            confirmLabel: 'Sign out',
            cancelLabel: 'Not now',
            onConfirm: () {},
          ),
        ),
        _gap(),
        _dialogBox(
          CydDialog(
            title: 'Delete profile?',
            body: 'This removes the profile and its card.',
            confirmLabel: 'Delete',
            cancelLabel: 'Keep it',
            destructive: true,
            onConfirm: () {},
          ),
        ),
      ],
    );
  }),
  GallerySection('tab_bar', 'Floating tab bar', (c) {
    return Column(
      children: [
        CydTabBar(
          selectedIndex: 0,
          onSelected: (_) {},
          badges: const {ShellTab.cart: 3, ShellTab.shop: 12},
        ),
        _gap(16),
        CydTabBar(
          selectedIndex: 2,
          firstTab: FirstTab.profiles,
          onSelected: (_) {},
          badges: const {ShellTab.cart: 120},
        ),
      ],
    );
  }),
];
