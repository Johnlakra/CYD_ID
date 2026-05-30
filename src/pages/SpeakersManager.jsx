import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Card,
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
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  RecordVoiceOver as RecordVoiceOverIcon,
  PersonAdd as PersonAddIcon,
  List as ListIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import {
  listSpeakers,
  createSpeaker,
  updateSpeaker,
  deleteSpeaker,
} from '../api/anubhavApi';
import { PLACES, PLACE_META } from '../utils/anubhavHelpers';
import ConfirmDialog from '../components/ConfirmDialog';

const safeArray = (v) => (Array.isArray(v) ? v : []);

const handleAuthError = (envelope, onLogout) => {
  if (envelope && envelope.status === 401 && typeof onLogout === 'function') {
    toast.error('Session expired. Please login again.');
    onLogout();
    return true;
  }
  return false;
};

// "All places" is represented as null on the wire and '' in form state.
const ALL_PLACES = '';
const placeFormOptions = [
  { value: ALL_PLACES, label: 'All places' },
  ...PLACES.map((p) => ({ value: p, label: PLACE_META[p].label })),
];

const placeLabel = (place) =>
  place ? (PLACE_META[place] && PLACE_META[place].label) || place : 'All places';

const initials = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const emptyForm = { name: '', role: '', bio: '', photo_url: '', place: ALL_PLACES, sort_order: 0 };

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`speakers-tabpanel-${index}`}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Shared field set used by both the Add tab and the Edit dialog.
function SpeakerFields({ values, onChange, includeStatus = false }) {
  const set = (field) => (e) => onChange({ ...values, [field]: e.target.value });
  return (
    <Stack spacing={2}>
      <TextField
        label="Name"
        size="small"
        fullWidth
        required
        value={values.name}
        onChange={set('name')}
      />
      <TextField
        label="Role"
        size="small"
        fullWidth
        required
        placeholder="e.g. Keynote Speaker, Worship Leader"
        value={values.role}
        onChange={set('role')}
      />
      <TextField
        label="Bio"
        size="small"
        fullWidth
        multiline
        rows={3}
        value={values.bio}
        onChange={set('bio')}
      />
      <TextField
        label="Photo URL"
        size="small"
        fullWidth
        placeholder="https://… (optional)"
        value={values.photo_url}
        onChange={set('photo_url')}
      />
      <FormControl size="small" fullWidth>
        <InputLabel>Place</InputLabel>
        <Select label="Place" value={values.place} onChange={set('place')}>
          {placeFormOptions.map((opt) => (
            <MenuItem key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        label="Sort order"
        size="small"
        type="number"
        helperText="Lower numbers appear first on the website."
        sx={{ maxWidth: 220 }}
        value={values.sort_order}
        onChange={set('sort_order')}
      />
      {includeStatus && (
        <FormControlLabel
          control={
            <Switch
              checked={values.status === 1}
              onChange={(e) => onChange({ ...values, status: e.target.checked ? 1 : 0 })}
            />
          }
          label={values.status === 1 ? 'Published (visible on website)' : 'Hidden (draft)'}
        />
      )}
    </Stack>
  );
}

const SpeakersManager = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add-tab form
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Edit dialog
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, speaker: null });
  const [deleting, setDeleting] = useState(false);

  const fetchSpeakers = useCallback(async () => {
    setLoading(true);
    const res = await listSpeakers();
    setLoading(false);
    if (handleAuthError(res, onLogout)) return;
    if (!res.success) {
      toast.error(res.message || 'Failed to load speakers');
      setSpeakers([]);
      return;
    }
    // Backend returns the wrapper { speakers, count } (never a bare array).
    setSpeakers(safeArray(res.data?.speakers));
  }, [onLogout]);

  useEffect(() => {
    fetchSpeakers();
  }, [fetchSpeakers]);

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.warning('Name is required'); return; }
    if (!form.role.trim()) { toast.warning('Role is required'); return; }
    setSaving(true);
    const res = await createSpeaker({
      place: form.place === ALL_PLACES ? null : form.place,
      name: form.name.trim(),
      role: form.role.trim(),
      bio: form.bio.trim(),
      photo_url: form.photo_url.trim(),
      sort_order: Number(form.sort_order) || 0,
    });
    setSaving(false);
    if (handleAuthError(res, onLogout)) return;
    if (!res.success) { toast.error(res.message || 'Failed to add speaker'); return; }
    toast.success('Speaker added');
    setForm(emptyForm);
    fetchSpeakers();
    setActiveTab(1);
  };

  const openEdit = (speaker) => {
    setEditTarget(speaker);
    setEditForm({
      name: speaker.name || '',
      role: speaker.role || '',
      bio: speaker.bio || '',
      photo_url: speaker.photo_url || '',
      place: speaker.place || ALL_PLACES,
      sort_order: speaker.sort_order ?? 0,
      status: speaker.status ?? 1,
    });
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    if (!editForm.name.trim()) { toast.warning('Name is required'); return; }
    if (!editForm.role.trim()) { toast.warning('Role is required'); return; }
    setEditSaving(true);
    const res = await updateSpeaker(editTarget.id, {
      place: editForm.place === ALL_PLACES ? null : editForm.place,
      name: editForm.name.trim(),
      role: editForm.role.trim(),
      bio: editForm.bio.trim(),
      photo_url: editForm.photo_url.trim(),
      sort_order: Number(editForm.sort_order) || 0,
      status: editForm.status,
    });
    setEditSaving(false);
    if (handleAuthError(res, onLogout)) return;
    if (!res.success) { toast.error(res.message || 'Failed to update speaker'); return; }
    toast.success('Speaker updated');
    setEditTarget(null);
    fetchSpeakers();
  };

  // Inline sort_order change from a Manage-tab row.
  const handleSortOrderCommit = async (speaker, raw) => {
    const next = Number(raw);
    if (Number.isNaN(next) || next === (speaker.sort_order ?? 0)) return;
    const res = await updateSpeaker(speaker.id, { sort_order: next });
    if (handleAuthError(res, onLogout)) return;
    if (!res.success) { toast.error(res.message || 'Failed to reorder'); return; }
    fetchSpeakers();
  };

  const handleDelete = async () => {
    if (!deleteConfirm.speaker) return;
    setDeleting(true);
    const res = await deleteSpeaker(deleteConfirm.speaker.id);
    setDeleting(false);
    setDeleteConfirm({ open: false, speaker: null });
    if (handleAuthError(res, onLogout)) return;
    if (!res.success) { toast.error(res.message || 'Failed to delete speaker'); return; }
    toast.success('Speaker removed');
    fetchSpeakers();
  };

  // Group speakers by place: "All places" (null) first, then each venue.
  const groups = [
    { key: ALL_PLACES, label: 'All places', items: speakers.filter((s) => !s.place) },
    ...PLACES.map((p) => ({
      key: p,
      label: PLACE_META[p].label,
      items: speakers.filter((s) => s.place === p),
    })),
  ].filter((g) => g.items.length > 0);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <RecordVoiceOverIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          Speakers
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage the speakers shown on the public Anubhav website
        </Typography>
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            aria-label="Speakers tabs"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
              },
            }}
          >
            <Tab icon={<PersonAddIcon />} iconPosition="start" label="Add Speaker" />
            <Tab icon={<ListIcon />} iconPosition="start" label="Manage Speakers" />
          </Tabs>
        </Box>

        {/* Add Speaker */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ px: 3, pb: 3 }}>
            <Card sx={{ borderRadius: 3, maxWidth: 560 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  New Speaker
                </Typography>
                <SpeakerFields values={form} onChange={setForm} />
                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={handleCreate}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={18} /> : null}
                  >
                    {saving ? 'Adding…' : 'Add Speaker'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* Manage Speakers */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ px: 3, pb: 3 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : speakers.length === 0 ? (
              <Alert severity="info">No speakers yet. Add one from the “Add Speaker” tab.</Alert>
            ) : (
              <Stack spacing={3}>
                {groups.map((group) => (
                  <Box key={group.key || 'all'}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, color: 'text.secondary', mb: 1 }}
                    >
                      {group.label}
                    </Typography>
                    <Stack spacing={1.5}>
                      {group.items.map((sp) => (
                        <Box
                          key={sp.id}
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 2,
                            opacity: sp.status === 0 ? 0.6 : 1,
                          }}
                        >
                          <Avatar src={sp.photo_url || undefined} sx={{ width: 48, height: 48 }}>
                            {initials(sp.name)}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.25 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {sp.name}
                              </Typography>
                              <Chip size="small" variant="outlined" label={placeLabel(sp.place)} />
                              {sp.status === 0 && (
                                <Chip size="small" color="default" label="Hidden" />
                              )}
                            </Box>
                            <Typography variant="body2" color="primary" sx={{ mb: 0.25 }}>
                              {sp.role}
                            </Typography>
                            {sp.bio && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {sp.bio}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                            <TextField
                              label="Order"
                              type="number"
                              size="small"
                              defaultValue={sp.sort_order ?? 0}
                              onBlur={(e) => handleSortOrderCommit(sp, e.target.value)}
                              sx={{ width: 84 }}
                              inputProps={{ 'aria-label': `Sort order for ${sp.name}` }}
                            />
                            <IconButton
                              size="small"
                              aria-label={`Edit ${sp.name}`}
                              onClick={() => openEdit(sp)}
                              sx={{ minWidth: 44, minHeight: 44 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              aria-label={`Delete ${sp.name}`}
                              onClick={() => setDeleteConfirm({ open: true, speaker: sp })}
                              sx={{ minWidth: 44, minHeight: 44 }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                    <Divider sx={{ mt: 2 }} />
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </TabPanel>
      </Paper>

      {/* Edit dialog */}
      <Dialog open={Boolean(editTarget)} onClose={() => !editSaving && setEditTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Speaker</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <SpeakerFields values={editForm} onChange={setEditForm} includeStatus />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditTarget(null)} disabled={editSaving} sx={{ minHeight: 44 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEditSave}
            disabled={editSaving}
            startIcon={editSaving ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ minHeight: 44 }}
          >
            {editSaving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete speaker?"
        body={
          deleteConfirm.speaker
            ? `Delete ${deleteConfirm.speaker.name}? They will no longer appear on the website.`
            : ''
        }
        confirmText="Delete"
        loading={deleting}
        onClose={() => !deleting && setDeleteConfirm({ open: false, speaker: null })}
        onConfirm={handleDelete}
      />
    </Box>
  );
};

export default SpeakersManager;
