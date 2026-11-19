import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  TextField,
  CircularProgress,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from '@mui/material';
import { Storefront as StorefrontIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import shopApi from '../../api/shopApi';
import EmptyState from '../../components/shop/EmptyState';
import { apiErrorMessage } from '../../utils/apiError';

const STATUS_TABS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'All', value: '' },
];

const STATUS_COLOR = { pending: 'warning', approved: 'success', rejected: 'error', suspended: 'default' };

const AdminShopModeration = () => {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  // { shop, status: 'rejected' | 'suspended' } while asking for a reason, otherwise null.
  const [reasonDialog, setReasonDialog] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    shopApi
      .adminGetShops({ status: STATUS_TABS[tab].value || undefined })
      .then((res) => setShops(res.data.shops || []))
      .catch((err) => toast.error(apiErrorMessage(err, 'Could not load shop applications')))
      .finally(() => setLoading(false));
  };

  useEffect(load, [tab]);

  const handleReview = async (shop, status, rejectionReason) => {
    setBusy(true);
    try {
      const res = await shopApi.adminReviewShop(shop.id, { status, rejection_reason: rejectionReason });
      const cancelled = res.data?.cancelled_unpaid_orders;
      toast.success(cancelled ? `Shop ${status}. ${cancelled} unpaid order(s) cancelled.` : `Shop ${status}`);
      setReasonDialog(null);
      setReason('');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to review shop'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Shop Applications
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 3 }}>
        {STATUS_TABS.map((t) => (
          <Tab key={t.label} label={t.label} />
        ))}
      </Tabs>

      {loading ? (
        <CircularProgress size={24} />
      ) : shops.length === 0 ? (
        <EmptyState icon={<StorefrontIcon fontSize="inherit" />} title="No shop applications here" />
      ) : (
        shops.map((shop) => (
          <Card key={shop.id} sx={{ borderRadius: 3, mb: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Avatar src={shop.logo_url}>
                  <StorefrontIcon />
                </Avatar>
                <Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {shop.name}
                    </Typography>
                    <Chip label={shop.status} size="small" color={STATUS_COLOR[shop.status] || 'default'} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Owner: {shop.owner_username} ({shop.owner_email})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {[shop.parish, shop.deanery, shop.contact_phone].filter(Boolean).join(' · ')}
                  </Typography>
                  {shop.description && (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {shop.description}
                    </Typography>
                  )}
                  {['rejected', 'suspended'].includes(shop.status) && shop.rejection_reason && (
                    <Typography variant="body2" color="error.main" sx={{ mt: 0.5 }}>
                      Reason: {shop.rejection_reason}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {shop.status !== 'approved' && (
                  <Button size="small" variant="contained" color="success" disabled={busy} onClick={() => handleReview(shop, 'approved')}>
                    Approve
                  </Button>
                )}
                {shop.status !== 'rejected' && (
                  <Button size="small" variant="outlined" color="error" onClick={() => setReasonDialog({ shop, status: 'rejected' })}>
                    Reject
                  </Button>
                )}
                {shop.status === 'approved' && (
                  <Button size="small" variant="outlined" onClick={() => setReasonDialog({ shop, status: 'suspended' })}>
                    Suspend
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={!!reasonDialog} onClose={() => !busy && setReasonDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>
          {reasonDialog?.status === 'suspended' ? 'Suspend' : 'Reject'} "{reasonDialog?.shop.name}"
        </DialogTitle>
        <DialogContent>
          {reasonDialog?.status === 'suspended' && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              The shop disappears from the marketplace and its unpaid orders are cancelled. The owner can still ship or
              refund orders that were already paid.
            </Typography>
          )}
          <TextField
            fullWidth
            required
            label="Reason (shown to the shop owner)"
            multiline
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            inputProps={{ maxLength: 500 }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReasonDialog(null)} disabled={busy}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={busy || !reason.trim()}
            onClick={() => handleReview(reasonDialog.shop, reasonDialog.status, reason.trim())}
          >
            {reasonDialog?.status === 'suspended' ? 'Suspend' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminShopModeration;
