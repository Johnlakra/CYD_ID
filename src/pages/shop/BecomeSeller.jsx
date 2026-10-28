import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, TextField, Button, Grid, Avatar, CircularProgress } from '@mui/material';
import { Storefront as StorefrontIcon, PhotoCamera as PhotoIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import shopApi from '../../api/shopApi';
import EncodeBase64 from '../../components/EncodeBase64';

const EMPTY = { name: '', description: '', parish: '', deanery: '', contact_phone: '', upi_id: '' };

const BecomeSeller = ({ onApplied }) => {
  const [form, setForm] = useState(EMPTY);
  const [logo, setLogo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await EncodeBase64(file);
      setLogo(base64);
    } catch {
      toast.error('Failed to process image');
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.contact_phone) {
      toast.error('Shop name and contact phone are required');
      return;
    }
    setSubmitting(true);
    try {
      await shopApi.applyForShop({ ...form, logo: logo || undefined });
      toast.success('Application submitted! An admin will review it shortly.');
      onApplied?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <StorefrontIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Become a Shop Owner
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Open your own shop in the CYD Marketplace. Your application will be reviewed by an
          admin before your shop goes live.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar src={logo} sx={{ width: 80, height: 80, mx: 'auto', mb: 1 }}>
              <StorefrontIcon />
            </Avatar>
            <Button variant="outlined" component="label" size="small" startIcon={<PhotoIcon />}>
              Upload Logo
              <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
            </Button>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Shop Name" value={form.name} onChange={set('name')} required />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={form.description}
                onChange={set('description')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Parish" value={form.parish} onChange={set('parish')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Deanery" value={form.deanery} onChange={set('deanery')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Contact Phone" value={form.contact_phone} onChange={set('contact_phone')} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="UPI ID (for receiving payouts)"
                placeholder="yourname@bank"
                value={form.upi_id}
                onChange={set('upi_id')}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={18} /> : null}
                sx={{ borderRadius: 2 }}
              >
                Submit Application
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BecomeSeller;
