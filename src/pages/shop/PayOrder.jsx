import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  ArrowBack as BackIcon,
  CheckCircle as CheckIcon,
  HourglassTop as HourglassIcon,
  OpenInNew as OpenIcon,
  QrCode2 as QrIcon,
  PhotoCamera as PhotoIcon,
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';
import shopApi from '../../api/shopApi';
import { apiErrorMessage } from '../../utils/apiError';
import { formatMoney } from '../../utils/money';
import { resizeImageToDataUrl } from '../../utils/image';
import { useCountdown, formatDuration } from '../../components/shop/useCountdown';

const POLL_MS = 15000;
export const normalizeUtr = (value) => String(value || '').replace(/[\s-]/g, '');
export const isValidUtr = (value) => /^\d{12}$/.test(normalizeUtr(value));

const copyText = async (text, label) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch {
    toast.info(`Select and copy the ${label.toLowerCase()} manually`);
  }
};

const CopyRow = ({ label, value, big }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, py: 1 }}>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant={big ? 'h5' : 'body1'} sx={{ fontWeight: 700, wordBreak: 'break-all' }}>
        {value}
      </Typography>
    </Box>
    <Tooltip title={`Copy ${label.toLowerCase()}`}>
      <IconButton onClick={() => copyText(value, label)} aria-label={`Copy ${label.toLowerCase()}`}>
        <CopyIcon />
      </IconButton>
    </Tooltip>
  </Box>
);

const StateCard = ({ icon, title, children }) => (
  <Card sx={{ borderRadius: 4, textAlign: 'center' }}>
    <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
      <Box sx={{ fontSize: 56, mb: 1 }}>{icon}</Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
        {title}
      </Typography>
      {children}
    </CardContent>
  </Card>
);

// Buyer's payment screen. Money goes straight from the buyer's UPI app to the seller's UPI ID;
// the platform never holds it. The buyer then reports the 12-digit UPI reference (UTR) and the
// seller confirms it against their bank app.
const PayOrder = ({ orderId, navigate }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [utr, setUtr] = useState('');
  const [utrTouched, setUtrTouched] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await shopApi.getOrderById(orderId);
      setOrder(res.data.order);
      setLoadError(null);
    } catch (err) {
      setLoadError(apiErrorMessage(err, 'Could not load this order'));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  // While waiting on the seller (or on the payment window), refresh periodically.
  const status = order?.payment_status;
  useEffect(() => {
    if (status !== 'claimed' && status !== 'awaiting_payment') return undefined;
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [status, load]);

  const payRemaining = useCountdown(order?.pay_seconds_left ?? null);
  const confirmRemaining = useCountdown(order?.confirm_seconds_left ?? null);

  // When the visible countdown hits zero, ask the server: it decides whether the grace period
  // still allows a claim.
  useEffect(() => {
    if (status === 'awaiting_payment' && payRemaining === 0) load();
  }, [payRemaining, status, load]);

  const handleScreenshot = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setScreenshot(await resizeImageToDataUrl(file));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const submitClaim = async () => {
    setUtrTouched(true);
    if (!isValidUtr(utr)) return;
    setSubmitting(true);
    try {
      const res = editing
        ? await shopApi.editClaim(orderId, normalizeUtr(utr))
        : await shopApi.claimPayment(orderId, { utr: normalizeUtr(utr), screenshot: screenshot || undefined });
      setOrder(res.data.order);
      setEditing(false);
      setUtr('');
      setUtrTouched(false);
      toast.success(editing ? 'UPI reference updated' : 'Payment reported. The seller will confirm it.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const back = (
    <Button startIcon={<BackIcon />} onClick={() => navigate('orders')} sx={{ mb: 2 }}>
      My Orders
    </Button>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loadError || !order) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto' }}>
        {back}
        <Alert severity="error" action={<Button onClick={load}>Retry</Button>}>
          {loadError || 'Order not found'}
        </Alert>
      </Box>
    );
  }

  const actions = order.allowed_actions || [];
  const utrError = utrTouched && !isValidUtr(utr);
  const viewDetails = (
    <Button variant="outlined" onClick={() => navigate('order-detail', { orderId: order.id })} sx={{ borderRadius: 2, mt: 2 }}>
      View order details
    </Button>
  );

  const utrForm = (submitLabel) => (
    <Box>
      <TextField
        fullWidth
        label="UPI reference number (UTR)"
        value={utr}
        onChange={(e) => setUtr(e.target.value)}
        onBlur={() => setUtrTouched(true)}
        error={utrError}
        helperText={
          utrError
            ? 'Enter the 12-digit UPI Ref No exactly as your UPI app shows it'
            : '12-digit UPI Ref No (not the Transaction ID). Find it in your UPI app under the payment details.'
        }
        inputProps={{ inputMode: 'numeric', autoComplete: 'off', 'aria-label': 'UPI reference number' }}
        sx={{ mb: 2 }}
      />
      {!editing && (
        <Box sx={{ mb: 2 }}>
          <Button variant="text" component="label" startIcon={<PhotoIcon />} size="small">
            {screenshot ? 'Change screenshot' : 'Attach payment screenshot (optional)'}
            <input type="file" hidden accept="image/*" onChange={handleScreenshot} />
          </Button>
          {screenshot && (
            <Typography variant="caption" color="success.main" sx={{ display: 'block' }}>
              Screenshot attached. Only you, the seller, and an admin (if there's a dispute) can see it.
            </Typography>
          )}
        </Box>
      )}
      <Button
        fullWidth
        size="large"
        variant="contained"
        onClick={submitClaim}
        disabled={submitting}
        startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
        sx={{ borderRadius: 2, py: 1.5 }}
      >
        {submitLabel}
      </Button>
    </Box>
  );

  // ---- Awaiting payment: show where and how much to pay ----
  if (status === 'awaiting_payment' && actions.includes('claim') && order.payee) {
    const urgent = payRemaining !== null && payRemaining < 5 * 60;
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto' }}>
        {back}
        <Card sx={{ borderRadius: 4, mb: 2 }}>
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Pay {order.shop_name}
              </Typography>
              <Box
                role="timer"
                aria-label="Time left to pay"
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  bgcolor: alpha(urgent ? theme.palette.error.main : theme.palette.warning.main, 0.12),
                  color: urgent ? 'error.main' : 'warning.dark',
                }}
              >
                {payRemaining > 0 ? `${formatDuration(payRemaining)} left` : 'Time is up'}
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Your money goes directly to the seller's UPI ID. CYD Shop never holds it.
            </Typography>

            <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.06), borderRadius: 3, px: 2, py: 1 }}>
              <CopyRow label="Seller's UPI ID" value={order.payee.upi_id} big />
              <Divider />
              <CopyRow label="Exact amount" value={formatMoney(order.total_paise)} />
              <Divider />
              <CopyRow label="Order reference (add as note)" value={order.order_number} />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Paying to: {order.payee.name}. Pay the exact amount in one payment.
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
              {order.payee.upi_link && (
                <Button variant="outlined" startIcon={<OpenIcon />} href={order.payee.upi_link} sx={{ borderRadius: 2 }}>
                  Open UPI app
                </Button>
              )}
              {order.payee.upi_link && (
                <Button variant="text" startIcon={<QrIcon />} onClick={() => setShowQr((s) => !s)} sx={{ borderRadius: 2 }}>
                  {showQr || isDesktop ? 'QR code' : 'Show QR code'}
                </Button>
              )}
            </Box>
            {order.payee.upi_link && (showQr || isDesktop) && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
                <Box sx={{ p: 1.5, bgcolor: '#fff', borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                  <QRCodeSVG value={order.payee.upi_link} size={180} includeMargin={false} aria-label="UPI payment QR code" />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  Scan with any UPI app. If the app refuses, copy the UPI ID above instead.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
              After paying, enter the UPI reference
            </Typography>
            {utrForm('I have paid')}
          </CardContent>
        </Card>
        <Box sx={{ textAlign: 'center' }}>{viewDetails}</Box>
      </Box>
    );
  }

  // ---- Claimed: waiting for the seller ----
  if (status === 'claimed') {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto' }}>
        {back}
        <StateCard icon={<HourglassIcon fontSize="inherit" color="info" />} title="Waiting for the seller to confirm">
          <Typography variant="body2" color="text.secondary">
            You reported paying {formatMoney(order.total_paise)} with UPI Ref No <strong>{order.claim?.utr}</strong>. The seller will
            check their bank app and confirm.
          </Typography>
          {confirmRemaining > 0 && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Seller has {formatDuration(confirmRemaining)} to confirm.
            </Typography>
          )}
          {actions.includes('dispute') && (order.dispute_reasons || []).includes('not_confirmed') && (
            <Alert severity="warning" sx={{ mt: 2, textAlign: 'left' }}>
              The seller hasn't confirmed in time. You can open a dispute from the order page.
            </Alert>
          )}
          {actions.includes('edit_claim') && !editing && (
            <Button size="small" onClick={() => setEditing(true)} sx={{ mt: 2 }}>
              Entered the wrong reference? Correct it
            </Button>
          )}
          {editing && <Box sx={{ mt: 2, textAlign: 'left' }}>{utrForm('Save corrected reference')}</Box>}
          <Box>{viewDetails}</Box>
        </StateCard>
      </Box>
    );
  }

  if (status === 'cod_pending' || status === 'cod_collected') {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto' }}>
        {back}
        <StateCard icon={<CheckIcon fontSize="inherit" color="success" />} title="Cash on delivery">
          <Typography variant="body2" color="text.secondary">
            Nothing to pay online for order #{order.order_number}. Pay {order.shop_name} in cash when you receive it.
          </Typography>
          {viewDetails}
        </StateCard>
      </Box>
    );
  }

  if (status === 'confirmed') {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto' }}>
        {back}
        <StateCard icon={<CheckIcon fontSize="inherit" color="success" />} title="Payment confirmed">
          <Typography variant="body2" color="text.secondary">
            {order.shop_name} confirmed your payment for order #{order.order_number}. They will now prepare your order.
          </Typography>
          {viewDetails}
        </StateCard>
      </Box>
    );
  }

  if (status === 'void' || status === 'awaiting_payment') {
    const canReport = (order.dispute_reasons || []).includes('paid_after_cancel');
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto' }}>
        {back}
        <StateCard icon={<HourglassIcon fontSize="inherit" color="disabled" />} title="This order is no longer waiting for payment">
          <Typography variant="body2" color="text.secondary">
            {order.cancel_reason || 'The order was cancelled.'} Do not send any money for it.
          </Typography>
          {canReport && (
            <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
              Already paid? Open the order and report it with your UPI reference and a screenshot; the seller will refund you.
            </Alert>
          )}
          {viewDetails}
        </StateCard>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      {back}
      <StateCard icon={<HourglassIcon fontSize="inherit" color="warning" />} title={status === 'disputed' ? 'This order is in dispute' : 'Payment update'}>
        <Typography variant="body2" color="text.secondary">
          {status === 'disputed'
            ? 'An admin is reviewing this order. Follow updates and add details in the order chat.'
            : 'See the order page for the latest status.'}
        </Typography>
        {viewDetails}
      </StateCard>
    </Box>
  );
};

export default PayOrder;
