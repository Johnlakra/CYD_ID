import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/api_exception.dart';
import '../strings.dart';
import '../theme/cyd_layout.dart';
import '../theme/cyd_tokens.dart';
import 'skeleton.dart';
import 'state_cards.dart';

/// The four-state list wrapper (doc 01 §10): skeleton while loading, an
/// empty card, an error card with "Tap to retry", or the data. With cached
/// data and a failed refresh it keeps the data and shows the offline strip.
///
/// Renders inside a scrollable so pull-to-refresh works in every state.
class AsyncListView<T> extends StatelessWidget {
  const AsyncListView({
    super.key,
    required this.value,
    required this.itemBuilder,
    required this.empty,
    required this.onRetry,
    this.skeleton = const ListSkeleton(),
    this.onRefresh,
    this.header,
    this.footer,
    this.padding = const EdgeInsets.fromLTRB(
      CydLayout.screenPadding,
      0,
      CydLayout.screenPadding,
      CydLayout.tabBarContentPad,
    ),
    this.separator = 10,
    this.skeletonDelay = const Duration(milliseconds: 150),
    this.controller,
  });

  final AsyncValue<List<T>> value;
  final Widget Function(BuildContext context, T item, int index) itemBuilder;

  /// Shown when the list is empty (usually an [EmptyState]).
  final Widget empty;
  final VoidCallback onRetry;

  /// Shape of the loaded content.
  final Widget skeleton;
  final Future<void> Function()? onRefresh;
  final Widget? header;
  final Widget? footer;
  final EdgeInsetsGeometry padding;
  final double separator;
  final Duration skeletonDelay;
  final ScrollController? controller;

  @override
  Widget build(BuildContext context) {
    // Each entry is built lazily by the ListView; header and footer are
    // ordinary index items so long lists are virtualised.
    final int count;
    final Widget Function(BuildContext, int) build;
    var offlineStrip = false;
    final hasHeader = header != null;
    final hasFooter = footer != null;

    if (value.hasValue) {
      final items = value.requireValue;
      offlineStrip = value.hasError && _isOffline(value.error);
      if (items.isEmpty) {
        count = (hasHeader ? 1 : 0) + 1 + (hasFooter ? 1 : 0);
        build = (ctx, i) => _single(i, empty);
      } else {
        // items interleaved with separators: i, sep, i, sep, ..., i
        final body = items.length * 2 - 1;
        count = (hasHeader ? 1 : 0) + body + (hasFooter ? 1 : 0);
        build = (ctx, i) {
          if (hasHeader && i == 0) return header!;
          final j = i - (hasHeader ? 1 : 0);
          if (j >= body) return footer!;
          if (j.isOdd) return SizedBox(height: separator);
          return itemBuilder(ctx, items[j ~/ 2], j ~/ 2);
        };
      }
    } else if (value.hasError) {
      count = (hasHeader ? 1 : 0) + 1;
      build = (ctx, i) => _single(i, _errorCard(value.error));
    } else {
      count = (hasHeader ? 1 : 0) + 1;
      build = (ctx, i) =>
          _single(i, DelayedSkeleton(delay: skeletonDelay, child: skeleton));
    }

    final list = ListView.builder(
      controller: controller,
      physics: const AlwaysScrollableScrollPhysics(),
      padding: padding,
      itemCount: count,
      itemBuilder: build,
    );
    final body = onRefresh == null
        ? list
        : RefreshIndicator(
            color: CydTokens.accent,
            backgroundColor: context.tokens.raised,
            onRefresh: onRefresh!,
            child: list,
          );
    // Keyed so the list (and its scroll position) survives the strip
    // appearing and disappearing.
    return Column(
      children: [
        if (offlineStrip) const OfflineStrip(key: ValueKey('offline-strip')),
        Expanded(
          child: KeyedSubtree(key: const ValueKey('body'), child: body),
        ),
      ],
    );
  }

  /// Index mapping for the non-data states: [header?] then one body widget
  /// then [footer?].
  Widget _single(int i, Widget body) {
    final hasHeader = header != null;
    if (hasHeader && i == 0) return header!;
    final j = i - (hasHeader ? 1 : 0);
    return j == 0 ? body : footer!;
  }

  Widget _errorCard(Object? error) {
    if (_isOffline(error)) return ErrorState.offline(onRetry: onRetry);
    if (error is ApiException) {
      return ErrorState(
        title: "Couldn't load",
        body: error.message,
        onRetry: onRetry,
      );
    }
    return ErrorState(
      title: "Couldn't load",
      body: Strings.unknownError,
      onRetry: onRetry,
    );
  }

  static bool _isOffline(Object? e) =>
      e is ApiException &&
      (e.kind == ApiErrorKind.offline || e.kind == ApiErrorKind.timeout);
}
