import React, { useCallback, useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Button, CircularProgress, Alert, useTheme } from '@mui/material';
import { CheckCircle as CheckIcon } from '@mui/icons-material';
import shopApi from '../../api/shopApi';
import { apiErrorMessage } from '../../utils/apiError';
import MoneyText from '../../components/shop/MoneyText';
import PaymentStatusChip from '../../components/shop/PaymentStatusChip';
import { useCountdown, formatDuration } from '../../components/shop/useCountdown';

const OrderRow = ({ order, navigate }) => {
  const theme = useTheme();
  const remaining = useCountdown(order.payment_status === 'awaiting_payment' ? order.pay_seconds_left : null);
  const needsPayment = order.payment_status === 'awaiting_payment' && remaining > 0;
  return (
    <Card sx={{ borderRadius: 3, mb: 2, border: `1px solid ${theme.palette.divider}` }}>
      <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {order.shop_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            #{order.order_number} · {order.payment_method === 'cod' ? 'Cash on delivery' : 'UPI'}
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <PaymentStatusChip status={order.payment_status} />
          </Box>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <MoneyText paise={order.total_paise} variant="subtitle1" />
          {needsPayment ? (
            <Button
              variant="contained"
              size="small"
              onClick={() => navigate('pay', { orderId: order.id })}
              sx={{ borderRadius: 2, mt: 1 }}
            >
              Pay now · {formatDuration(remaining)}
            </Button>
          ) : (
            <Button size="small" onClick={() => navigate('order-detail', { orderId: order.id })} sx={{ mt: 1 }}>
              View
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// After a checkout that spans several shops: each shop is paid separately, straight to its own
// UPI ID, so the buyer works through this list.
const PayCheckout = ({ checkoutId, navigate }) => {
  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    shopApi
      .getCheckout(checkoutId)
      .then((res) => {
        setCheckout(res.data.checkout);
        setError(null);
      })
      .catch((err) => setError(apiErrorMessage(err, 'Could not load your orders')))
      .finally(() => setLoading(false));
  }, [checkoutId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !checkout) {
    return (
      <Alert severity="error" action={<Button onClick={load}>Retry</Button>}>
        {error || 'Checkout not found'}
      </Alert>
    );
  }

  const unpaid = checkout.orders.filter((o) => o.payment_status === 'awaiting_payment');

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <CheckIcon sx={{ fontSize: 48, color: 'success.main' }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Orders placed
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {unpaid.length > 0
            ? `Pay each shop separately — the money goes straight to that shop's UPI ID. ${unpaid.length} payment${unpaid.length > 1 ? 's' : ''} left.`
            : 'Nothing left to pay right now.'}
        </Typography>
      </Box>
      {checkout.orders.map((order) => (
        <OrderRow key={order.id} order={order} navigate={navigate} />
      ))}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3, flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={() => navigate('orders')} sx={{ borderRadius: 2 }}>
          My Orders
        </Button>
        <Button onClick={() => navigate('marketplace')} sx={{ borderRadius: 2 }}>
          Continue shopping
        </Button>
      </Box>
    </Box>
  );
};

export default PayCheckout;
