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
    final List<Widget> children;
    var offlineStrip = false;

    if (value.hasValue) {
      final items = value.requireValue;
      offlineStrip = value.hasError && _isOffline(value.error);
      if (items.isEmpty) {
        children = [?header, empty, ?footer];
      } else {
        children = [
          ?header,
          for (var i = 0; i < items.length; i++) ...[
            if (i > 0) SizedBox(height: separator),
            itemBuilder(context, items[i], i),
          ],
          ?footer,
        ];
      }
    } else if (value.hasError) {
      children = [?header, _errorCard(value.error)];
    } else {
      children = [
        ?header,
        DelayedSkeleton(delay: skeletonDelay, child: skeleton),
      ];
    }

    final list = ListView(
      controller: controller,
      physics: const AlwaysScrollableScrollPhysics(),
      padding: padding,
      children: children,
    );
    final body = onRefresh == null
        ? list
        : RefreshIndicator(
            color: CydTokens.accent,
            backgroundColor: context.tokens.raised,
            onRefresh: onRefresh!,
            child: list,
          );
    if (!offlineStrip) return body;
    return Column(
      children: [
        const OfflineStrip(),
        Expanded(child: body),
      ],
    );
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
