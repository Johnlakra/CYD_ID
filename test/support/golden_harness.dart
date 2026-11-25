import 'package:cyd_app/app/theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// Golden key for a widget tree rendered at [width] logical px.
const goldenBoundaryKey = Key('golden-boundary');

/// Pumps [child] on the page background of [brightness], [width] px wide
/// (390 phone, 360 dense), and returns the finder of the captured boundary.
/// One pixel per logical pixel keeps the golden files small.
Future<Finder> pumpGolden(
  WidgetTester tester,
  Widget child, {
  required Brightness brightness,
  double width = 390,
  double textScale = 1,
  EdgeInsets padding = const EdgeInsets.all(20),
}) async {
  // flutter_test turns shadows off by default, which hides the card shadows
  // and the gold glows; render them in goldens.
  final oldShadows = debugDisableShadows;
  debugDisableShadows = false;
  addTearDown(() => debugDisableShadows = oldShadows);
  tester.view.devicePixelRatio = 1;
  tester.view.physicalSize = Size(width, 4000);
  addTearDown(tester.view.reset);
  final theme = cydTheme(brightness);
  final tokens = brightness == Brightness.dark
      ? CydTokens.dark
      : CydTokens.light;
  await tester.pumpWidget(
    MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: theme,
      home: MediaQuery(
        data: MediaQueryData(
          size: Size(width, 4000),
          textScaler: TextScaler.linear(textScale),
        ),
        child: Align(
          alignment: Alignment.topLeft,
          child: RepaintBoundary(
            key: goldenBoundaryKey,
            child: Container(
              width: width,
              padding: padding,
              decoration: BoxDecoration(
                color: tokens.bg,
                gradient: tokens.bgGrad,
              ),
              child: Material(
                type: MaterialType.transparency,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [child],
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
  await tester.pump(const Duration(milliseconds: 50));
  return find.byKey(goldenBoundaryKey);
}
