import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const EmptyState = ({ icon, title, subtitle, actionLabel, onAction }) => (
  <Box
    sx={{
      textAlign: 'center',
      py: 8,
      px: 3,
      borderRadius: 4,
      bgcolor: 'grey.50',
      border: '1px dashed',
      borderColor: 'divider',
    }}
  >
    {icon && <Box sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }}>{icon}</Box>}
    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="body2" color="text.secondary" sx={{ mb: actionLabel ? 3 : 0 }}>
        {subtitle}
      </Typography>
    )}
    {actionLabel && (
      <Button variant="contained" onClick={onAction} sx={{ borderRadius: 2 }}>
        {actionLabel}
      </Button>
    )}
  </Box>
);

export default EmptyState;
