// Create / edit an independent entry (Option B). Six minimal fields; the
// place / deanery / parish are fixed by context and shown as read-only chips
// (they are decided by who is registering and which parish is selected, not
// typed here). Talks to the API facade directly and reports back via onSaved.
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
  Typography,
  CircularProgress,
} from '@mui/material';
import { toast } from 'react-toastify';
import { createIndependent, updateIndependent } from '../api/anubhavApi';
import { LEVEL_OPTIONS, DESIGNATION_OPTIONS, placeChipProps } from '../utils/anubhavHelpers';
import { INDEPENDENT_COLOR } from './IndependentBadge';

const EMPTY_FORM = {
  name: '',
  father_name: '',
  phone: '',
  date_of_birth: '',
  level: '',
  designation: '',
};

// Pull just the six editable fields out of an existing independent row.
const formFromRow = (row) => ({
  name: row.name || '',
  father_name: row.father_name || '',
  phone: row.phone || '',
  date_of_birth: row.date_of_birth || '',
  level: row.level || '',
  designation: row.designation || '',
});

const IndependentEntryDialog = ({
  open,
  onClose,
  mode = 'create',
  place,
  deanery,
  parish,
  initial = null,
  onSaved,
}) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!open) return;
    setForm(isEdit && initial ? formFromRow(initial) : EMPTY_FORM);
  }, [open, isEdit, initial]);

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const result = isEdit
        ? await updateIndependent(initial.id, { ...form })
        : await createIndependent({ place, deanery, parish, ...form });
      if (result.success) {
        toast.success(isEdit ? 'Independent entry updated' : 'Independent entry added');
        onSaved?.(result);
        onClose();
      } else {
        toast.error(result.message || 'Could not save independent entry');
      }
    } finally {
      setSaving(false);
    }
  };

  // In edit mode the context chips come from the row being edited.
  const chipPlace = isEdit && initial ? initial.place : place;
  const chipDeanery = isEdit && initial ? initial.deanery : deanery;
  const chipParish = isEdit && initial ? initial.parish : parish;

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ color: INDEPENDENT_COLOR, fontWeight: 700 }}>
          {isEdit ? 'Edit independent entry' : 'Add independent entry'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Chip size="small" {...placeChipProps(chipPlace)} />
            <Chip size="small" variant="outlined" label={`Deanery: ${chipDeanery || '—'}`} />
            <Chip size="small" variant="outlined" label={`Parish: ${chipParish || '—'}`} />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Only the name is required. Remaining details can be completed later
            before promoting this entry to a full ID-card profile.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={form.name}
                onChange={handleChange('name')}
                required
                autoFocus
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Father's Name"
                value={form.father_name}
                onChange={handleChange('father_name')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={form.phone}
                onChange={handleChange('phone')}
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
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Level</InputLabel>
                <Select value={form.level} label="Level" onChange={handleChange('level')}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {LEVEL_OPTIONS.map((level) => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Designation</InputLabel>
                <Select value={form.designation} label="Designation" onChange={handleChange('designation')}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {DESIGNATION_OPTIONS.map((d) => (
                    <MenuItem key={d} value={d}>{d}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} /> : null}
            sx={{ minWidth: 120, bgcolor: INDEPENDENT_COLOR, '&:hover': { bgcolor: '#455a64' } }}
          >
            {saving ? 'Saving…' : (isEdit ? 'Save changes' : 'Add entry')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default IndependentEntryDialog;
