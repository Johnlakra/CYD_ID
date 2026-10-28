import React from 'react';
import { Chip } from '@mui/material';

const STATUS_CONFIG = {
  pending_payment: { label: 'Awaiting Payment', color: 'warning' },
  placed: { label: 'Placed', color: 'info' },
  accepted: { label: 'Accepted', color: 'primary' },
  packed: { label: 'Packed', color: 'primary' },
  shipped: { label: 'Shipped', color: 'secondary' },
  delivered: { label: 'Delivered', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'default' },
  rejected: { label: 'Rejected', color: 'error' },
};

const OrderStatusChip = ({ status, size = 'small' }) => {
  const config = STATUS_CONFIG[status] || { label: status, color: 'default' };
  return <Chip label={config.label} color={config.color} size={size} sx={{ fontWeight: 600 }} />;
};

export default OrderStatusChip;
