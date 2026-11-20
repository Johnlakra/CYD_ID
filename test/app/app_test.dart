import 'package:cyd_app/app/app.dart';
import 'package:cyd_app/core/network/dio_provider.dart';
import 'package:cyd_app/core/strings.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http_mock_adapter/http_mock_adapter.dart';

Widget _app(Dio dio) => ProviderScope(
  overrides: [dioProvider.overrideWithValue(dio)],
  child: const CydApp(),
);

void main() {
  testWidgets('starts on splash, shows the DEV ribbon, opens login', (
    tester,
  ) async {
    await tester.pumpWidget(_app(buildDio(baseUrl: 'http://test.local')));
    await tester.pumpAndSettle();

    expect(find.text(Strings.splashTitle), findsOneWidget);
    expect(find.byType(Banner), findsWidgets);

    await tester.tap(find.text(Strings.loginTitle));
    await tester.pumpAndSettle();
    expect(find.byType(AppBar), findsOneWidget);
  });

  testWidgets('/debug/health shows OK from GET /health', (tester) async {
    final dio = buildDio(baseUrl: 'http://test.local');
    DioAdapter(dio: dio).onGet(
      '/health',
      (s) => s.reply(200, {
        'success': true,
        'message': 'Server is running',
        'version': '1.0.0',
      }),
    );
    await tester.pumpWidget(_app(dio));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Backend health (debug)'));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('health-ok')), findsOneWidget);
    expect(find.textContaining('Server is running'), findsOneWidget);
  });

  testWidgets('/debug/health shows the error and retry on failure', (
    tester,
  ) async {
    final dio = buildDio(baseUrl: 'http://test.local');
    DioAdapter(dio: dio).onGet(
      '/health',
      (s) => s.reply(500, {'success': false, 'message': 'boom'}),
    );
    await tester.pumpWidget(_app(dio));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Backend health (debug)'));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('health-error')), findsOneWidget);
    expect(find.text('Retry'), findsOneWidget);
  });
}
