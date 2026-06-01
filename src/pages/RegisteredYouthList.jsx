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
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Skeleton,
  Alert,
  CircularProgress,
  InputAdornment,
  alpha,
  useTheme,
  Stack,
  Switch,
  FormControlLabel,
  Avatar,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  WarningAmber as WarningIcon,
  People as PeopleIcon,
  PaidOutlined as PaidIcon,
  AccountBalanceWallet as WalletIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import { toast } from 'react-toastify';
import {
  deaneriesForPlace,
  FEE_PER_YOUTH,
  SOFT_CAP_PER_PARISH,
  formatRupees,
  PLACE_META,
  formatRegisteredAt,
} from '../utils/anubhavHelpers';
import {
  getRegistrations,
  getFees,
  deleteRegistration,
} from '../api/anubhavApi';
import ConfirmDialog from '../components/ConfirmDialog';
import IndependentBadge from '../components/IndependentBadge';

const handleAuthError = (envelope, onLogout) => {
  if (envelope && envelope.status === 401 && typeof onLogout === 'function') {
    toast.error('Session expired. Please login again.');
    onLogout();
    return true;
  }
  return false;
};

const ROW_SKELETON_COUNT = 5;
const BASE_COLUMN_COUNT = 8;

const initialsFor = (name) => {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const RegisteredYouthList = ({ activePlace, onLogout, refreshKey }) => {
  const theme = useTheme();
  const [deanery, setDeanery] = useState('');
  const [parish, setParish] = useState('');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all'); // all | existing | independent

  const [registrations, setRegistrations] = useState([]);
  const [countsByParish, setCountsByParish] = useState({});
  const [loading, setLoading] = useState(false);
  const [fees, setFees] = useState(null);
  const [feesLoading, setFeesLoading] = useState(false);
  const [includePhones, setIncludePhones] = useState(false);
  const tableColumnCount = BASE_COLUMN_COUNT + (includePhones ? 1 : 0);

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    registrationId: null,
    saving: false,
  });

  const deaneriesForCurrentPlace = useMemo(
    () => deaneriesForPlace(activePlace),
    [activePlace]
  );

  const parishOptions = useMemo(() => {
    if (!deanery) return [];
    const unique = new Set(
      registrations.filter((r) => r.deanery === deanery).map((r) => r.parish)
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [registrations, deanery]);

  useEffect(() => {
    setDeanery('');
    setParish('');
    setSearch('');
  }, [activePlace]);

  useEffect(() => {
    setParish('');
  }, [deanery]);

  const fetchRegistrations = useCallback(async () => {
    if (!activePlace) return;
    setLoading(true);
    const response = await getRegistrations({
      place: activePlace,
      deanery: deanery || undefined,
      parish: parish || undefined,
    });
    setLoading(false);
    if (handleAuthError(response, onLogout)) return;
    if (!response.success) {
      toast.error(response.message || 'Failed to load registrations');
      setRegistrations([]);
      setCountsByParish({});
      return;
    }
    const data = response.data || {};
    setRegistrations(Array.isArray(data.registrations) ? data.registrations : []);
    setCountsByParish(data.countsByParish || {});
  }, [activePlace, deanery, parish, onLogout]);

  const fetchFees = useCallback(async () => {
    if (!activePlace) return;
    setFeesLoading(true);
    const response = await getFees({ place: activePlace });
    setFeesLoading(false);
    if (handleAuthError(response, onLogout)) return;
    if (!response.success) {
      toast.error(response.message || 'Failed to load fees');
      setFees(null);
      return;
    }
    setFees(response.data || null);
  }, [activePlace, onLogout]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations, refreshKey]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees, refreshKey]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return registrations.filter((row) => {
      if (sourceFilter === 'existing' && row.is_independent) return false;
      if (sourceFilter === 'independent' && !row.is_independent) return false;
      if (!term) return true;
      return (
        (row.name && row.name.toLowerCase().includes(term)) ||
        (row.father_name && row.father_name.toLowerCase().includes(term)) ||
        (row.phone && row.phone.toLowerCase().includes(term)) ||
        (row.chaperone_name &&
          row.chaperone_name.toLowerCase().includes(term))
      );
    });
  }, [registrations, search, sourceFilter]);

  const handleConfirmDelete = async () => {
    if (!deleteDialog.registrationId) return;
    setDeleteDialog((prev) => ({ ...prev, saving: true }));
    const response = await deleteRegistration(deleteDialog.registrationId);
    setDeleteDialog({ open: false, registrationId: null, saving: false });
    if (handleAuthError(response, onLogout)) return;
    if (!response.success) {
      toast.error(response.message || 'Failed to un-register');
      return;
    }
    toast.success('Registration removed');
    await Promise.all([fetchRegistrations(), fetchFees()]);
  };

  const parishesOverCap = useMemo(() => {
    if (!fees || !Array.isArray(fees.byParish)) return [];
    return fees.byParish.filter((row) => row.count > SOFT_CAP_PER_PARISH);
  }, [fees]);

  const [pdfGenerating, setPdfGenerating] = useState(false);

  const generateParticipantReport = async () => {
    setPdfGenerating(true);
    try {
      const gen = (() => {
        const d = new Date(), p = (n) => String(n).padStart(2, '0');
        return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
      })();
      const res = await getRegistrations({
        place: activePlace,
        deanery: deanery || undefined,
        parish: parish || undefined,
      });
      if (!res.success) { toast.error('Failed to load data for PDF'); return; }
      const allRegs = Array.isArray(res.data?.registrations) ? res.data.registrations : [];
      if (!allRegs.length) { toast.info('No registrations to export'); return; }

      const scopeLabel = parish
        ? `${parish} · ${deanery}`
        : deanery
        ? deanery
        : 'All Participants';
      const fileSlug = (parish || deanery || activePlace)
        .replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
      const PW = 297, PH = 210, M = 15;
      const CW = PW - M * 2;
      const COLS = includePhones
        ? [8, 60, 48, 55, 30, 66]
        : [8, 68, 55, 60, 76];
      const LABELS = includePhones
        ? ['#', 'Name', "Father's Name", 'Parish', 'Phone', 'Chaperone']
        : ['#', 'Name', "Father's Name", 'Parish', 'Chaperone'];
      const ROW_H = 7, HEAD_H = 8;
      const FOOTER_Y = PH - M - 10;
      const GREY = [245, 245, 245], HGREY = [220, 220, 220];

      const trunc = (t, n) => { const s = t ? String(t) : '—'; return s.length > n ? s.slice(0,n-1)+'…' : s; };

      let pageNum = 1, curY = 0;
      const placeMeta = {
        phagwara: { label: 'Phagwara', venue: "St. Joseph's Catholic Church, Phagwara", dates: '02-04 Jun 2026' },
        abohar: { label: 'Abohar', venue: "St. Joseph's Catholic Church, Abohar", dates: '04-06 Jun 2026' },
        amritsar: { label: 'Amritsar', venue: 'St. Francis Church, Amritsar', dates: '06-08 Jun 2026' },
      };
      const pm = placeMeta[activePlace] || { label: activePlace, venue: '', dates: '' };

      const drawHeader = () => {
        doc.setFont('helvetica','bold').setFontSize(11);
        doc.text(`Anubhav Retreat 2026 — ${pm.label} | ${pm.venue} | ${pm.dates}`, M, M);
        doc.setFont('helvetica','normal').setFontSize(9);
        doc.text(`${scopeLabel}  ·  ${allRegs.length} registrations`, M, M+5);
        doc.setDrawColor(180,180,180).line(M, M+8, PW-M, M+8);
        curY = M + 13;
        doc.setFillColor(...HGREY).rect(M, curY, CW, HEAD_H, 'F');
        doc.setFont('helvetica','bold').setFontSize(8);
        let x = M + 1;
        LABELS.forEach((l, i) => { doc.text(l, x, curY+5.5); x += COLS[i]; });
        curY += HEAD_H;
      };
      const drawFooter = () => {
        doc.setFont('helvetica','italic').setFontSize(8);
        doc.text(`Page ${pageNum}`, M, PH-M+4);
        doc.text(`Generated: ${gen}`, PW-M, PH-M+4, { align: 'right' });
      };

      drawHeader();

      const grouped = {};
      allRegs.forEach(r => { (grouped[r.deanery] = grouped[r.deanery] || []).push(r); });
      let serial = 1;
      Object.keys(grouped).sort().forEach(deanery => {
        if (curY + 6 > FOOTER_Y) { drawFooter(); doc.addPage(); pageNum++; drawHeader(); }
        doc.setFont('helvetica','bold').setFontSize(8).setTextColor(80,80,80);
        doc.text(deanery, M+1, curY+5);
        doc.setTextColor(0,0,0);
        curY += 6;

        grouped[deanery].forEach((row, idx) => {
          if (curY + ROW_H > FOOTER_Y) { drawFooter(); doc.addPage(); pageNum++; drawHeader(); }
          if (idx % 2 === 1) doc.setFillColor(...GREY).rect(M, curY, CW, ROW_H, 'F');
          doc.setFont('helvetica','normal').setFontSize(8);
          const chapStr = row.chaperone_name
            ? `${row.chaperone_name}${includePhones && row.chaperone_phone ? ' ' + row.chaperone_phone : ''}`
            : '—';
          const indSuffix = row.is_independent ? ' (IND)' : '';
          const vals = includePhones
            ? [
                String(serial++),
                trunc(row.name, 28) + indSuffix,
                trunc(row.father_name, 24),
                trunc(row.parish, 26),
                trunc(row.phone, 13),
                trunc(chapStr, 30),
              ]
            : [
                String(serial++),
                trunc(row.name, 32) + indSuffix,
                trunc(row.father_name, 26),
                trunc(row.parish, 28),
                trunc(chapStr, 36),
              ];
          let x = M + 1;
          vals.forEach((v, i) => { doc.text(v, x, curY+5); x += COLS[i]; });
          curY += ROW_H;
        });
        curY += 2;
      });

      const total = doc.getNumberOfPages();
      for (let p = 1; p <= total; p++) {
        doc.setPage(p);
        doc.setFont('helvetica','italic').setFontSize(8);
        doc.text(`Page ${p} of ${total}`, M, PH-M+4);
        doc.text(`Generated: ${gen}`, PW-M, PH-M+4, { align: 'right' });
        doc.setFont('helvetica','normal').setFontSize(7).setTextColor(140,140,140);
        doc.text(
          'Powered by — Softech Smart Solutions · In collaboration with Youth Commission, Diocese of Jalandhar',
          PW / 2, PH - M + 8, { align: 'center' }
        );
        doc.setTextColor(0,0,0);
      }

      doc.save(`anubhav-participants-${fileSlug}.pdf`);
      toast.success('Participant report downloaded');
    } catch {
      toast.error('PDF generation failed');
    } finally {
      setPdfGenerating(false);
    }
  };

  const meta = PLACE_META[activePlace];

  const summaryCards = [
    {
      title: 'Place total',
      value: feesLoading ? null : formatRupees(fees?.placeTotal ?? 0),
      icon: <WalletIcon sx={{ fontSize: 36 }} />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Youth registered',
      value: feesLoading ? null : String(fees?.placeCount ?? 0),
      icon: <PeopleIcon sx={{ fontSize: 36 }} />,
      color: theme.palette.success.main,
    },
    {
      title: `Parishes over cap (${SOFT_CAP_PER_PARISH})`,
      value: feesLoading ? null : parishesOverCap.length.toString(),
      icon: <WarningIcon sx={{ fontSize: 36 }} />,
      color: theme.palette.warning.main,
      chip:
        !feesLoading && parishesOverCap.length > 0 ? (
          <Chip
            size="small"
            color="warning"
            icon={<WarningIcon />}
            label="Action needed"
          />
        ) : null,
    },
  ];

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {summaryCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.title}>
            <Card
              sx={{
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(card.color, 0.12)} 0%, ${alpha(card.color, 0.02)} 100%)`,
                border: `1px solid ${alpha(card.color, 0.15)}`,
              }}
            >
              <CardContent
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    {card.title}
                  </Typography>
                  {card.value === null ? (
                    <Skeleton width={80} height={36} />
                  ) : (
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 600, color: card.color }}
                    >
                      {card.value}
                    </Typography>
                  )}
                  {card.chip && <Box sx={{ mt: 1 }}>{card.chip}</Box>}
                </Box>
                <Box sx={{ color: card.color, opacity: 0.85 }}>{card.icon}</Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ borderRadius: 3 }}>
        <CardHeader
          title={
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PaidIcon color="primary" />
                <Typography variant="h6">Registered Youth</Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title="Off by default — youth contact numbers stay private.">
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={includePhones}
                        onChange={(e) => setIncludePhones(e.target.checked)}
                      />
                    }
                    label="Include phone numbers"
                    sx={{ mr: 0, '& .MuiFormControlLabel-label': { fontSize: '0.8125rem' } }}
                  />
                </Tooltip>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    fetchRegistrations();
                    fetchFees();
                  }}
                  startIcon={
                    loading ? <CircularProgress size={16} /> : <RefreshIcon />
                  }
                  disabled={loading}
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={pdfGenerating ? <CircularProgress size={16} /> : <PdfIcon />}
                  onClick={generateParticipantReport}
                  disabled={loading || pdfGenerating}
                >
                  PDF Report
                </Button>
              </Stack>
            </Box>
          }
          subheader={
            meta
              ? `${meta.venue} | ${meta.dates} | Rs. ${FEE_PER_YOUTH} per youth`
              : `Rs. ${FEE_PER_YOUTH} per youth`
          }
        />
        <CardContent>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Show</InputLabel>
                <Select
                  value={sourceFilter}
                  label="Show"
                  onChange={(e) => setSourceFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="existing">Existing</MenuItem>
                  <MenuItem value="independent">Independents only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search registrations"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>

          {parishesOverCap.length > 0 && !feesLoading && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {parishesOverCap.length} parish
              {parishesOverCap.length === 1 ? '' : 'es'} exceed the soft cap of{' '}
              {SOFT_CAP_PER_PARISH} registrations.
            </Alert>
          )}

          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: 56 }} />
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Father's Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Parish</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Deanery</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Chaperone</TableCell>
                  {includePhones && (
                    <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                  )}
                  <TableCell sx={{ fontWeight: 600 }}>Registered</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: ROW_SKELETON_COUNT }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: tableColumnCount }).map(
                        (__, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <Skeleton />
                          </TableCell>
                        )
                      )}
                    </TableRow>
                  ))
                ) : filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableColumnCount} align="center">
                      <Box sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No registrations found
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => {
                    const parishCount = countsByParish[row.parish] || 0;
                    const overCap = parishCount > SOFT_CAP_PER_PARISH;
                    return (
                      <TableRow key={row.registration_id} hover>
                        <TableCell sx={{ py: 1, pr: 0 }}>
                          <Avatar
                            src={row.photo_url || undefined}
                            sx={{ width: 36, height: 36 }}
                            imgProps={{ loading: 'lazy' }}
                          >
                            {initialsFor(row.name)}
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {row.name}
                            </Typography>
                            {row.is_independent ? <IndependentBadge /> : null}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {row.father_name || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              flexWrap: 'wrap',
                            }}
                          >
                            <span>{row.parish}</span>
                            {overCap && (
                              <Chip
                                size="small"
                                color="warning"
                                label={`${parishCount} > ${SOFT_CAP_PER_PARISH}`}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>{row.deanery}</TableCell>
                        <TableCell>
                          {row.chaperone_name ? (
                            <Box>
                              <Typography variant="body2">
                                {row.chaperone_name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {row.chaperone_type}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              -
                            </Typography>
                          )}
                        </TableCell>
                        {includePhones && <TableCell>{row.phone}</TableCell>}
                        <TableCell>
                          {row.created_at ? formatRegisteredAt(row.created_at) : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Un-register">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                setDeleteDialog({
                                  open: true,
                                  registrationId: row.registration_id,
                                  saving: false,
                                })
                              }
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialog.open}
        title="Un-register this youth?"
        body="Their slot will be freed for the parish. This cannot be undone."
        confirmText="Un-register"
        loading={deleteDialog.saving}
        onClose={() =>
          !deleteDialog.saving &&
          setDeleteDialog({
            open: false,
            registrationId: null,
            saving: false,
          })
        }
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
};

export default RegisteredYouthList;
