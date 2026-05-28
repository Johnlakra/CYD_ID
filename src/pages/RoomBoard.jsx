import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Grid,
  Typography,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tooltip,
  Autocomplete,
  TextField,
  Avatar,
} from '@mui/material';
import {
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
  GridView as GridViewIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { getBuildings, getRegistrations, createAllotmentBatch, deleteAllotment } from '../api/anubhavApi';

const safeArray = (value) => (Array.isArray(value) ? value : []);

const handleAuthError = (envelope, onLogout) => {
  if (envelope && envelope.status === 401 && typeof onLogout === 'function') {
    toast.error('Session expired. Please login again.');
    onLogout();
    return true;
  }
  return false;
};

// ── Allot dialog ─────────────────────────────────────────────────────────────

const AllotDialog = ({ open, room, unallottedYouth, onClose, onAllotted }) => {
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  const vacant = room ? Math.max(0, room.capacity - room.occupancy) : 0;

  const handleClose = () => {
    setSelected([]);
    onClose();
  };

  const handleConfirm = async () => {
    if (!selected.length) { toast.warning('Select at least one youth'); return; }
    setSaving(true);
    const res = await createAllotmentBatch({
      room_id: room.id,
      registration_ids: selected.map((y) => y.registration_id),
    });
    setSaving(false);
    if (!res.success) { toast.error(res.message || 'Could not allot youth'); return; }
    const { succeeded = [], failed = [] } = res.data || {};
    if (succeeded.length) toast.success(`${succeeded.length} youth allotted`);
    if (failed.length) toast.warning(`${failed.length} failed: ${failed.map((f) => f.reason).join(', ')}`);
    handleClose();
    onAllotted();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          Allot to {room?.name}
          {room && (
            <Typography variant="caption" color="text.secondary">
              ({vacant} slot{vacant !== 1 ? 's' : ''} remaining)
            </Typography>
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        {safeArray(unallottedYouth).length === 0 ? (
          <Alert severity="info" sx={{ mt: 1 }}>
            All registered youth for this venue are already allotted.
          </Alert>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={safeArray(unallottedYouth)}
              getOptionLabel={(opt) => opt.name || ''}
              isOptionEqualToValue={(opt, val) => opt.registration_id === val.registration_id}
              getOptionDisabled={(opt) =>
                selected.length >= vacant && !selected.find((s) => s.registration_id === opt.registration_id)
              }
              filterOptions={(options, { inputValue }) => {
                const term = inputValue.trim().toLowerCase();
                if (!term) return options;
                return options.filter((opt) =>
                  [opt.name, opt.parish, opt.deanery, opt.phone]
                    .some((f) => f && String(f).toLowerCase().includes(term))
                );
              }}
              renderOption={(props, option) => {
                const { key, ...rest } = props;
                return (
                  <Box component="li" key={key} {...rest} sx={{ gap: 1.5, alignItems: 'flex-start !important' }}>
                    <Avatar sx={{ width: 36, height: 36, flexShrink: 0, mt: 0.5 }}>
                      {option.name?.charAt(0)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.parish} · {option.deanery}
                      </Typography>
                    </Box>
                  </Box>
                );
              }}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((opt, index) => (
                  <Chip
                    key={opt.registration_id}
                    avatar={<Avatar>{opt.name?.charAt(0)}</Avatar>}
                    label={opt.name}
                    size="small"
                    {...getTagProps({ index })}
                  />
                ))
              }
              value={selected}
              onChange={(_, newVal) => setSelected(newVal)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select youth (name, parish, deanery, phone)"
                  size="small"
                />
              )}
            />
            {selected.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {selected.length} selected · {vacant - selected.length} slot{vacant - selected.length !== 1 ? 's' : ''} remaining
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={saving || !selected.length}
          startIcon={saving ? <CircularProgress size={18} /> : <PersonAddIcon />}
        >
          {saving ? 'Allotting…' : selected.length > 1 ? `Allot ${selected.length} Youth` : 'Allot Youth'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Room card ─────────────────────────────────────────────────────────────────

const RoomCard = ({ room, unallottedYouth, onAllotted, onUnallot }) => {
  const [allotOpen, setAllotOpen] = useState(false);
  const isFull = room.occupancy >= room.capacity;
  const fillPct = room.capacity > 0
    ? Math.min(100, Math.round((room.occupancy / room.capacity) * 100))
    : 0;

  const chipColor = room.occupancy > room.capacity
    ? 'error'
    : room.occupancy === room.capacity
    ? 'warning'
    : 'success';

  return (
    <>
      <Card sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {room.name}
              </Typography>
              <Chip
                size="small"
                label={`${room.occupancy} / ${room.capacity}`}
                color={chipColor}
              />
            </Box>
          }
        />
        <CardContent sx={{ pt: 0, pb: 1, flexGrow: 1 }}>
          <LinearProgress
            variant="determinate"
            value={fillPct}
            color={chipColor}
            sx={{ mb: 2, borderRadius: 4, height: 6 }}
          />
          {safeArray(room.occupants).length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No occupants yet.
            </Typography>
          ) : (
            <List dense disablePadding>
              {safeArray(room.occupants).map((occupant) => (
                <ListItem key={occupant.allotment_id} disableGutters sx={{ pr: 5 }}>
                  <ListItemText
                    primary={occupant.name}
                    secondary={occupant.parish}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Un-allot">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onUnallot(occupant.allotment_id)}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
        <Box sx={{ p: 1.5, pt: 0 }}>
          <Button
            variant="outlined"
            size="small"
            fullWidth
            startIcon={<PersonAddIcon />}
            disabled={isFull}
            onClick={() => setAllotOpen(true)}
          >
            Allot Youth
          </Button>
        </Box>
      </Card>

      <AllotDialog
        open={allotOpen}
        room={room}
        unallottedYouth={unallottedYouth}
        onClose={() => setAllotOpen(false)}
        onAllotted={() => {
          setAllotOpen(false);
          onAllotted();
        }}
      />
    </>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const RoomBoard = ({ activePlace, onLogout, refreshKey }) => {
  const [buildings, setBuildings] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterBuildingId, setFilterBuildingId] = useState('');
  const [filterFloorId, setFilterFloorId] = useState('');

  const fetchData = useCallback(async () => {
    if (!activePlace) return;
    setLoading(true);
    const [buildingsRes, regsRes] = await Promise.all([
      getBuildings({ place: activePlace }),
      getRegistrations({ place: activePlace }),
    ]);
    setLoading(false);

    if (handleAuthError(buildingsRes, onLogout)) return;
    if (!buildingsRes.success) {
      toast.error(buildingsRes.message || 'Failed to load buildings');
      setBuildings([]);
    } else {
      setBuildings(safeArray(buildingsRes.data?.buildings ?? buildingsRes.data));
    }

    if (!regsRes.success) {
      setRegistrations([]);
    } else {
      const data = regsRes.data || {};
      setRegistrations(safeArray(data.registrations));
    }
  }, [activePlace, onLogout]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  // Reset floor filter when building filter changes
  useEffect(() => {
    setFilterFloorId('');
  }, [filterBuildingId]);

  // Reset filters when place changes
  useEffect(() => {
    setFilterBuildingId('');
    setFilterFloorId('');
  }, [activePlace]);

  const floorOptions = useMemo(() => {
    if (!filterBuildingId) return [];
    const building = buildings.find((b) => b.id === Number(filterBuildingId));
    return safeArray(building && building.floors);
  }, [buildings, filterBuildingId]);

  // Collect all allotted registration IDs across visible rooms
  const allottedRegIds = useMemo(() => {
    const ids = new Set();
    buildings.forEach((b) => {
      safeArray(b.floors).forEach((f) => {
        safeArray(f.rooms).forEach((r) => {
          safeArray(r.occupants).forEach((o) => ids.add(o.registration_id));
        });
      });
    });
    return ids;
  }, [buildings]);

  const unallottedYouth = useMemo(() => {
    return registrations.filter((r) => !allottedRegIds.has(r.registration_id));
  }, [registrations, allottedRegIds]);

  // Flatten rooms according to filters
  const visibleRooms = useMemo(() => {
    const rooms = [];
    buildings.forEach((b) => {
      if (filterBuildingId && b.id !== Number(filterBuildingId)) return;
      safeArray(b.floors).forEach((f) => {
        if (filterFloorId && f.id !== Number(filterFloorId)) return;
        safeArray(f.rooms).forEach((r) => {
          rooms.push({ ...r, _building: b.name, _floor: f.name });
        });
      });
    });
    return rooms;
  }, [buildings, filterBuildingId, filterFloorId]);

  const handleUnallot = async (allotmentId) => {
    const res = await deleteAllotment(allotmentId);
    if (handleAuthError(res, onLogout)) return;
    if (!res.success) {
      toast.error(res.message || 'Could not remove allotment');
      return;
    }
    toast.success('Allotment removed');
    fetchData();
  };

  return (
    <Box>
      {/* Filter row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GridViewIcon color="primary" />
          <Typography variant="h6">Room Board</Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Building</InputLabel>
          <Select
            value={filterBuildingId}
            label="Building"
            onChange={(e) => setFilterBuildingId(e.target.value)}
          >
            <MenuItem value="">All Buildings</MenuItem>
            {buildings.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }} disabled={!filterBuildingId}>
          <InputLabel>Floor</InputLabel>
          <Select
            value={filterFloorId}
            label="Floor"
            onChange={(e) => setFilterFloorId(e.target.value)}
          >
            <MenuItem value="">All Floors</MenuItem>
            {floorOptions.map((f) => (
              <MenuItem key={f.id} value={f.id}>
                {f.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : visibleRooms.length === 0 ? (
        <Alert severity="info">
          No rooms found. Add buildings and rooms in the Building Setup tab.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {visibleRooms.map((room) => (
            <Grid item xs={12} sm={6} md={4} xl={3} key={room.id}>
              <RoomCard
                room={room}
                unallottedYouth={unallottedYouth}
                onAllotted={fetchData}
                onUnallot={handleUnallot}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default RoomBoard;
