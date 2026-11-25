import 'package:flutter/material.dart';

/// Glyph drawn in front of a status label. Chips always pair a glyph with
/// text (never colour alone); the glyphs are icons, not font characters, so
/// they render the same on every device.
enum StatusGlyph {
  timelapse, // the mock-up's half-filled circle
  dot,
  check,
  packed,
  arrow,
  cross,
  alert,
  pause,
  ring,
  archive,
  undo,
  rupee,
}

/// One entry of the status table (`design/tokens.json` -> `statusChips`).
@immutable
class CydStatusStyle {
  const CydStatusStyle({
    required this.label,
    required this.glyph,
    required this.darkFg,
    required this.lightFg,
    required this.scope,
  });

  /// Label; `{n}` is replaced by the day count (card validity) and `N` by
  /// the stock count (low stock).
  final String label;
  final StatusGlyph glyph;
  final Color darkFg;
  final Color lightFg;

  /// `order.status`, `order.payment_status`, `shop.status`,
  /// `product.status`, `product.stock` or `idcard.validity`.
  final String scope;

  Color fg(Brightness b) => b == Brightness.dark ? darkFg : lightFg;

  /// Chip background: the dark foreground at .14 (dark) / .2 (light) alpha.
  Color bg(Brightness b, double alpha) => darkFg.withValues(alpha: alpha);
}

/// Status table keyed by the server value (order status, payment status,
/// shop status, product status/stock, card validity).
const Map<String, CydStatusStyle> cydStatusStyles = {
  'pending_payment': CydStatusStyle(
    label: 'Awaiting payment',
    glyph: StatusGlyph.timelapse,
    darkFg: Color(0xFFFFC53D),
    lightFg: Color(0xFF8A5A00),
    scope: 'order.status',
  ),
  'placed': CydStatusStyle(
    label: 'Placed',
    glyph: StatusGlyph.dot,
    darkFg: Color(0xFF7CB2FF),
    lightFg: Color(0xFF1F5FC4),
    scope: 'order.status',
  ),
  'accepted': CydStatusStyle(
    label: 'Accepted',
    glyph: StatusGlyph.check,
    darkFg: Color(0xFFFFB547),
    lightFg: Color(0xFFA35400),
    scope: 'order.status',
  ),
  'packed': CydStatusStyle(
    label: 'Packed',
    glyph: StatusGlyph.packed,
    darkFg: Color(0xFFBBA2FF),
    lightFg: Color(0xFF5B3BC4),
    scope: 'order.status',
  ),
  'shipped': CydStatusStyle(
    label: 'Shipped',
    glyph: StatusGlyph.arrow,
    darkFg: Color(0xFF4FD1C5),
    lightFg: Color(0xFF0F7A70),
    scope: 'order.status',
  ),
  'delivered': CydStatusStyle(
    label: 'Delivered',
    glyph: StatusGlyph.check,
    darkFg: Color(0xFF3DD68C),
    lightFg: Color(0xFF1B7A3A),
    scope: 'order.status',
  ),
  'cancelled': CydStatusStyle(
    label: 'Cancelled',
    glyph: StatusGlyph.cross,
    darkFg: Color(0xFFA8A8B0),
    lightFg: Color(0xFF55555C),
    scope: 'order.status',
  ),
  'rejected': CydStatusStyle(
    label: 'Rejected',
    glyph: StatusGlyph.alert,
    darkFg: Color(0xFFFF6A55),
    lightFg: Color(0xFFB82A18),
    scope: 'order.status',
  ),
  'pending': CydStatusStyle(
    label: 'Pending review',
    glyph: StatusGlyph.timelapse,
    darkFg: Color(0xFFFFC53D),
    lightFg: Color(0xFF8A5A00),
    scope: 'shop.status',
  ),
  'approved': CydStatusStyle(
    label: 'Approved',
    glyph: StatusGlyph.check,
    darkFg: Color(0xFF3DD68C),
    lightFg: Color(0xFF1B7A3A),
    scope: 'shop.status',
  ),
  'suspended': CydStatusStyle(
    label: 'Suspended',
    glyph: StatusGlyph.pause,
    darkFg: Color(0xFFA8A8B0),
    lightFg: Color(0xFF55555C),
    scope: 'shop.status',
  ),
  'active': CydStatusStyle(
    label: 'Active',
    glyph: StatusGlyph.dot,
    darkFg: Color(0xFF3DD68C),
    lightFg: Color(0xFF1B7A3A),
    scope: 'product.status',
  ),
  'draft': CydStatusStyle(
    label: 'Draft',
    glyph: StatusGlyph.ring,
    darkFg: Color(0xFFA8A8B0),
    lightFg: Color(0xFF55555C),
    scope: 'product.status',
  ),
  'out': CydStatusStyle(
    label: 'Out of stock',
    glyph: StatusGlyph.alert,
    darkFg: Color(0xFFFF6A55),
    lightFg: Color(0xFFB82A18),
    scope: 'product.stock',
  ),
  'archived': CydStatusStyle(
    label: 'Archived',
    glyph: StatusGlyph.archive,
    darkFg: Color(0xFFA8A8B0),
    lightFg: Color(0xFF55555C),
    scope: 'product.status',
  ),
  'awaiting_payment': CydStatusStyle(
    label: 'Awaiting payment',
    glyph: StatusGlyph.timelapse,
    darkFg: Color(0xFFFFC53D),
    lightFg: Color(0xFF8A5A00),
    scope: 'order.payment_status',
  ),
  'claimed': CydStatusStyle(
    label: 'Paid — awaiting seller',
    glyph: StatusGlyph.timelapse,
    darkFg: Color(0xFF7CB2FF),
    lightFg: Color(0xFF1F5FC4),
    scope: 'order.payment_status',
  ),
  'confirmed': CydStatusStyle(
    label: 'Payment confirmed',
    glyph: StatusGlyph.check,
    darkFg: Color(0xFF3DD68C),
    lightFg: Color(0xFF1B7A3A),
    scope: 'order.payment_status',
  ),
  'disputed': CydStatusStyle(
    label: 'In dispute',
    glyph: StatusGlyph.alert,
    darkFg: Color(0xFFFF6A55),
    lightFg: Color(0xFFB82A18),
    scope: 'order.payment_status',
  ),
  'refund_due': CydStatusStyle(
    label: 'Refund due',
    glyph: StatusGlyph.undo,
    darkFg: Color(0xFFFFC53D),
    lightFg: Color(0xFF8A5A00),
    scope: 'order.payment_status',
  ),
  'refunded': CydStatusStyle(
    label: 'Refunded',
    glyph: StatusGlyph.undo,
    darkFg: Color(0xFFA8A8B0),
    lightFg: Color(0xFF55555C),
    scope: 'order.payment_status',
  ),
  'void': CydStatusStyle(
    label: 'No payment',
    glyph: StatusGlyph.ring,
    darkFg: Color(0xFFA8A8B0),
    lightFg: Color(0xFF55555C),
    scope: 'order.payment_status',
  ),
  'written_off': CydStatusStyle(
    label: 'Closed by admin',
    glyph: StatusGlyph.archive,
    darkFg: Color(0xFFA8A8B0),
    lightFg: Color(0xFF55555C),
    scope: 'order.payment_status',
  ),
  'cod_pending': CydStatusStyle(
    label: 'Cash on delivery',
    glyph: StatusGlyph.rupee,
    darkFg: Color(0xFFBBA2FF),
    lightFg: Color(0xFF5B3BC4),
    scope: 'order.payment_status',
  ),
  'cod_collected': CydStatusStyle(
    label: 'Cash collected',
    glyph: StatusGlyph.check,
    darkFg: Color(0xFF3DD68C),
    lightFg: Color(0xFF1B7A3A),
    scope: 'order.payment_status',
  ),
  'valid': CydStatusStyle(
    label: 'Valid',
    glyph: StatusGlyph.check,
    darkFg: Color(0xFF3DD68C),
    lightFg: Color(0xFF1B7A3A),
    scope: 'idcard.validity',
  ),
  'expiring': CydStatusStyle(
    label: 'Expires in {n} days',
    glyph: StatusGlyph.timelapse,
    darkFg: Color(0xFFFFC53D),
    lightFg: Color(0xFF8A5A00),
    scope: 'idcard.validity',
  ),
  'expired': CydStatusStyle(
    label: 'Expired',
    glyph: StatusGlyph.alert,
    darkFg: Color(0xFFFF6A55),
    lightFg: Color(0xFFB82A18),
    scope: 'idcard.validity',
  ),
  'stock_low': CydStatusStyle(
    label: 'Only N left',
    glyph: StatusGlyph.alert,
    darkFg: Color(0xFFFFC53D),
    lightFg: Color(0xFF8A5A00),
    scope: 'product.stock',
  ),
  'stock_ok': CydStatusStyle(
    label: 'In stock',
    glyph: StatusGlyph.check,
    darkFg: Color(0xFF3DD68C),
    lightFg: Color(0xFF1B7A3A),
    scope: 'product.stock',
  ),
};

/// Fallback for a server value the table does not know (never crash).
const CydStatusStyle cydUnknownStatus = CydStatusStyle(
  label: '',
  glyph: StatusGlyph.ring,
  darkFg: Color(0xFFA8A8B0),
  lightFg: Color(0xFF55555C),
  scope: 'unknown',
);
