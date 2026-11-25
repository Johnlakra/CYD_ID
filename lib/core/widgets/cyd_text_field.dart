import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../format/text.dart';
import '../theme/cyd_tokens.dart';
import '../theme/cyd_type.dart';

/// Labelled text field: DM Mono label above, 50 dp field (radius 14, line2
/// border, accent on focus, danger + message on error). [maxLines] > 1 makes
/// a textarea.
class CydTextField extends StatefulWidget {
  const CydTextField({
    super.key,
    this.label,
    this.controller,
    this.hint,
    this.helper,
    this.errorText,
    this.obscure = false,
    this.keyboardType,
    this.textInputAction,
    this.inputFormatters,
    this.onChanged,
    this.onSubmitted,
    this.enabled = true,
    this.maxLines = 1,
    this.minLines,
    this.maxLength,
    this.textCapitalization = TextCapitalization.none,
    this.autofillHints,
    this.suffix,
    this.prefix,
    this.focusNode,
    this.textStyle,
    this.height,
    this.autofocus = false,
    this.shadow = false,
    this.borderColor,
    this.borderWidth = 1,
  });

  final String? label;
  final TextEditingController? controller;
  final String? hint;
  final String? helper;
  final String? errorText;

  /// Password field with a show / hide toggle.
  final bool obscure;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final List<TextInputFormatter>? inputFormatters;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final bool enabled;
  final int maxLines;
  final int? minLines;
  final int? maxLength;
  final TextCapitalization textCapitalization;
  final Iterable<String>? autofillHints;
  final Widget? suffix;
  final Widget? prefix;
  final FocusNode? focusNode;
  final TextStyle? textStyle;
  final double? height;
  final bool autofocus;

  /// Lifted shadow (only the login password field has one in the design).
  final bool shadow;

  /// Overrides the state-driven border colour (UTR field).
  final Color? borderColor;
  final double borderWidth;

  @override
  State<CydTextField> createState() => _CydTextFieldState();
}

class _CydTextFieldState extends State<CydTextField> {
  late final FocusNode _focus = widget.focusNode ?? FocusNode();
  bool _hide = true;

  @override
  void initState() {
    super.initState();
    _focus.addListener(_onFocus);
  }

  void _onFocus() => setState(() {});

  @override
  void dispose() {
    _focus.removeListener(_onFocus);
    if (widget.focusNode == null) _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final type = context.type;
    final hasError = widget.errorText != null && widget.errorText!.isNotEmpty;
    final multi = widget.maxLines > 1;
    final borderColor =
        widget.borderColor ??
        (hasError
            ? t.danger
            : _focus.hasFocus
            ? CydTokens.accent
            : t.line2);
    final style = (widget.textStyle ?? type.inputText).copyWith(
      color: widget.enabled ? t.ink : t.mute,
    );

    final Widget? toggle = widget.obscure
        ? Semantics(
            button: true,
            label: _hide ? 'Show password' : 'Hide password',
            excludeSemantics: true,
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () => setState(() => _hide = !_hide),
              child: Container(
                constraints: const BoxConstraints(minWidth: 56, minHeight: 44),
                alignment: Alignment.center,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text(
                  _hide ? 'Show' : 'Hide',
                  style: type.ui(12, weight: FontWeight.w700, color: t.accText),
                ),
              ),
            ),
          )
        : null;

    final field = Container(
      constraints: BoxConstraints(
        minHeight: widget.height ?? (multi ? 96 : 50),
      ),
      decoration: BoxDecoration(
        color: widget.enabled ? t.card : t.sunk,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor, width: widget.borderWidth),
        boxShadow: widget.enabled && widget.shadow ? t.shadow : null,
      ),
      padding: EdgeInsets.only(
        left: 14,
        right: toggle != null || widget.suffix != null ? 4 : 14,
        top: multi ? 12 : 0,
        bottom: multi ? 12 : 0,
      ),
      child: Row(
        crossAxisAlignment: multi
            ? CrossAxisAlignment.start
            : CrossAxisAlignment.center,
        children: [
          if (widget.prefix != null) ...[
            widget.prefix!,
            const SizedBox(width: 8),
          ],
          Expanded(
            child: TextField(
              controller: widget.controller,
              focusNode: _focus,
              enabled: widget.enabled,
              obscureText: widget.obscure && _hide,
              keyboardType: widget.keyboardType,
              textInputAction: widget.textInputAction,
              inputFormatters: widget.inputFormatters,
              onChanged: widget.onChanged,
              onSubmitted: widget.onSubmitted,
              maxLines: widget.obscure ? 1 : widget.maxLines,
              minLines: widget.minLines,
              maxLength: widget.maxLength,
              autofocus: widget.autofocus,
              textCapitalization: widget.textCapitalization,
              autofillHints: widget.autofillHints,
              cursorColor: CydTokens.accent,
              style: style,
              decoration: InputDecoration(
                isCollapsed: true,
                border: InputBorder.none,
                counterText: '',
                hintText: widget.hint,
                hintStyle: style.copyWith(color: t.faint),
                contentPadding: multi
                    ? EdgeInsets.zero
                    : const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
          ?toggle,
          if (widget.suffix != null) widget.suffix!,
        ],
      ),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (widget.label != null) ...[
          Text(widget.label!.toUpperCase(), style: type.inputLabel),
          const SizedBox(height: 6),
        ],
        field,
        if (hasError) ...[
          const SizedBox(height: 6),
          Semantics(
            liveRegion: true,
            child: Text(widget.errorText!, style: type.error),
          ),
        ] else if (widget.helper != null) ...[
          const SizedBox(height: 6),
          Text(widget.helper!, style: type.bodySmall.copyWith(color: t.faint)),
        ],
      ],
    );
  }
}

/// Search field (height 48, 1 px accent border always, leading magnifier,
/// trailing clear button once there is text).
class CydSearchField extends StatefulWidget {
  const CydSearchField({
    super.key,
    required this.controller,
    this.hint = 'Search',
    this.onChanged,
    this.onSubmitted,
    this.autofocus = false,
  });

  final TextEditingController controller;
  final String hint;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final bool autofocus;

  @override
  State<CydSearchField> createState() => _CydSearchFieldState();
}

class _CydSearchFieldState extends State<CydSearchField> {
  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_rebuild);
  }

  void _rebuild() => setState(() {});

  @override
  void dispose() {
    widget.controller.removeListener(_rebuild);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final type = context.type;
    return Container(
      height: 48,
      padding: const EdgeInsets.only(left: 14, right: 4),
      decoration: BoxDecoration(
        color: t.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: CydTokens.accent),
      ),
      child: Row(
        children: [
          Icon(Icons.search, size: 20, color: t.ink),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              controller: widget.controller,
              autofocus: widget.autofocus,
              textInputAction: TextInputAction.search,
              onChanged: widget.onChanged,
              onSubmitted: widget.onSubmitted,
              cursorColor: CydTokens.accent,
              style: type.inputText,
              decoration: InputDecoration(
                isCollapsed: true,
                border: InputBorder.none,
                hintText: widget.hint,
                hintStyle: type.inputText.copyWith(color: t.faint),
              ),
            ),
          ),
          if (widget.controller.text.isNotEmpty)
            Semantics(
              button: true,
              label: 'Clear search',
              excludeSemantics: true,
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () {
                  widget.controller.clear();
                  widget.onChanged?.call('');
                },
                child: SizedBox(
                  width: 44,
                  height: 44,
                  child: Center(
                    child: Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: t.sunk,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.close, size: 14, color: t.mute),
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

/// UTR field (doc 02 §9.20): digits only, max 12, shown grouped 4-4-4 in DM
/// Mono. Read the value with `normalizeUtr(controller.text)`.
class CydUtrField extends StatelessWidget {
  const CydUtrField({
    super.key,
    required this.controller,
    this.errorText,
    this.onChanged,
    this.enabled = true,
    this.label = 'UPI Ref No (12 digits)',
    this.helper =
        '12-digit UPI Ref No (not the Transaction ID). Find it in your UPI '
        'app under the payment details.',
  });

  final TextEditingController controller;
  final String? errorText;
  final ValueChanged<String>? onChanged;
  final bool enabled;
  final String label;
  final String helper;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return ValueListenableBuilder<TextEditingValue>(
      valueListenable: controller,
      builder: (context, v, _) {
        final valid = isValidUtr(normalizeUtr(v.text));
        return CydTextField(
          label: label,
          controller: controller,
          enabled: enabled,
          height: 50,
          borderWidth: 1.5,
          borderColor: errorText != null
              ? t.danger
              : v.text.isEmpty
              ? t.line
              : CydTokens.accent,
          hint: '0000 0000 0000',
          helper: helper,
          errorText: errorText,
          keyboardType: TextInputType.number,
          inputFormatters: [_UtrFormatter()],
          onChanged: onChanged,
          textStyle: context.type.mono(
            16,
            color: t.ink,
            tracking: .06,
            height: 1,
          ),
          suffix: valid
              ? Padding(
                  padding: const EdgeInsets.only(right: 10),
                  child: Icon(Icons.check, size: 20, color: t.ok),
                )
              : null,
        );
      },
    );
  }
}

class _UtrFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    var digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    if (digits.length > 12) digits = digits.substring(0, 12);
    final grouped = groupUtr(digits);
    return TextEditingValue(
      text: grouped,
      selection: TextSelection.collapsed(offset: grouped.length),
    );
  }
}
