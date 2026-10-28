import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { CheckCircle as CheckIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import shopApi from '../../api/shopApi';

const OrderConfirmation = ({ orderId, navigate }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    shopApi
      .getOrderById(orderId)
      .then((res) => setOrder(res.data.order))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load order'))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', textAlign: 'center', py: 6 }}>
      <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        Order Placed!
      </Typography>
      {loading ? (
        <CircularProgress size={24} />
      ) : (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Order #{order?.order_number || orderId} has been placed successfully.
          {order?.payment_method === 'cod' && ' Pay the shop owner on delivery.'}
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button variant="outlined" onClick={() => navigate('marketplace')} sx={{ borderRadius: 2 }}>
          Continue Shopping
        </Button>
        <Button variant="contained" onClick={() => navigate('orders')} sx={{ borderRadius: 2 }}>
          View My Orders
        </Button>
      </Box>
    </Box>
  );
};

export default OrderConfirmation;
