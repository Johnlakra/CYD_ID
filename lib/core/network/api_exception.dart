import '../strings.dart';

/// Failure categories (doc 01 §4, doc 08 §14).
enum ApiErrorKind {
  validation,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  rateLimited,
  tooLarge,
  server,
  offline,
  timeout,
  unknown,
}

/// Every failed request becomes one of these. [message] is the server text
/// verbatim (already user-facing English) or app copy for offline/timeout.
class ApiException implements Exception {
  const ApiException({
    required this.kind,
    required this.message,
    this.status,
    this.errors = const [],
  });

  /// HTTP status; `null` for offline/timeout.
  final int? status;
  final String message;

  /// Validation messages (flat list of strings, not keyed by field).
  final List<String> errors;
  final ApiErrorKind kind;

  const ApiException.offline()
    : this(kind: ApiErrorKind.offline, message: Strings.offline);

  const ApiException.timeout()
    : this(kind: ApiErrorKind.timeout, message: Strings.timeout);

  bool get isValidation => kind == ApiErrorKind.validation;

  /// Messages to show under a form: [errors] if any, else [message].
  List<String> get displayMessages => errors.isEmpty ? [message] : errors;

  @override
  String toString() => 'ApiException(${kind.name}, status: $status)';
}
