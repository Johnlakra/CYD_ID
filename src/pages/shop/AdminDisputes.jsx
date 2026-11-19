import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Chip,
  useTheme,
} from '@mui/material';
import { Gavel as GavelIcon } from '@mui/icons-material';
import shopApi from '../../api/shopApi';
import { apiErrorMessage } from '../../utils/apiError';
import EmptyState from '../../components/shop/EmptyState';
import MoneyText from '../../components/shop/MoneyText';
import OrderDetail, { DISPUTE_REASON_LABEL, RESOLUTION_LABEL } from './OrderDetail';

const TABS = [
  { label: 'Open', value: 'open' },
  { label: 'Resolved', value: 'resolved' },
];

// Admin queue for payment disputes. Opening one shows the full order (chat, screenshots, history)
// with the resolve panel; admins can read a chat only while an order has a dispute.
const AdminDisputes = () => {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    shopApi
      .adminGetDisputes({ status: TABS[tab].value })
      .then((res) => {
        setDisputes(res.data.disputes || []);
        setError(null);
      })
      .catch((err) => setError(apiErrorMessage(err, 'Could not load disputes')))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    if (!selectedOrderId) load();
  }, [load, selectedOrderId]);

  if (selectedOrderId) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <OrderDetail orderId={selectedOrderId} navigate={() => setSelectedOrderId(null)} backView="disputes" />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        Shop Disputes
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Buyers pay sellers directly, so the platform holds no money. Decide each case from the chat, the UPI references and
        screenshots. For sellers who won't refund, suspend the shop and follow up through the parish.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 3 }}>
        {TABS.map((t) => (
          <Tab key={t.value} label={t.label} />
        ))}
      </Tabs>

      {loading ? (
        <CircularProgress size={24} />
      ) : error ? (
        <Alert severity="error" action={<Button onClick={load}>Retry</Button>}>
          {error}
        </Alert>
      ) : disputes.length === 0 ? (
        <EmptyState icon={<GavelIcon fontSize="inherit" />} title={tab === 0 ? 'No open disputes' : 'No resolved disputes yet'} />
      ) : (
        disputes.map((d) => (
          <Card key={d.id} sx={{ borderRadius: 3, mb: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardActionArea onClick={() => setSelectedOrderId(d.order_id)}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {DISPUTE_REASON_LABEL[d.reason] || d.reason}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    #{d.order_number} · {d.shop_name} · buyer {d.buyer_username} · seller {d.seller_username}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Opened by the {d.opened_by_role} on {new Date(d.opened_at).toLocaleString()}
                  </Typography>
                  {d.status === 'resolved' && (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {RESOLUTION_LABEL[d.resolution] || d.resolution}
                      {d.resolution_note ? ` — ${d.resolution_note}` : ''}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                  <MoneyText paise={d.total_paise} variant="subtitle1" />
                  <Chip size="small" label={d.status === 'open' ? 'Open' : 'Resolved'} color={d.status === 'open' ? 'error' : 'default'} />
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        ))
      )}
    </Box>
  );
};

export default AdminDisputes;
