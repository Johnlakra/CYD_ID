/// Spacing and layout constants (tokens.json `spacing`, `tabBar`).
class CydLayout {
  const CydLayout._();

  static const double screenPadding = 20;
  static const double sectionGap = 24;
  static const double cardPadding = 16;
  static const double gridGapX = 12;
  static const double gridGapY = 18;

  /// Bottom padding that keeps scroll content clear of the floating tab bar.
  static const double tabBarContentPad = 110;

  /// Toast bottom offsets (design: 104 with tabs, 100 over a sticky bar,
  /// 30 otherwise).
  static const double toastBottomWithTabs = 104;
  static const double toastBottomStickyBar = 100;
  static const double toastBottomOther = 30;

  /// Largest text scale the app honours without overflow (doc 02 §8).
  static const double maxTextScale = 1.3;
}
