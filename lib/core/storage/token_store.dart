import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// JWT + user JSON (`{id, username, email, role}`) in secure storage only
/// (doc 01 §5, §11). Never log values from this class.
class TokenStore {
  TokenStore([FlutterSecureStorage? storage])
    // v11 defaults: Android AES-GCM with a Keystore-wrapped key; iOS keychain
    // accessible `first_unlock` (doc 01 §11). See docs/DECISIONS.md.
    : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  static const _tokenKey = 'cyd_token';
  static const _userKey = 'cyd_user';

  Future<String?> readToken() => _storage.read(key: _tokenKey);

  Future<Map<String, dynamic>?> readUser() async {
    final raw = await _storage.read(key: _userKey);
    if (raw == null) return null;
    try {
      final decoded = jsonDecode(raw);
      return decoded is Map<String, dynamic> ? decoded : null;
    } on FormatException {
      return null;
    }
  }

  Future<void> save({
    required String token,
    required Map<String, dynamic> user,
  }) async {
    await _storage.write(key: _tokenKey, value: token);
    await _storage.write(key: _userKey, value: jsonEncode(user));
  }

  Future<void> clear() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _userKey);
  }
}

final tokenStoreProvider = Provider<TokenStore>((ref) => TokenStore());
