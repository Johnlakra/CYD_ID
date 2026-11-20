import 'package:cyd_app/core/config/env.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('dev defaults', () {
    expect(Env.apiBaseUrl, 'http://10.0.2.2:3000');
    expect(Env.flavor, 'dev');
    expect(Env.isDev, isTrue);
  });

  test('isSecureUrl', () {
    expect(Env.isSecureUrl('https://cyd-id-be.onrender.com'), isTrue);
    expect(Env.isSecureUrl('http://10.0.2.2:3000'), isFalse);
    expect(Env.isSecureUrl('not a url'), isFalse);
  });

  test('release builds reject cleartext URLs', () {
    expect(
      () => Env.assertReleaseConfig(url: 'http://x.test', releaseMode: true),
      throwsStateError,
    );
    expect(
      () => Env.assertReleaseConfig(url: 'https://x.test', releaseMode: true),
      returnsNormally,
    );
    expect(
      () => Env.assertReleaseConfig(url: 'http://x.test'),
      returnsNormally,
    );
  });
}
