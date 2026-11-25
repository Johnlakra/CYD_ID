import 'package:flutter/widgets.dart';

/// Tells descendants whether the floating tab bar is on screen so overlays
/// (toasts) can sit above it. Provided by the shell; defaults to "no bar".
class CydChrome extends InheritedWidget {
  const CydChrome({
    super.key,
    required this.tabBarVisible,
    required super.child,
  });

  final bool tabBarVisible;

  static bool tabBarVisibleOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<CydChrome>()?.tabBarVisible ??
      false;

  @override
  bool updateShouldNotify(CydChrome old) => old.tabBarVisible != tabBarVisible;
}
