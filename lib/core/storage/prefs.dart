import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Typed wrapper over [SharedPreferences]. Personal data is keyed per user
/// with [userKey] so sign-out can remove it with [removeUserData].
class Prefs {
  Prefs(this._p);
  final SharedPreferences _p;

  static const themeModeKey = 'cyd_theme_mode';
  static const recentSearchesKey = 'cyd_recent_searches';
  static const _cartPrefix = 'cyd_cart:';
  static const _wishlistPrefix = 'cyd_wishlist:';

  static String cartKey(int userId) => '$_cartPrefix$userId';
  static String wishlistKey(int userId) => '$_wishlistPrefix$userId';
  static String userKey(String base, int userId) => '$base:$userId';

  String? getString(String key) => _p.getString(key);
  Future<bool> setString(String key, String value) => _p.setString(key, value);

  List<String> getStringList(String key) => _p.getStringList(key) ?? const [];
  Future<bool> setStringList(String key, List<String> value) =>
      _p.setStringList(key, value);

  /// Decoded JSON object, or `null` if missing or corrupt.
  Map<String, dynamic>? getJson(String key) {
    final raw = _p.getString(key);
    if (raw == null) return null;
    try {
      final v = jsonDecode(raw);
      return v is Map<String, dynamic> ? v : null;
    } on FormatException {
      return null;
    }
  }

  Future<bool> setJson(String key, Map<String, dynamic> value) =>
      _p.setString(key, jsonEncode(value));

  Future<bool> remove(String key) => _p.remove(key);

  /// Sign-out: delete the user's cart and wishlist (doc 01 §5). Theme and
  /// recent searches are kept.
  Future<void> removeUserData(int userId) async {
    await _p.remove(cartKey(userId));
    await _p.remove(wishlistKey(userId));
  }
}

/// Overridden in `main()` with the awaited instance (and in tests).
final sharedPreferencesProvider = Provider<SharedPreferences>(
  (ref) => throw UnimplementedError('Override sharedPreferencesProvider'),
);

final prefsProvider = Provider<Prefs>(
  (ref) => Prefs(ref.watch(sharedPreferencesProvider)),
);
