import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/env.dart';
import 'error_mapper.dart';

/// Builds the app's Dio. Exposed for tests; use [dioProvider] in the app.
/// The AuthInterceptor (Bearer, 401 handling) is added in M2.
Dio buildDio({String? baseUrl, bool logging = false}) {
  final dio = Dio(
    BaseOptions(
      baseUrl: baseUrl ?? Env.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 60),
      contentType: Headers.jsonContentType,
      headers: {'Accept': 'application/json'},
    ),
  );
  dio.interceptors.add(ErrorMapperInterceptor());
  if (logging) dio.interceptors.add(MinimalLogInterceptor());
  return dio;
}

/// The one Dio instance (doc 01 §3: allowed global, supplied by a provider).
final dioProvider = Provider<Dio>((ref) {
  return buildDio(logging: kDebugMode && Env.isDev);
});

/// Debug-only log of method, path and status. Deliberately logs no headers,
/// query strings or bodies, so tokens, passwords, UTRs and base64 never reach
/// the console (doc 01 §4, §11).
class MinimalLogInterceptor extends Interceptor {
  @override
  void onResponse(
    Response<dynamic> response,
    ResponseInterceptorHandler handler,
  ) {
    final o = response.requestOptions;
    debugPrint('[http] ${o.method} ${o.uri.path} -> ${response.statusCode}');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final o = err.requestOptions;
    debugPrint(
      '[http] ${o.method} ${o.uri.path} -> '
      '${err.response?.statusCode ?? err.type.name}',
    );
    handler.next(err);
  }
}
