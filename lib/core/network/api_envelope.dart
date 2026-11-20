import 'package:dio/dio.dart';

import 'api_exception.dart';
import 'error_mapper.dart';

/// Returns `data` of a success envelope `{success:true, message, data}`.
/// Endpoints that omit `data` (e.g. change-password) yield `null`.
Object? unwrapData(Response<dynamic> response) {
  final body = response.data;
  if (body is Map && body['success'] == true) return body['data'];
  throw mapResponse(response);
}

/// `data` as an object. Throws [ApiException] if it is not one.
Map<String, dynamic> unwrapMap(Response<dynamic> response) {
  final data = unwrapData(response);
  if (data is Map<String, dynamic>) return data;
  throw const ApiException(
    kind: ApiErrorKind.unknown,
    message: 'Unexpected response from the server.',
  );
}

/// The server `message` of an envelope, if present.
String? envelopeMessage(Response<dynamic> response) {
  final body = response.data;
  return body is Map ? body['message'] as String? : null;
}

/// Runs a repository call and guarantees any failure surfaces as an
/// [ApiException] (never a raw [DioException]).
Future<T> guardApi<T>(Future<T> Function() call) async {
  try {
    return await call();
  } on DioException catch (e) {
    throw mapDioException(e);
  }
}
