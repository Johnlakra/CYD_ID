// Platform Phase 4 — ID Card Designer page (Pillar D). Gallery of saved +
// starter templates, and a drag/resize editor (react-rnd) whose canvas shares
// the exact render path of the final card. Gated by idcards.design.

import React, { useCallback, useEffect, useReducer, useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  GridOn as GridOnIcon,
  GridOff as GridOffIcon,
  Save as SaveIcon,
  Undo as UndoIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Wallpaper as WallpaperIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import {
  createIdCardTemplate,
  deleteIdCardTemplate,
  duplicateIdCardTemplate,
  getIdCardGallery,
  listIdCardTemplates,
  setDefaultIdCardTemplate,
  updateIdCardTemplate,
} from '../../../api/platformApi';
import ConfirmDialog from '../../../components/ConfirmDialog';
import FieldPalette from './FieldPalette';
import PropertyPanel from './PropertyPanel';
import DesignerCanvas from './DesignerCanvas';
import TemplateGallery from './TemplateGallery';
import { SAMPLE_PROFILE } from './sampleProfile';
import {
  ZOOM_STEPS,
  designerReducer,
  initDesignerState,
  toLayoutJson,
} from './designerState';

const LEVEL_OPTIONS = ['parish', 'deanery', 'dexco'];

// Reads an uploaded image as a data URL (the real backend stores a Cloudinary
// URL instead; both are valid background_url values).
const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the selected file'));
    reader.readAsDataURL(file);
  });

const IdCardDesigner = ({ onLogout }) => {
  const [view, setView] = useState('gallery');
  const [templates, setTemplates] = useState([]);
  const [starters, setStarters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [state, dispatch] = useReducer(designerReducer, null, () => initDesignerState());

  const handle401 = useCallback(
    (res) => {
      if (res.status === 401 && onLogout) onLogout();
    },
    [onLogout]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    const [listRes, galleryRes] = await Promise.all([listIdCardTemplates(), getIdCardGallery()]);
    if (listRes.success) {
      setTemplates(listRes.data.templates || []);
    } else {
      handle401(listRes);
      toast.error(listRes.message);
    }
    if (galleryRes.success) {
      setStarters(galleryRes.data.templates || []);
    } else {
      handle401(galleryRes);
      toast.error(galleryRes.message);
    }
    setLoading(false);
  }, [handle401]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openEditor = (template) => {
    dispatch({ type: 'load', template });
    setView('editor');
  };

  const handleCreate = (starter) => {
    openEditor(
      starter
        ? {
            id: null,
            name: `${starter.name} card`,
            level: 'parish',
            background_url: null,
            layout_json: starter.layout_json,
          }
        : null
    );
  };

  const handleSave = async () => {
    if (!state.meta.background_url) {
      toast.error('Upload a background image before saving');
      return;
    }
    setBusy(true);
    const payload = {
      level: state.meta.level,
      name: state.meta.name,
      background_url: state.meta.background_url,
      width_mm: state.meta.width_mm,
      height_mm: state.meta.height_mm,
      layout_json: toLayoutJson(state),
    };
    const res = state.meta.id
      ? await updateIdCardTemplate(state.meta.id, payload)
      : await createIdCardTemplate(payload);
    setBusy(false);
    if (!res.success) {
      handle401(res);
      toast.error(res.message);
      return;
    }
    dispatch({ type: 'saved', template: res.data.template });
    setSaveOpen(false);
    toast.success(state.meta.id ? 'Template updated' : 'Template created');
    refresh();
  };

  const handleDuplicate = async (id) => {
    setBusy(true);
    const res = await duplicateIdCardTemplate(id);
    setBusy(false);
    if (!res.success) {
      handle401(res);
      toast.error(res.message);
      return;
    }
    toast.success('Template duplicated');
    refresh();
  };

  const handleSetDefault = async (id) => {
    setBusy(true);
    const res = await setDefaultIdCardTemplate(id);
    setBusy(false);
    if (!res.success) {
      handle401(res);
      toast.error(res.message);
      return;
    }
    toast.success('Default template set');
    refresh();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    const res = await deleteIdCardTemplate(deleteTarget.id);
    setBusy(false);
    setDeleteTarget(null);
    if (!res.success) {
      handle401(res);
      toast.error(res.message);
      return;
    }
    toast.success('Template deleted');
    refresh();
  };

  const handleBackgroundUpload = async (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      dispatch({ type: 'set-meta', patch: { background_url: dataUrl } });
    } catch (error) {
      toast.error(error.message);
    }
  };

  const zoomBy = (step) => {
    const index = ZOOM_STEPS.indexOf(state.zoom);
    const base = index === -1 ? ZOOM_STEPS.findIndex((z) => z >= state.zoom) : index;
    const next = Math.min(Math.max(base + step, 0), ZOOM_STEPS.length - 1);
    dispatch({ type: 'set-zoom', zoom: ZOOM_STEPS[next] });
  };

  const selectedElement = state.elements.find((el) => el.id === state.selectedId) || null;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (view === 'gallery') {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          ID Card Designer
        </Typography>
        <TemplateGallery
          templates={templates}
          starters={starters}
          busy={busy}
          onEdit={openEditor}
          onCreate={handleCreate}
          onDuplicate={handleDuplicate}
          onDelete={setDeleteTarget}
          onSetDefault={handleSetDefault}
        />
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Delete template?"
          body={deleteTarget ? `"${deleteTarget.name}" will no longer be available for ${deleteTarget.level} cards.` : ''}
          warning={
            deleteTarget && deleteTarget.is_default === 1
              ? 'This is the default template for its level — cards fall back to the legacy layout.'
              : null
          }
          confirmText="Delete"
          loading={busy}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 112px)' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense" sx={{ gap: 1 }}>
          <Tooltip title="Back to gallery">
            <IconButton edge="start" onClick={() => setView('gallery')}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="subtitle1" sx={{ flex: 1 }} noWrap>
            {state.meta.name}
            {state.dirty ? ' *' : ''}
          </Typography>
          <Tooltip title="Undo">
            <span>
              <IconButton onClick={() => dispatch({ type: 'undo' })} disabled={state.history.length === 0}>
                <UndoIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Zoom out">
            <IconButton onClick={() => zoomBy(-1)}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="body2">{Math.round(state.zoom * 100)}%</Typography>
          <Tooltip title="Zoom in">
            <IconButton onClick={() => zoomBy(1)}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={state.snap ? 'Snap to grid: on' : 'Snap to grid: off'}>
            <IconButton onClick={() => dispatch({ type: 'toggle-snap' })}>
              {state.snap ? <GridOnIcon /> : <GridOffIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Upload background image">
            <IconButton component="label">
              <WallpaperIcon />
              <input hidden type="file" accept="image/png,image/jpeg" onChange={handleBackgroundUpload} />
            </IconButton>
          </Tooltip>
          <Button variant="contained" size="small" startIcon={<SaveIcon />} onClick={() => setSaveOpen(true)} disabled={busy}>
            Save
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Card square variant="outlined" sx={{ width: 190, flexShrink: 0, overflowY: 'auto' }}>
          <FieldPalette dispatch={dispatch} />
        </Card>
        <DesignerCanvas state={state} dispatch={dispatch} sampleData={SAMPLE_PROFILE} />
        <Card square variant="outlined" sx={{ width: 280, flexShrink: 0, overflowY: 'auto' }}>
          <PropertyPanel element={selectedElement} dispatch={dispatch} />
        </Card>
      </Box>

      <Dialog open={saveOpen} onClose={() => setSaveOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{state.meta.id ? 'Update template' : 'Save template'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Template name"
            margin="dense"
            value={state.meta.name}
            onChange={(e) => dispatch({ type: 'set-meta', patch: { name: e.target.value } })}
          />
          <TextField
            select
            fullWidth
            label="Level"
            margin="dense"
            helperText="Which card level this template renders"
            value={LEVEL_OPTIONS.includes(state.meta.level) ? state.meta.level : 'custom'}
            onChange={(e) =>
              e.target.value !== 'custom' &&
              dispatch({ type: 'set-meta', patch: { level: e.target.value } })
            }
          >
            {LEVEL_OPTIONS.map((level) => (
              <MenuItem key={level} value={level}>
                {level}
              </MenuItem>
            ))}
            <MenuItem value="custom">custom…</MenuItem>
          </TextField>
          {!LEVEL_OPTIONS.includes(state.meta.level) && (
            <TextField
              fullWidth
              label="Custom level key"
              margin="dense"
              value={state.meta.level}
              onChange={(e) => dispatch({ type: 'set-meta', patch: { level: e.target.value } })}
            />
          )}
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" color="text.secondary">
            {state.meta.background_url
              ? 'Background image attached.'
              : 'No background yet — use the toolbar wallpaper button to upload one.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={busy || !state.meta.name.trim()}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IdCardDesigner;
