import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  RadioGroup,
  Radio,
  FormControlLabel,
  Stack,
  Alert,
  Autocomplete,
  Avatar,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  GroupAdd as GroupAddIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import {
  deaneriesForPlace,
  SOFT_CAP_PER_PARISH,
  PLACE_META,
} from '../utils/anubhavHelpers';
import {
  getEligible,
  getRegistrations,
  getChaperones,
  createChaperone,
  createRegistration,
} from '../api/anubhavApi';

const safeArray = (value) => (Array.isArray(value) ? value : []);

const handleAuthError = (envelope, onLogout) => {
  if (envelope && envelope.status === 401 && typeof onLogout === 'function') {
    toast.error('Session expired. Please login again.');
    onLogout();
    return true;
  }
  return false;
};

const RegisterYouth = ({ activePlace, onLogout, onRegistered }) => {
  const [deanery, setDeanery] = useState('');
  const [parish, setParish] = useState('');
  const [eligible, setEligible] = useState([]);
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [batchResult, setBatchResult] = useState(null); // { succeeded: [], failed: [] }

  const [chaperones, setChaperones] = useState([]);
  const [chaperonesLoading, setChaperonesLoading] = useState(false);
  const [chaperoneId, setChaperoneId] = useState('');

  const [addChaperoneOpen, setAddChaperoneOpen] = useState(false);
  const [newChaperone, setNewChaperone] = useState({
    name: '',
    phone: '',
    type: 'Sister',
  });
  const [addChaperoneSaving, setAddChaperoneSaving] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [softCap, setSoftCap] = useState({ open: false, count: 0 });

  const deaneriesForCurrentPlace = useMemo(
    () => deaneriesForPlace(activePlace),
    [activePlace]
  );

  const parishOptions = useMemo(() => {
    if (!deanery) return [];
    const unique = new Set(
      eligible.filter((p) => p.deanery === deanery).map((p) => p.parish)
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [eligible, deanery]);

  // Reset child fields when active place changes from above.
  useEffect(() => {
    setDeanery('');
    setParish('');
    setSelectedProfiles([]);
    setChaperoneId('');
  }, [activePlace]);

  // Reset parish + selection when deanery changes.
  useEffect(() => {
    setParish('');
    setSelectedProfiles([]);
  }, [deanery]);

  // Reset selected youth when parish changes.
  useEffect(() => {
    setSelectedProfiles([]);
    setChaperoneId('');
  }, [parish]);

  const fetchEligible = useCallback(async () => {
    if (!activePlace) return;
    setEligibleLoading(true);
    const response = await getEligible({
      place: activePlace,
      deanery: deanery || undefined,
      parish: parish || undefined,
    });
    setEligibleLoading(false);
    if (handleAuthError(response, onLogout)) return;
    if (!response.success) {
      toast.error(response.message || 'Failed to load eligible youth');
      setEligible([]);
      return;
    }
    setEligible(safeArray(response.data));
  }, [activePlace, deanery, parish, onLogout]);

  useEffect(() => {
    fetchEligible();
  }, [fetchEligible]);

  const fetchChaperones = useCallback(async () => {
    if (!activePlace || !parish) {
      setChaperones([]);
      return;
    }
    setChaperonesLoading(true);
    const response = await getChaperones({ place: activePlace, parish });
    setChaperonesLoading(false);
    if (handleAuthError(response, onLogout)) return;
    if (!response.success) {
      toast.error(response.message || 'Failed to load chaperones');
      setChaperones([]);
      return;
    }
    setChaperones(safeArray(response.data));
  }, [activePlace, parish, onLogout]);

  useEffect(() => {
    fetchChaperones();
  }, [fetchChaperones]);

  const resetForm = () => {
    setSelectedProfiles([]);
    setChaperoneId('');
    setParish('');
    setDeanery('');
  };

  const submitBatch = useCallback(async (profiles) => {
    setSubmitting(true);
    const succeeded = [];
    const failed = [];
    for (const profile of profiles) {
      const payload = { place: activePlace, profile_id: Number(profile.id) };
      if (chaperoneId) payload.chaperone_id = Number(chaperoneId);
      const response = await createRegistration(payload);
      if (handleAuthError(response, onLogout)) { setSubmitting(false); return; }
      if (response.success) {
        succeeded.push(profile.name);
      } else {
        failed.push({ name: profile.name, reason: response.message || 'Failed' });
      }
    }
    setSubmitting(false);
    if (succeeded.length > 0) {
      toast.success(`${succeeded.length} youth registered`);
      resetForm();
      if (typeof onRegistered === 'function') onRegistered();
    }
    if (failed.length > 0) {
      setBatchResult({ succeeded, failed });
    }
  }, [activePlace, chaperoneId, onLogout, onRegistered]);

  const handleRegisterClick = async () => {
    if (!selectedProfiles.length) {
      toast.warning('Select at least one youth');
      return;
    }
    if (!activePlace) {
      toast.warning('Place is required');
      return;
    }
    // Soft cap check: for each unique parish in selection, get current count
    if (parish) {
      const countResponse = await getRegistrations({ place: activePlace, parish });
      if (handleAuthError(countResponse, onLogout)) return;
      const count = (countResponse.success && countResponse.data && countResponse.data.total) || 0;
      if (count + selectedProfiles.filter(p => p.parish === parish).length > SOFT_CAP_PER_PARISH) {
        setSoftCap({ open: true, count });
        return;
      }
    }
    submitBatch(selectedProfiles);
  };

  const handleConfirmSoftCap = () => {
    setSoftCap({ open: false, count: 0 });
    submitBatch(selectedProfiles);
  };

  const handleAddChaperone = async () => {
    if (!newChaperone.name || !newChaperone.phone) {
      toast.warning('Chaperone name and phone are required');
      return;
    }
    if (!parish) {
      toast.warning('Select a parish first');
      return;
    }
    setAddChaperoneSaving(true);
    const response = await createChaperone({
      place: activePlace,
      parish,
      name: newChaperone.name.trim(),
      phone: newChaperone.phone.trim(),
      type: newChaperone.type,
    });
    setAddChaperoneSaving(false);
    if (handleAuthError(response, onLogout)) return;
    if (!response.success) {
      toast.error(response.message || 'Could not add chaperone');
      return;
    }
    toast.success('Chaperone added');
    setAddChaperoneOpen(false);
    setNewChaperone({ name: '', phone: '', type: 'Sister' });
    await fetchChaperones();
    if (response.data && response.data.id) {
      setChaperoneId(String(response.data.id));
    }
  };

  const meta = PLACE_META[activePlace];

  return (
    <Box>
      <Card sx={{ borderRadius: 3 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonAddIcon color="primary" />
              <Typography variant="h6">Register Youth for Anubhav 2026</Typography>
            </Box>
          }
          subheader={
            meta ? `${meta.venue} | ${meta.dates}` : 'Select a place to begin'
          }
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Deanery</InputLabel>
                <Select
                  value={deanery}
                  label="Deanery"
                  onChange={(e) => setDeanery(e.target.value)}
                >
                  <MenuItem value="">All Deaneries</MenuItem>
                  {deaneriesForCurrentPlace.map((d) => (
                    <MenuItem key={d} value={d}>
                      {d}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Parish</InputLabel>
                <Select
                  value={parish}
                  label="Parish"
                  onChange={(e) => setParish(e.target.value)}
                  disabled={!deanery}
                >
                  <MenuItem value="">All Parishes</MenuItem>
                  {parishOptions.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={eligible}
                loading={eligibleLoading}
                getOptionLabel={(opt) => opt.name || ''}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                filterOptions={(options, { inputValue }) => {
                  const term = inputValue.trim().toLowerCase();
                  if (!term) return options;
                  return options.filter((opt) =>
                    [opt.name, opt.father_name, opt.parish, opt.deanery, opt.phone]
                      .some((f) => f && String(f).toLowerCase().includes(term))
                  );
                }}
                renderOption={(props, option) => {
                  const { key, ...rest } = props;
                  return (
                    <Box component="li" key={key} {...rest} sx={{ gap: 1.5, alignItems: 'flex-start !important' }}>
                      <Avatar
                        src={option.photo_url || undefined}
                        sx={{ width: 40, height: 40, flexShrink: 0, mt: 0.5 }}
                      >
                        {option.name?.charAt(0)}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {option.name}
                        </Typography>
                        {option.father_name && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            s/o {option.father_name}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {option.parish} · {option.deanery}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
                renderTags={(selected, getTagProps) =>
                  selected.map((opt, index) => (
                    <Chip
                      key={opt.id}
                      avatar={
                        <Avatar src={opt.photo_url || undefined}>
                          {opt.name?.charAt(0)}
                        </Avatar>
                      }
                      label={opt.name}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
                value={selectedProfiles}
                onChange={(_, newVal) => setSelectedProfiles(newVal)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select youth (search by name, father, parish, deanery, phone)"
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {eligibleLoading ? <CircularProgress size={18} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box
            sx={{
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Chaperone (optional)
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<GroupAddIcon />}
              onClick={() => setAddChaperoneOpen(true)}
              disabled={!parish}
            >
              Add chaperone
            </Button>
          </Box>

          {!parish && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Select a parish to load chaperones for that parish.
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <FormControl fullWidth size="small">
                <InputLabel>Chaperone</InputLabel>
                <Select
                  value={chaperoneId}
                  label="Chaperone"
                  onChange={(e) => setChaperoneId(e.target.value)}
                  disabled={!parish || chaperonesLoading}
                >
                  <MenuItem value="">
                    {chaperonesLoading
                      ? 'Loading chaperones...'
                      : chaperones.length === 0
                      ? 'No chaperones yet for this parish'
                      : 'No chaperone'}
                  </MenuItem>
                  {chaperones.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name} ({c.type}) - {c.phone}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={resetForm} disabled={submitting}>
              Reset
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleRegisterClick}
              disabled={submitting || !selectedProfiles.length}
              startIcon={
                submitting ? <CircularProgress size={18} /> : <PersonAddIcon />
              }
            >
              {submitting ? 'Registering...' : selectedProfiles.length > 1 ? `Register ${selectedProfiles.length} Youth` : 'Register'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Soft cap confirmation */}
      <Dialog
        open={softCap.open}
        onClose={() => setSoftCap({ open: false, count: 0 })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Soft cap reached</DialogTitle>
        <DialogContent>
          <Typography>
            This parish already has {softCap.count} registrations (soft cap{' '}
            {SOFT_CAP_PER_PARISH}). Register anyway?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSoftCap({ open: false, count: 0 })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleConfirmSoftCap}
          >
            Register anyway
          </Button>
        </DialogActions>
      </Dialog>

      {/* Batch result dialog */}
      <Dialog open={!!batchResult} onClose={() => setBatchResult(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Registration Results</DialogTitle>
        <DialogContent>
          {batchResult?.failed?.map((f) => (
            <Alert key={f.name} severity="error" sx={{ mb: 1 }}>
              {f.name}: {f.reason}
            </Alert>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBatchResult(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add chaperone dialog */}
      <Dialog
        open={addChaperoneOpen}
        onClose={() => setAddChaperoneOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add chaperone</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Chip
              label={`${meta ? meta.label : ''}${parish ? ` - ${parish}` : ''}`}
              size="small"
              sx={{ alignSelf: 'flex-start' }}
            />
            <TextField
              label="Name"
              size="small"
              value={newChaperone.name}
              onChange={(e) =>
                setNewChaperone((prev) => ({ ...prev, name: e.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Phone"
              size="small"
              value={newChaperone.phone}
              onChange={(e) =>
                setNewChaperone((prev) => ({ ...prev, phone: e.target.value }))
              }
              fullWidth
            />
            <FormControl size="small">
              <Typography variant="body2" sx={{ mb: 1 }}>
                Type
              </Typography>
              <RadioGroup
                row
                value={newChaperone.type}
                onChange={(e) =>
                  setNewChaperone((prev) => ({ ...prev, type: e.target.value }))
                }
              >
                <FormControlLabel
                  value="Sister"
                  control={<Radio />}
                  label="Sister"
                />
                <FormControlLabel
                  value="Catechist"
                  control={<Radio />}
                  label="Catechist"
                />
              </RadioGroup>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAddChaperoneOpen(false)}
            disabled={addChaperoneSaving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddChaperone}
            disabled={addChaperoneSaving}
            startIcon={
              addChaperoneSaving ? <CircularProgress size={18} /> : null
            }
          >
            {addChaperoneSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RegisterYouth;
