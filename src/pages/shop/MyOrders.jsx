import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, useTheme } from '@mui/material';
import { ReceiptLong as OrdersIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import shopApi from '../../api/shopApi';
import OrderStatusChip from '../../components/shop/OrderStatusChip';
import MoneyText from '../../components/shop/MoneyText';
import EmptyState from '../../components/shop/EmptyState';

const MyOrders = ({ navigate }) => {
  const theme = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    shopApi
      .getMyOrders()
      .then((res) => setOrders(res.data.orders || []))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load orders'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
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
          onClick={() => navigate('order-detail', { orderId: order.id })}
          sx={{
            borderRadius: 3,
            mb: 2,
            cursor: 'pointer',
            border: `1px solid ${theme.palette.divider}`,
            '&:hover': { borderColor: theme.palette.primary.main },
          }}
        >
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                #{order.order_number}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {order.shop_name} · {order.items?.length || 0} item(s) · {new Date(order.created_at).toLocaleDateString()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <MoneyText paise={order.total_paise} variant="subtitle1" />
              <OrderStatusChip status={order.status} />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default MyOrders;
