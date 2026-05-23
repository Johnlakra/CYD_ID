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
  PersonAdd as PersonAddIcon,
  List as ListIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { PLACES, PLACE_META, placeChipProps } from '../utils/anubhavHelpers';
import RegisterYouth from './RegisterYouth';
import RegisteredYouthList from './RegisteredYouthList';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`anubhav-tabpanel-${index}`}
      aria-labelledby={`anubhav-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `anubhav-tab-${index}`,
    'aria-controls': `anubhav-tabpanel-${index}`,
  };
}

const AnubhavRegistration = ({ eventRole, locPlace, onLogout }) => {
  const isLoc = eventRole === 'loc';

  // LOC: place is fixed. DEXCO: defaults to first place, user can change.
  const [selectedPlace, setSelectedPlace] = useState(
    isLoc ? locPlace : PLACES[0]
  );
  const [activeTab, setActiveTab] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const activePlace = isLoc ? locPlace : selectedPlace;

  const handleRegistered = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const chipProps = placeChipProps(activePlace);
  const meta = PLACE_META[activePlace];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <EventIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          Anubhav Retreat 2026
        </Typography>
        <Chip {...chipProps} size="small" />
        {meta && (
          <Typography variant="body2" color="text.secondary">
            {meta.venue} &nbsp;|&nbsp; {meta.dates}
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
            aria-label="Anubhav registration tabs"
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
              icon={<PersonAddIcon />}
              iconPosition="start"
              label="Register Youth"
              {...a11yProps(0)}
            />
            <Tab
              icon={<ListIcon />}
              iconPosition="start"
              label="Registered Youth"
              {...a11yProps(1)}
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <RegisterYouth
            activePlace={activePlace}
            onLogout={onLogout}
            onRegistered={handleRegistered}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <RegisteredYouthList
            activePlace={activePlace}
            onLogout={onLogout}
            refreshKey={refreshKey}
          />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AnubhavRegistration;
