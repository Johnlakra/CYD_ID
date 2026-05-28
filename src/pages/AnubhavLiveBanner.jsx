import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Chip,
  Typography,
  CircularProgress,
} from '@mui/material';
import { getTimetableLive } from '../api/anubhavApi';
import { PLACES, to12h } from '../utils/anubhavHelpers';

const POLL_INTERVAL_MS = 2 * 60 * 1000;

const AnubhavLiveBanner = ({ activePlace, eventRole }) => {
  const resolvedPlace = activePlace || PLACES[0];

  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLive = useCallback(async () => {
    const res = await getTimetableLive({ place: resolvedPlace });
    if (res.success && res.data) {
      setLiveData(res.data);
    }
    setLoading(false);
  }, [resolvedPlace]);

  useEffect(() => {
    fetchLive();
    const timer = setInterval(fetchLive, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchLive]);

  if (eventRole !== 'loc' && eventRole !== 'dexco') return null;
  if (loading) {
    return (
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="caption" color="text.secondary">
          Loading live schedule…
        </Typography>
      </Box>
    );
  }
  if (!liveData) return null;

  const { now, next } = liveData;

  const formatRange = (item) =>
    item ? `${to12h(item.start_time)}–${to12h(item.end_time)} ${item.title}` : null;

  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        px: 2,
        py: 1,
        mb: 3,
        borderRadius: 2,
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip label="NOW" color="success" size="small" />
        <Typography variant="body2">
          {now ? formatRange(now) : 'No session in progress'}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip label="NEXT" color="info" size="small" />
        <Typography variant="body2">
          {next ? formatRange(next) : 'No upcoming sessions'}
        </Typography>
      </Box>
    </Paper>
  );
};

export default AnubhavLiveBanner;
