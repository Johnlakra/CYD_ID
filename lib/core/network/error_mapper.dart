import 'package:dio/dio.dart';

import '../strings.dart';
import 'api_exception.dart';

/// Builds an [ApiException] from an HTTP response (success flag false or a
/// non-2xx status). Non-JSON bodies (Express HTML 404) are handled.
ApiException mapResponse(Response<dynamic> response) {
  final status = response.statusCode;
  final body = response.data;
  String? message;
  final errors = <String>[];
  if (body is Map) {
    final m = body['message'];
    if (m is String && m.trim().isNotEmpty) message = m;
    final e = body['errors'];
    if (e is List) errors.addAll(e.whereType<String>());
  }

  final ApiErrorKind kind;
  switch (status) {
    case 400:
      kind = errors.isNotEmpty ? ApiErrorKind.validation : ApiErrorKind.unknown;
    case 401:
      kind = ApiErrorKind.unauthorized;
    case 403:
      kind = ApiErrorKind.forbidden;
    case 404:
      kind = ApiErrorKind.notFound;
    case 409:
      kind = ApiErrorKind.conflict;
    case 413:
      kind = ApiErrorKind.tooLarge;
    case 429:
      kind = ApiErrorKind.rateLimited;
    case final int s when s >= 500:
      kind = ApiErrorKind.server;
    default:
      kind = ApiErrorKind.unknown;
  }

  return ApiException(
    kind: kind,
    status: status,
    message:
        message ??
        (kind == ApiErrorKind.notFound
            ? Strings.notFound
            : Strings.unknownError),
    errors: errors,
  );
}

/// Maps any [DioException] to an [ApiException].
ApiException mapDioException(DioException e) {
  final existing = e.error;
  if (existing is ApiException) return existing;
  switch (e.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.receiveTimeout:
    case DioExceptionType.transformTimeout:
      return const ApiException.timeout();
    case DioExceptionType.connectionError:
      return const ApiException.offline();
    case DioExceptionType.badResponse:
      final r = e.response;
      return r == null
          ? const ApiException(
              kind: ApiErrorKind.unknown,
              message: Strings.unknownError,
            )
          : mapResponse(r);
    case DioExceptionType.cancel:
    case DioExceptionType.badCertificate:
    case DioExceptionType.unknown:
      return const ApiException(
        kind: ApiErrorKind.unknown,
        message: Strings.unknownError,
      );
  }
}

/// Converts every [DioException] into one carrying an [ApiException] in
/// `error`, so repositories can `catch` uniformly (see `guardApi`).
class ErrorMapperInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    handler.next(err.copyWith(error: mapDioException(err)));
  }
}
