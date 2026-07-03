// Org structure manager (Platform Phase 2, S5). Diocese-admin CRUD for
// deaneries and parishes via /org/*. Also embedded inside the setup wizard
// (embedded prop hides the page header). Diocese 1 keeps its static JSON —
// this screen is only reachable for new-diocese admins.

import React, { useCallback, useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  AccountTreeOutlined as TreeIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import {
  getOrgStructure,
  createDeanery,
  updateDeanery,
  deleteDeanery,
  createParish,
  updateParish,
  deleteParish,
} from '../../api/platformApi';
import ConfirmDialog from '../../components/ConfirmDialog';

const OrgStructureManager = ({ onLogout, embedded = false, onStructureChange }) => {
  const [deaneries, setDeaneries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newDeanery, setNewDeanery] = useState('');
  const [addingDeanery, setAddingDeanery] = useState(false);
  const [parishDrafts, setParishDrafts] = useState({}); // deaneryId -> name
  const [addingParishFor, setAddingParishFor] = useState(null);
  // rename: { kind: 'deanery'|'parish', id, name } | null
  const [rename, setRename] = useState(null);
  const [renaming, setRenaming] = useState(false);
  // remove: { kind, id, name, parishCount } | null
  const [remove, setRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  const fetchStructure = useCallback(async () => {
    setLoading(true);
    const res = await getOrgStructure();
    setLoading(false);
    if (res.success) {
      setDeaneries(res.data.deaneries || []);
      if (onStructureChange) onStructureChange(res.data.deaneries || []);
    } else {
      if (res.status === 401 && onLogout) onLogout();
      toast.error(res.message || 'Failed to load org structure');
    }
  }, [onLogout, onStructureChange]);

  useEffect(() => {
    fetchStructure();
  }, [fetchStructure]);

  const handleAddDeanery = async (e) => {
    e.preventDefault();
    const name = newDeanery.trim();
    if (name.length < 2) return;
    setAddingDeanery(true);
    const res = await createDeanery({ name });
    setAddingDeanery(false);
    if (res.success) {
      toast.success(`Deanery "${name}" created`);
      setNewDeanery('');
      fetchStructure();
    } else {
      toast.error(res.message || 'Could not create deanery');
    }
  };

  const handleAddParish = async (deanery) => {
    const name = (parishDrafts[deanery.id] || '').trim();
    if (name.length < 2) return;
    setAddingParishFor(deanery.id);
    const res = await createParish({ deanery_id: deanery.id, name });
    setAddingParishFor(null);
    if (res.success) {
      toast.success(`Parish "${name}" added to ${deanery.name}`);
      setParishDrafts((prev) => ({ ...prev, [deanery.id]: '' }));
      fetchStructure();
    } else {
      toast.error(res.message || 'Could not create parish');
    }
  };

  const handleRename = async () => {
    if (!rename) return;
    const name = rename.name.trim();
    if (name.length < 2) return;
    setRenaming(true);
    const res =
      rename.kind === 'deanery'
        ? await updateDeanery(rename.id, { name })
        : await updateParish(rename.id, { name });
    setRenaming(false);
    if (res.success) {
      toast.success('Renamed');
      setRename(null);
      fetchStructure();
    } else {
      toast.error(res.message || 'Rename failed');
    }
  };

  const handleRemove = async () => {
    if (!remove) return;
    setRemoving(true);
    const res =
      remove.kind === 'deanery'
        ? await deleteDeanery(remove.id)
        : await deleteParish(remove.id);
    setRemoving(false);
    setRemove(null);
    if (res.success) {
      toast.success('Deleted');
      fetchStructure();
    } else {
      toast.error(res.message || 'Delete failed');
    }
  };

  const totalParishes = deaneries.reduce((n, d) => n + d.parishes.length, 0);

  return (
    <Box sx={embedded ? {} : { p: 3 }}>
      {!embedded && (
        <>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 300, mb: 1 }}>
            Organisation
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Manage the deaneries and parishes of your diocese
          </Typography>
        </>
      )}

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TreeIcon color="primary" />
              <Typography variant="h6">
                {deaneries.length} deaneries · {totalParishes} parishes
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={fetchStructure}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
            >
              Refresh
            </Button>
          </Box>

          {/* Add deanery */}
          <Box
            component="form"
            onSubmit={handleAddDeanery}
            sx={{ display: 'flex', gap: 1, mb: 3 }}
          >
            <TextField
              fullWidth
              size="small"
              label="New deanery name"
              value={newDeanery}
              onChange={(e) => setNewDeanery(e.target.value)}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={newDeanery.trim().length < 2 || addingDeanery}
              startIcon={
                addingDeanery ? <CircularProgress size={16} color="inherit" /> : <AddIcon />
              }
              sx={{ whiteSpace: 'nowrap', px: 3 }}
            >
              Add deanery
            </Button>
          </Box>

          {loading && deaneries.length === 0 ? (
            <>
              <Skeleton height={56} />
              <Skeleton height={56} />
              <Skeleton height={56} />
            </>
          ) : deaneries.length === 0 ? (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No deaneries yet. Add your first deanery above, or use the Bulk Import
                to load the whole structure from a spreadsheet.
              </Typography>
            </Box>
          ) : (
            deaneries.map((deanery) => (
              <Accordion key={deanery.id} disableGutters sx={{ borderRadius: 2, '&:before': { display: 'none' }, mb: 1, border: 1, borderColor: 'divider', boxShadow: 'none' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      pr: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {deanery.name}
                      </Typography>
                      <Chip
                        size="small"
                        label={`${deanery.parishes.length} parishes`}
                        variant="outlined"
                      />
                    </Box>
                    <Box
                      sx={{ display: 'flex', gap: 0.5 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tooltip title="Rename deanery">
                        <IconButton
                          size="small"
                          onClick={() =>
                            setRename({ kind: 'deanery', id: deanery.id, name: deanery.name })
                          }
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip
                        title={
                          deanery.parishes.length
                            ? 'Delete its parishes first'
                            : 'Delete deanery'
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={deanery.parishes.length > 0}
                            onClick={() =>
                              setRemove({
                                kind: 'deanery',
                                id: deanery.id,
                                name: deanery.name,
                                parishCount: deanery.parishes.length,
                              })
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {deanery.parishes.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No parishes yet.
                      </Typography>
                    ) : (
                      deanery.parishes.map((parish) => (
                        <Chip
                          key={parish.id}
                          label={parish.name}
                          onDelete={() =>
                            setRemove({ kind: 'parish', id: parish.id, name: parish.name })
                          }
                          onClick={() =>
                            setRename({ kind: 'parish', id: parish.id, name: parish.name })
                          }
                        />
                      ))
                    )}
                  </Box>
                  <Box
                    component="form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddParish(deanery);
                    }}
                    sx={{ display: 'flex', gap: 1 }}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      label={`New parish in ${deanery.name}`}
                      value={parishDrafts[deanery.id] || ''}
                      onChange={(e) =>
                        setParishDrafts((prev) => ({ ...prev, [deanery.id]: e.target.value }))
                      }
                    />
                    <Button
                      type="submit"
                      variant="outlined"
                      disabled={
                        (parishDrafts[deanery.id] || '').trim().length < 2 ||
                        addingParishFor === deanery.id
                      }
                      startIcon={
                        addingParishFor === deanery.id ? (
                          <CircularProgress size={16} />
                        ) : (
                          <AddIcon />
                        )
                      }
                      sx={{ whiteSpace: 'nowrap', px: 3 }}
                    >
                      Add parish
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </CardContent>
      </Card>

      {/* Rename dialog */}
      <Dialog
        open={!!rename}
        onClose={renaming ? undefined : () => setRename(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Rename {rename?.kind === 'deanery' ? 'deanery' : 'parish'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            sx={{ mt: 1 }}
            label="Name"
            value={rename?.name || ''}
            onChange={(e) => setRename((prev) => ({ ...prev, name: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRename(null)} disabled={renaming}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRename}
            disabled={renaming || (rename?.name || '').trim().length < 2}
            startIcon={renaming ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {renaming ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!remove}
        title={`Delete ${remove?.kind}?`}
        body={`"${remove?.name}" will be removed from your diocese structure.`}
        warning={
          remove?.kind === 'deanery'
            ? 'A deanery can only be deleted after all its parishes are removed.'
            : 'Profiles already using this parish name keep it as free text.'
        }
        confirmText="Delete"
        loading={removing}
        onClose={() => setRemove(null)}
        onConfirm={handleRemove}
      />
    </Box>
  );
};

export default OrgStructureManager;
