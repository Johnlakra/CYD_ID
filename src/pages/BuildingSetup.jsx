import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Business as BusinessIcon,
  AddCircleOutline as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import {
  getBuildings,
  createBuilding,
  createFloor,
  createRoom,
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

// ── Dialogs ──────────────────────────────────────────────────────────────────

const AddBuildingDialog = ({ open, place, onClose, onSaved }) => {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    setName('');
    onClose();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.warning('Building name is required');
      return;
    }
    setSaving(true);
    const res = await createBuilding({ place, name: name.trim() });
    setSaving(false);
    if (!res.success) {
      toast.error(res.message || 'Could not create building');
      return;
    }
    toast.success('Building added');
    handleClose();
    onSaved();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add Building</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Building Name"
            size="small"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={18} /> : null}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const AddFloorDialog = ({ open, building, onClose, onSaved }) => {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    setName('');
    setLevel('');
    onClose();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.warning('Floor name is required');
      return;
    }
    if (level === '' || level === undefined) {
      toast.warning('Level is required');
      return;
    }
    setSaving(true);
    const res = await createFloor({
      building_id: building.id,
      name: name.trim(),
      level: Number(level),
    });
    setSaving(false);
    if (!res.success) {
      toast.error(res.message || 'Could not create floor');
      return;
    }
    toast.success('Floor added');
    handleClose();
    onSaved();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        Add Floor {building ? `— ${building.name}` : ''}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Floor Name"
            size="small"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ground Floor"
            autoFocus
          />
          <TextField
            label="Level (0 = Ground)"
            size="small"
            type="number"
            fullWidth
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            inputProps={{ min: 0 }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={18} /> : null}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const AddRoomDialog = ({ open, floor, onClose, onSaved }) => {
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('6');
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    setName('');
    setCapacity('6');
    onClose();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.warning('Room name is required');
      return;
    }
    if (!capacity || Number(capacity) < 1) {
      toast.warning('Capacity must be at least 1');
      return;
    }
    setSaving(true);
    const res = await createRoom({
      floor_id: floor.id,
      name: name.trim(),
      capacity: Number(capacity),
    });
    setSaving(false);
    if (!res.success) {
      toast.error(res.message || 'Could not create room');
      return;
    }
    toast.success('Room added');
    handleClose();
    onSaved();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        Add Room {floor ? `— ${floor.name}` : ''}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Room Name"
            size="small"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Room A"
            autoFocus
          />
          <TextField
            label="Capacity"
            size="small"
            type="number"
            fullWidth
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            inputProps={{ min: 1 }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={18} /> : null}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const BuildingSetup = ({ activePlace, eventRole, onLogout, onRoomChanged }) => {
  const canDelete = eventRole === 'admin' || eventRole === 'dexco';
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);

  const [addBuildingOpen, setAddBuildingOpen] = useState(false);
  const [addFloorDialog, setAddFloorDialog] = useState({ open: false, building: null });
  const [addRoomDialog, setAddRoomDialog] = useState({ open: false, floor: null });

  const [confirm, setConfirm] = useState({ open: false });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchBuildings = useCallback(async () => {
    if (!activePlace) return;
    setLoading(true);
    const res = await getBuildings({ place: activePlace });
    setLoading(false);
    if (handleAuthError(res, onLogout)) return;
    if (!res.success) {
      toast.error(res.message || 'Failed to load buildings');
      setBuildings([]);
      return;
    }
    setBuildings(safeArray(res.data?.buildings ?? res.data));
  }, [activePlace, onLogout]);

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  const notifyChanged = () => {
    if (typeof onRoomChanged === 'function') onRoomChanged();
  };

  const askDeleteBuilding = (building) => {
    const floorCount = safeArray(building.floors).length;
    const roomCount = safeArray(building.floors).reduce(
      (s, f) => s + safeArray(f.rooms).length,
      0
    );
    setConfirm({
      open: true,
      title: `Delete ${building.name}?`,
      body: 'This will permanently remove the building.',
      warning:
        floorCount + roomCount > 0
          ? `${floorCount} floor${floorCount === 1 ? '' : 's'} and ${roomCount} room${roomCount === 1 ? '' : 's'} will be removed, along with any allotments inside them.`
          : null,
      confirmText: 'Delete building',
      run: async () => {
        const res = await deleteBuilding(building.id);
        if (handleAuthError(res, onLogout)) return;
        if (!res.success) { toast.error(res.message || 'Could not delete building'); return; }
        toast.success(`${building.name} deleted`);
        await fetchBuildings();
        notifyChanged();
      },
    });
  };

  const askDeleteFloor = (floor, buildingName) => {
    const roomCount = safeArray(floor.rooms).length;
    setConfirm({
      open: true,
      title: `Delete ${floor.name}?`,
      body: `This will remove the floor from ${buildingName}.`,
      warning:
        roomCount > 0
          ? `${roomCount} room${roomCount === 1 ? '' : 's'} on this floor will be removed, along with any allotments inside them.`
          : null,
      confirmText: 'Delete floor',
      run: async () => {
        const res = await deleteFloor(floor.id);
        if (handleAuthError(res, onLogout)) return;
        if (!res.success) { toast.error(res.message || 'Could not delete floor'); return; }
        toast.success(`${floor.name} deleted`);
        await fetchBuildings();
        notifyChanged();
      },
    });
  };

  const askDeleteRoom = (room, floorName, buildingName) => {
    setConfirm({
      open: true,
      title: `Delete ${room.name}?`,
      body: `This will remove the room from ${buildingName} · ${floorName}.`,
      warning:
        room.occupancy > 0
          ? `${room.occupancy} youth currently allotted to this room will be un-allotted. Their registrations remain.`
          : null,
      confirmText: 'Delete room',
      run: async () => {
        const res = await deleteRoom(room.id);
        if (handleAuthError(res, onLogout)) return;
        if (!res.success) { toast.error(res.message || 'Could not delete room'); return; }
        toast.success(`${room.name} deleted`);
        await fetchBuildings();
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
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
                <BusinessIcon color="primary" />
                <Typography variant="h6">Buildings</Typography>
              </Box>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setAddBuildingOpen(true)}
              >
                Add Building
              </Button>
            </Box>
          }
        />
        <CardContent>
          {buildings.length === 0 ? (
            <Alert severity="info">
              No buildings yet for this venue. Click "Add Building" to get started.
            </Alert>
          ) : (
            buildings.map((building) => (
              <Accordion key={building.id} sx={{ mb: 1, borderRadius: '8px !important', '&:before': { display: 'none' }, border: '1px solid', borderColor: 'divider' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', width: '100%', pr: 1 }}>
                    <Typography sx={{ fontWeight: 600, mr: 'auto' }}>{building.name}</Typography>
                    <Chip
                      size="small"
                      label={`${building.occupancy} / ${building.capacity}`}
                      color={
                        building.occupancy >= building.capacity
                          ? 'warning'
                          : 'default'
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
                <AccordionDetails sx={{ pt: 0 }}>
                  {safeArray(building.floors).length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      No floors yet.
                    </Typography>
                  ) : (
                    safeArray(building.floors).map((floor) => (
                      <Box key={floor.id} sx={{ mb: 3 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 1,
                            gap: 1,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mr: 'auto' }}>
                            {floor.name}
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() =>
                              setAddRoomDialog({ open: true, floor })
                            }
                            sx={{ minHeight: 44 }}
                          >
                            Add Room
                          </Button>
                          {canDelete && (
                            <Tooltip title={`Delete ${floor.name}`}>
                              <IconButton
                                size="small"
                                aria-label={`Delete ${floor.name}`}
                                color="error"
                                onClick={() => askDeleteFloor(floor, building.name)}
                                sx={{ minWidth: 44, minHeight: 44 }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                        {safeArray(floor.rooms).length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            No rooms yet.
                          </Typography>
                        ) : (
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Room</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">
                                  Capacity
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">
                                  Occupancy
                                </TableCell>
                                {canDelete && <TableCell sx={{ p: 0.5 }} />}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {safeArray(floor.rooms).map((room) => (
                                <TableRow key={room.id} hover>
                                  <TableCell>{room.name}</TableCell>
                                  <TableCell align="right">{room.capacity}</TableCell>
                                  <TableCell align="right">
                                    <Chip
                                      size="small"
                                      label={`${room.occupancy} / ${room.capacity}`}
                                      color={
                                        room.occupancy >= room.capacity
                                          ? 'warning'
                                          : 'success'
                                      }
                                    />
                                  </TableCell>
                                  {canDelete && (
                                    <TableCell align="right" sx={{ p: 0.5 }}>
                                      <Tooltip title={`Delete ${room.name}`}>
                                        <IconButton
                                          size="small"
                                          aria-label={`Delete ${room.name}`}
                                          color="error"
                                          onClick={() => askDeleteRoom(room, floor.name, building.name)}
                                          sx={{ minWidth: 44, minHeight: 44 }}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </Box>
                    ))
                  )}

                  <Box sx={{ mt: 1 }}>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() =>
                        setAddFloorDialog({ open: true, building })
                      }
                    >
                      Add Floor
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </CardContent>
      </Card>

      <AddBuildingDialog
        open={addBuildingOpen}
        place={activePlace}
        onClose={() => setAddBuildingOpen(false)}
        onSaved={fetchBuildings}
      />

      <AddFloorDialog
        open={addFloorDialog.open}
        building={addFloorDialog.building}
        onClose={() => setAddFloorDialog({ open: false, building: null })}
        onSaved={fetchBuildings}
      />

      <AddRoomDialog
        open={addRoomDialog.open}
        floor={addRoomDialog.floor}
        onClose={() => setAddRoomDialog({ open: false, floor: null })}
        onSaved={fetchBuildings}
      />

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

export default BuildingSetup;
