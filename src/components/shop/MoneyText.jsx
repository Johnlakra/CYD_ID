import React from 'react';
import { Box, Typography } from '@mui/material';
import { formatMoney } from '../../utils/money';

const MoneyText = ({ paise, comparePaise, variant = 'h6', color = 'text.primary' }) => (
  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
    <Typography variant={variant} sx={{ fontWeight: 700, color }}>
      {formatMoney(paise)}
    </Typography>
    {comparePaise && comparePaise > paise && (
      <Typography
        variant="body2"
        sx={{ textDecoration: 'line-through', color: 'text.disabled' }}
      >
        {formatMoney(comparePaise)}
      </Typography>
    )}
  </Box>
);

export default MoneyText;
