// Promote an independent entry to a full ID-card profile. Mirrors the profile
// edit form, but every field here is REQUIRED for an ID card — empty ones are
// highlighted in red so the operator can see exactly what still needs filling.
// On success the parent shows the generated-credentials dialog.
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  CircularProgress,
} from '@mui/material';
import { toast } from 'react-toastify';
import { promoteIndependent } from '../api/anubhavApi';
import {
  LEVEL_OPTIONS,
  DESIGNATION_OPTIONS,
  placeChipProps,
  missingIdCardFields,
} from '../utils/anubhavHelpers';

const isBlank = (value) => !String(value ?? '').trim();

const formFromRow = (row) => ({
  name: row?.name || '',
  father_name: row?.father_name || '',
  phone: row?.phone || '',
  date_of_birth: row?.date_of_birth || '',
  postal_address: row?.postal_address || '',
  photo_url: row?.photo_url || '',
  level: row?.level || '',
  designation: row?.designation || '',
});

const PromoteIndependentDialog = ({ open, onClose, row, onPromoted }) => {
  const [form, setForm] = useState(formFromRow(null));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(formFromRow(row));
  }, [open, row]);

  const handleChange = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  // Outstanding ID-card-required fields, based on the live form + the row's
  // fixed place/deanery/parish (those are set at creation and shown as chips).
  const missing = missingIdCardFields({
    ...row,
    ...form,
    deanery: row?.deanery,
    parish: row?.parish,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await promoteIndependent(row.id, { ...form });
      if (result.success) {
        onPromoted?.(result.data);
        onClose();
      } else {
        const missingFields = result.data?.missing_fields;
        toast.error(
          missingFields?.length
            ? `Still missing: ${missingFields.join(', ')}`
            : result.message || 'Could not promote entry'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const requiredError = (field) => isBlank(form[field]);

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Promote to full ID-card profile</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Chip size="small" {...placeChipProps(row?.place)} />
            <Chip size="small" variant="outlined" label={`Deanery: ${row?.deanery || '—'}`} />
            <Chip size="small" variant="outlined" label={`Parish: ${row?.parish || '—'}`} />
          </Stack>
          {missing.length > 0 ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {missing.length} field{missing.length === 1 ? '' : 's'} still required: {missing.join(', ')}
            </Alert>
          ) : (
            <Alert severity="success" sx={{ mb: 2 }}>
              All ID-card fields are complete — ready to promote.
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={form.name}
                onChange={handleChange('name')}
                error={requiredError('name')}
                helperText={requiredError('name') ? 'Required for ID card' : ' '}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Father's Name"
                value={form.father_name}
                onChange={handleChange('father_name')}
                error={requiredError('father_name')}
                helperText={requiredError('father_name') ? 'Required for ID card' : ' '}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={form.phone}
                onChange={handleChange('phone')}
                error={requiredError('phone')}
                helperText={requiredError('phone') ? 'Required for ID card' : ' '}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={form.date_of_birth}
                onChange={handleChange('date_of_birth')}
                InputLabelProps={{ shrink: true }}
                error={requiredError('date_of_birth')}
                helperText={requiredError('date_of_birth') ? 'Required for ID card' : ' '}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={requiredError('level')}>
                <InputLabel>Level</InputLabel>
                <Select value={form.level} label="Level" onChange={handleChange('level')}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {LEVEL_OPTIONS.map((level) => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                </Select>
                <FormHelperText>{requiredError('level') ? 'Required for ID card' : ' '}</FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={requiredError('designation')}>
                <InputLabel>Designation</InputLabel>
                <Select value={form.designation} label="Designation" onChange={handleChange('designation')}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {DESIGNATION_OPTIONS.map((d) => (
                    <MenuItem key={d} value={d}>{d}</MenuItem>
                  ))}
                </Select>
                <FormHelperText>{requiredError('designation') ? 'Required for ID card' : ' '}</FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Photo URL"
                value={form.photo_url}
                onChange={handleChange('photo_url')}
                error={requiredError('photo_url')}
                helperText={requiredError('photo_url') ? 'Required for ID card' : ' '}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Postal Address"
                multiline
                rows={2}
                value={form.postal_address}
                onChange={handleChange('postal_address')}
                error={requiredError('postal_address')}
                helperText={requiredError('postal_address') ? 'Required for ID card' : ' '}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving || missing.length > 0}
            startIcon={saving ? <CircularProgress size={18} /> : null}
            sx={{ minWidth: 140 }}
          >
            {saving ? 'Promoting…' : 'Promote'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PromoteIndependentDialog;
