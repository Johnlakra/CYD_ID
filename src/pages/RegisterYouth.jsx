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
  const [search, setSearch] = useState('');
  const [eligible, setEligible] = useState([]);
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState('');

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
    setSearch('');
    setSelectedProfileId('');
    setChaperoneId('');
  }, [activePlace]);

  // Reset parish + selection when deanery changes.
  useEffect(() => {
    setParish('');
    setSelectedProfileId('');
  }, [deanery]);

  // Reset selected youth when parish changes.
  useEffect(() => {
    setSelectedProfileId('');
    setChaperoneId('');
  }, [parish]);

  const fetchEligible = useCallback(async () => {
    if (!activePlace) return;
    setEligibleLoading(true);
    const response = await getEligible({
      place: activePlace,
      deanery: deanery || undefined,
      parish: parish || undefined,
      search: search || undefined,
    });
    setEligibleLoading(false);
    if (handleAuthError(response, onLogout)) return;
    if (!response.success) {
      toast.error(response.message || 'Failed to load eligible youth');
      setEligible([]);
      return;
    }
    setEligible(safeArray(response.data));
  }, [activePlace, deanery, parish, search, onLogout]);

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
    setSelectedProfileId('');
    setChaperoneId('');
    setSearch('');
    setParish('');
    setDeanery('');
  };

  const submitRegistration = useCallback(async () => {
    setSubmitting(true);
    const payload = {
      place: activePlace,
      profile_id: Number(selectedProfileId),
    };
    if (chaperoneId) {
      payload.chaperone_id = Number(chaperoneId);
    }
    const response = await createRegistration(payload);
    setSubmitting(false);
    if (handleAuthError(response, onLogout)) return;
    if (!response.success) {
      toast.error(response.message || 'Registration failed');
      return;
    }
    toast.success('Youth registered successfully');
    resetForm();
    if (typeof onRegistered === 'function') {
      onRegistered();
    }
  }, [activePlace, selectedProfileId, chaperoneId, onLogout, onRegistered]);

  const handleRegisterClick = async () => {
    if (!selectedProfileId) {
      toast.warning('Select a youth to register');
      return;
    }
    if (!activePlace) {
      toast.warning('Place is required');
      return;
    }
    // Soft cap check: count existing registrations for this parish.
    if (parish) {
      const countResponse = await getRegistrations({
        place: activePlace,
        parish,
      });
      if (handleAuthError(countResponse, onLogout)) return;
      const count =
        (countResponse.success && countResponse.data && countResponse.data.total) ||
        0;
      if (count >= SOFT_CAP_PER_PARISH) {
        setSoftCap({ open: true, count });
        return;
      }
    }
    submitRegistration();
  };

  const handleConfirmSoftCap = () => {
    setSoftCap({ open: false, count: 0 });
    submitRegistration();
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

            <Grid item xs={12} sm={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Search youth"
                placeholder="Name or phone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Youth</InputLabel>
                <Select
                  value={selectedProfileId}
                  label="Youth"
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  disabled={eligibleLoading}
                >
                  <MenuItem value="">
                    {eligibleLoading
                      ? 'Loading eligible youth...'
                      : eligible.length === 0
                      ? 'No eligible youth match your filters'
                      : 'Select a youth'}
                  </MenuItem>
                  {eligible.map((profile) => (
                    <MenuItem key={profile.id} value={profile.id}>
                      {profile.name} - {profile.parish} ({profile.deanery})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
              disabled={submitting || !selectedProfileId}
              startIcon={
                submitting ? <CircularProgress size={18} /> : <PersonAddIcon />
              }
            >
              {submitting ? 'Registering...' : 'Register'}
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
