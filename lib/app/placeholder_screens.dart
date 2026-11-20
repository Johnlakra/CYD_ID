import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/strings.dart';
import 'router.dart';

/// Temporary M0 screens, replaced by the auth feature in M2.
class SplashPlaceholder extends StatelessWidget {
  const SplashPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(Strings.splashTitle, style: text.displayMedium),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () => context.go(Routes.login),
              child: const Text(Strings.loginTitle),
            ),
            if (!kReleaseMode) ...[
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () => context.push(Routes.debugHealth),
                child: const Text(Strings.debugHealthLink),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class LoginPlaceholder extends StatelessWidget {
  const LoginPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text(Strings.loginTitle)),
      body: const Center(child: Text(Strings.loginTitle)),
    );
  }
}
