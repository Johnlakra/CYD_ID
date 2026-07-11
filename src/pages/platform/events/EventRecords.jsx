// Platform Phase 5 — event records page (Pillar E): per-venue registration
// counts (GET /events/:id/stats), fee totals (display-only math from the
// authoritative counts), lifecycle actions, venue management and CSV export.

import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import {
  archiveEvent,
  createEventVenue,
  deleteEventVenue,
  getEvent,
  getEventStats,
  updateEvent,
  updateEventVenue,
} from '../../../api/platformApi';
import Can from '../../../components/Can';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { PERM } from '../../../utils/permissionKeys';
import {
  buildVenuePayload,
  displayFeeTotal,
  downloadCsv,
  emptyVenueDraft,
  eventStatusChip,
  formatDateRange,
  nextStatuses,
  toCsv,
  validateVenue,
} from '../../../utils/eventHelpers';

const STATUS_ACTION_META = {
  open: { label: 'Open registrations', icon: <PlayArrowIcon />, color: 'success' },
  closed: { label: 'Close registrations', icon: <LockIcon />, color: 'warning' },
  archived: { label: 'Archive event', icon: <ArchiveIcon />, color: 'error' },
};

const EventRecords = ({ eventId, onBack, onChanged, onLogout }) => {
  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  // venueDialog: { venue (draft fields), id|null } | null
  const [venueDialog, setVenueDialog] = useState(null);
  const [venueError, setVenueError] = useState(null);
  const [deleteVenueTarget, setDeleteVenueTarget] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);

  const handle401 = useCallback(
    (res) => {
      if (res.status === 401 && onLogout) onLogout();
    },
    [onLogout]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    const [eventRes, statsRes] = await Promise.all([getEvent(eventId), getEventStats(eventId)]);
    setLoading(false);
    if (eventRes.success) {
      setEvent(eventRes.data.event);
    } else {
      handle401(eventRes);
      toast.error(eventRes.message);
      return;
    }
    if (statsRes.success) {
      setStats(statsRes.data);
    } else {
      handle401(statsRes);
      toast.error(statsRes.message);
    }
  }, [eventId, handle401]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const registrationsFor = (venueKey) => {
    const row = ((stats && stats.by_venue) || []).find((entry) => entry.venue_key === venueKey);
    return row ? row.registrations : 0;
  };

  const totalRegistrations = (stats && stats.total_registrations) || 0;

  // ---- Lifecycle -----------------------------------------------------------------

  const applyStatus = async (status) => {
    setBusy(true);
    const res =
      status === 'archived' ? await archiveEvent(event.id) : await updateEvent(event.id, { status });
    setBusy(false);
    setStatusTarget(null);
    if (res.success) {
      toast.success(STATUS_ACTION_META[status].label);
      refresh();
      if (onChanged) onChanged();
    } else {
      handle401(res);
      toast.error(res.message);
    }
  };

  // ---- Venue management -------------------------------------------------------------

  const saveVenue = async () => {
    const draft = venueDialog.venue;
    const error = validateVenue(draft);
    if (error) {
      setVenueError(error);
      return;
    }
    setBusy(true);
    const payload = buildVenuePayload(draft);
    const res = venueDialog.id
      ? await updateEventVenue(event.id, venueDialog.id, payload)
      : await createEventVenue(event.id, payload);
    setBusy(false);
    if (res.success) {
      toast.success(venueDialog.id ? 'Venue updated' : 'Venue added');
      setVenueDialog(null);
      setVenueError(null);
      refresh();
    } else {
      handle401(res);
      setVenueError(res.message);
    }
  };

  const removeVenue = async () => {
    setBusy(true);
    const res = await deleteEventVenue(event.id, deleteVenueTarget.id);
    setBusy(false);
    setDeleteVenueTarget(null);
    if (res.success) {
      toast.success('Venue deleted');
      refresh();
    } else {
      handle401(res);
      toast.error(res.message);
    }
  };

  // ---- Export -----------------------------------------------------------------------

  const exportCsv = () => {
    const rows = (event.venues || []).map((venue) => [
      venue.venue_key,
      venue.name || '',
      formatDateRange(venue.start_date, venue.end_date),
      (venue.deaneries || []).join('; '),
      registrationsFor(venue.venue_key),
      displayFeeTotal(registrationsFor(venue.venue_key), event),
    ]);
    rows.push(['TOTAL', '', '', '', totalRegistrations, displayFeeTotal(totalRegistrations, event)]);
    const csv = toCsv(
      ['Venue key', 'Venue name', 'Dates', 'Deaneries', 'Registrations', 'Fee collected (Rs)'],
      rows
    );
    downloadCsv(`${event.name.replace(/\s+/g, '-').toLowerCase()}-records.csv`, csv);
  };

  if (loading || !event) {
    return (
      <Box sx={{ p: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const chip = eventStatusChip(event.status);
  const feeEnabled = Number(event.fee_enabled) === 1;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
        <IconButton onClick={onBack} aria-label="Back to events">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 300, flexGrow: 1 }}>
          {event.name}
        </Typography>
        <Chip label={chip.label} color={chip.color} size="small" />
        {nextStatuses(event.status).map((status) => (
          <Button
            key={status}
            size="small"
            variant="outlined"
            color={STATUS_ACTION_META[status].color}
            startIcon={STATUS_ACTION_META[status].icon}
            disabled={busy}
            onClick={() => setStatusTarget(status)}
          >
            {STATUS_ACTION_META[status].label}
          </Button>
        ))}
      </Box>
      <Typography color="text.secondary" sx={{ mb: 3, ml: 6 }}>
        {event.scope === 'diocese' ? 'Diocese-wide' : `${event.scope}: ${event.scope_ref}`} ·{' '}
        {formatDateRange(event.start_date, event.end_date)}
        {event.description && ` — ${event.description}`}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={feeEnabled ? 4 : 6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Total registrations
              </Typography>
              <Typography variant="h4">{totalRegistrations}</Typography>
            </CardContent>
          </Card>
        </Grid>
        {feeEnabled && (
          <Grid item xs={12} sm={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  Fee collected (₹{event.fee_amount}/head)
                </Typography>
                <Typography variant="h4">
                  ₹{displayFeeTotal(totalRegistrations, event).toLocaleString('en-IN')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Indicative — counts × fee; the backend record is authoritative.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
        <Grid item xs={12} sm={feeEnabled ? 4 : 6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Modules
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                <Chip size="small" label={feeEnabled ? `Fee ₹${event.fee_amount}` : 'No fee'} />
                {Number(event.accommodation_enabled) === 1 && <Chip size="small" label="Accommodation" />}
                {Number(event.timetable_enabled) === 1 && <Chip size="small" label="Timetable" />}
                {Number(event.speakers_enabled) === 1 && <Chip size="small" label="Speakers" />}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 400, flexGrow: 1 }}>
          Venues & registrations
        </Typography>
        <Can perm={PERM.UI_BUTTON_EXPORT_XLSX}>
          <Button size="small" startIcon={<DownloadIcon />} onClick={exportCsv} sx={{ mr: 1 }}>
            Export CSV
          </Button>
        </Can>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => {
            setVenueError(null);
            setVenueDialog({ id: null, venue: emptyVenueDraft() });
          }}
        >
          Add venue
        </Button>
      </Box>
      <TableContainer component={Card} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Venue</TableCell>
              <TableCell>Key</TableCell>
              <TableCell>Dates</TableCell>
              <TableCell>Deaneries</TableCell>
              <TableCell align="right">Registrations</TableCell>
              {feeEnabled && <TableCell align="right">Fee collected</TableCell>}
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(event.venues || []).map((venue) => (
              <TableRow key={venue.id} hover>
                <TableCell>{venue.name || '—'}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {venue.venue_key}
                  </Typography>
                </TableCell>
                <TableCell>{formatDateRange(venue.start_date, venue.end_date)}</TableCell>
                <TableCell>
                  {(venue.deaneries || []).length > 0 ? (
                    <Tooltip title={(venue.deaneries || []).join(', ')}>
                      <Chip size="small" label={`${venue.deaneries.length} deaneries`} />
                    </Tooltip>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell align="right">{registrationsFor(venue.venue_key)}</TableCell>
                {feeEnabled && (
                  <TableCell align="right">
                    ₹{displayFeeTotal(registrationsFor(venue.venue_key), event).toLocaleString('en-IN')}
                  </TableCell>
                )}
                <TableCell align="right">
                  <Tooltip title="Edit venue">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setVenueError(null);
                        setVenueDialog({ id: venue.id, venue: { ...emptyVenueDraft(), ...venue } });
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete venue">
                    <IconButton size="small" color="error" onClick={() => setDeleteVenueTarget(venue)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {(event.venues || []).length === 0 && (
              <TableRow>
                <TableCell colSpan={feeEnabled ? 7 : 6}>
                  <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    No venues yet.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Venue add/edit dialog */}
      <Dialog open={!!venueDialog} onClose={() => setVenueDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{venueDialog && venueDialog.id ? 'Edit venue' : 'Add venue'}</DialogTitle>
        <DialogContent>
          {venueDialog && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {venueError && (
                <Typography color="error" variant="body2">
                  {venueError}
                </Typography>
              )}
              <TextField
                label="Venue name"
                value={venueDialog.venue.name || ''}
                onChange={(e) =>
                  setVenueDialog((prev) => ({ ...prev, venue: { ...prev.venue, name: e.target.value } }))
                }
                fullWidth
                required
              />
              <TextField
                label="Venue key"
                value={venueDialog.venue.venue_key || ''}
                onChange={(e) =>
                  setVenueDialog((prev) => ({
                    ...prev,
                    venue: { ...prev.venue, venue_key: e.target.value.toLowerCase() },
                  }))
                }
                helperText="Short unique id, e.g. phagwara"
                fullWidth
                required
              />
              <TextField
                label="Address"
                value={venueDialog.venue.address || ''}
                onChange={(e) =>
                  setVenueDialog((prev) => ({ ...prev, venue: { ...prev.venue, address: e.target.value } }))
                }
                fullWidth
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Start date"
                  type="date"
                  value={venueDialog.venue.start_date || ''}
                  onChange={(e) =>
                    setVenueDialog((prev) => ({
                      ...prev,
                      venue: { ...prev.venue, start_date: e.target.value },
                    }))
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="End date"
                  type="date"
                  value={venueDialog.venue.end_date || ''}
                  onChange={(e) =>
                    setVenueDialog((prev) => ({
                      ...prev,
                      venue: { ...prev.venue, end_date: e.target.value },
                    }))
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              <TextField
                label="Deaneries (comma-separated)"
                value={(venueDialog.venue.deaneries || []).join(', ')}
                onChange={(e) =>
                  setVenueDialog((prev) => ({
                    ...prev,
                    venue: {
                      ...prev.venue,
                      deaneries: e.target.value
                        .split(',')
                        .map((name) => name.trim())
                        .filter(Boolean),
                    },
                  }))
                }
                helperText="Deaneries whose youth register at this venue (optional)"
                fullWidth
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVenueDialog(null)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="contained" onClick={saveVenue} disabled={busy}>
            {busy ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lifecycle confirm */}
      <ConfirmDialog
        open={!!statusTarget}
        title={statusTarget ? STATUS_ACTION_META[statusTarget].label : ''}
        body={
          statusTarget === 'archived'
            ? `Archive "${event.name}"? Records stay available, but the event is closed for good.`
            : `Change "${event.name}" to ${statusTarget}?`
        }
        confirmText="Yes, continue"
        loading={busy}
        onClose={() => setStatusTarget(null)}
        onConfirm={() => applyStatus(statusTarget)}
      />

      {/* Venue delete confirm */}
      <ConfirmDialog
        open={!!deleteVenueTarget}
        title="Delete venue"
        body={
          deleteVenueTarget
            ? `Delete venue "${deleteVenueTarget.name || deleteVenueTarget.venue_key}"?`
            : ''
        }
        confirmText="Delete"
        loading={busy}
        onClose={() => setDeleteVenueTarget(null)}
        onConfirm={removeVenue}
      />
    </Box>
  );
};

export default EventRecords;
