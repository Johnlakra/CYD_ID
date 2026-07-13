// Platform Phase 6 — scan-desk instant registration (Pillar F).
// Flow: pick event + venue -> camera scan (html5-qrcode) -> confirm card ->
// POST /events/:id/registrations -> success flash, ready for the next scan.
// Duplicates show "already registered" with the original timestamp; a manual
// phone search covers youth without their QR. Gated by events.scan_register.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  PersonSearch as PersonSearchIcon,
  QrCodeScanner as QrCodeScannerIcon,
  VideocamOff as VideocamOffIcon,
} from '@mui/icons-material';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'react-toastify';
import {
  getEvent,
  listEvents,
  qrScanLookup,
  scanRegister,
  searchScanProfiles,
} from '../../../api/platformApi';
import { formatScanTimestamp, parseQrPayload } from '../../../utils/qrHelpers';

const READER_ID = 'scan-desk-reader';
const RESCAN_COOLDOWN_MS = 3000;
const SUCCESS_FLASH_MS = 1800;

const ScanDesk = ({ onLogout }) => {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [venues, setVenues] = useState([]);
  const [venueKey, setVenueKey] = useState('');
  const [cameraState, setCameraState] = useState('off'); // off | starting | on | unavailable
  // candidate: { profile, eligibility, qr_token } | null — the confirm card.
  const [candidate, setCandidate] = useState(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(null); // { name } success banner
  const [phoneQuery, setPhoneQuery] = useState('');
  const [phoneResults, setPhoneResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const scannerRef = useRef(null);
  const lastScanRef = useRef({ token: null, at: 0 });
  const deskRef = useRef({ eventId: '', venueKey: '' });
  deskRef.current = { eventId, venueKey };

  const handle401 = useCallback(
    (res) => {
      if (res.status === 401 && onLogout) onLogout();
    },
    [onLogout]
  );

  // ---- Event/venue selection -----------------------------------------------------

  useEffect(() => {
    listEvents().then((res) => {
      if (!res.success) {
        handle401(res);
        toast.error(res.message || 'Failed to load events');
        return;
      }
      const rows = (res.data.events || []).filter((event) => event.status === 'open');
      setEvents(rows);
      if (rows.length === 1) setEventId(rows[0].id);
    });
  }, [handle401]);

  useEffect(() => {
    if (!eventId) {
      setVenues([]);
      setVenueKey('');
      return;
    }
    getEvent(eventId).then((res) => {
      if (!res.success) {
        handle401(res);
        toast.error(res.message);
        return;
      }
      const rows = res.data.event.venues || [];
      setVenues(rows);
      setVenueKey(rows.length === 1 ? rows[0].venue_key : '');
    });
  }, [eventId, handle401]);

  const deskReady = Boolean(eventId && venueKey);

  // ---- Camera ------------------------------------------------------------------------

  const handleDecoded = useCallback(
    async (decodedText) => {
      const desk = deskRef.current;
      if (!desk.eventId || !desk.venueKey) return;
      const parsed = parseQrPayload(decodedText);
      if (!parsed) return; // not a CYD code — keep scanning silently
      const now = Date.now();
      if (lastScanRef.current.token === parsed.token && now - lastScanRef.current.at < RESCAN_COOLDOWN_MS) {
        return;
      }
      lastScanRef.current = { token: parsed.token, at: now };
      const res = await qrScanLookup(parsed.token, {
        event_id: desk.eventId,
        venue_key: desk.venueKey,
      });
      if (!res.success) {
        handle401(res);
        toast.error(res.message);
        return;
      }
      setFlash(null);
      setCandidate({ ...res.data, qr_token: parsed.token });
    },
    [handle401]
  );

  useEffect(() => {
    if (!deskReady || cameraState === 'unavailable') return undefined;
    let disposed = false;
    const scanner = new Html5Qrcode(READER_ID);
    scannerRef.current = scanner;
    setCameraState('starting');
    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => handleDecoded(text),
        () => {} // per-frame decode misses are normal noise
      )
      .then(() => {
        if (!disposed) setCameraState('on');
      })
      .catch(() => {
        if (!disposed) setCameraState('unavailable');
      });
    return () => {
      disposed = true;
      scannerRef.current = null;
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deskReady, handleDecoded]);

  // ---- Registration ---------------------------------------------------------------------

  const register = async ({ qrToken, profileId, name }) => {
    setBusy(true);
    const res = await scanRegister(eventId, {
      venue_key: venueKey,
      ...(qrToken ? { qr_token: qrToken } : { profile_id: profileId }),
    });
    setBusy(false);
    if (res.success) {
      setCandidate(null);
      setPhoneResults(null);
      setPhoneQuery('');
      setFlash({ name: res.data.profile.name });
      setTimeout(() => setFlash(null), SUCCESS_FLASH_MS);
      return;
    }
    handle401(res);
    if (res.status === 409 && res.data && res.data.already_registered) {
      toast.warn(`Already registered on ${formatScanTimestamp(res.data.registered_at)}`);
      setCandidate(null);
      return;
    }
    toast.error(res.message || 'Registration failed');
  };

  // ---- Phone fallback ----------------------------------------------------------------------

  const runPhoneSearch = async (e) => {
    e.preventDefault();
    const term = phoneQuery.trim();
    if (term.length < 3) return;
    setSearching(true);
    const res = await searchScanProfiles(term);
    setSearching(false);
    if (res.success) {
      setPhoneResults(res.data.profiles || []);
    } else {
      handle401(res);
      toast.error(res.message);
    }
  };

  // ---- Render --------------------------------------------------------------------------------

  const eligibility = candidate && candidate.eligibility;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 300, mb: 1 }}>
        <QrCodeScannerIcon sx={{ fontSize: 32, mr: 1, verticalAlign: 'text-bottom' }} />
        Scan Desk
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Scan a youth&apos;s QR code to register them for the selected event venue in seconds.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            select
            fullWidth
            label="Event"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            helperText={events.length === 0 ? 'No open events' : undefined}
          >
            {events.map((event) => (
              <MenuItem key={event.id} value={event.id}>
                {event.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            select
            fullWidth
            label="Venue"
            value={venueKey}
            onChange={(e) => setVenueKey(e.target.value)}
            disabled={!eventId}
          >
            {venues.map((venue) => (
              <MenuItem key={venue.venue_key} value={venue.venue_key}>
                {venue.name || venue.venue_key}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {flash && (
        <Alert icon={<CheckCircleIcon />} severity="success" sx={{ mb: 2 }}>
          Registered <strong>{flash.name}</strong> — ready for the next scan.
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* Camera pane */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 400, mb: 1 }}>
                Camera
              </Typography>
              {!deskReady && (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  Select an event and venue to start scanning.
                </Typography>
              )}
              {deskReady && cameraState === 'unavailable' && (
                <Alert icon={<VideocamOffIcon />} severity="warning">
                  Camera unavailable or permission denied — use the phone search on the right.
                </Alert>
              )}
              {/* html5-qrcode mounts its video stream into this element */}
              <Box id={READER_ID} sx={{ width: '100%', display: deskReady ? 'block' : 'none' }} />
              {deskReady && cameraState === 'starting' && (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <CircularProgress size={22} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Confirm / fallback pane */}
        <Grid item xs={12} md={6}>
          {candidate && (
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar src={candidate.profile.photo_url || ''} sx={{ width: 72, height: 72 }} />
                  <Box>
                    <Typography variant="h5" sx={{ textTransform: 'capitalize' }}>
                      {candidate.profile.name}
                    </Typography>
                    <Typography color="text.secondary">
                      {candidate.profile.parish} · {candidate.profile.deanery}
                    </Typography>
                    <Chip size="small" label={candidate.profile.designation || candidate.profile.level} sx={{ mt: 0.5 }} />
                  </Box>
                </Box>
                {eligibility && eligibility.already_registered && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Already registered on {formatScanTimestamp(eligibility.registered_at)}.
                  </Alert>
                )}
                {eligibility && !eligibility.already_registered && !eligibility.eligible && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {eligibility.reason || 'Not eligible for this venue'}
                  </Alert>
                )}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    fullWidth
                    size="large"
                    variant="contained"
                    color="success"
                    disabled={busy || !eligibility || !eligibility.eligible}
                    onClick={() => register({ qrToken: candidate.qr_token })}
                  >
                    {busy ? <CircularProgress size={22} /> : 'Register'}
                  </Button>
                  <Button size="large" onClick={() => setCandidate(null)} disabled={busy}>
                    Dismiss
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 400, mb: 1 }}>
                <PersonSearchIcon sx={{ fontSize: 20, mr: 0.5, verticalAlign: 'text-bottom' }} />
                Phone search (no QR?)
              </Typography>
              <Box component="form" onSubmit={runPhoneSearch} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Phone number or name"
                  value={phoneQuery}
                  onChange={(e) => setPhoneQuery(e.target.value)}
                  disabled={!deskReady}
                />
                <Button type="submit" variant="outlined" disabled={!deskReady || searching}>
                  {searching ? <CircularProgress size={18} /> : 'Search'}
                </Button>
              </Box>
              {phoneResults && phoneResults.length === 0 && (
                <Typography color="text.secondary" variant="body2">
                  No matches in this diocese.
                </Typography>
              )}
              {phoneResults && phoneResults.length > 0 && (
                <>
                  <Divider sx={{ mb: 1 }} />
                  <List dense disablePadding>
                    {phoneResults.map((profile) => (
                      <ListItem
                        key={profile.id}
                        secondaryAction={
                          <Button
                            size="small"
                            variant="contained"
                            disabled={busy}
                            onClick={() => register({ profileId: profile.id, name: profile.name })}
                          >
                            Register
                          </Button>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar src={profile.photo_url || ''} />
                        </ListItemAvatar>
                        <ListItemText
                          primary={profile.name}
                          primaryTypographyProps={{ sx: { textTransform: 'capitalize' } }}
                          secondary={`${profile.parish || ''} · ${profile.deanery || ''}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ScanDesk;
