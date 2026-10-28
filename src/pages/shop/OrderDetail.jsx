import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress, Divider, Chip, useTheme } from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import shopApi from '../../api/shopApi';
import OrderStatusChip from '../../components/shop/OrderStatusChip';
import MoneyText from '../../components/shop/MoneyText';

const NEXT_ACTIONS = {
  placed: [{ status: 'accepted', label: 'Accept Order', color: 'primary' }, { status: 'rejected', label: 'Reject', color: 'error' }],
  accepted: [{ status: 'packed', label: 'Mark as Packed', color: 'primary' }, { status: 'rejected', label: 'Reject', color: 'error' }],
  packed: [{ status: 'shipped', label: 'Mark as Shipped', color: 'primary' }],
  shipped: [{ status: 'delivered', label: 'Mark as Delivered', color: 'success' }],
};

const OrderDetail = ({ orderId, navigate, currentUserId, backView = 'orders' }) => {
  const theme = useTheme();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = () => {
    setLoading(true);
    shopApi
      .getOrderById(orderId)
      .then((res) => setOrder(res.data.order))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load order'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [orderId]);

  const isCustomer = order?.customer_user_id === currentUserId;
  const isShopOwner = order?.owner_user_id === currentUserId;

  const handleStatusChange = async (status) => {
    setUpdating(true);
    try {
      await shopApi.updateOrderStatus(orderId, status);
      toast.success(`Order marked as ${status}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    setUpdating(true);
    try {
      await shopApi.cancelOrder(orderId);
      toast.success('Order cancelled');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!order) {
    return <Typography>Order not found.</Typography>;
  }

  const canCancel = isCustomer && ['pending_payment', 'placed'].includes(order.status);
  const canPayNow =
    isCustomer &&
    order.payment_method === 'upi' &&
    order.payment_status === 'pending' &&
    order.status === 'pending_payment';
  const nextActions = isShopOwner ? NEXT_ACTIONS[order.status] || [] : [];

  return (
    <Box>
      <Button startIcon={<BackIcon />} onClick={() => navigate(backView)} sx={{ mb: 2 }}>
        Back
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Order #{order.order_number}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date(order.created_at).toLocaleString()}
          </Typography>
        </Box>
        <OrderStatusChip status={order.status} size="medium" />
      </Box>

      <Box sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, p: 3, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          Items
        </Typography>
        {order.items?.map((item) => (
          <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
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
        <Chip
          label={order.payment_method === 'upi' ? `Payment: ${order.payment_status}` : 'Cash on Delivery'}
          size="small"
          sx={{ mt: 1 }}
        />
      </Box>

      {order.full_name && (
        <Box sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, p: 3, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Delivery Address
          </Typography>
          <Typography variant="body2">{order.full_name} · {order.phone}</Typography>
          <Typography variant="body2" color="text.secondary">
            {order.line1}, {order.line2 ? `${order.line2}, ` : ''}{order.city}, {order.state} - {order.pincode}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {nextActions.map((action) => (
          <Button
            key={action.status}
            variant="contained"
            color={action.color}
            disabled={updating}
            onClick={() => handleStatusChange(action.status)}
            sx={{ borderRadius: 2 }}
          >
            {action.label}
          </Button>
        ))}
        {canPayNow && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('payment', { orderId: order.id })}
            sx={{ borderRadius: 2 }}
          >
            Pay Now
          </Button>
        )}
        {canCancel && (
          <Button variant="outlined" color="error" disabled={updating} onClick={handleCancel} sx={{ borderRadius: 2 }}>
            Cancel Order
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default OrderDetail;
