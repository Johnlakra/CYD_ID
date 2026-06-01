import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  CircularProgress,
  Chip,
  Stack,
  Alert,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Avatar,
  Badge,
} from '@mui/material';
import { Celebration as CelebrationIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { getMyEvent, getTimetableLive } from '../api/anubhavApi';
import { PLACE_META, to12h } from '../utils/anubhavHelpers';
import { IndependentDot } from '../components/IndependentBadge';

const POLL_INTERVAL_MS = 2 * 60 * 1000;

const DAY_LABELS = { 1: 'Day 1', 2: 'Day 2', 3: 'Day 3' };
const safeArray = (v) => (Array.isArray(v) ? v : []);

const initialsFor = (name) => {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const MyEvent = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [liveData, setLiveData] = useState(null);

  useEffect(() => {
    getMyEvent()
      .then((res) => {
        setLoading(false);
        if (res.success && res.data) {
          setData(res.data);
        } else if (!res.success) {
          setError(true);
          toast.error(res.message || 'Failed to load your event details');
        }
      })
      .catch(() => {
        setLoading(false);
        setError(true);
        toast.error('Network error — please try again');
      });
  }, []);

  const fetchLive = useCallback(async () => {
    if (!data || !data.registered || !data.place) return;
    const res = await getTimetableLive({ place: data.place });
    if (res.success && res.data) setLiveData(res.data);
  }, [data]);

  useEffect(() => {
    fetchLive();
    const timer = setInterval(fetchLive, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchLive]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Alert severity="error">
          Could not load your event details. Please refresh or try again later.
        </Alert>
      </Box>
    );
  }

  if (!data || !data.registered) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Alert severity="info" icon={<CelebrationIcon />}>
          You're not registered for Anubhav 2026 yet. Please contact your parish coordinator to get registered.
        </Alert>
      </Box>
    );
  }

  const pm = PLACE_META[data.place] || { label: data.place, venue: '', dates: '' };
  const { room, timetable, announcements } = data;

  const groupedTimetable = [1, 2, 3].map((day) => ({
    day,
    label: DAY_LABELS[day] || `Day ${day}`,
    rows: safeArray(timetable)
      .filter((it) => it.day === day)
      .sort((a, b) => (a.start_time > b.start_time ? 1 : -1)),
  }));

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Anubhav 2026 — {pm.label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {pm.venue} · {pm.dates}
        </Typography>
      </Box>

      <Stack spacing={3}>
        {/* Live now / up next */}
        {liveData && (
          <Paper
            variant="outlined"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              px: 2,
              py: 1.5,
              borderRadius: 3,
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="NOW" color="success" size="small" />
              <Typography variant="body2">
                {liveData.now
                  ? `${to12h(liveData.now.start_time)}–${to12h(liveData.now.end_time)} ${liveData.now.title}`
                  : 'No session in progress'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="NEXT" color="info" size="small" />
              <Typography variant="body2">
                {liveData.next
                  ? `${to12h(liveData.next.start_time)}–${to12h(liveData.next.end_time)} ${liveData.next.title}`
                  : 'No upcoming sessions'}
              </Typography>
            </Box>
          </Paper>
        )}

        {/* Room assignment */}
        <Card sx={{ borderRadius: 3 }}>
          <CardHeader title="Accommodation" />
          <CardContent>
            {room ? (
              <>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {room.building} · {room.floor} · {room.room}
                </Typography>
                {room.roommates && room.roommates.length > 0 && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mb: 0.75 }}
                    >
                      Roommates
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {room.roommates.map((rm, idx) => (
                        <Chip
                          key={idx}
                          avatar={
                            <Badge
                              overlap="circular"
                              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                              badgeContent={rm.is_independent ? <IndependentDot size={7} /> : null}
                            >
                              <Avatar
                                src={rm.photo_url || undefined}
                                imgProps={{ loading: 'lazy' }}
                              >
                                {initialsFor(rm.name)}
                              </Avatar>
                            </Badge>
                          }
                          label={`${rm.name} · ${rm.parish}`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Room not assigned yet.
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Timetable — read-only, grouped by day */}
        <Card sx={{ borderRadius: 3 }}>
          <CardHeader title="Timetable" />
          <CardContent>
            {safeArray(timetable).length === 0 ? (
              <Alert severity="info">Timetable not published yet.</Alert>
            ) : (
              groupedTimetable.map(({ day, label, rows }) => (
                <Box key={day} sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    {label}
                  </Typography>
                  {rows.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No items for {label}.
                    </Typography>
                  ) : (
                    <Box sx={{ overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                            <TableCell sx={{ fontWeight: 600, display: { xs: 'none', sm: 'table-cell' } }}>Location</TableCell>
                            <TableCell sx={{ fontWeight: 600, display: { xs: 'none', md: 'table-cell' } }}>Notes</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rows.map((item) => (
                            <TableRow key={item.id} hover>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                {to12h(item.start_time)} – {to12h(item.end_time)}
                              </TableCell>
                              <TableCell>{item.title}</TableCell>
                              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                {item.location}
                              </TableCell>
                              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                {item.notes || '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  )}
                </Box>
              ))
            )}
          </CardContent>
        </Card>

        {/* Announcements — read-only */}
        <Card sx={{ borderRadius: 3 }}>
          <CardHeader title="Announcements" />
          <CardContent>
            {safeArray(announcements).length === 0 ? (
              <Alert severity="info">No announcements at this time.</Alert>
            ) : (
              <Stack spacing={2}>
                {safeArray(announcements).map((ann) => (
                  <Box
                    key={ann.id}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 3,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 0.5,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Chip
                        size="small"
                        label={ann.place ? pm.label : 'Diocese-wide'}
                        color={ann.place ? 'primary' : 'warning'}
                        variant="outlined"
                      />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {ann.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {ann.body}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default MyEvent;
