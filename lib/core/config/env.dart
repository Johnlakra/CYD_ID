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

  /// Release builds must talk HTTPS only (doc 01 §4, §11).
  static bool isSecureUrl(String url) =>
      Uri.tryParse(url)?.scheme.toLowerCase() == 'https';

  /// Throws in release mode when [apiBaseUrl] is not HTTPS.
  static void assertReleaseConfig({
    String url = apiBaseUrl,
    bool releaseMode = kReleaseMode,
  }) {
    if (releaseMode && !isSecureUrl(url)) {
      throw StateError(
        'Release builds require an https API_BASE_URL (got "$url").',
      );
    }
  }
}
