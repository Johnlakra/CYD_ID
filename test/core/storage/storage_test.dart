import 'dart:io';

import 'package:cyd_app/core/storage/cache_store.dart';
import 'package:cyd_app/core/storage/prefs.dart';
import 'package:cyd_app/core/storage/token_store.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';

class _MockSecure extends Mock implements FlutterSecureStorage {}

void main() {
  group('TokenStore', () {
    late _MockSecure secure;
    late TokenStore store;
    final data = <String, String>{};

    setUp(() {
      data.clear();
      secure = _MockSecure();
      when(
        () => secure.write(
          key: any(named: 'key'),
          value: any(named: 'value'),
        ),
      ).thenAnswer((i) async {
        data[i.namedArguments[#key] as String] =
            i.namedArguments[#value] as String;
      });
      when(() => secure.read(key: any(named: 'key')))
          .thenAnswer((i) async => data[i.namedArguments[#key] as String]);
      when(() => secure.delete(key: any(named: 'key'))).thenAnswer((i) async {
        data.remove(i.namedArguments[#key] as String);
      });
      store = TokenStore(secure);
    });

    test('save, read, clear', () async {
      await store.save(
        token: 't0k3n',
        user: {'id': 1, 'username': 'admin', 'role': 'admin'},
      );
      expect(await store.readToken(), 't0k3n');
      expect((await store.readUser())?['username'], 'admin');
      await store.clear();
      expect(await store.readToken(), isNull);
      expect(await store.readUser(), isNull);
    });

    test('corrupt user JSON reads as null', () async {
      data['cyd_user'] = '{not json';
      expect(await store.readUser(), isNull);
    });
  });

  group('Prefs', () {
    late Prefs prefs;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      prefs = Prefs(await SharedPreferences.getInstance());
    });

    test('strings, lists, json', () async {
      await prefs.setString('a', 'b');
      await prefs.setStringList('l', ['x', 'y']);
      await prefs.setJson('j', {'k': 1});
      expect(prefs.getString('a'), 'b');
      expect(prefs.getStringList('l'), ['x', 'y']);
      expect(prefs.getJson('j'), {'k': 1});
      expect(prefs.getStringList('missing'), isEmpty);
      expect(prefs.getJson('missing'), isNull);
    });

    test('corrupt json reads as null', () async {
      await prefs.setString('bad', '{oops');
      expect(prefs.getJson('bad'), isNull);
    });

    test('removeUserData wipes cart and wishlist but keeps theme', () async {
      await prefs.setString(Prefs.cartKey(7), '[]');
      await prefs.setString(Prefs.wishlistKey(7), '[]');
      await prefs.setString(Prefs.cartKey(8), '[1]');
      await prefs.setString(Prefs.themeModeKey, 'dark');
      await prefs.removeUserData(7);
      expect(prefs.getString(Prefs.cartKey(7)), isNull);
      expect(prefs.getString(Prefs.wishlistKey(7)), isNull);
      expect(prefs.getString(Prefs.cartKey(8)), '[1]');
      expect(prefs.getString(Prefs.themeModeKey), 'dark');
    });
  });

  group('CacheStore', () {
    late Directory dir;
    late CacheStore cache;
    final now = DateTime.utc(2026, 11, 20, 10);

    setUp(() async {
      dir = await Directory.systemTemp.createTemp('cyd_cache_test');
      cache = CacheStore(() async => dir, clock: () => now);
    });
    tearDown(() async => dir.delete(recursive: true));

    test('write then read returns data with savedAt', () async {
      await cache.write('profiles:page1', {
        'items': [1, 2],
      });
      final e = await cache.read('profiles:page1');
      expect(e, isNotNull);
      expect(e!.data, {
        'items': [1, 2],
      });
      expect(e.savedAt.toUtc(), now);
    });

    test('missing key reads null; corrupt file is dropped', () async {
      expect(await cache.read('nope'), isNull);
      await File('${dir.path}/bad.json').writeAsString('garbage');
      expect(await cache.read('bad'), isNull);
      expect(File('${dir.path}/bad.json').existsSync(), isFalse);
    });

    test('remove and clear', () async {
      await cache.write('a', 1);
      await cache.write('b', 2);
      await cache.remove('a');
      expect(await cache.read('a'), isNull);
      expect(await cache.read('b'), isNotNull);
      await cache.clear();
      expect(await cache.read('b'), isNull);
    });
  });
}
