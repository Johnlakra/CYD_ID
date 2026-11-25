import 'package:cyd_app/app/theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// Pumps [child] inside a themed MaterialApp (Scaffold body).
Future<void> pumpThemed(
  WidgetTester tester,
  Widget child, {
  Brightness brightness = Brightness.light,
  double textScale = 1,
  Size size = const Size(390, 844),
}) async {
  tester.view.devicePixelRatio = 1;
  tester.view.physicalSize = size;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(
    MaterialApp(
      theme: cydTheme(brightness),
      builder: (context, c) => MediaQuery(
        data: MediaQuery.of(context)
            .copyWith(textScaler: TextScaler.linear(textScale)),
        child: c!,
      ),
      home: Scaffold(body: child),
    ),
  );
}
