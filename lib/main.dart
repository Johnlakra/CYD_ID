import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app/app.dart';
import 'core/config/env.dart';
import 'core/config/riverpod_config.dart';
import 'core/storage/prefs.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  Env.assertReleaseConfig();
  final prefs = await SharedPreferences.getInstance();
  runApp(
    ProviderScope(
      retry: noAutomaticRetry,
      overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
      child: const CydApp(),
    ),
  );
}
