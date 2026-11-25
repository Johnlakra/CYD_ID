import 'package:flutter/material.dart';

import '../theme/cyd_tokens.dart';
import '../theme/cyd_type.dart';

/// Neutral photo frame: gradient + image icon + DM Mono caption (e.g.
/// "PRODUCT PHOTOS · SWIPE", "BANNER PHOTO · 16:9"). Shown wherever a real
/// picture will go; replace by the image once it exists.
class PhotoPlaceholder extends StatelessWidget {
  const PhotoPlaceholder({
    super.key,
    this.label,
    this.aspectRatio,
    this.height,
    this.radius = 16,
    this.iconSize = 34,
    this.border = true,
  });

  final String? label;
  final double? aspectRatio;
  final double? height;
  final double radius;
  final double iconSize;
  final bool border;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final frame = Container(
      height: height,
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: t.ph,
        borderRadius: BorderRadius.circular(radius),
        border: border ? Border.all(color: t.line) : null,
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.image_outlined, size: iconSize, color: t.faint),
          if (label != null) ...[
            const SizedBox(height: 8),
            Text(
              label!.toUpperCase(),
              textAlign: TextAlign.center,
              style: context.type.photoCaption,
            ),
          ],
        ],
      ),
    );
    final child = aspectRatio == null
        ? frame
        : AspectRatio(aspectRatio: aspectRatio!, child: frame);
    return Semantics(
      image: true,
      label: label == null ? 'Photo placeholder' : '${label!} placeholder',
      excludeSemantics: true,
      child: child,
    );
  }
}
