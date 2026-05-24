import React, { useState, useCallback } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
} from '@mui/material';
import {
  Business as BusinessIcon,
  GridView as GridViewIcon,
  PictureAsPdf as PdfIcon,
  Apartment as ApartmentIcon,
} from '@mui/icons-material';
import { PLACES, PLACE_META, placeChipProps } from '../utils/anubhavHelpers';
import BuildingSetup from './BuildingSetup';
import RoomBoard from './RoomBoard';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`accommodation-tabpanel-${index}`}
      aria-labelledby={`accommodation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `accommodation-tab-${index}`,
    'aria-controls': `accommodation-tabpanel-${index}`,
  };
}

const AccommodationManager = ({ eventRole, locPlace, onLogout }) => {
  const isLoc = eventRole === 'loc';

  const [selectedPlace, setSelectedPlace] = useState(
    isLoc ? locPlace : PLACES[0]
  );
  const [activeTab, setActiveTab] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const activePlace = isLoc ? locPlace : selectedPlace;

  const onRoomChanged = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const chipProps = placeChipProps(activePlace);
  const meta = PLACE_META[activePlace];

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <ApartmentIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          Accommodation
        </Typography>
        <Chip {...chipProps} size="small" />
        {meta && (
          <Typography variant="body2" color="text.secondary">
            {meta.venue}&nbsp;|&nbsp;{meta.dates}
          </Typography>
        )}
      </Box>

      {!isLoc && (
        <Box sx={{ mb: 3, maxWidth: 280 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Place</InputLabel>
            <Select
              value={selectedPlace}
              label="Place"
              onChange={(e) => setSelectedPlace(e.target.value)}
            >
              {PLACES.map((p) => (
                <MenuItem key={p} value={p}>
                  {PLACE_META[p].label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            aria-label="Accommodation tabs"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
              },
            }}
          >
            <Tab
              icon={<BusinessIcon />}
              iconPosition="start"
              label="Building Setup"
              {...a11yProps(0)}
            />
            <Tab
              icon={<GridViewIcon />}
              iconPosition="start"
              label="Room Board"
              {...a11yProps(1)}
            />
            <Tab
              icon={<PdfIcon />}
              iconPosition="start"
              label="Generate PDFs"
              {...a11yProps(2)}
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <BuildingSetup
            activePlace={activePlace}
            onLogout={onLogout}
            onRoomChanged={onRoomChanged}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <RoomBoard
            activePlace={activePlace}
            onLogout={onLogout}
            refreshKey={refreshKey}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <PdfIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              PDF generation — coming in the pdf-specialist pass
            </Typography>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AccommodationManager;
