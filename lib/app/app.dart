import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/config/env.dart';
import '../core/strings.dart';
import '../core/theme/cyd_layout.dart';
import '../core/theme/theme_mode_controller.dart';
import 'router.dart';
import 'theme.dart';

class CydApp extends ConsumerWidget {
  const CydApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: Strings.appName,
      debugShowCheckedModeBanner: false,
      theme: cydTheme(Brightness.light),
      darkTheme: cydTheme(Brightness.dark),
      themeMode: ref.watch(themeModeProvider),
      routerConfig: ref.watch(routerProvider),
      builder: (context, child) {
        // Honour the user's text size up to 1.3x without overflow (doc 02 §8).
        final body = MediaQuery.withClampedTextScaling(
          maxScaleFactor: CydLayout.maxTextScale,
          child: child ?? const SizedBox.shrink(),
        );
        return Env.isDev
            ? Banner(
                message: 'DEV',
                location: BannerLocation.topEnd,
                child: body,
              )
            : body;
      },
    );
  }
}
