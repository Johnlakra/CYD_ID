// "Independent Entries" tab inside Manage Profiles. Lists youth registered
// directly for Anubhav (is_independent=1) — these never appear on /profiles.
// Each row can be edited, promoted to a full ID-card profile, deleted, or (when
// complete) printed. Promotion returns login credentials shown in a dialog.
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Typography,
  Avatar,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Skeleton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  UpgradeOutlined as PromoteIcon,
  Badge as IdCardIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { getIndependents, deleteIndependent } from '../api/anubhavApi';
import { PLACES, PLACE_META, missingIdCardFields } from '../utils/anubhavHelpers';
import IndependentBadge from '../components/IndependentBadge';
import IndependentEntryDialog from '../components/IndependentEntryDialog';
import PromoteIndependentDialog from '../components/PromoteIndependentDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import IDCard from '../components/IDCard';

const initialsFor = (name) => {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const IndependentEntriesTab = ({ onLogout }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [placeFilter, setPlaceFilter] = useState('');

  const [editRow, setEditRow] = useState(null);
  const [promoteRow, setPromoteRow] = useState(null);
  const [printRow, setPrintRow] = useState(null);
  const [deleteState, setDeleteState] = useState({ open: false, row: null, loading: false });
  const [credentials, setCredentials] = useState(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const res = await getIndependents({
      place: placeFilter || undefined,
      search: search.trim() || undefined,
    });
    setLoading(false);
    if (res && res.status === 401 && typeof onLogout === 'function') {
      onLogout();
      return;
    }
    if (!res.success) {
      toast.error(res.message || 'Failed to load independent entries');
      setRows([]);
      return;
    }
    setRows(Array.isArray(res.data?.independents) ? res.data.independents : []);
  }, [placeFilter, search, onLogout]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleConfirmDelete = async () => {
    if (!deleteState.row) return;
    setDeleteState((prev) => ({ ...prev, loading: true }));
    const res = await deleteIndependent(deleteState.row.id);
    setDeleteState({ open: false, row: null, loading: false });
    if (!res.success) {
      toast.error(res.message || 'Could not delete entry');
      return;
    }
    toast.success('Independent entry deleted');
    fetchRows();
  };

  const handlePromoted = (data) => {
    setCredentials(data?.credentials || null);
    fetchRows();
  };

  const copyUsername = async () => {
    try {
      await navigator.clipboard.writeText(credentials?.username || '');
      toast.success('Username copied');
    } catch {
      toast.error('Could not copy — please select and copy manually');
    }
  };

  const renderCompleteness = (row) => {
    if (row.id_card_complete) {
      return <Chip size="small" color="success" label="Ready for ID card" />;
    }
    const missing = missingIdCardFields(row);
    return (
      <Tooltip title={`Missing: ${missing.join(', ')}`}>
        <Chip size="small" color="default" variant="outlined" label={`Incomplete (${missing.length})`} />
      </Tooltip>
    );
  };

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6">Independent Entries</Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={fetchRows}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
            >
              Refresh
            </Button>
          </Box>
        }
        subheader="Youth registered directly for Anubhav — promote to create a full ID-card profile."
      />
      <CardContent>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name or phone"
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
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Place</InputLabel>
              <Select value={placeFilter} label="Place" onChange={(e) => setPlaceFilter(e.target.value)}>
                <MenuItem value="">All Places</MenuItem>
                {PLACES.map((p) => (
                  <MenuItem key={p} value={p}>{PLACE_META[p].label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: 56 }} />
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Parish · Deanery</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>ID-card status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No independent entries found.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const missing = missingIdCardFields(row);
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ py: 1, pr: 0 }}>
                        <Avatar src={row.photo_url || undefined} sx={{ width: 36, height: 36 }}>
                          {initialsFor(row.name)}
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.name}</Typography>
                          <IndependentBadge />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {row.parish} · {row.deanery}
                        </Typography>
                      </TableCell>
                      <TableCell>{row.phone || '—'}</TableCell>
                      <TableCell>{renderCompleteness(row)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit entry">
                          <IconButton size="small" color="info" aria-label={`Edit ${row.name}`} onClick={() => setEditRow(row)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Promote to full profile">
                          <IconButton size="small" color="primary" aria-label={`Promote ${row.name}`} onClick={() => setPromoteRow(row)}>
                            <PromoteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={
                            row.id_card_complete
                              ? 'Print ID card'
                              : `Complete these first: ${missing.join(', ')}`
                          }
                        >
                          <span>
                            <IconButton
                              size="small"
                              aria-label={`Print ID card for ${row.name}`}
                              disabled={!row.id_card_complete}
                              onClick={() => setPrintRow(row)}
                            >
                              <IdCardIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Delete entry">
                          <IconButton size="small" color="error" aria-label={`Delete ${row.name}`} onClick={() => setDeleteState({ open: true, row, loading: false })}>
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

      {/* Edit */}
      <IndependentEntryDialog
        open={!!editRow}
        mode="edit"
        initial={editRow}
        onClose={() => setEditRow(null)}
        onSaved={fetchRows}
      />

      {/* Promote */}
      <PromoteIndependentDialog
        open={!!promoteRow}
        row={promoteRow}
        onClose={() => setPromoteRow(null)}
        onPromoted={handlePromoted}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteState.open}
        title="Delete this independent entry?"
        body="This removes the entry. It cannot be deleted while an active registration exists."
        confirmText="Delete"
        loading={deleteState.loading}
        onClose={() => !deleteState.loading && setDeleteState({ open: false, row: null, loading: false })}
        onConfirm={handleConfirmDelete}
      />

      {/* ID card preview (only reachable when complete) */}
      <Dialog open={!!printRow} onClose={() => setPrintRow(null)} maxWidth="md" fullWidth>
        <DialogTitle>ID Card Preview</DialogTitle>
        <DialogContent>
          {printRow && (
            <IDCard
              data={{
                ...printRow,
                photo: printRow.photo_url,
                issue_date: new Date().toISOString(),
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrintRow(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Promotion success — generated credentials */}
      <Dialog open={!!credentials} onClose={() => setCredentials(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Profile created 🎉</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The independent entry is now a full ID-card profile. Share these login details with the youth.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              p: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">Username</Typography>
              <Typography variant="h6" sx={{ fontFamily: 'monospace', lineHeight: 1.2 }}>
                {credentials?.username}
              </Typography>
            </Box>
            <Tooltip title="Copy username">
              <IconButton onClick={copyUsername}><CopyIcon /></IconButton>
            </Tooltip>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Alert severity="info">
            Password is the youth's phone number — share this so they can log in.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setCredentials(null)}>Done</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default IndependentEntriesTab;
