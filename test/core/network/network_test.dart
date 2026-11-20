import 'package:cyd_app/core/network/api_envelope.dart';
import 'package:cyd_app/core/network/api_exception.dart';
import 'package:cyd_app/core/network/dio_provider.dart';
import 'package:cyd_app/core/network/health_repository.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http_mock_adapter/http_mock_adapter.dart';

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

    test('a redirect-style failure surfaces as ApiException', () async {
      adapter.onGet('/health', (s) => s.reply(308, ''));
      final e = await failure(() => HealthRepository(dio).check());
      expect(e, isA<ApiException>());
    });
  });
}
