import 'package:flutter/material.dart';

import '../../core/widgets/widgets.dart';
import '../theme.dart';
import 'gallery_sections.dart';

/// Debug-only design gallery (`/debug/gallery`): every design-system widget
/// with a light / dark toggle. Not registered in release builds.
class GalleryScreen extends StatefulWidget {
  const GalleryScreen({super.key});

  @override
  State<GalleryScreen> createState() => _GalleryScreenState();
}

class _GalleryScreenState extends State<GalleryScreen> {
  Brightness? _override;

  @override
  Widget build(BuildContext context) {
    final system = MediaQuery.platformBrightnessOf(context);
    final b = _override ?? system;
    return Theme(
      data: cydTheme(b),
      child: Builder(
        builder: (context) {
          final t = context.tokens;
          return CydScaffold(
            title: 'Design gallery',
            trailing: Semantics(
              label: 'Toggle theme',
              button: true,
              child: CydCircleButton(
                semanticLabel: b == Brightness.dark
                    ? 'Switch to light theme'
                    : 'Switch to dark theme',
                icon: b == Brightness.dark
                    ? Icons.light_mode_outlined
                    : Icons.dark_mode_outlined,
                onPressed: () => setState(
                  () => _override = b == Brightness.dark
                      ? Brightness.light
                      : Brightness.dark,
                ),
              ),
            ),
            body: ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
              children: [
                for (final s in gallerySections) ...[
                  SectionLabel(s.title),
                  Builder(builder: s.builder),
                  const SizedBox(height: 28),
                  Divider(color: t.line),
                  const SizedBox(height: 16),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}
