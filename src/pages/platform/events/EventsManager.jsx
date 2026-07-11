// Platform Phase 5 — Events page shell (Pillar E). Same page-mode pattern as
// the ID card designer: list ⇄ create wizard ⇄ records. Mounted from
// Dashboard case 'platform-events'; menu gated by ui.tab.events.

import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import { Add as AddIcon, EventNote as EventNoteIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { listEvents } from '../../../api/platformApi';
import Can from '../../../components/Can';
import { PERM } from '../../../utils/permissionKeys';
import { eventStatusChip, formatDateRange } from '../../../utils/eventHelpers';
import EventWizard from './EventWizard';
import EventRecords from './EventRecords';

const EventsManager = ({ onLogout }) => {
  // view: 'list' | 'create' | { eventId }
  const [view, setView] = useState('list');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await listEvents();
    setLoading(false);
    if (res.success) {
      setEvents(res.data.events || []);
    } else {
      if (res.status === 401 && onLogout) onLogout();
      toast.error(res.message || 'Failed to load events');
    }
  }, [onLogout]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (view === 'create') {
    return (
      <EventWizard
        onCancel={() => setView('list')}
        onCreated={(event) => {
          refresh();
          setView({ eventId: event.id });
        }}
        onLogout={onLogout}
      />
    );
  }

  if (view && view.eventId) {
    return (
      <EventRecords
        eventId={view.eventId}
        onBack={() => setView('list')}
        onChanged={refresh}
        onLogout={onLogout}
      />
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 300, flexGrow: 1 }}>
          Events
        </Typography>
        <Can perm={PERM.EVENTS_CREATE}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setView('create')}>
            New Event
          </Button>
        </Can>
      </Box>

      {loading && (
        <Box sx={{ p: 6, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && events.length === 0 && (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <EventNoteIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">
              No events yet. Create your first event to open registrations.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={2}>
        {events.map((event) => {
          const chip = eventStatusChip(event.status);
          return (
            <Grid item xs={12} sm={6} md={4} key={event.id}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardActionArea sx={{ height: '100%' }} onClick={() => setView({ eventId: event.id })}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 500, flexGrow: 1 }}>
                        {event.name}
                      </Typography>
                      <Chip label={chip.label} color={chip.color} size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {event.scope === 'diocese' ? 'Diocese-wide' : `${event.scope}: ${event.scope_ref}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDateRange(event.start_date, event.end_date)}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1.5 }}>
                      <Chip size="small" variant="outlined" label={`${event.venue_count || 0} venues`} />
                      {Number(event.fee_enabled) === 1 && (
                        <Chip size="small" variant="outlined" label={`Fee ₹${event.fee_amount}`} />
                      )}
                      {Number(event.accommodation_enabled) === 1 && (
                        <Chip size="small" variant="outlined" label="Accommodation" />
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default EventsManager;
