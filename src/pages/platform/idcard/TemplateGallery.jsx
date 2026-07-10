// Platform Phase 4 — template gallery: the diocese's saved templates (edit /
// duplicate / set default / delete) plus starter designs and a blank canvas.
// Thumbnails render through the shared TemplateCardRenderer, scaled down.

import React from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Grid,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as ContentCopyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import TemplateCardRenderer from '../../../components/TemplateCardRenderer';
import { CARD_WIDTH_MM, mmToPx } from '../../../utils/idCardLayout';
import { SAMPLE_PROFILE } from './sampleProfile';

const THUMB_WIDTH_PX = 180;

const Thumbnail = ({ template }) => {
  const scale = THUMB_WIDTH_PX / mmToPx(Number(template.width_mm) || CARD_WIDTH_MM);
  const heightPx = mmToPx(Number(template.height_mm) || 221.8) * scale;
  return (
    <Box
      sx={{
        width: THUMB_WIDTH_PX,
        height: heightPx,
        overflow: 'hidden',
        mx: 'auto',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <TemplateCardRenderer template={template} data={SAMPLE_PROFILE} />
      </div>
    </Box>
  );
};

const TemplateGallery = ({
  templates,
  starters,
  busy,
  onEdit,
  onCreate,
  onDuplicate,
  onDelete,
  onSetDefault,
}) => (
  <Box>
    <Typography variant="h6" sx={{ mb: 1.5 }}>
      Your templates
    </Typography>
    {templates.length === 0 && (
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        No templates yet — start from a design below or a blank canvas.
      </Typography>
    )}
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {templates.map((template) => (
        <Grid item key={template.id}>
          <Card variant="outlined" sx={{ width: 220 }}>
            <CardContent sx={{ pb: 1 }}>
              <Thumbnail template={template} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                <Typography variant="subtitle2" noWrap sx={{ flex: 1 }}>
                  {template.name}
                </Typography>
                {template.is_default === 1 && (
                  <Chip size="small" color="primary" label="Default" />
                )}
              </Box>
              <Chip size="small" variant="outlined" label={template.level} sx={{ mt: 0.5 }} />
            </CardContent>
            <CardActions sx={{ pt: 0 }}>
              <Tooltip title="Edit">
                <Button size="small" startIcon={<EditIcon />} onClick={() => onEdit(template)} disabled={busy}>
                  Edit
                </Button>
              </Tooltip>
              <Tooltip title={template.is_default === 1 ? 'Default for level' : 'Set as default'}>
                <span>
                  <Button
                    size="small"
                    startIcon={template.is_default === 1 ? <StarIcon /> : <StarBorderIcon />}
                    onClick={() => onSetDefault(template.id)}
                    disabled={busy || template.is_default === 1}
                  >
                    Default
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Duplicate">
                <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => onDuplicate(template.id)} disabled={busy}>
                  Copy
                </Button>
              </Tooltip>
              <Tooltip title="Delete">
                <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => onDelete(template)} disabled={busy}>
                  Del
                </Button>
              </Tooltip>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>

    <Typography variant="h6" sx={{ mb: 1.5 }}>
      Start from a design
    </Typography>
    <Grid container spacing={2}>
      <Grid item>
        <Card
          variant="outlined"
          sx={{
            width: 220,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 300,
          }}
        >
          <Button startIcon={<AddIcon />} onClick={() => onCreate(null)} disabled={busy}>
            Blank canvas
          </Button>
        </Card>
      </Grid>
      {starters.map((starter) => (
        <Grid item key={starter.key}>
          <Card variant="outlined" sx={{ width: 220 }}>
            <CardContent sx={{ pb: 1 }}>
              <Thumbnail template={starter} />
              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                {starter.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {starter.description}
              </Typography>
            </CardContent>
            <CardActions sx={{ pt: 0 }}>
              <Button size="small" startIcon={<AddIcon />} onClick={() => onCreate(starter)} disabled={busy}>
                Use this design
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Box>
);

export default TemplateGallery;
