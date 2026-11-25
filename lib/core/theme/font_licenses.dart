import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Bundled font families and their licence files (SIL OFL 1.1).
const Map<String, String> fontLicenseAssets = {
  'Instrument Serif': 'assets/fonts/OFL-InstrumentSerif.txt',
  'Manrope': 'assets/fonts/OFL-Manrope.txt',
  'DM Mono': 'assets/fonts/OFL-DMMono.txt',
  'Gafata': 'assets/fonts/OFL-Gafata.txt',
};

/// Registers every bundled font licence so it appears on the in-app licences
/// page. Call once at startup (`main`).
void registerFontLicenses({AssetBundle? bundle}) {
  for (final entry in fontLicenseAssets.entries) {
    LicenseRegistry.addLicense(() async* {
      final text = await (bundle ?? rootBundle).loadString(entry.value);
      yield LicenseEntryWithLineBreaks([entry.key], text);
    });
  }
}
