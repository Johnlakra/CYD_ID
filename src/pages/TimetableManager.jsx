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
import { Schedule as ScheduleIcon, Delete as DeleteIcon, PictureAsPdf as PdfIcon } from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import { toast } from 'react-toastify';
import { getTimetable, createTimetableItem, deleteTimetableItem } from '../api/anubhavApi';
import { PLACES, PLACE_META } from '../utils/anubhavHelpers';

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

const to12h = (t) => {
  if (!t) return '';
  const [hStr, mStr = '00'] = String(t).split(':');
  const h = Number(hStr);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${mStr} ${ampm}`;
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
    setItems(safeArray(res.data?.items ?? res.data));
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

  const [pdfGenerating, setPdfGenerating] = useState(false);

  const grouped = DAY_OPTIONS.map(({ value, label }) => ({
    day: value,
    label,
    rows: items
      .filter((it) => it.day === value)
      .sort((a, b) => (a.start_time > b.start_time ? 1 : -1)),
  }));

  const generateTimetablePdf = () => {
    if (!items.length) { toast.info('No timetable items to export'); return; }
    setPdfGenerating(true);
    try {
      const pm = PLACE_META[resolvedPlace] || { label: resolvedPlace, venue: '', dates: '' };
      const gen = (() => {
        const d = new Date(), z = (n) => String(n).padStart(2, '0');
        return `${z(d.getDate())}/${z(d.getMonth()+1)}/${d.getFullYear()} ${z(d.getHours())}:${z(d.getMinutes())}`;
      })();

      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const PW = 210, PH = 297, M = 15;
      const CW = PW - M * 2;
      // Time | Title | Location | Notes
      const COLS = [38, 72, 35, 35];
      const LABELS = ['Time', 'Title', 'Location', 'Notes'];
      const ROW_H = 7, HEAD_H = 8;
      const FOOTER_Y = PH - M - 10;
      const GREY = [245, 245, 245], HGREY = [220, 220, 220];
      const trunc = (t, n) => { const s = t ? String(t) : '—'; return s.length > n ? s.slice(0,n-1)+'…' : s; };

      let curY = 0, pageNum = 1;

      const drawPageHeader = () => {
        doc.setFont('helvetica', 'bold').setFontSize(12);
        doc.text(`Anubhav Retreat 2026 — ${pm.label}`, M, M);
        doc.setFont('helvetica', 'normal').setFontSize(9);
        doc.text(`${pm.venue}  |  ${pm.dates}`, M, M + 5);
        doc.setFont('helvetica', 'bold').setFontSize(10);
        doc.text('Timetable', M, M + 11);
        doc.setDrawColor(180, 180, 180).line(M, M + 13, PW - M, M + 13);
        curY = M + 18;
      };
      const drawFooter = () => {
        doc.setFont('helvetica', 'italic').setFontSize(8);
        doc.text(`Page ${pageNum}`, M, PH - M + 4);
        doc.text(`Generated: ${gen}`, PW - M, PH - M + 4, { align: 'right' });
      };
      const drawTableHeader = () => {
        doc.setFillColor(...HGREY).rect(M, curY, CW, HEAD_H, 'F');
        doc.setFont('helvetica', 'bold').setFontSize(8);
        let x = M + 1;
        LABELS.forEach((l, i) => { doc.text(l, x, curY + 5.5); x += COLS[i]; });
        curY += HEAD_H;
      };
      const ensureSpace = (needed) => {
        if (curY + needed > FOOTER_Y) {
          drawFooter(); doc.addPage(); pageNum++; drawPageHeader();
        }
      };

      drawPageHeader();

      grouped.forEach(({ label, rows }) => {
        if (!rows.length) return;
        ensureSpace(10 + HEAD_H + rows.length * ROW_H);

        doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(60, 60, 60);
        doc.text(label, M, curY + 5);
        doc.setTextColor(0, 0, 0);
        curY += 7;

        drawTableHeader();

        rows.forEach((item, idx) => {
          ensureSpace(ROW_H);
          if (idx % 2 === 1) doc.setFillColor(...GREY).rect(M, curY, CW, ROW_H, 'F');
          doc.setFont('helvetica', 'normal').setFontSize(8);
          const timeStr = `${to12h(item.start_time)} – ${to12h(item.end_time)}`;
          const vals = [trunc(timeStr, 18), trunc(item.title, 34), trunc(item.location, 17), trunc(item.notes || '', 17)];
          let x = M + 1;
          vals.forEach((v, i) => { doc.text(v, x, curY + 5); x += COLS[i]; });
          curY += ROW_H;
        });
        curY += 5;
      });

      const total = doc.getNumberOfPages();
      for (let p = 1; p <= total; p++) {
        doc.setPage(p);
        doc.setFont('helvetica', 'italic').setFontSize(8);
        doc.text(`Page ${p} of ${total}`, M, PH - M + 4);
        doc.text(`Generated: ${gen}`, PW - M, PH - M + 4, { align: 'right' });
        doc.setFont('helvetica', 'normal').setFontSize(7).setTextColor(140, 140, 140);
        doc.text(
          'Powered by — Softech Smart Solutions · In collaboration with Youth Commission, Diocese of Jalandhar',
          PW / 2, PH - M + 8, { align: 'center' }
        );
        doc.setTextColor(0, 0, 0);
      }

      doc.save(`anubhav-timetable-${resolvedPlace}.pdf`);
      toast.success('Timetable PDF downloaded');
    } catch (err) {
      console.error(err);
      toast.error('PDF generation failed');
    } finally {
      setPdfGenerating(false);
    }
  };

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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon color="primary" />
                <Typography variant="h6">Timetable</Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={pdfGenerating ? <CircularProgress size={16} /> : <PdfIcon />}
                onClick={generateTimetablePdf}
                disabled={pdfGenerating || loading}
              >
                {pdfGenerating ? 'Generating…' : 'Download PDF'}
              </Button>
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
                          {to12h(item.start_time)} – {to12h(item.end_time)}
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
