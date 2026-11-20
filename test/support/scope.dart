import 'package:cyd_app/core/config/riverpod_config.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;

/// ProviderScope with the app's no-automatic-retry policy (matches main.dart).
/// Use in every widget test instead of a bare ProviderScope.
ProviderScope testScope({
  required Widget child,
  List<Override> overrides = const [],
}) =>
    ProviderScope(retry: noAutomaticRetry, overrides: overrides, child: child);

/// ProviderContainer with the same policy. Caller disposes it.
ProviderContainer testContainer({List<Override> overrides = const []}) =>
    ProviderContainer(retry: noAutomaticRetry, overrides: overrides);
