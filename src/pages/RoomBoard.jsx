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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Badge,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
  GridView as GridViewIcon,
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  Apartment as ApartmentIcon,
  Layers as LayersIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import {
  getBuildings,
  getRegistrations,
  createAllotmentBatch,
  deleteAllotment,
  deleteBuilding,
  deleteFloor,
  deleteRoom,
} from '../api/anubhavApi';
import ConfirmDialog from '../components/ConfirmDialog';

const safeArray = (value) => (Array.isArray(value) ? value : []);

const handleAuthError = (envelope, onLogout) => {
  if (envelope && envelope.status === 401 && typeof onLogout === 'function') {
    toast.error('Session expired. Please login again.');
    onLogout();
    return true;
  }
  return false;
};

const initialsFor = (name) => {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
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
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
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
                    <Avatar
                      src={option.photo_url || undefined}
                      sx={{ width: 36, height: 36, flexShrink: 0, mt: 0.5 }}
                    >
                      {initialsFor(option.name)}
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
                    avatar={
                      <Avatar src={opt.photo_url || undefined}>
                        {initialsFor(opt.name)}
                      </Avatar>
                    }
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
        <Button onClick={handleClose} disabled={saving} sx={{ minHeight: 44 }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={saving || !selected.length}
          startIcon={saving ? <CircularProgress size={18} /> : <PersonAddIcon />}
          sx={{ minHeight: 44 }}
        >
          {saving ? 'Allotting…' : selected.length > 1 ? `Allot ${selected.length} Youth` : 'Allot Youth'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Occupant tile: circular avatar, name below, × badge to remove ────────────

const OccupantTile = ({ occupant, onRemove }) => (
  <Box
    sx={{
      width: 88,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0.5,
    }}
  >
    <Badge
      overlap="circular"
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      badgeContent={
        <Tooltip title={`Remove ${occupant.name}`}>
          <IconButton
            size="small"
            aria-label={`Remove ${occupant.name}`}
            onClick={() => onRemove(occupant)}
            sx={{
              width: 24,
              height: 24,
              minWidth: 24,
              minHeight: 24,
              p: 0,
              bgcolor: 'error.main',
              color: 'error.contrastText',
              boxShadow: 1,
              '&:hover': { bgcolor: 'error.dark' },
            }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      }
    >
      <Avatar
        src={occupant.photo_url || undefined}
        sx={{ width: 56, height: 56, fontSize: '1rem' }}
      >
        {initialsFor(occupant.name)}
      </Avatar>
    </Badge>
    <Typography
      variant="caption"
      sx={{
        textAlign: 'center',
        fontWeight: 500,
        lineHeight: 1.2,
        width: '100%',
        wordBreak: 'break-word',
      }}
      title={occupant.name}
    >
      {occupant.name}
    </Typography>
    {occupant.parish && (
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontSize: '0.65rem', lineHeight: 1, textAlign: 'center' }}
      >
        {occupant.parish}
      </Typography>
    )}
  </Box>
);

// ── Room card ────────────────────────────────────────────────────────────────

const RoomCard = ({ room, unallottedYouth, onAllotted, onUnallot, canDelete, onDelete }) => {
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
      <Card variant="outlined" sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardHeader
          sx={{ pb: 1 }}
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {room.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip
                  size="small"
                  label={`${room.occupancy} / ${room.capacity}`}
                  color={chipColor}
                />
                {canDelete && (
                  <Tooltip title={`Delete ${room.name}`}>
                    <IconButton
                      size="small"
                      aria-label={`Delete ${room.name}`}
                      color="error"
                      onClick={() => onDelete(room)}
                      sx={{ minWidth: 44, minHeight: 44 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
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
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              No occupants yet.
            </Typography>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: { xs: 1.25, sm: 1.5 },
                justifyContent: { xs: 'center', sm: 'flex-start' },
                pt: 1,
              }}
            >
              {safeArray(room.occupants).map((occupant) => (
                <OccupantTile
                  key={occupant.allotment_id}
                  occupant={occupant}
                  onRemove={onUnallot}
                />
              ))}
            </Box>
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
            sx={{ minHeight: 44 }}
          >
            {isFull ? 'Room full' : 'Allot Youth'}
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

// ── Main component ──────────────────────────────────────────────────────────

const RoomBoard = ({ activePlace, eventRole, onLogout, refreshKey, onRoomChanged }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const canDelete = eventRole === 'admin' || eventRole === 'dexco';

  const [buildings, setBuildings] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterBuildingId, setFilterBuildingId] = useState('');
  const [filterFloorId, setFilterFloorId] = useState('');

  const [expandedBuilding, setExpandedBuilding] = useState(null);
  const [expandedFloor, setExpandedFloor] = useState(null);

  const [confirm, setConfirm] = useState({ open: false });
  const [confirmLoading, setConfirmLoading] = useState(false);

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

  useEffect(() => {
    setFilterFloorId('');
  }, [filterBuildingId]);

  useEffect(() => {
    setFilterBuildingId('');
    setFilterFloorId('');
    setExpandedBuilding(null);
    setExpandedFloor(null);
  }, [activePlace]);

  // On desktop, expand the first building by default once data loads.
  useEffect(() => {
    if (!isMobile && buildings.length > 0 && expandedBuilding === null) {
      setExpandedBuilding(buildings[0].id);
    }
  }, [buildings, isMobile, expandedBuilding]);

  const floorOptions = useMemo(() => {
    if (!filterBuildingId) return [];
    const building = buildings.find((b) => b.id === Number(filterBuildingId));
    return safeArray(building && building.floors);
  }, [buildings, filterBuildingId]);

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

  // Apply filters by re-shaping the buildings tree (preserves accordion structure).
  const visibleBuildings = useMemo(() => {
    return buildings
      .filter((b) => !filterBuildingId || b.id === Number(filterBuildingId))
      .map((b) => ({
        ...b,
        floors: safeArray(b.floors).filter(
          (f) => !filterFloorId || f.id === Number(filterFloorId)
        ),
      }));
  }, [buildings, filterBuildingId, filterFloorId]);

  const notifyChanged = () => {
    if (typeof onRoomChanged === 'function') onRoomChanged();
  };

  const askUnallot = (occupant, roomName) => {
    setConfirm({
      open: true,
      title: 'Remove from room?',
      body: `${occupant.name} will be removed from ${roomName}. They will need to be re-allotted to stay in this room.`,
      confirmText: 'Remove',
      run: async () => {
        const res = await deleteAllotment(occupant.allotment_id);
        if (handleAuthError(res, onLogout)) return;
        if (!res.success) {
          toast.error(res.message || 'Could not remove allotment');
          return;
        }
        toast.success(`${occupant.name} removed from ${roomName}`);
        await fetchData();
        notifyChanged();
      },
    });
  };

  const askDeleteRoom = (room, floorName, buildingName) => {
    const occCount = safeArray(room.occupants).length;
    setConfirm({
      open: true,
      title: `Delete ${room.name}?`,
      body: `This will remove the room from ${buildingName} · ${floorName}.`,
      warning:
        occCount > 0
          ? `${occCount} youth will be un-allotted. Their registrations remain.`
          : null,
      confirmText: 'Delete room',
      run: async () => {
        const res = await deleteRoom(room.id);
        if (handleAuthError(res, onLogout)) return;
        if (!res.success) { toast.error(res.message || 'Could not delete room'); return; }
        toast.success(`${room.name} deleted`);
        await fetchData();
        notifyChanged();
      },
    });
  };

  const askDeleteFloor = (floor, buildingName) => {
    const roomCount = safeArray(floor.rooms).length;
    const occCount = safeArray(floor.rooms).reduce(
      (s, r) => s + safeArray(r.occupants).length,
      0
    );
    setConfirm({
      open: true,
      title: `Delete ${floor.name}?`,
      body: `This will remove the floor from ${buildingName}.`,
      warning:
        roomCount > 0 || occCount > 0
          ? `${roomCount} room${roomCount === 1 ? '' : 's'} and ${occCount} allotment${occCount === 1 ? '' : 's'} will be removed.`
          : null,
      confirmText: 'Delete floor',
      run: async () => {
        const res = await deleteFloor(floor.id);
        if (handleAuthError(res, onLogout)) return;
        if (!res.success) { toast.error(res.message || 'Could not delete floor'); return; }
        toast.success(`${floor.name} deleted`);
        await fetchData();
        notifyChanged();
      },
    });
  };

  const askDeleteBuilding = (building) => {
    const floorCount = safeArray(building.floors).length;
    const roomCount = safeArray(building.floors).reduce(
      (s, f) => s + safeArray(f.rooms).length,
      0
    );
    const occCount = safeArray(building.floors).reduce(
      (s, f) => s + safeArray(f.rooms).reduce((ss, r) => ss + safeArray(r.occupants).length, 0),
      0
    );
    setConfirm({
      open: true,
      title: `Delete ${building.name}?`,
      body: 'This will permanently remove the building.',
      warning:
        floorCount + roomCount + occCount > 0
          ? `${floorCount} floor${floorCount === 1 ? '' : 's'}, ${roomCount} room${roomCount === 1 ? '' : 's'}, and ${occCount} allotment${occCount === 1 ? '' : 's'} will be removed.`
          : null,
      confirmText: 'Delete building',
      run: async () => {
        const res = await deleteBuilding(building.id);
        if (handleAuthError(res, onLogout)) return;
        if (!res.success) { toast.error(res.message || 'Could not delete building'); return; }
        toast.success(`${building.name} deleted`);
        await fetchData();
        notifyChanged();
      },
    });
  };

  const runConfirm = async () => {
    if (!confirm.run) return;
    setConfirmLoading(true);
    try {
      await confirm.run();
    } finally {
      setConfirmLoading(false);
      setConfirm({ open: false });
    }
  };

  return (
    <Box>
      {/* Filter row */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap',
          alignItems: { xs: 'stretch', sm: 'center' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '1 0 100%', minWidth: 0 }}>
          <GridViewIcon color="primary" />
          <Typography variant="h6">Room Board</Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 180, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}>
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
        <FormControl
          size="small"
          sx={{ minWidth: 180, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
          disabled={!filterBuildingId}
        >
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
      ) : visibleBuildings.length === 0 ? (
        <Alert severity="info">
          No buildings yet. Add buildings and rooms in the Building Setup tab.
        </Alert>
      ) : (
        <Stack spacing={1.5}>
          {visibleBuildings.map((building) => {
            const floors = safeArray(building.floors);
            const totalRooms = floors.reduce((s, f) => s + safeArray(f.rooms).length, 0);
            const isOpen = expandedBuilding === building.id;

            return (
              <Accordion
                key={building.id}
                expanded={isOpen}
                onChange={(_, open) => setExpandedBuilding(open ? building.id : null)}
                disableGutters
                sx={{
                  borderRadius: '12px !important',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:before': { display: 'none' },
                  boxShadow: 'none',
                  overflow: 'hidden',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ minHeight: 56, '& .MuiAccordionSummary-content': { my: 1.5 } }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      width: '100%',
                      flexWrap: 'wrap',
                      pr: 1,
                    }}
                  >
                    <ApartmentIcon color="primary" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 'auto', minWidth: 0 }}>
                      {building.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                      {floors.length} floor{floors.length === 1 ? '' : 's'} · {totalRooms} room{totalRooms === 1 ? '' : 's'} · {building.occupancy}/{building.capacity} filled
                    </Typography>
                    <Chip
                      size="small"
                      label={`${building.occupancy} / ${building.capacity}`}
                      color={
                        building.occupancy >= building.capacity
                          ? 'warning'
                          : 'success'
                      }
                    />
                    {canDelete && (
                      <Tooltip title={`Delete ${building.name}`}>
                        <IconButton
                          size="small"
                          aria-label={`Delete ${building.name}`}
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            askDeleteBuilding(building);
                          }}
                          sx={{ minWidth: 44, minHeight: 44 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: { xs: 1.5, sm: 2 }, pt: 0 }}>
                  {floors.length === 0 ? (
                    <Alert severity="info">No floors yet. Add floors in Building Setup.</Alert>
                  ) : (
                    <Stack spacing={1.5}>
                      {floors.map((floor) => {
                        const rooms = safeArray(floor.rooms);
                        const floorOpen =
                          expandedFloor === floor.id ||
                          (expandedFloor === null && !isMobile);
                        return (
                          <Accordion
                            key={floor.id}
                            expanded={floorOpen}
                            onChange={(_, open) =>
                              setExpandedFloor(open ? floor.id : null)
                            }
                            disableGutters
                            sx={{
                              borderRadius: '8px !important',
                              border: '1px solid',
                              borderColor: 'divider',
                              '&:before': { display: 'none' },
                              boxShadow: 'none',
                              bgcolor: 'background.default',
                            }}
                          >
                            <AccordionSummary
                              expandIcon={<ExpandMoreIcon />}
                              sx={{
                                minHeight: 48,
                                '& .MuiAccordionSummary-content': { my: 1 },
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  width: '100%',
                                  flexWrap: 'wrap',
                                  pr: 1,
                                }}
                              >
                                <LayersIcon fontSize="small" color="action" />
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mr: 'auto' }}>
                                  {floor.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                  {rooms.length} room{rooms.length === 1 ? '' : 's'} · {floor.occupancy}/{floor.capacity} filled
                                </Typography>
                                <Chip
                                  size="small"
                                  label={`${floor.occupancy} / ${floor.capacity}`}
                                  color={
                                    floor.occupancy >= floor.capacity
                                      ? 'warning'
                                      : 'default'
                                  }
                                  variant="outlined"
                                />
                                {canDelete && (
                                  <Tooltip title={`Delete ${floor.name}`}>
                                    <IconButton
                                      size="small"
                                      aria-label={`Delete ${floor.name}`}
                                      color="error"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        askDeleteFloor(floor, building.name);
                                      }}
                                      sx={{ minWidth: 44, minHeight: 44 }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: { xs: 1, sm: 1.5 }, pt: 0 }}>
                              {rooms.length === 0 ? (
                                <Alert severity="info">
                                  No rooms yet. Add rooms in Building Setup.
                                </Alert>
                              ) : (
                                <Grid container spacing={2}>
                                  {rooms.map((room) => (
                                    <Grid item xs={12} sm={6} md={6} lg={4} xl={3} key={room.id}>
                                      <RoomCard
                                        room={room}
                                        unallottedYouth={unallottedYouth}
                                        onAllotted={() => {
                                          fetchData();
                                          notifyChanged();
                                        }}
                                        onUnallot={(occ) => askUnallot(occ, room.name)}
                                        canDelete={canDelete}
                                        onDelete={(r) =>
                                          askDeleteRoom(r, floor.name, building.name)
                                        }
                                      />
                                    </Grid>
                                  ))}
                                </Grid>
                              )}
                            </AccordionDetails>
                          </Accordion>
                        );
                      })}
                    </Stack>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>
      )}

      <ConfirmDialog
        open={!!confirm.open}
        title={confirm.title}
        body={confirm.body}
        warning={confirm.warning}
        confirmText={confirm.confirmText || 'Confirm'}
        loading={confirmLoading}
        onClose={() => !confirmLoading && setConfirm({ open: false })}
        onConfirm={runConfirm}
      />
    </Box>
  );
};

export default RoomBoard;
