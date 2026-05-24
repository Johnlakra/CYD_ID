import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  Divider,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import { Schedule as ScheduleIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { getTimetable, createTimetableItem, deleteTimetableItem } from '../api/anubhavApi';
import { PLACES } from '../utils/anubhavHelpers';

const DAY_OPTIONS = [
  { value: 1, label: 'Day 1' },
  { value: 2, label: 'Day 2' },
  { value: 3, label: 'Day 3' },
];

const safeArray = (v) => (Array.isArray(v) ? v : []);

const handleAuthError = (envelope, onLogout) => {
  if (envelope && envelope.status === 401 && typeof onLogout === 'function') {
    toast.error('Session expired. Please login again.');
    onLogout();
    return true;
  }
  return false;
};

const EMPTY_FORM = {
  day: '',
  start_time: '',
  end_time: '',
  title: '',
  location: '',
  notes: '',
};

const TimetableManager = ({ activePlace, eventRole, onLogout }) => {
  const resolvedPlace = activePlace || PLACES[0];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchItems = useCallback(async () => {
    if (!resolvedPlace) return;
    setLoading(true);
    const res = await getTimetable({ place: resolvedPlace });
    setLoading(false);
    if (handleAuthError(res, onLogout)) return;
    if (!res.success) {
      toast.error(res.message || 'Failed to load timetable');
      setItems([]);
      return;
    }
    setItems(safeArray(res.data));
  }, [resolvedPlace, onLogout]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleFieldChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.day) { toast.warning('Day is required'); return; }
    if (!form.start_time) { toast.warning('Start time is required'); return; }
    if (!form.end_time) { toast.warning('End time is required'); return; }
    if (!form.title.trim()) { toast.warning('Title is required'); return; }
    if (!form.location.trim()) { toast.warning('Location is required'); return; }

    setSaving(true);
    const res = await createTimetableItem({
      place: resolvedPlace,
      day: Number(form.day),
      start_time: form.start_time,
      end_time: form.end_time,
      title: form.title.trim(),
      location: form.location.trim(),
      notes: form.notes.trim() || null,
    });
    setSaving(false);
    if (handleAuthError(res, onLogout)) return;
    if (!res.success) {
      toast.error(res.message || 'Failed to add item');
      return;
    }
    toast.success('Timetable item added');
    setForm(EMPTY_FORM);
    fetchItems();
  };

  const handleDelete = async (id) => {
    const res = await deleteTimetableItem(id);
    if (handleAuthError(res, onLogout)) return;
    if (!res.success) {
      toast.error(res.message || 'Failed to delete item');
      return;
    }
    toast.success('Item removed');
    fetchItems();
  };

  const grouped = DAY_OPTIONS.map(({ value, label }) => ({
    day: value,
    label,
    rows: items
      .filter((it) => it.day === value)
      .sort((a, b) => (a.start_time > b.start_time ? 1 : -1)),
  }));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ borderRadius: 3 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScheduleIcon color="primary" />
              <Typography variant="h6">Timetable</Typography>
            </Box>
          }
          subheader={`Venue: ${resolvedPlace}`}
        />
        <CardContent>
          {/* Add Item form */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Add Item
          </Typography>
          <Stack spacing={2} sx={{ mb: 4 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Day</InputLabel>
                <Select
                  label="Day"
                  value={form.day}
                  onChange={handleFieldChange('day')}
                >
                  {DAY_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Start Time"
                type="time"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={form.start_time}
                onChange={handleFieldChange('start_time')}
              />
              <TextField
                label="End Time"
                type="time"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={form.end_time}
                onChange={handleFieldChange('end_time')}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Title"
                size="small"
                fullWidth
                value={form.title}
                onChange={handleFieldChange('title')}
              />
              <TextField
                label="Location"
                size="small"
                fullWidth
                placeholder="e.g. Chapel, Hall A"
                value={form.location}
                onChange={handleFieldChange('location')}
              />
            </Stack>
            <TextField
              label="Notes (optional)"
              size="small"
              fullWidth
              multiline
              rows={2}
              value={form.notes}
              onChange={handleFieldChange('notes')}
            />
            <Box>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={18} /> : null}
              >
                {saving ? 'Adding…' : 'Add Item'}
              </Button>
            </Box>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {/* Timetable list grouped by day */}
          {grouped.map(({ day, label, rows }) => (
            <Box key={day} sx={{ mb: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                {label}
              </Typography>
              {rows.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No items for {label}.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {item.start_time} – {item.end_time}
                        </TableCell>
                        <TableCell>{item.title}</TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell>{item.notes || '—'}</TableCell>
                        <TableCell align="right" sx={{ p: 0.5 }}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(item.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          ))}

          {items.length === 0 && (
            <Alert severity="info">
              No timetable items yet. Use the form above to add sessions.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default TimetableManager;
