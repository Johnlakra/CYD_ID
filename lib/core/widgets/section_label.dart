import 'package:flutter/material.dart';

import '../theme/cyd_tokens.dart';
import '../theme/cyd_type.dart';

/// DM Mono 9 tracked uppercase label with an optional right-aligned count or
/// action (action text in `accText`).
class SectionLabel extends StatelessWidget {
  const SectionLabel(
    this.text, {
    super.key,
    this.trailing,
    this.onTrailingTap,
    this.bottom = 10,
  });

  final String text;
  final String? trailing;
  final VoidCallback? onTrailingTap;
  final double bottom;

  @override
  Widget build(BuildContext context) {
    final type = context.type;
    final t = context.tokens;
    return Padding(
      padding: EdgeInsets.only(bottom: bottom),
      child: Row(
        children: [
          Expanded(
            child: Semantics(
              header: true,
              child: Text(text.toUpperCase(), style: type.sectionLabel),
            ),
          ),
          if (trailing != null)
            onTrailingTap == null
                ? Text(trailing!.toUpperCase(), style: type.sectionLabel)
                : Semantics(
                    button: true,
                    child: GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: onTrailingTap,
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(minHeight: 44),
                        child: Center(
                          child: Text(
                            trailing!.toUpperCase(),
                            style: type.sectionLabel.copyWith(color: t.accText),
                          ),
                        ),
                      ),
                    ),
                  ),
        ],
      ),
    );
  }
}
