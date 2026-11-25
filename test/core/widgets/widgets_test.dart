import 'dart:async';

import 'package:cyd_app/core/network/api_exception.dart';
import 'package:cyd_app/core/widgets/widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../support/pump.dart';

void main() {
  tearDown(CydToast.dismiss);

  group('CydButton', () {
    testWidgets('calls onPressed once per tap', (tester) async {
      var n = 0;
      await pumpThemed(tester, CydButton(label: 'Go', onPressed: () => n++));
      await tester.tap(find.text('Go'));
      expect(n, 1);
    });

    testWidgets('is disabled and announced as such when onPressed is null', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      await pumpThemed(tester, const CydButton(label: 'Go', onPressed: null));
      expect(
        tester.getSemantics(find.byType(CydButton)),
        matchesSemantics(label: 'Go', isButton: true, hasEnabledState: true),
      );
      handle.dispose();
    });

    testWidgets('async onPressed cannot be double submitted', (tester) async {
      final done = Completer<void>();
      var n = 0;
      await pumpThemed(
        tester,
        CydButton(
          label: 'Place order',
          loadingLabel: 'Placing order…',
          onPressed: () {
            n++;
            return done.future;
          },
        ),
      );
      await tester.tap(find.text('Place order'));
      await tester.pump();
      expect(find.text('Placing order…'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      await tester.tap(find.text('Placing order…'));
      await tester.pump();
      expect(n, 1);
      done.complete();
      await tester.pump();
      await tester.pump();
      expect(find.text('Place order'), findsOneWidget);
    });

    testWidgets('loading ignores taps', (tester) async {
      var n = 0;
      await pumpThemed(
        tester,
        CydButton(label: 'Go', loading: true, onPressed: () => n++),
      );
      await tester.tap(find.byType(CydButton));
      expect(n, 0);
    });

    testWidgets('touch target is at least 44 dp for every size', (
      tester,
    ) async {
      for (final size in CydButtonSize.values) {
        await pumpThemed(
          tester,
          Center(
            child: CydButton(
              label: 'x',
              size: size,
              expand: false,
              onPressed: () {},
            ),
          ),
        );
        expect(
          tester.getSize(find.byType(CydButton)).height,
          greaterThanOrEqualTo(44),
        );
      }
      await pumpThemed(
        tester,
        Center(
          child: CydButton.text(label: 'Copy', onPressed: () {}),
        ),
      );
      expect(
        tester.getSize(find.byType(CydButton)).height,
        greaterThanOrEqualTo(44),
      );
    });
  });

  group('StatusChip', () {
    testWidgets('every status renders its label with a glyph', (tester) async {
      for (final brightness in Brightness.values) {
        for (final key in cydStatusStyles.keys) {
          await pumpThemed(
            tester,
            Center(child: StatusChip(key, days: 5, count: 3)),
            brightness: brightness,
          );
          expect(
            find.text(StatusChip.labelFor(key, days: 5, count: 3)),
            findsOneWidget,
            reason: key,
          );
          expect(find.byType(StatusGlyphIcon), findsOneWidget, reason: key);
        }
      }
    });

    test('labels', () {
      expect(StatusChip.labelFor('expiring', days: 12), 'Expires in 12 days');
      expect(StatusChip.labelFor('stock_low', count: 3), 'Only 3 left');
      expect(StatusChip.labelFor('claimed'), 'Paid — awaiting seller');
      expect(StatusChip.labelFor('mystery'), 'mystery');
    });

    testWidgets('exposes the label to accessibility', (tester) async {
      await pumpThemed(tester, const Center(child: StatusChip('disputed')));
      expect(find.bySemanticsLabel('In dispute'), findsOneWidget);
    });
  });

  group('PriceText', () {
    testWidgets('formats paise, strike and discount', (tester) async {
      await pumpThemed(
        tester,
        const PriceText(124500, comparePaise: 149900, showDiscount: true),
      );
      expect(find.text('₹1,245.00'), findsOneWidget);
      expect(find.text('₹1,499.00'), findsOneWidget);
      expect(find.text('17% off'), findsOneWidget);
    });

    testWidgets('no strike when mrp is not higher', (tester) async {
      await pumpThemed(tester, const PriceText(24900, comparePaise: 24900));
      expect(find.text('₹249.00'), findsOneWidget);
      expect(find.textContaining('₹249.00'), findsOneWidget);
      expect(find.byType(Text), findsOneWidget);
    });

    test('discountPercent rounds', () {
      expect(PriceText.discountPercent(124500, 149900), 17);
      expect(PriceText.discountPercent(50, 100), 50);
    });
  });

  group('QuantityStepper', () {
    testWidgets('respects min and max', (tester) async {
      var v = 1;
      await pumpThemed(
        tester,
        StatefulBuilder(
          builder: (context, set) => QuantityStepper(
            value: v,
            max: 2,
            onChanged: (n) => set(() => v = n),
          ),
        ),
      );
      await tester.tap(find.bySemanticsLabel('Decrease quantity'));
      await tester.pump();
      expect(v, 1);
      await tester.tap(find.bySemanticsLabel('Increase quantity'));
      await tester.pump();
      expect(v, 2);
      await tester.tap(find.bySemanticsLabel('Increase quantity'));
      await tester.pump();
      expect(v, 2);
      expect(find.text('2'), findsOneWidget);
    });
  });

  group('CountdownPill', () {
    test('format', () {
      expect(CountdownPill.format(75), '01:15');
      expect(CountdownPill.format(3725), '1:02:05');
      expect(CountdownPill.format(-4), '00:00');
    });

    testWidgets('ticks every second and fires onExpired once', (tester) async {
      var expired = 0;
      await pumpThemed(
        tester,
        Center(
          child: CountdownPill(secondsLeft: 3, onExpired: () => expired++),
        ),
      );
      expect(find.text('00:03'), findsOneWidget);
      await tester.pump(const Duration(seconds: 1));
      expect(find.text('00:02'), findsOneWidget);
      await tester.pump(const Duration(seconds: 2));
      expect(find.text("Time's up"), findsOneWidget);
      await tester.pump();
      expect(expired, 1);
      await tester.pump(const Duration(seconds: 5));
      expect(expired, 1);
    });

    testWidgets('re-syncs when the server value changes', (tester) async {
      Widget w(int s) => Center(child: CountdownPill(secondsLeft: s));
      await pumpThemed(tester, w(100));
      await tester.pump(const Duration(seconds: 10));
      expect(find.text('01:30'), findsOneWidget);
      await pumpThemed(tester, w(600));
      await tester.pump();
      expect(find.text('10:00'), findsOneWidget);
    });

    testWidgets('turns danger under five minutes', (tester) async {
      Color? fill(WidgetTester t) {
        final box = t.widget<Container>(
          find.descendant(
            of: find.byType(CountdownPill),
            matching: find.byType(Container),
          ),
        );
        return (box.decoration! as BoxDecoration).color;
      }

      await pumpThemed(
        tester,
        const Center(child: CountdownPill(secondsLeft: 1800)),
      );
      expect(fill(tester), CydTokens.light.accSoft);
      await pumpThemed(
        tester,
        const Center(child: CountdownPill(secondsLeft: 299)),
      );
      expect(fill(tester), CydTokens.light.danger.withValues(alpha: .14));
    });
  });

  group('CopyRow + CydToast', () {
    testWidgets('copies, toasts "{label} copied" and auto-dismisses', (
      tester,
    ) async {
      String? copied;
      tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
        SystemChannels.platform,
        (call) async {
          if (call.method == 'Clipboard.setData') {
            copied =
                (call.arguments as Map<Object?, Object?>)['text'] as String?;
          }
          return null;
        },
      );
      addTearDown(
        () => tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
          SystemChannels.platform,
          null,
        ),
      );
      await pumpThemed(
        tester,
        const CopyRow(label: 'UPI ID', value: 'shop@okbank'),
      );
      await tester.tap(find.text('shop@okbank'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 350));
      expect(copied, 'shop@okbank');
      expect(find.text('Upi id copied'), findsOneWidget);
      await tester.pump(const Duration(milliseconds: 2800));
      await tester.pump();
      expect(find.text('Upi id copied'), findsNothing);
    });

    testWidgets('copy row has a semantics label and 44 dp action', (
      tester,
    ) async {
      await pumpThemed(tester, const CopyRow(label: 'Amount', value: '₹10.00'));
      expect(find.bySemanticsLabel('Copy Amount'), findsOneWidget);
    });

    testWidgets('a new toast replaces the old; action extends to 5 s', (
      tester,
    ) async {
      var undone = 0;
      late BuildContext ctx;
      await pumpThemed(
        tester,
        Builder(
          builder: (c) {
            ctx = c;
            return const SizedBox();
          },
        ),
      );
      CydToast.show(ctx, 'One');
      await tester.pump();
      CydToast.show(ctx, 'Two', actionLabel: 'Undo', onAction: () => undone++);
      await tester.pump(const Duration(milliseconds: 350));
      expect(find.text('One'), findsNothing);
      expect(find.text('Two'), findsOneWidget);
      await tester.pump(const Duration(seconds: 4));
      expect(find.text('Two'), findsOneWidget);
      await tester.tap(find.text('Undo'));
      await tester.pump();
      expect(undone, 1);
      expect(find.text('Two'), findsNothing);
    });

    testWidgets('sits above the tab bar when the shell says it is visible', (
      tester,
    ) async {
      late BuildContext ctx;
      await pumpThemed(
        tester,
        CydChrome(
          tabBarVisible: true,
          child: Builder(
            builder: (c) {
              ctx = c;
              return const SizedBox();
            },
          ),
        ),
      );
      CydToast.show(ctx, 'Above tabs');
      await tester.pump(const Duration(milliseconds: 350));
      final bottomGap = 844 - tester.getBottomLeft(find.text('Above tabs')).dy;
      expect(bottomGap, greaterThan(CydLayout.toastBottomWithTabs));
    });
  });

  group('AsyncListView four states', () {
    Widget view(AsyncValue<List<String>> v, {VoidCallback? retry}) =>
        AsyncListView<String>(
          value: v,
          skeletonDelay: Duration.zero,
          skeleton: const ListSkeleton(count: 1),
          empty: const EmptyState(title: 'Nothing here'),
          onRetry: retry ?? () {},
          itemBuilder: (c, item, i) => Text(item),
        );

    testWidgets('loading shows the skeleton', (tester) async {
      await pumpThemed(tester, view(const AsyncLoading()));
      await tester.pump();
      expect(find.byType(ListSkeleton), findsOneWidget);
    });

    testWidgets('skeleton waits 150 ms by default', (tester) async {
      await pumpThemed(
        tester,
        AsyncListView<String>(
          value: const AsyncLoading(),
          skeleton: const ListSkeleton(count: 1),
          empty: const SizedBox(),
          onRetry: () {},
          itemBuilder: (c, item, i) => Text(item),
        ),
      );
      expect(find.byType(ListSkeleton), findsNothing);
      await tester.pump(const Duration(milliseconds: 160));
      expect(find.byType(ListSkeleton), findsOneWidget);
    });

    testWidgets('empty shows the empty card', (tester) async {
      await pumpThemed(tester, view(const AsyncData(<String>[])));
      expect(find.text('Nothing here'), findsOneWidget);
    });

    testWidgets('data shows the items', (tester) async {
      await pumpThemed(tester, view(const AsyncData(['a', 'b'])));
      expect(find.text('a'), findsOneWidget);
      expect(find.text('b'), findsOneWidget);
    });

    testWidgets('error shows the card; retry calls back', (tester) async {
      var retried = 0;
      await pumpThemed(
        tester,
        view(
          const AsyncError(
            ApiException(kind: ApiErrorKind.server, message: 'Server exploded'),
            StackTrace.empty,
          ),
          retry: () => retried++,
        ),
      );
      expect(find.text('Server exploded'), findsOneWidget);
      await tester.tap(find.text('Tap to retry'));
      expect(retried, 1);
    });

    testWidgets('offline error uses the offline wording', (tester) async {
      await pumpThemed(
        tester,
        view(const AsyncError(ApiException.offline(), StackTrace.empty)),
      );
      expect(find.text("You're offline"), findsOneWidget);
      expect(find.text('Tap to retry'), findsOneWidget);
    });

    testWidgets('stale data + failed refresh keeps data with offline strip', (
      tester,
    ) async {
      var calls = 0;
      final provider = FutureProvider<List<String>>((ref) async {
        calls++;
        if (calls > 1) throw const ApiException.offline();
        return ['kept'];
      });
      late WidgetRef widgetRef;
      await pumpThemed(
        tester,
        ProviderScope(
          retry: (_, _) => null,
          child: Consumer(
            builder: (context, ref, _) {
              widgetRef = ref;
              return view(ref.watch(provider));
            },
          ),
        ),
      );
      await tester.pump();
      await tester.pump();
      expect(find.text('kept'), findsOneWidget);
      expect(find.byType(OfflineStrip), findsNothing);

      widgetRef.invalidate(provider);
      await tester.pump();
      await tester.pump();
      expect(find.text('kept'), findsOneWidget);
      expect(find.byType(OfflineStrip), findsOneWidget);
      expect(find.text("You're offline"), findsNothing);
    });
  });

  group('CydTextField', () {
    testWidgets('shows the label upper-cased and the error', (tester) async {
      await pumpThemed(
        tester,
        const CydTextField(label: 'Mobile', errorText: 'Enter 10 digits'),
      );
      expect(find.text('MOBILE'), findsOneWidget);
      expect(find.text('Enter 10 digits'), findsOneWidget);
    });

    testWidgets('password field toggles visibility', (tester) async {
      final c = TextEditingController(text: 'secret');
      await pumpThemed(tester, CydTextField(obscure: true, controller: c));
      EditableText editable() => tester.widget(find.byType(EditableText));
      expect(editable().obscureText, isTrue);
      await tester.tap(find.text('Show'));
      await tester.pump();
      expect(editable().obscureText, isFalse);
      expect(find.text('Hide'), findsOneWidget);
    });

    testWidgets('UTR field groups digits 4-4-4 and caps at 12', (tester) async {
      final c = TextEditingController();
      await pumpThemed(tester, CydUtrField(controller: c));
      await tester.enterText(find.byType(TextField), '4291-8830 1127 99');
      await tester.pump();
      expect(c.text, '4291 8830 1127');
      expect(find.byIcon(Icons.check), findsOneWidget);
    });
  });

  group('Dialog and sheet', () {
    Future<BuildContext> host(WidgetTester tester) async {
      late BuildContext ctx;
      await pumpThemed(
        tester,
        Builder(
          builder: (c) {
            ctx = c;
            return const SizedBox();
          },
        ),
      );
      return ctx;
    }

    testWidgets('confirm resolves true, cancel resolves false', (tester) async {
      final ctx = await host(tester);
      bool? result;
      unawaited(
        showCydDialog(
          ctx,
          title: 'Sign out?',
          body: 'Body',
          confirmLabel: 'Sign out',
          cancelLabel: 'Not now',
        ).then((v) => result = v),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.text('Not now'));
      await tester.pumpAndSettle();
      expect(result, isFalse);

      unawaited(
        showCydDialog(
          ctx,
          title: 'Sign out?',
          body: 'Body',
          confirmLabel: 'Sign out',
        ).then((v) => result = v),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.text('Sign out'));
      await tester.pumpAndSettle();
      expect(result, isTrue);
    });

    testWidgets('async confirm shows a spinner and cannot double submit', (
      tester,
    ) async {
      final ctx = await host(tester);
      final done = Completer<void>();
      var n = 0;
      unawaited(
        showCydDialog(
          ctx,
          title: 'Delete?',
          body: 'Body',
          confirmLabel: 'Delete',
          destructive: true,
          onConfirm: () {
            n++;
            return done.future;
          },
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.text('Delete'));
      await tester.pump();
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      await tester.tap(find.byType(CydButton).last, warnIfMissed: false);
      await tester.pump();
      expect(n, 1);
      done.complete();
      await tester.pumpAndSettle();
      expect(find.text('Delete?'), findsNothing);
    });

    testWidgets('sheet shows title, content and footer; scrim dismisses', (
      tester,
    ) async {
      final ctx = await host(tester);
      unawaited(
        showCydSheet<void>(
          ctx,
          title: 'Filters',
          builder: (c) => const Text('content'),
          footer: const Text('footer'),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Filters'), findsOneWidget);
      expect(find.text('content'), findsOneWidget);
      expect(find.text('footer'), findsOneWidget);
      await tester.tapAt(const Offset(195, 20));
      await tester.pumpAndSettle();
      expect(find.text('Filters'), findsNothing);
    });

    testWidgets('non-dismissible sheet ignores scrim taps', (tester) async {
      final ctx = await host(tester);
      unawaited(
        showCydSheet<void>(
          ctx,
          title: 'Busy',
          dismissible: false,
          builder: (c) => const Text('content'),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tapAt(const Offset(195, 20));
      await tester.pumpAndSettle();
      expect(find.text('Busy'), findsOneWidget);
    });
  });

  group('accessibility', () {
    testWidgets('icon-only controls carry semantic labels', (tester) async {
      await pumpThemed(
        tester,
        const Row(
          children: [
            CydBackButton(),
            CydCircleButton(
              semanticLabel: 'Cart',
              onPressed: null,
              glyph: '₹',
              badge: 2,
            ),
          ],
        ),
      );
      expect(find.bySemanticsLabel('Back'), findsOneWidget);
      expect(find.bySemanticsLabel('Cart'), findsOneWidget);
    });

    testWidgets('tappable widgets meet the 44 dp minimum', (tester) async {
      await pumpThemed(
        tester,
        Wrap(
          children: [
            const CydBackButton(),
            CydFilterChip(label: 'Any', selected: true, onTap: () {}),
            QuantityStepper(value: 2, compact: true, onChanged: (_) {}),
            CydRadioRow<int>(
              value: 1,
              groupValue: 1,
              label: 'x',
              onChanged: (_) {},
            ),
          ],
        ),
      );
      for (final f in [
        find.byType(CydBackButton),
        find.byType(CydFilterChip),
        find.byType(CydRadioRow<int>),
      ]) {
        expect(tester.getSize(f).height, greaterThanOrEqualTo(44));
      }
      expect(
        tester.getSize(find.byType(CydBackButton)).width,
        greaterThanOrEqualTo(44),
      );
    });
  });
}
