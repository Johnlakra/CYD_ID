import React, { useState } from 'react';
import { Box, Grid, TextField, Button, FormControlLabel, Checkbox, CircularProgress } from '@mui/material';

const EMPTY = { label: 'Home', full_name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', is_default: false };

const AddressForm = ({ initial, onSubmit, onCancel, submitLabel = 'Save Address' }) => {
  const [form, setForm] = useState(initial || EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.full_name || !form.phone || !form.line1 || !form.city || !form.state || !form.pincode) {
      return;
    }
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Full Name" value={form.full_name} onChange={set('full_name')} required />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Phone" value={form.phone} onChange={set('phone')} required />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Address Line 1" value={form.line1} onChange={set('line1')} required />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Address Line 2 (optional)" value={form.line2} onChange={set('line2')} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="City" value={form.city} onChange={set('city')} required />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="State" value={form.state} onChange={set('state')} required />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="Pincode" value={form.pincode} onChange={set('pincode')} required />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={<Checkbox checked={!!form.is_default} onChange={(e) => setForm((p) => ({ ...p, is_default: e.target.checked }))} />}
            label="Set as default address"
          />
        </Grid>
        <Grid item xs={12} sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} /> : null}
            sx={{ borderRadius: 2 }}
          >
            {submitLabel}
          </Button>
          {onCancel && (
            <Button onClick={onCancel} sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default AddressForm;
