// Visual marker for "independent" entries — youth registered directly for
// Anubhav without an existing ID-card profile (Option B). One consistent muted
// colour everywhere (deliberately NOT MUI "warning", and not purple), so the
// badge reads as a neutral status tag rather than an alarm.
import React from 'react';
import { Chip, Tooltip, Box } from '@mui/material';

// Blue-grey — muted and tasteful. Exported so every surface (chips, corner
// dots, PDFs) can share the exact same colour.
export const INDEPENDENT_COLOR = '#546e7a';

const TOOLTIP_TEXT = 'Registered directly for Anubhav — no ID-card profile yet.';

// Small corner dot for dense surfaces (avatars, roommate chips) where a full
// chip would not fit. Size is configurable; defaults to 10px.
export const IndependentDot = ({ size = 10, title = TOOLTIP_TEXT }) => (
  <Tooltip title={title} arrow>
    <Box
      component="span"
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: INDEPENDENT_COLOR,
        border: '2px solid #fff',
        display: 'inline-block',
        boxSizing: 'content-box',
      }}
    />
  </Tooltip>
);

// Default: an outlined chip labelled "Independent" with an explanatory tooltip.
const IndependentBadge = ({ size = 'small', label = 'Independent', sx }) => (
  <Tooltip title={TOOLTIP_TEXT} arrow>
    <Chip
      label={label}
      size={size}
      variant="outlined"
      sx={{
        color: INDEPENDENT_COLOR,
        borderColor: INDEPENDENT_COLOR,
        fontWeight: 600,
        ...sx,
      }}
    />
  </Tooltip>
);

export default IndependentBadge;
