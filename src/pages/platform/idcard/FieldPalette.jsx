// Platform Phase 4 — designer field palette. One click adds the element to
// the canvas; profile fields become bound `text` elements.

import React from 'react';
import { Box, Button, Divider, Typography } from '@mui/material';
import {
  Abc as AbcIcon,
  HorizontalRule as HorizontalRuleIcon,
  Image as ImageIcon,
  Notes as NotesIcon,
  QrCode2 as QrCode2Icon,
  TextFields as TextFieldsIcon,
} from '@mui/icons-material';
import { FIELD_OPTIONS } from '../../../utils/idCardLayout';

const SPECIALS = [
  { elementType: 'photo', label: 'Photo', icon: <ImageIcon fontSize="small" /> },
  { elementType: 'qr', label: 'QR Code', icon: <QrCode2Icon fontSize="small" /> },
  { elementType: 'logo', label: 'Diocese Logo', icon: <ImageIcon fontSize="small" /> },
  { elementType: 'static_text', label: 'Static Text', icon: <NotesIcon fontSize="small" /> },
  { elementType: 'line', label: 'Line', icon: <HorizontalRuleIcon fontSize="small" /> },
];

const paletteButtonSx = {
  justifyContent: 'flex-start',
  textTransform: 'none',
  mb: 0.5,
};

const FieldPalette = ({ dispatch }) => (
  <Box sx={{ p: 1.5, width: '100%', overflowY: 'auto' }}>
    <Typography variant="subtitle2" sx={{ mb: 1 }}>
      Profile fields
    </Typography>
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {FIELD_OPTIONS.map((option) => (
        <Button
          key={option.field}
          size="small"
          startIcon={<TextFieldsIcon fontSize="small" />}
          sx={paletteButtonSx}
          onClick={() =>
            dispatch({
              type: 'add-element',
              elementType: 'text',
              overrides: { field: option.field },
            })
          }
        >
          {option.label}
        </Button>
      ))}
    </Box>
    <Divider sx={{ my: 1 }} />
    <Typography variant="subtitle2" sx={{ mb: 1 }}>
      Elements
    </Typography>
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {SPECIALS.map((special) => (
        <Button
          key={special.elementType}
          size="small"
          startIcon={special.icon || <AbcIcon fontSize="small" />}
          sx={paletteButtonSx}
          onClick={() => dispatch({ type: 'add-element', elementType: special.elementType })}
        >
          {special.label}
        </Button>
      ))}
    </Box>
  </Box>
);

export default FieldPalette;
