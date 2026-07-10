// Platform Phase 4 — property panel for the selected designer element:
// position/size (mm), typography, colors, label, layer order and delete.

import React from 'react';
import {
  Box,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon,
  Delete as DeleteIcon,
  FormatAlignCenter as FormatAlignCenterIcon,
  FormatAlignLeft as FormatAlignLeftIcon,
  FormatAlignRight as FormatAlignRightIcon,
} from '@mui/icons-material';
import { FIELD_OPTIONS, FONT_FAMILIES } from '../../../utils/idCardLayout';

const FONT_WEIGHTS = [300, 400, 500, 600, 700];

const numberOr = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const PropertyPanel = ({ element, dispatch }) => {
  if (!element) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Select an element on the card to edit its properties.
        </Typography>
      </Box>
    );
  }

  const update = (patch) => dispatch({ type: 'update-element', id: element.id, patch });
  const isTextual = element.type === 'text' || element.type === 'static_text';

  return (
    <Box sx={{ p: 1.5, overflowY: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2">
          {element.type.replace('_', ' ')} · {element.id}
        </Typography>
        <Box>
          <Tooltip title="Layer down">
            <IconButton
              size="small"
              onClick={() => dispatch({ type: 'layer', id: element.id, direction: 'down' })}
            >
              <ArrowDownwardIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Layer up">
            <IconButton
              size="small"
              onClick={() => dispatch({ type: 'layer', id: element.id, direction: 'up' })}
            >
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete element">
            <IconButton
              size="small"
              color="error"
              onClick={() => dispatch({ type: 'remove-element', id: element.id })}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider sx={{ my: 1 }} />

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
        {['x', 'y', 'w', 'h'].map((key) => (
          <TextField
            key={key}
            label={`${key.toUpperCase()} (mm)`}
            size="small"
            type="number"
            inputProps={{ step: 0.1 }}
            value={element[key]}
            onChange={(e) => update({ [key]: numberOr(e.target.value, element[key]) })}
          />
        ))}
      </Box>

      {element.type === 'text' && (
        <TextField
          select
          fullWidth
          size="small"
          label="Field"
          sx={{ mt: 1.5 }}
          value={element.field || 'name'}
          onChange={(e) => update({ field: e.target.value })}
        >
          {FIELD_OPTIONS.map((option) => (
            <MenuItem key={option.field} value={option.field}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      )}

      {isTextual && (
        <>
          <TextField
            fullWidth
            size="small"
            label={element.type === 'static_text' ? 'Text' : 'Label prefix'}
            sx={{ mt: 1.5 }}
            value={element.label || ''}
            onChange={(e) => update({ label: e.target.value || null })}
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1.5 }}>
            <TextField
              label="Font size (px)"
              size="small"
              type="number"
              inputProps={{ step: 0.5 }}
              value={element.fontSize || 16}
              onChange={(e) => update({ fontSize: numberOr(e.target.value, element.fontSize) })}
            />
            <TextField
              select
              label="Weight"
              size="small"
              value={element.fontWeight || 400}
              onChange={(e) => update({ fontWeight: Number(e.target.value) })}
            >
              {FONT_WEIGHTS.map((weight) => (
                <MenuItem key={weight} value={weight}>
                  {weight}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <TextField
            select
            fullWidth
            size="small"
            label="Font family"
            sx={{ mt: 1.5 }}
            value={element.fontFamily || 'inherit'}
            onChange={(e) => update({ fontFamily: e.target.value })}
          >
            {FONT_FAMILIES.map((family) => (
              <MenuItem key={family} value={family}>
                {family}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={element.align || 'left'}
              onChange={(e, align) => align && update({ align })}
            >
              <ToggleButton value="left" aria-label="Align left">
                <FormatAlignLeftIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="center" aria-label="Align center">
                <FormatAlignCenterIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="right" aria-label="Align right">
                <FormatAlignRightIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
            <TextField
              label="Color"
              size="small"
              type="color"
              sx={{ width: 90 }}
              value={element.color || '#1a1a1a'}
              onChange={(e) => update({ color: e.target.value })}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={Boolean(element.uppercase)}
                  onChange={(e) => update({ uppercase: e.target.checked })}
                />
              }
              label="Uppercase"
            />
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={Boolean(element.wrap)}
                  onChange={(e) => update({ wrap: e.target.checked })}
                />
              }
              label="Wrap"
            />
          </Box>
        </>
      )}

      {element.type === 'line' && (
        <TextField
          label="Color"
          size="small"
          type="color"
          sx={{ mt: 1.5, width: 90 }}
          value={element.color || '#1a1a1a'}
          onChange={(e) => update({ color: e.target.value })}
        />
      )}

      {(element.type === 'photo' || element.type === 'logo' || isTextual) && (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1.5 }}>
          <TextField
            label="Radius (px)"
            size="small"
            type="number"
            value={element.borderRadius || 0}
            onChange={(e) => update({ borderRadius: numberOr(e.target.value, 0) || undefined })}
          />
          <TextField
            label="Border (CSS)"
            size="small"
            placeholder="1px solid #8D8D8D"
            value={element.border || ''}
            onChange={(e) => update({ border: e.target.value || undefined })}
          />
        </Box>
      )}

      <TextField
        label="Rotation (deg)"
        size="small"
        type="number"
        sx={{ mt: 1.5 }}
        value={element.rotation || 0}
        onChange={(e) => update({ rotation: numberOr(e.target.value, 0) })}
      />
    </Box>
  );
};

export default PropertyPanel;
