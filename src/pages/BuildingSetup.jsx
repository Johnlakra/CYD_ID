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
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Business as BusinessIcon,
  AddCircleOutline as AddIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { getBuildings, createBuilding, createFloor, createRoom } from '../api/anubhavApi';

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

const BuildingSetup = ({ activePlace, onLogout }) => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);

  const [addBuildingOpen, setAddBuildingOpen] = useState(false);
  const [addFloorDialog, setAddFloorDialog] = useState({ open: false, building: null });
  const [addRoomDialog, setAddRoomDialog] = useState({ open: false, floor: null });

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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontWeight: 600 }}>{building.name}</Typography>
                    <Chip
                      size="small"
                      label={`${building.occupancy} / ${building.capacity}`}
                      color={
                        building.occupancy >= building.capacity
                          ? 'warning'
                          : 'default'
                      }
                    />
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
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {floor.name}
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() =>
                              setAddRoomDialog({ open: true, floor })
                            }
                          >
                            Add Room
                          </Button>
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
    </Box>
  );
};

export default BuildingSetup;
