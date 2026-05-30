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
  Chip,
  Link,
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  Delete as DeleteIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from '../api/anubhavApi';
import { PLACES, PLACE_META, formatDateTime } from '../utils/anubhavHelpers';
import ConfirmDialog from '../components/ConfirmDialog';

// Public marketing/info website. Override per-environment via
// REACT_APP_ANUBHAV_WEB_URL. TODO: confirm the final deployed domain.
const ANUBHAV_WEB_URL =
  process.env.REACT_APP_ANUBHAV_WEB_URL || 'https://anubhav.diocesseofjalandhar.in';

const safeArray = (v) => (Array.isArray(v) ? v : []);

const handleAuthError = (envelope, onLogout) => {
  if (envelope && envelope.status === 401 && typeof onLogout === 'function') {
    toast.error('Session expired. Please login again.');
    onLogout();
    return true;
  }
  return false;
};

const placeLabel = (place) => {
  if (!place) return 'Diocese-wide';
  return (PLACE_META[place] && PLACE_META[place].label) || place;
};

const AnnouncementManager = ({ activePlace, eventRole, onLogout }) => {
  const resolvedPlace = activePlace || PLACES[0];
  const isDexco = eventRole === 'dexco';

  const scopeOptions = isDexco
    ? [
        { value: resolvedPlace, label: `This venue only (${placeLabel(resolvedPlace)})` },
        { value: '', label: 'Diocese-wide (all venues)' },
      ]
    : [{ value: resolvedPlace, label: placeLabel(resolvedPlace) }];

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scope, setScope] = useState(resolvedPlace);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const fetchAnnouncements = useCallback(async () => {
    if (!resolvedPlace) return;
    setLoading(true);
    const res = await getAnnouncements({ place: resolvedPlace });
    setLoading(false);
    if (handleAuthError(res, onLogout)) return;
    if (!res.success) {
      toast.error(res.message || 'Failed to load announcements');
      setAnnouncements([]);
      return;
    }
    setAnnouncements(safeArray(res.data?.announcements ?? res.data));
  }, [resolvedPlace, onLogout]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Sync scope default when resolvedPlace changes
  useEffect(() => {
    setScope(resolvedPlace);
  }, [resolvedPlace]);

  const handleSubmit = async () => {
    if (!title.trim()) { toast.warning('Title is required'); return; }
    if (!body.trim()) { toast.warning('Body is required'); return; }

    setSaving(true);
    const res = await createAnnouncement({
      place: scope === '' ? null : scope,
      title: title.trim(),
      body: body.trim(),
    });
    setSaving(false);
    if (handleAuthError(res, onLogout)) return;
    if (!res.success) {
      toast.error(res.message || 'Failed to post announcement');
      return;
    }
    toast.success('Announcement posted');
    setTitle('');
    setBody('');
    setScope(resolvedPlace);
    fetchAnnouncements();
  };

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, ann: null });
  const [deleting, setDeleting] = useState(false);

  const askDelete = (ann) => {
    setDeleteConfirm({ open: true, ann });
  };

  const handleDelete = async () => {
    if (!deleteConfirm.ann) return;
    setDeleting(true);
    const res = await deleteAnnouncement(deleteConfirm.ann.id);
    setDeleting(false);
    setDeleteConfirm({ open: false, ann: null });
    if (handleAuthError(res, onLogout)) return;
    if (!res.success) {
      toast.error(res.message || 'Failed to delete announcement');
      return;
    }
    toast.success('Announcement deleted');
    fetchAnnouncements();
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CampaignIcon color="primary" />
              <Typography variant="h6">Announcements</Typography>
            </Box>
          }
          subheader={`Venue: ${resolvedPlace}`}
          action={
            <Link
              href={ANUBHAV_WEB_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="body2"
              underline="hover"
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mr: 1, mt: 1 }}
            >
              View public website
              <OpenInNewIcon sx={{ fontSize: 16 }} />
            </Link>
          }
        />
        <CardContent>
          {/* Post form */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Post Announcement
          </Typography>
          <Stack spacing={2} sx={{ mb: 4 }}>
            <FormControl size="small" sx={{ maxWidth: 400 }}>
              <InputLabel>Scope</InputLabel>
              <Select
                label="Scope"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                disabled={!isDexco}
              >
                {scopeOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Title"
              size="small"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
              label="Body"
              size="small"
              fullWidth
              multiline
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <Box>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={18} /> : null}
              >
                {saving ? 'Posting…' : 'Post'}
              </Button>
            </Box>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {/* Announcements list */}
          {announcements.length === 0 ? (
            <Alert severity="info">No announcements yet for this venue.</Alert>
          ) : (
            <Stack spacing={2}>
              {announcements.map((ann) => (
                <Box
                  key={ann.id}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 2,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                      <Chip
                        size="small"
                        label={ann.place ? placeLabel(ann.place) : 'Diocese-wide'}
                        color={ann.place ? 'primary' : 'warning'}
                        variant="outlined"
                      />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {ann.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {ann.body}
                    </Typography>
                    {ann.created_at && (
                      <Typography variant="caption" color="text.disabled">
                        {formatDateTime(ann.created_at)}
                      </Typography>
                    )}
                  </Box>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label={`Delete announcement ${ann.title}`}
                    onClick={() => askDelete(ann)}
                    sx={{ flexShrink: 0, minWidth: 44, minHeight: 44 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete announcement?"
        body={
          deleteConfirm.ann
            ? `"${deleteConfirm.ann.title}" will be removed for everyone who can see this venue.`
            : ''
        }
        confirmText="Delete"
        loading={deleting}
        onClose={() => !deleting && setDeleteConfirm({ open: false, ann: null })}
        onConfirm={handleDelete}
      />
    </Box>
  );
};

export default AnnouncementManager;
