import 'dart:convert';
import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';

/// A cached JSON payload and when it was saved.
class CacheEntry {
  const CacheEntry({required this.data, required this.savedAt});
  final Object? data;
  final DateTime savedAt;
}

/// JSON file cache with timestamps for stale-while-revalidate (profile list
/// page 1, own profile, card data, filter options). Files hold personal data:
/// [clear] is called on sign-out.
class CacheStore {
  CacheStore(this._dir, {DateTime Function()? clock})
    : _clock = clock ?? DateTime.now;

  final Future<Directory> Function() _dir;
  final DateTime Function() _clock;

  Future<File> _file(String key) async {
    final dir = await _dir();
    final safe = key.replaceAll(RegExp(r'[^A-Za-z0-9_.-]'), '_');
    return File('${dir.path}/$safe.json');
  }

  Future<void> write(String key, Object? data) async {
    final f = await _file(key);
    await f.parent.create(recursive: true);
    await f.writeAsString(
      jsonEncode({'savedAt': _clock().toUtc().toIso8601String(), 'data': data}),
    );
  }

  /// `null` if missing or unreadable (a corrupt file is deleted).
  Future<CacheEntry?> read(String key) async {
    final f = await _file(key);
    if (!await f.exists()) return null;
    try {
      final m = jsonDecode(await f.readAsString());
      final savedAt = DateTime.tryParse((m as Map)['savedAt'] as String? ?? '');
      if (savedAt == null) throw const FormatException('savedAt');
      return CacheEntry(data: m['data'], savedAt: savedAt.toLocal());
    } on Object {
      await f.delete();
      return null;
    }
  }

  Future<void> remove(String key) async {
    final f = await _file(key);
    if (await f.exists()) await f.delete();
  }

  /// Deletes every cache file (sign-out).
  Future<void> clear() async {
    final dir = await _dir();
    if (!await dir.exists()) return;
    await for (final e in dir.list()) {
      if (e is File && e.path.endsWith('.json')) await e.delete();
    }
  }
}

final cacheStoreProvider = Provider<CacheStore>((ref) {
  return CacheStore(() async {
    final base = await getApplicationSupportDirectory();
    return Directory('${base.path}/cyd_cache');
  });
});
