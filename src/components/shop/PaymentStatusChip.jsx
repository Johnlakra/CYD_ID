import React from 'react';
import { Chip } from '@mui/material';

export const PAYMENT_STATUS = {
  awaiting_payment: { label: 'Awaiting payment', color: 'warning' },
  claimed: { label: 'Paid — awaiting seller', color: 'info' },
  confirmed: { label: 'Payment confirmed', color: 'success' },
  disputed: { label: 'In dispute', color: 'error' },
  refund_due: { label: 'Refund due', color: 'warning' },
  refunded: { label: 'Refunded', color: 'default' },
  void: { label: 'No payment', color: 'default' },
  written_off: { label: 'Closed by admin', color: 'default' },
  cod_pending: { label: 'Cash on delivery', color: 'secondary' },
  cod_collected: { label: 'Cash collected', color: 'success' },
};

const PaymentStatusChip = ({ status, size = 'small' }) => {
  const config = PAYMENT_STATUS[status] || { label: status, color: 'default' };
  return <Chip label={config.label} color={config.color} size={size} variant="outlined" sx={{ fontWeight: 600 }} />;
};

export default PaymentStatusChip;
