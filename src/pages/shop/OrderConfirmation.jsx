import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { CheckCircle as CheckIcon } from '@mui/icons-material';
import shopApi from '../../api/shopApi';
import { apiErrorMessage } from '../../utils/apiError';
import { formatMoney } from '../../utils/money';

const OrderConfirmation = ({ orderId, navigate }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    shopApi
      .getOrderById(orderId)
      .then((res) => setOrder(res.data.order))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load the order')))
      .finally(() => setLoading(false));
  }, [orderId]);

  const awaitingPayment = order?.payment_status === 'awaiting_payment';

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', textAlign: 'center', py: 6 }}>
      <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        Order placed
      </Typography>
      {loading && <CircularProgress size={24} />}
      {error && <Alert severity="warning">{error}</Alert>}
      {order && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Order #{order.order_number} for {formatMoney(order.total_paise)}.{' '}
          {order.payment_method === 'cod'
            ? 'Pay the seller in cash when you receive it.'
            : awaitingPayment
              ? "Now pay the seller's UPI ID to complete it."
              : 'The seller will update you here.'}
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        {awaitingPayment && (
          <Button variant="contained" onClick={() => navigate('pay', { orderId: order.id })} sx={{ borderRadius: 2 }}>
            Pay now
          </Button>
        )}
        <Button variant={awaitingPayment ? 'outlined' : 'contained'} onClick={() => navigate('orders')} sx={{ borderRadius: 2 }}>
          My Orders
        </Button>
        <Button onClick={() => navigate('marketplace')} sx={{ borderRadius: 2 }}>
          Continue shopping
        </Button>
      </Box>
    </Box>
  );
};

export default OrderConfirmation;
