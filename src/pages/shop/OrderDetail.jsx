import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Divider,
  Alert,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  RadioGroup,
  Radio,
  FormControlLabel,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { ArrowBack as BackIcon, PhotoCamera as PhotoIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import shopApi from '../../api/shopApi';
import { apiErrorMessage } from '../../utils/apiError';
import { formatMoney } from '../../utils/money';
import { resizeImageToDataUrl } from '../../utils/image';
import OrderStatusChip from '../../components/shop/OrderStatusChip';
import PaymentStatusChip from '../../components/shop/PaymentStatusChip';
import MoneyText from '../../components/shop/MoneyText';
import OrderChat from '../../components/shop/OrderChat';
import EvidenceUpload from '../../components/shop/EvidenceUpload';
import { useCountdown, formatDuration } from '../../components/shop/useCountdown';
import { normalizeUtr, isValidUtr } from './PayOrder';

export const DISPUTE_REASON_LABEL = {
  not_received: "I haven't received this payment",
  wrong_amount: 'The amount I received is wrong',
  not_confirmed: "The seller hasn't confirmed my payment",
  paid_after_cancel: 'I paid, but the order was cancelled',
  refund_not_received: "I haven't received my refund",
  not_delivered: 'My order was not delivered',
  other: 'Something else',
};

export const RESOLUTION_LABEL = {
  payment_confirmed: 'Payment was received — confirm it',
  claim_rejected: 'No valid payment — reject the claim',
  refund_required: 'The seller must refund the buyer',
  fulfilment_ordered: 'The seller must deliver the order',
  refund_confirmed: 'The refund was made — close',
  closed_unrecoverable: 'Close as unrecoverable',
};

export const RESOLUTIONS_BY_ORIGIN = {
  claimed: ['payment_confirmed', 'claim_rejected', 'refund_required'],
  void: ['refund_required', 'claim_rejected'],
  confirmed: ['refund_required', 'fulfilment_ordered'],
  refund_due: ['refund_confirmed', 'refund_required', 'closed_unrecoverable'],
  refunded: ['refund_confirmed', 'refund_required', 'closed_unrecoverable'],
};

const ADVANCE_LABEL = {
  accepted: 'Accept order',
  packed: 'Mark as packed',
  shipped: 'Mark as shipped',
  delivered: 'Mark as delivered',
};

const POLL_MS = 20000;
const LIVE_STATES = ['awaiting_payment', 'claimed', 'disputed', 'refund_due'];

const Section = ({ title, children }) => {
  const theme = useTheme();
  return (
    <Box sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, p: { xs: 2, sm: 3 }, mb: 3 }}>
      {title && (
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          {title}
        </Typography>
      )}
      {children}
    </Box>
  );
};

const ActionDialog = ({ open, title, children, confirmLabel, confirmColor = 'primary', busy, disabled, onConfirm, onClose }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy}>
          Back
        </Button>
        <Button
          variant="contained"
          color={confirmColor}
          onClick={onConfirm}
          disabled={busy || disabled}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ borderRadius: 2 }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const banner = (order, role, payLeft, confirmLeft, proofLeft) => {
  const amount = formatMoney(order.total_paise);
  const openDispute = (order.disputes || []).find((d) => d.status === 'open');
  switch (order.payment_status) {
    case 'awaiting_payment':
      return role === 'buyer'
        ? { severity: 'warning', text: `Pay ${amount} directly to the seller's UPI ID${payLeft ? ` within ${formatDuration(payLeft)}` : ''}, then enter the UPI reference.` }
        : { severity: 'info', text: `Waiting for the buyer to pay ${amount}${payLeft ? ` (${formatDuration(payLeft)} left)` : ''}. Don't ship anything yet.` };
    case 'claimed':
      return role === 'seller'
        ? { severity: 'warning', text: `The buyer says they paid ${amount} with UPI Ref No ${order.claim?.utr}. Check your bank app, then confirm${confirmLeft ? ` within ${formatDuration(confirmLeft)}` : ''}.` }
        : { severity: 'info', text: `You reported paying ${amount}. The seller has ${confirmLeft ? formatDuration(confirmLeft) : 'a little time'} to confirm.` };
    case 'confirmed':
      return role === 'seller'
        ? { severity: 'success', text: 'Payment confirmed. Prepare the order and update its status as you go.' }
        : { severity: 'success', text: 'The seller confirmed your payment and is preparing your order.' };
    case 'disputed': {
      const proofNote =
        role === 'buyer' && openDispute?.reason === 'not_received' && proofLeft > 0
          ? ` Upload your payment screenshot below within ${formatDuration(proofLeft)}, or the claim will be rejected.`
          : '';
      return { severity: 'error', text: `An admin is reviewing a dispute on this order. Add details in the chat.${proofNote}` };
    }
    case 'refund_due':
      return role === 'seller'
        ? { severity: 'warning', text: `You must refund ${amount} to the buyer by UPI, then enter the refund's UPI Ref No below.` }
        : { severity: 'info', text: `The seller owes you a refund of ${amount}.` };
    case 'refunded':
      return { severity: 'success', text: `A refund of ${amount} was recorded${order.claim?.refund_utr ? ` (UPI Ref No ${order.claim.refund_utr})` : ''}.` };
    case 'void':
      return { severity: 'info', text: `No payment is due for this order.${order.cancel_reason ? ` ${order.cancel_reason}.` : ''}` };
    case 'written_off':
      return { severity: 'info', text: 'An admin closed this order after a dispute.' };
    case 'cod_pending':
      return { severity: 'info', text: `Cash on delivery: pay ${amount} to the seller when you receive the order.` };
    case 'cod_collected':
      return { severity: 'success', text: 'Delivered and paid in cash.' };
    default:
      return null;
  }
};

const OrderDetail = ({ orderId, navigate, backView = 'orders' }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [dialog, setDialog] = useState(null); // 'confirm' | 'reject' | 'refund' | 'cancel' | 'dispute' | 'advance'
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({});

  const load = useCallback(async () => {
    try {
      const res = await shopApi.getOrderById(orderId);
      setOrder(res.data.order);
      setLoadError(null);
    } catch (err) {
      setLoadError(apiErrorMessage(err, 'Could not load order'));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const live = order && LIVE_STATES.includes(order.payment_status);
  useEffect(() => {
    if (!live) return undefined;
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [live, load]);

  const openDispute = order?.disputes?.find((d) => d.status === 'open');
  const payLeft = useCountdown(order?.pay_seconds_left ?? null);
  const confirmLeft = useCountdown(order?.confirm_seconds_left ?? null);
  const proofLeft = useCountdown(openDispute ? openDispute.proof_seconds_left ?? null : null);

  const openDialog = (name, initial = {}) => {
    setForm(initial);
    setDialog(name);
  };

  const run = async (fn, successMessage) => {
    setBusy(true);
    try {
      const res = await fn();
      if (res?.data?.order) setOrder(res.data.order);
      else await load();
      toast.success(successMessage);
      setDialog(null);
    } catch (err) {
      toast.error(apiErrorMessage(err));
      load();
    } finally {
      setBusy(false);
    }
  };

  const pickScreenshot = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const screenshot = await resizeImageToDataUrl(file);
      setForm((f) => ({ ...f, screenshot }));
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const backButton = (
    <Button startIcon={<BackIcon />} onClick={() => navigate(backView)} sx={{ mb: 2 }}>
      Back
    </Button>
  );

  if (loadError || !order) {
    return (
      <Box>
        {backButton}
        <Alert severity="error" action={<Button onClick={load}>Retry</Button>}>
          {loadError || 'Order not found.'}
        </Alert>
      </Box>
    );
  }

  const role = order.viewer_role;
  const actions = order.allowed_actions || [];
  const has = (a) => actions.includes(a);
  const advances = actions.filter((a) => a.startsWith('advance:')).map((a) => a.split(':')[1]);
  const info = banner(order, role, payLeft, confirmLeft, proofLeft);
  const showChat = role === 'buyer' || role === 'seller' || (role === 'admin' && (order.disputes || []).length > 0);
  const disputeReason = form.reason;
  const needsUtr = disputeReason === 'paid_after_cancel';
  const needsShot = disputeReason === 'paid_after_cancel';

  return (
    <Box>
      {backButton}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 1, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Order #{order.order_number}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {order.shop_name} · {new Date(order.created_at).toLocaleString()}
            {role !== 'buyer' && order.customer_username ? ` · Buyer: ${order.customer_username}` : ''}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <OrderStatusChip status={order.status} />
          <PaymentStatusChip status={order.payment_status} />
        </Box>
      </Box>

      {info && (
        <Alert severity={info.severity} sx={{ mb: 2, borderRadius: 2 }}>
          {info.text}
        </Alert>
      )}

      {/* Actions: only what the server says this viewer may do right now. */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
        {has('claim') && (
          <Button variant="contained" onClick={() => navigate('pay', { orderId: order.id })} sx={{ borderRadius: 2 }}>
            Pay now
          </Button>
        )}
        {has('edit_claim') && (
          <Button variant="outlined" onClick={() => navigate('pay', { orderId: order.id })} sx={{ borderRadius: 2 }}>
            Correct UPI reference
          </Button>
        )}
        {has('confirm') && (
          <Button variant="contained" color="success" onClick={() => openDialog('confirm')} sx={{ borderRadius: 2 }}>
            Confirm payment received
          </Button>
        )}
        {advances.map((next) => (
          <Button
            key={next}
            variant="contained"
            onClick={() => run(() => shopApi.updateOrderStatus(order.id, next), `Order marked as ${next}`)}
            disabled={busy}
            sx={{ borderRadius: 2 }}
          >
            {ADVANCE_LABEL[next] || next}
          </Button>
        ))}
        {has('refund') && (
          <Button variant="contained" color="warning" onClick={() => openDialog('refund', { refundUtr: '' })} sx={{ borderRadius: 2 }}>
            Record refund
          </Button>
        )}
        {has('reject') && (
          <Button variant="outlined" color="error" onClick={() => openDialog('reject', { reason: '' })} sx={{ borderRadius: 2 }}>
            Reject order
          </Button>
        )}
        {has('cancel') && (
          <Button variant="outlined" color="error" onClick={() => openDialog('cancel', { reason: '' })} sx={{ borderRadius: 2 }}>
            Cancel order
          </Button>
        )}
        {has('dispute') && (
          <Button
            variant="outlined"
            color="warning"
            onClick={() => openDialog('dispute', { reason: order.dispute_reasons?.[0] || '', description: '', utr: '' })}
            sx={{ borderRadius: 2 }}
          >
            {role === 'seller' && order.dispute_reasons?.includes('not_received') ? 'Payment not received' : 'Report a problem'}
          </Button>
        )}
      </Box>

      {role === 'admin' && has('resolve') && openDispute && (
        <Card sx={{ borderRadius: 3, mb: 3, border: '2px solid', borderColor: 'warning.main' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Resolve dispute
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Opened by the {openDispute.opened_by_role}: {DISPUTE_REASON_LABEL[openDispute.reason] || openDispute.reason}
              {openDispute.description ? ` — “${openDispute.description}”` : ''}. Review the chat and screenshots below before deciding.
            </Typography>
            <RadioGroup value={form.resolution || ''} onChange={(e) => setForm((f) => ({ ...f, resolution: e.target.value }))}>
              {(RESOLUTIONS_BY_ORIGIN[openDispute.origin_payment_status] || []).map((r) => (
                <FormControlLabel key={r} value={r} control={<Radio />} label={RESOLUTION_LABEL[r] || r} />
              ))}
            </RadioGroup>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Note explaining the decision (required, both parties will see it)"
              value={form.note || ''}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              inputProps={{ maxLength: 1000 }}
              sx={{ mt: 1, mb: 2 }}
            />
            <Button
              variant="contained"
              disabled={busy || !form.resolution || !(form.note || '').trim()}
              onClick={() =>
                run(
                  () => shopApi.adminResolveDispute(openDispute.id, { resolution: form.resolution, note: form.note.trim() }),
                  'Dispute resolved'
                ).then(() => setForm({}))
              }
              sx={{ borderRadius: 2 }}
            >
              Resolve
            </Button>
          </CardContent>
        </Card>
      )}

      <Section title="Items">
        {order.items?.map((item) => (
          <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, gap: 2 }}>
            <Typography variant="body2">
              {item.product_title_snapshot} × {item.quantity}
            </Typography>
            <MoneyText paise={item.line_total_paise} variant="body2" />
          </Box>
        ))}
        <Divider sx={{ my: 1.5 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Total
          </Typography>
          <MoneyText paise={order.total_paise} variant="subtitle1" />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {order.payment_method === 'upi' ? 'UPI, paid directly to the seller' : 'Cash on delivery'}
          {order.claim?.utr ? ` · UPI Ref No ${order.claim.utr}` : ''}
          {order.claim?.refund_utr ? ` · Refund Ref No ${order.claim.refund_utr}` : ''}
        </Typography>
      </Section>

      {order.full_name && (
        <Section title="Delivery address">
          <Typography variant="body2">
            {order.full_name} · {order.phone}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {order.line1}, {order.line2 ? `${order.line2}, ` : ''}
            {order.city}, {order.state} - {order.pincode}
          </Typography>
        </Section>
      )}

      {(order.disputes || []).length > 0 && (
        <Section title="Disputes">
          {order.disputes.map((d) => (
            <Box key={d.id} sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {DISPUTE_REASON_LABEL[d.reason] || d.reason} · {d.status === 'open' ? 'Open' : 'Resolved'}
              </Typography>
              {d.status === 'resolved' && (
                <Typography variant="body2" color="text.secondary">
                  {RESOLUTION_LABEL[d.resolution] || d.resolution}
                  {d.resolution_note ? ` — ${d.resolution_note}` : ''}
                </Typography>
              )}
            </Box>
          ))}
        </Section>
      )}

      {order.payment_method === 'upi' && showChat && (
        <Section title="Payment screenshots">
          <EvidenceUpload orderId={order.id} viewerRole={role} canUpload={has('upload_evidence')} onUploaded={load} />
        </Section>
      )}

      {showChat && (
        <Section title="Messages">
          <OrderChat orderId={order.id} viewerRole={role} canWrite={has('chat')} />
        </Section>
      )}

      {/* ---- dialogs ---- */}
      <ActionDialog
        open={dialog === 'confirm'}
        title="Confirm you received the payment"
        confirmLabel="Yes, I received it"
        confirmColor="success"
        busy={busy}
        onClose={() => setDialog(null)}
        onConfirm={() => run(() => shopApi.confirmPayment(order.id, order.claim?.utr), 'Payment confirmed')}
      >
        <Typography variant="body1" sx={{ mb: 1 }}>
          Open your bank or UPI app and look for a credit of <strong>{formatMoney(order.total_paise)}</strong> with UPI Ref No{' '}
          <strong>{order.claim?.utr}</strong>.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Only confirm if you can see the money in your account. If it isn't there, go back and choose “Payment not received”.
        </Typography>
      </ActionDialog>

      <ActionDialog
        open={dialog === 'reject'}
        title="Reject this order"
        confirmLabel="Reject order"
        confirmColor="error"
        busy={busy}
        onClose={() => setDialog(null)}
        onConfirm={() => run(() => shopApi.updateOrderStatus(order.id, 'rejected', form.reason || undefined), 'Order rejected')}
      >
        {order.payment_status === 'confirmed' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            The buyer has already paid. After rejecting, you must refund {formatMoney(order.total_paise)} and record the refund.
          </Alert>
        )}
        <TextField
          fullWidth
          label="Reason (shown to the buyer)"
          value={form.reason || ''}
          onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          inputProps={{ maxLength: 500 }}
        />
      </ActionDialog>

      <ActionDialog
        open={dialog === 'refund'}
        title="Record your refund"
        confirmLabel="Save refund"
        busy={busy}
        disabled={!isValidUtr(form.refundUtr)}
        onClose={() => setDialog(null)}
        onConfirm={() => run(() => shopApi.markRefunded(order.id, normalizeUtr(form.refundUtr)), 'Refund recorded')}
      >
        <Typography variant="body2" sx={{ mb: 2 }}>
          Send {formatMoney(order.total_paise)} back to the buyer from your UPI app, then enter that refund's 12-digit UPI Ref No.
        </Typography>
        <TextField
          fullWidth
          label="Refund UPI Ref No"
          value={form.refundUtr || ''}
          onChange={(e) => setForm((f) => ({ ...f, refundUtr: e.target.value }))}
          error={Boolean(form.refundUtr) && !isValidUtr(form.refundUtr)}
          helperText="12 digits, from the refund's payment details"
          inputProps={{ inputMode: 'numeric' }}
        />
      </ActionDialog>

      <ActionDialog
        open={dialog === 'cancel'}
        title="Cancel this order?"
        confirmLabel="Cancel order"
        confirmColor="error"
        busy={busy}
        onClose={() => setDialog(null)}
        onConfirm={() => run(() => shopApi.cancelOrder(order.id, form.reason || undefined), 'Order cancelled')}
      >
        {has('claim') && (
          <Alert
            severity="info"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={() => navigate('pay', { orderId: order.id })}>
                Enter UTR
              </Button>
            }
          >
            Already paid? Submit your UPI reference instead of cancelling.
          </Alert>
        )}
        <TextField
          fullWidth
          label="Reason (optional)"
          value={form.reason || ''}
          onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          inputProps={{ maxLength: 500 }}
        />
      </ActionDialog>

      <ActionDialog
        open={dialog === 'dispute'}
        title={role === 'seller' ? 'Report a payment problem' : 'Report a problem'}
        confirmLabel="Send to admin"
        confirmColor="warning"
        busy={busy}
        disabled={!disputeReason || (needsUtr && !isValidUtr(form.utr)) || (needsShot && !form.screenshot)}
        onClose={() => setDialog(null)}
        onConfirm={() =>
          run(
            () =>
              shopApi.openDispute(order.id, {
                reason: disputeReason,
                description: form.description || undefined,
                utr: needsUtr ? normalizeUtr(form.utr) : undefined,
                screenshot: form.screenshot || undefined,
              }),
            'Sent to an admin for review'
          )
        }
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          An admin will look at the order, the chat, and any screenshots, then decide.
        </Typography>
        <RadioGroup value={disputeReason || ''} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}>
          {(order.dispute_reasons || []).map((r) => (
            <FormControlLabel key={r} value={r} control={<Radio />} label={DISPUTE_REASON_LABEL[r] || r} />
          ))}
        </RadioGroup>
        {needsUtr && (
          <TextField
            fullWidth
            label="UPI Ref No of your payment"
            value={form.utr || ''}
            onChange={(e) => setForm((f) => ({ ...f, utr: e.target.value }))}
            error={Boolean(form.utr) && !isValidUtr(form.utr)}
            helperText="12 digits"
            inputProps={{ inputMode: 'numeric' }}
            sx={{ mt: 1 }}
          />
        )}
        <TextField
          fullWidth
          multiline
          minRows={2}
          label="What happened? (optional)"
          value={form.description || ''}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          inputProps={{ maxLength: 1000 }}
          sx={{ mt: 2 }}
        />
        {role === 'buyer' && (
          <Box sx={{ mt: 2 }}>
            <Button variant="outlined" component="label" size="small" startIcon={<PhotoIcon />}>
              {form.screenshot ? 'Change screenshot' : `Attach payment screenshot${needsShot ? ' (required)' : ''}`}
              <input type="file" hidden accept="image/*" onChange={pickScreenshot} />
            </Button>
            {disputeReason === 'not_confirmed' && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                A screenshot is required unless you already uploaded one.
              </Typography>
            )}
            {form.screenshot && (
              <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>
                Screenshot attached.
              </Typography>
            )}
          </Box>
        )}
      </ActionDialog>
    </Box>
  );
};

export default OrderDetail;
