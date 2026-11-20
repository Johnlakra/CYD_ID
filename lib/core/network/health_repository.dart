import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'api_envelope.dart';
import 'dio_provider.dart';
import 'error_mapper.dart';

/// Result of `GET /health` (public, no auth).
class HealthStatus {
  const HealthStatus({required this.message, this.timestamp, this.version});

  final String message;
  final String? timestamp;
  final String? version;
}

class HealthRepository {
  HealthRepository(this._dio);
  final Dio _dio;

  /// `GET /health` -> `{success, message, timestamp, version}` (the health
  /// payload is top level, not under `data`).
  Future<HealthStatus> check() => guardApi(() async {
    final res = await _dio.get<dynamic>('/health');
    final body = res.data;
    if (body is Map && body['success'] == true) {
      return HealthStatus(
        message: body['message'] as String? ?? 'OK',
        timestamp: body['timestamp'] as String?,
        version: body['version'] as String?,
      );
    }
    throw mapResponse(res);
  });
}

final healthRepositoryProvider = Provider<HealthRepository>(
  (ref) => HealthRepository(ref.watch(dioProvider)),
);

/// Re-run with `ref.invalidate(healthCheckProvider)`.
final healthCheckProvider = FutureProvider.autoDispose<HealthStatus>(
  (ref) => ref.watch(healthRepositoryProvider).check(),
);
