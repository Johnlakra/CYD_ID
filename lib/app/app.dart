import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/config/env.dart';
import '../core/strings.dart';
import 'router.dart';

/// Temporary theme: the real `CydTokens` ThemeExtension replaces it in M1.
ThemeData _theme(Brightness b) => ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(
    seedColor: const Color(0xFFFFA51F), // saffron accent
    brightness: b,
  ),
);

class CydApp extends ConsumerWidget {
  const CydApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: Strings.appName,
      debugShowCheckedModeBanner: false,
      theme: _theme(Brightness.light),
      darkTheme: _theme(Brightness.dark),
      routerConfig: ref.watch(routerProvider),
      builder: (context, child) => Env.isDev
          ? Banner(
              message: 'DEV',
              location: BannerLocation.topEnd,
              child: child ?? const SizedBox.shrink(),
            )
          : child ?? const SizedBox.shrink(),
    );
  }
}
