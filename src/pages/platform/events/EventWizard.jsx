// Platform Phase 5 — event creation wizard (Pillar E).
// Steps: Basics & scope -> Venues -> Modules & fees -> Review & publish.
// POST /events then POST /events/:id/venues per venue; publish sets status
// 'open', otherwise the event is saved as a draft.

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Publish as PublishIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { createEvent, createEventVenue, getOrgStructure } from '../../../api/platformApi';
import {
  EVENT_SCOPES,
  WIZARD_STEPS,
  buildEventPayload,
  buildVenuePayload,
  emptyEventDraft,
  emptyVenueDraft,
  formatDateRange,
  validateWizardStep,
  venueKeyFromName,
} from '../../../utils/eventHelpers';

const SCOPE_LABELS = { diocese: 'Whole diocese', deanery: 'Single deanery', parish: 'Single parish' };

const EventWizard = ({ onCancel, onCreated, onLogout }) => {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(() => emptyEventDraft());
  const [venueDraft, setVenueDraft] = useState(() => emptyVenueDraft());
  const [editingIndex, setEditingIndex] = useState(null);
  const [stepError, setStepError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deaneryOptions, setDeaneryOptions] = useState([]);
  const [parishOptions, setParishOptions] = useState([]);

  // Org structure feeds the deanery/parish pickers; new dioceses may still be
  // empty, so every picker is freeSolo and typed values are accepted.
  useEffect(() => {
    getOrgStructure().then((res) => {
      if (!res.success) {
        if (res.status === 401 && onLogout) onLogout();
        return;
      }
      const deaneries = res.data.deaneries || [];
      setDeaneryOptions(deaneries.map((deanery) => deanery.name));
      setParishOptions(
        deaneries.flatMap((deanery) => (deanery.parishes || []).map((parish) => parish.name))
      );
    });
  }, [onLogout]);

  const setField = (field) => (event) =>
    setDraft((prev) => ({ ...prev, [field]: event.target.value }));

  const setToggle = (field) => (event) =>
    setDraft((prev) => ({ ...prev, [field]: event.target.checked }));

  const handleNext = () => {
    const error = validateWizardStep(step, draft);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    setStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  };

  const handleBack = () => {
    setStepError(null);
    setStep((prev) => Math.max(prev - 1, 0));
  };

  // ---- Venue step ------------------------------------------------------------

  const upsertVenue = () => {
    const candidate = {
      ...venueDraft,
      venue_key: venueDraft.venue_key || venueKeyFromName(venueDraft.name),
    };
    const others = draft.venues.filter((_, index) => index !== editingIndex);
    const error = validateWizardStep(1, { ...draft, venues: [...others, candidate] });
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    setDraft((prev) => ({
      ...prev,
      venues:
        editingIndex === null
          ? [...prev.venues, candidate]
          : prev.venues.map((venue, index) => (index === editingIndex ? candidate : venue)),
    }));
    setVenueDraft(emptyVenueDraft());
    setEditingIndex(null);
  };

  const editVenue = (index) => {
    setVenueDraft({ ...draft.venues[index] });
    setEditingIndex(index);
  };

  const removeVenue = (index) => {
    setDraft((prev) => ({ ...prev, venues: prev.venues.filter((_, i) => i !== index) }));
    if (editingIndex === index) {
      setVenueDraft(emptyVenueDraft());
      setEditingIndex(null);
    }
  };

  // ---- Submit ------------------------------------------------------------------

  const handleSubmit = async (status) => {
    const error = validateWizardStep(WIZARD_STEPS.length - 1, draft);
    if (error) {
      setStepError(error);
      return;
    }
    setSaving(true);
    const eventRes = await createEvent(buildEventPayload(draft, status));
    if (!eventRes.success) {
      setSaving(false);
      if (eventRes.status === 401 && onLogout) onLogout();
      toast.error(eventRes.message || 'Could not create the event');
      return;
    }
    const eventId = eventRes.data.event.id;
    let venueFailures = 0;
    for (const venue of draft.venues) {
      // Sequential on purpose: keeps mock/backend ordering deterministic.
      // eslint-disable-next-line no-await-in-loop
      const venueRes = await createEventVenue(eventId, buildVenuePayload(venue));
      if (!venueRes.success) {
        venueFailures += 1;
        toast.error(`Venue "${venue.name || venue.venue_key}": ${venueRes.message}`);
      }
    }
    setSaving(false);
    if (venueFailures === 0) {
      toast.success(status === 'open' ? 'Event published' : 'Event saved as draft');
    } else {
      toast.warn('Event created, but some venues failed — edit them from the event page');
    }
    if (onCreated) onCreated(eventRes.data.event);
  };

  // ---- Step content ----------------------------------------------------------------

  const renderBasics = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={8}>
        <TextField
          label="Event name"
          value={draft.name}
          onChange={setField('name')}
          fullWidth
          required
          inputProps={{ maxLength: 150 }}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField select label="Scope" value={draft.scope} onChange={setField('scope')} fullWidth>
          {EVENT_SCOPES.map((scope) => (
            <MenuItem key={scope} value={scope}>
              {SCOPE_LABELS[scope]}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      {draft.scope !== 'diocese' && (
        <Grid item xs={12} md={6}>
          <Autocomplete
            freeSolo
            options={draft.scope === 'deanery' ? deaneryOptions : parishOptions}
            value={draft.scope_ref}
            onInputChange={(_, value) => setDraft((prev) => ({ ...prev, scope_ref: value }))}
            renderInput={(params) => (
              <TextField {...params} label={draft.scope === 'deanery' ? 'Deanery' : 'Parish'} required />
            )}
          />
        </Grid>
      )}
      <Grid item xs={12}>
        <TextField
          label="Description"
          value={draft.description}
          onChange={setField('description')}
          fullWidth
          multiline
          minRows={2}
        />
      </Grid>
      <Grid item xs={6} md={3}>
        <TextField
          label="Start date"
          type="date"
          value={draft.start_date}
          onChange={setField('start_date')}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={6} md={3}>
        <TextField
          label="End date"
          type="date"
          value={draft.end_date}
          onChange={setField('end_date')}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
    </Grid>
  );

  const renderVenues = () => (
    <Box>
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {draft.venues.length === 0 && (
          <Typography color="text.secondary">
            No venues yet — every event needs at least one (it can simply be the event location).
          </Typography>
        )}
        {draft.venues.map((venue, index) => (
          <Card key={venue.venue_key} variant="outlined">
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography sx={{ fontWeight: 600 }}>{venue.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {venue.venue_key} · {formatDateRange(venue.start_date, venue.end_date)}
                  {venue.deaneries.length > 0 && ` · ${venue.deaneries.length} deaneries`}
                </Typography>
              </Box>
              <Tooltip title="Edit venue">
                <IconButton size="small" onClick={() => editVenue(index)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove venue">
                <IconButton size="small" color="error" onClick={() => removeVenue(index)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </CardContent>
          </Card>
        ))}
      </Stack>
      <Divider sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {editingIndex === null ? 'Add a venue' : 'Edit venue'}
        </Typography>
      </Divider>
      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <TextField
            label="Venue name"
            value={venueDraft.name}
            onChange={(event) =>
              setVenueDraft((prev) => ({
                ...prev,
                name: event.target.value,
                venue_key:
                  editingIndex === null && (!prev.venue_key || prev.venue_key === venueKeyFromName(prev.name))
                    ? venueKeyFromName(event.target.value)
                    : prev.venue_key,
              }))
            }
            fullWidth
            required
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Venue key"
            value={venueDraft.venue_key}
            onChange={(event) =>
              setVenueDraft((prev) => ({ ...prev, venue_key: event.target.value.toLowerCase() }))
            }
            helperText="Short unique id, e.g. phagwara"
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Address"
            value={venueDraft.address}
            onChange={(event) => setVenueDraft((prev) => ({ ...prev, address: event.target.value }))}
            fullWidth
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            label="Start date"
            type="date"
            value={venueDraft.start_date}
            onChange={(event) => setVenueDraft((prev) => ({ ...prev, start_date: event.target.value }))}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            label="End date"
            type="date"
            value={venueDraft.end_date}
            onChange={(event) => setVenueDraft((prev) => ({ ...prev, end_date: event.target.value }))}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Autocomplete
            multiple
            freeSolo
            options={deaneryOptions}
            value={venueDraft.deaneries}
            onChange={(_, value) => setVenueDraft((prev) => ({ ...prev, deaneries: value }))}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={option} size="small" {...getTagProps({ index })} />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} label="Assigned deaneries" helperText="Who registers at this venue (optional)" />
            )}
          />
        </Grid>
        <Grid item xs={12}>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={upsertVenue}>
            {editingIndex === null ? 'Add venue' : 'Update venue'}
          </Button>
          {editingIndex !== null && (
            <Button
              sx={{ ml: 1 }}
              onClick={() => {
                setVenueDraft(emptyVenueDraft());
                setEditingIndex(null);
              }}
            >
              Cancel edit
            </Button>
          )}
        </Grid>
      </Grid>
    </Box>
  );

  const renderToggles = () => (
    <Stack spacing={2} sx={{ maxWidth: 480 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControlLabel
          control={<Switch checked={draft.fee_enabled} onChange={setToggle('fee_enabled')} />}
          label="Registration fee"
        />
        {draft.fee_enabled && (
          <TextField
            label="Fee amount (₹)"
            type="number"
            size="small"
            value={draft.fee_amount}
            onChange={setField('fee_amount')}
            inputProps={{ min: 1, step: 1 }}
            sx={{ width: 160 }}
          />
        )}
      </Box>
      <FormControlLabel
        control={<Switch checked={draft.accommodation_enabled} onChange={setToggle('accommodation_enabled')} />}
        label="Accommodation (buildings, rooms, allotments)"
      />
      <FormControlLabel
        control={<Switch checked={draft.timetable_enabled} onChange={setToggle('timetable_enabled')} />}
        label="Timetable"
      />
      <FormControlLabel
        control={<Switch checked={draft.speakers_enabled} onChange={setToggle('speakers_enabled')} />}
        label="Speakers"
      />
      <Typography variant="body2" color="text.secondary">
        Disabled modules simply hide their tabs for this event — you can change these later.
      </Typography>
    </Stack>
  );

  const renderReview = () => (
    <Stack spacing={1.5}>
      <Typography variant="h6">{draft.name}</Typography>
      <Typography color="text.secondary">
        {SCOPE_LABELS[draft.scope]}
        {draft.scope !== 'diocese' && ` — ${draft.scope_ref}`} · {formatDateRange(draft.start_date, draft.end_date)}
      </Typography>
      {draft.description && <Typography variant="body2">{draft.description}</Typography>}
      <Divider />
      <Typography variant="subtitle2">Venues ({draft.venues.length})</Typography>
      {draft.venues.map((venue) => (
        <Typography key={venue.venue_key} variant="body2" color="text.secondary">
          • {venue.name} ({venue.venue_key})
          {venue.deaneries.length > 0 && ` — ${venue.deaneries.join(', ')}`}
        </Typography>
      ))}
      <Divider />
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          size="small"
          color={draft.fee_enabled ? 'success' : 'default'}
          label={draft.fee_enabled ? `Fee ₹${draft.fee_amount}` : 'No fee'}
        />
        <Chip
          size="small"
          color={draft.accommodation_enabled ? 'success' : 'default'}
          label={draft.accommodation_enabled ? 'Accommodation on' : 'Accommodation off'}
        />
        <Chip
          size="small"
          color={draft.timetable_enabled ? 'success' : 'default'}
          label={draft.timetable_enabled ? 'Timetable on' : 'Timetable off'}
        />
        <Chip
          size="small"
          color={draft.speakers_enabled ? 'success' : 'default'}
          label={draft.speakers_enabled ? 'Speakers on' : 'Speakers off'}
        />
      </Box>
    </Stack>
  );

  const stepContent = [renderBasics, renderVenues, renderToggles, renderReview][step];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={onCancel} aria-label="Back to events">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 300 }}>
          New Event
        </Typography>
      </Box>
      <Stepper activeStep={step} sx={{ mb: 4 }} alternativeLabel>
        {WIZARD_STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {stepError && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setStepError(null)}>
          {stepError}
        </Alert>
      )}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>{stepContent()}</CardContent>
      </Card>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button onClick={handleBack} disabled={step === 0 || saving}>
          Back
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        {step < WIZARD_STEPS.length - 1 && (
          <Button variant="contained" onClick={handleNext}>
            Next
          </Button>
        )}
        {step === WIZARD_STEPS.length - 1 && (
          <>
            <Button
              variant="outlined"
              startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
              disabled={saving}
              onClick={() => handleSubmit('draft')}
            >
              Save as draft
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} /> : <PublishIcon />}
              disabled={saving}
              onClick={() => handleSubmit('open')}
            >
              Publish (open registrations)
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};

export default EventWizard;
