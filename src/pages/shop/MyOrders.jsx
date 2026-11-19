import React, { useCallback, useEffect, useState } from 'react';
import { Box, Typography, Card, CardActionArea, CardContent, CircularProgress, Button, Alert, useTheme } from '@mui/material';
import { ReceiptLong as OrdersIcon } from '@mui/icons-material';
import shopApi from '../../api/shopApi';
import { apiErrorMessage } from '../../utils/apiError';
import OrderStatusChip from '../../components/shop/OrderStatusChip';
import PaymentStatusChip from '../../components/shop/PaymentStatusChip';
import MoneyText from '../../components/shop/MoneyText';
import EmptyState from '../../components/shop/EmptyState';
import { useCountdown, formatDuration } from '../../components/shop/useCountdown';

const PayNowButton = ({ order, navigate }) => {
  const remaining = useCountdown(order.pay_seconds_left);
  if (!(remaining > 0)) return null;
  return (
    <Button
      variant="contained"
      size="small"
      onClick={() => navigate('pay', { orderId: order.id })}
      sx={{ borderRadius: 2 }}
    >
      Pay now · {formatDuration(remaining)}
    </Button>
  );
};

const MyOrders = ({ navigate }) => {
  const theme = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    shopApi
      .getMyOrders()
      .then((res) => {
        setOrders(res.data.orders || []);
        setError(null);
      })
      .catch((err) => setError(apiErrorMessage(err, 'Could not load orders')))
      .finally(() => setLoading(false));
  }, []);

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

  if (error) {
    return (
      <Alert severity="error" action={<Button onClick={load}>Retry</Button>}>
        {error}
      </Alert>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<OrdersIcon fontSize="inherit" />}
        title="No orders yet"
        subtitle="Your order history will show up here."
        actionLabel="Browse Marketplace"
        onAction={() => navigate('marketplace')}
      />
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        My Orders
      </Typography>
      {orders.map((order) => (
        <Card
          key={order.id}
          sx={{
            borderRadius: 3,
            mb: 2,
            border: `1px solid ${order.needs_action ? theme.palette.warning.main : theme.palette.divider}`,
          }}
        >
          <CardActionArea onClick={() => navigate('order-detail', { orderId: order.id })}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  #{order.order_number}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.shop_name} · {order.items?.length || 0} item(s) · {new Date(order.created_at).toLocaleDateString()}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.75, flexWrap: 'wrap' }}>
                  <OrderStatusChip status={order.status} />
                  <PaymentStatusChip status={order.payment_status} />
                </Box>
              </Box>
              <MoneyText paise={order.total_paise} variant="subtitle1" />
            </CardContent>
          </CardActionArea>
          {order.payment_status === 'awaiting_payment' && (
            <Box sx={{ px: 2, pb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <PayNowButton order={order} navigate={navigate} />
            </Box>
          )}
        </Card>
      ))}
    </Box>
  );
};

export default MyOrders;
