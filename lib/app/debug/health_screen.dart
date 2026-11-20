import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/config/env.dart';
import '../../core/network/api_exception.dart';
import '../../core/network/health_repository.dart';
import '../../core/strings.dart';

/// Debug-only `/debug/health`: calls `GET /health` to prove connectivity
/// (doc 01 §6). Not routed in release builds.
class HealthScreen extends ConsumerWidget {
  const HealthScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final health = ref.watch(healthCheckProvider);
    final text = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: const Text(Strings.debugHealthTitle)),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(Strings.debugBaseUrl, style: text.labelMedium),
            const SelectableText(Env.apiBaseUrl),
            const SizedBox(height: 16),
            health.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Text(
                e is ApiException
                    ? 'Failed (${e.kind.name}): ${e.message}'
                    : 'Failed: $e',
                key: const Key('health-error'),
              ),
              data: (h) => Text(
                'OK: ${h.message}\nversion ${h.version ?? '-'}\n${h.timestamp ?? ''}',
                key: const Key('health-ok'),
              ),
            ),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: () => ref.invalidate(healthCheckProvider),
              child: const Text(Strings.tapToRetry),
            ),
          ],
        ),
      ),
    );
  }
}
