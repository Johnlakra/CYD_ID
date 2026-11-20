import 'package:flutter/foundation.dart';

/// Build-time configuration from `--dart-define`. The only place a backend
/// URL may appear.
///
/// ```
/// flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000 --dart-define=FLAVOR=dev
/// ```
class Env {
  const Env._();

  /// Backend base URL. Default targets the Android emulator's view of the host.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  /// `dev` or `prod`.
  static const String flavor = String.fromEnvironment(
    'FLAVOR',
    defaultValue: 'dev',
  );

  static bool get isDev => flavor == 'dev';

  static const _flavors = {'dev', 'prod'};

  /// HTTPS with a non-empty host (doc 01 §4, §11).
  static bool isSecureUrl(String url) {
    final uri = Uri.tryParse(url);
    return uri != null &&
        uri.scheme.toLowerCase() == 'https' &&
        uri.host.isNotEmpty;
  }

  /// Throws on an unknown flavor (any mode), and in release mode unless the
  /// flavor is `prod` and [url] is HTTPS.
  static void assertReleaseConfig({
    String url = apiBaseUrl,
    String flavor = Env.flavor,
    bool releaseMode = kReleaseMode,
  }) {
    if (!_flavors.contains(flavor)) {
      throw StateError('FLAVOR must be dev or prod (got "$flavor").');
    }
    if (!releaseMode) return;
    if (flavor != 'prod') {
      throw StateError('Release builds require FLAVOR=prod (got "$flavor").');
    }
    if (!isSecureUrl(url)) {
      throw StateError(
        'Release builds require an https API_BASE_URL (got "$url").',
      );
    }
  }
}
