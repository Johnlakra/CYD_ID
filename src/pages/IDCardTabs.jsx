import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
} from '@mui/material';
import {
  CardMembership as CardIcon,
  List as ListIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import FormDetails from './FormDetails';
import ManageProfiles from './ManageProfiles';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`id-card-tabpanel-${index}`}
      aria-labelledby={`id-card-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `id-card-tab-${index}`,
    'aria-controls': `id-card-tabpanel-${index}`,
  };
}

const IDCardTabs = ({ authToken, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [editProfile, setEditProfile] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleEditProfile = (profileData) => {
    setEditProfile(profileData);
    setActiveTab(0); // Switch to form tab
  };

  const handleEditComplete = () => {
    setEditProfile(null);
    setActiveTab(1); // Switch back to manage tab
  };

  const getTabLabel = () => {
    if (editProfile && activeTab === 0) {
      return `Edit Profile - ${editProfile.name}`;
    }
    return activeTab === 0 ? "Create ID Card" : "Manage Profiles";
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="ID Card management tabs"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
              }
            }}
          >
            <Tab 
              icon={editProfile && activeTab === 0 ? <EditIcon /> : <CardIcon />} 
              iconPosition="start"
              label={editProfile && activeTab === 0 ? `Edit - ${editProfile.name}` : "Create ID Card"} 
              {...a11yProps(0)} 
            />
            <Tab 
              icon={<ListIcon />} 
              iconPosition="start"
              label="Manage Profiles" 
              {...a11yProps(1)} 
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <FormDetails 
            authToken={authToken} 
            user={user} 
            onLogout={onLogout}
            editProfile={editProfile}
            onEditComplete={handleEditComplete}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <ManageProfiles 
            authToken={authToken} 
            user={user} 
            onLogout={onLogout}
            onEditProfile={handleEditProfile}
          />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default IDCardTabs;