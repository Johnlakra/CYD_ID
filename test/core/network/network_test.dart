import 'package:cyd_app/core/network/api_envelope.dart';
import 'package:cyd_app/core/network/api_exception.dart';
import 'package:cyd_app/core/network/dio_provider.dart';
import 'package:cyd_app/core/network/health_repository.dart';
import 'package:cyd_app/core/strings.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http_mock_adapter/http_mock_adapter.dart';

import '../../support/scope.dart';

void main() {
  late Dio dio;
  late DioAdapter adapter;

  setUp(() {
    dio = buildDio(baseUrl: 'http://test.local');
    adapter = DioAdapter(dio: dio);
  });

  Future<ApiException> failure(Future<Object?> Function() call) async {
    try {
      await call();
    } on ApiException catch (e) {
      return e;
    }
    fail('expected ApiException');
  }

  group('envelope', () {
    test('unwrapMap returns data of a success envelope', () async {
      adapter.onGet(
        '/x',
        (s) => s.reply(200, {
          'success': true,
          'message': 'ok',
          'data': {'a': 1},
        }),
      );
      final map = await guardApi(() async => unwrapMap(await dio.get('/x')));
      expect(map, {'a': 1});
    });

    test('success without data yields null', () async {
      adapter.onPut(
        '/pw',
        (s) => s.reply(200, {'success': true, 'message': 'changed'}),
      );
      final data = await guardApi(() async => unwrapData(await dio.put('/pw')));
      expect(data, isNull);
    });

    test('envelopeMessage reads the message', () async {
      adapter.onGet(
        '/x',
        (s) => s.reply(200, {'success': true, 'message': 'hello'}),
      );
      expect(envelopeMessage(await dio.get('/x')), 'hello');
    });
  });

  group('error mapping', () {
    test(
      '400 with errors list is validation, messages kept verbatim',
      () async {
        adapter.onPost(
          '/p',
          (s) => s.reply(400, {
            'success': false,
            'message': 'Validation failed',
            'errors': ['Name is required', 'Invalid value'],
          }),
        );
        final e = await failure(() => guardApi(() => dio.post('/p')));
        expect(e.kind, ApiErrorKind.validation);
        expect(e.status, 400);
        expect(e.message, 'Validation failed');
        expect(e.errors, ['Name is required', 'Invalid value']);
        expect(e.displayMessages, ['Name is required', 'Invalid value']);
      },
    );

    test('400 without errors keeps the server message', () async {
      adapter.onPost(
        '/p',
        (s) => s.reply(400, {
          'success': false,
          'message': 'Malformed JSON in request body',
        }),
      );
      final e = await failure(() => guardApi(() => dio.post('/p')));
      expect(e.kind, ApiErrorKind.unknown);
      expect(e.message, 'Malformed JSON in request body');
    });

    final statusKinds = {
      401: ApiErrorKind.unauthorized,
      403: ApiErrorKind.forbidden,
      404: ApiErrorKind.notFound,
      409: ApiErrorKind.conflict,
      413: ApiErrorKind.tooLarge,
      429: ApiErrorKind.rateLimited,
      500: ApiErrorKind.server,
      503: ApiErrorKind.server,
    };
    statusKinds.forEach((status, kind) {
      test('$status maps to ${kind.name}', () async {
        adapter.onGet(
          '/s',
          (s) => s.reply(status, {'success': false, 'message': 'msg $status'}),
        );
        final e = await failure(() => guardApi(() => dio.get('/s')));
        expect(e.kind, kind);
        expect(e.status, status);
        expect(e.message, 'msg $status');
      });
    });

    test('non-JSON (HTML) 404 becomes notFound with app copy', () async {
      adapter.onGet(
        '/missing',
        (s) => s.reply(404, '<html>Cannot GET /missing</html>'),
      );
      final e = await failure(() => guardApi(() => dio.get('/missing')));
      expect(e.kind, ApiErrorKind.notFound);
      expect(e.message, isNot(contains('<html>')));
    });

    test('connection error is offline', () async {
      adapter.onGet(
        '/o',
        (s) => s.throws(
          0,
          DioException.connectionError(
            requestOptions: RequestOptions(path: '/o'),
            reason: 'no network',
          ),
        ),
      );
      final e = await failure(() => guardApi(() => dio.get('/o')));
      expect(e.kind, ApiErrorKind.offline);
      expect(e.status, isNull);
    });

    test('timeout is timeout', () async {
      adapter.onGet(
        '/t',
        (s) => s.throws(
          0,
          DioException.receiveTimeout(
            timeout: const Duration(seconds: 30),
            requestOptions: RequestOptions(path: '/t'),
          ),
        ),
      );
      final e = await failure(() => guardApi(() => dio.get('/t')));
      expect(e.kind, ApiErrorKind.timeout);
    });

    test('envelope with success false on a 200 throws', () async {
      adapter.onGet(
        '/odd',
        (s) => s.reply(200, {'success': false, 'message': 'nope'}),
      );
      final e = await failure(
        () => guardApi(() async => unwrapData(await dio.get('/odd'))),
      );
      expect(e.message, 'nope');
    });
  });

  group('HealthRepository', () {
    test('GET /health parses the payload', () async {
      adapter.onGet(
        '/health',
        (s) => s.reply(200, {
          'success': true,
          'message': 'Server is running',
          'timestamp': '2026-11-20T10:00:00.000Z',
          'version': '1.0.0',
        }),
      );
      final h = await HealthRepository(dio).check();
      expect(h.message, 'Server is running');
      expect(h.version, '1.0.0');
    });

    test(
      'a 308 (wrong server on the port) is an unknown ApiException',
      () async {
        adapter.onGet('/health', (s) => s.reply(308, ''));
        final e = await failure(() => HealthRepository(dio).check());
        expect(e.kind, ApiErrorKind.unknown);
        expect(e.status, 308);
      },
    );

    test(
      'a wrong-typed field surfaces as ApiException, not TypeError',
      () async {
        adapter.onGet(
          '/health',
          (s) => s.reply(200, {'success': true, 'message': 42}),
        );
        final e = await failure(() => HealthRepository(dio).check());
        expect(e.kind, ApiErrorKind.unknown);
        expect(e.message, Strings.unknownError);
      },
    );
  });

  group('no automatic retry (Riverpod 3 default is 10 retries)', () {
    test('a 403 through a FutureProvider issues exactly one request', () async {
      var calls = 0;
      adapter.onGet('/forbidden', (s) {
        calls++;
        s.reply(403, {'success': false, 'message': 'Admin access required'});
      });
      final provider = FutureProvider.autoDispose<void>(
        (ref) => guardApi(() => dio.get<dynamic>('/forbidden')),
      );
      final container = testContainer();
      addTearDown(container.dispose);
      final sub = container.listen(provider, (_, _) {});
      addTearDown(sub.close);

      await expectLater(
        container.read(provider.future),
        throwsA(isA<ApiException>()),
      );
      await Future<void>.delayed(const Duration(seconds: 1));
      expect(calls, 1);
      expect(container.read(provider), isA<AsyncError<void>>());
    });
  });

  group('MinimalLogInterceptor', () {
    test('logs only method, path and status', () async {
      final lines = <String>[];
      final old = debugPrint;
      debugPrint = (String? m, {int? wrapWidth}) => lines.add(m ?? '');
      addTearDown(() => debugPrint = old);

      final logged = buildDio(baseUrl: 'http://test.local', logging: true);
      DioAdapter(dio: logged)
        ..onGet(
          '/profiles',
          (s) => s.reply(200, {'success': true, 'data': 'secret-body'}),
          headers: {'Authorization': 'Bearer abc'},
          queryParameters: {'q': 'utr123'},
        )
        ..onPost(
          '/pay',
          (s) => s.reply(400, {'success': false, 'message': 'bad'}),
          data: {'utr': '429188301127'},
        );
      await logged.get<dynamic>(
        '/profiles',
        queryParameters: {'q': 'utr123'},
        options: Options(headers: {'Authorization': 'Bearer abc'}),
      );
      await expectLater(
        logged.post<dynamic>('/pay', data: {'utr': '429188301127'}),
        throwsA(isA<DioException>()),
      );

      expect(lines, ['[http] GET /profiles -> 200', '[http] POST /pay -> 400']);
    });
  });
}
