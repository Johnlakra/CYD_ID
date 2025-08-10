import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
} from '@mui/material';
import {
  Edit as EditIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import ProfileHolderEdit from './ProfileHolderEdit';
import ChangePassword from './ChangePassword';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-holder-tabpanel-${index}`}
      aria-labelledby={`profile-holder-tab-${index}`}
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
    id: `profile-holder-tab-${index}`,
    'aria-controls': `profile-holder-tabpanel-${index}`,
  };
}

const ProfileHolderSettings = ({ authToken, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 300, mb: 1 }}>
        Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Update your profile information and account settings
      </Typography>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="Profile holder settings tabs"
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
              icon={<EditIcon />} 
              iconPosition="start"
              label="Edit Profile" 
              {...a11yProps(0)} 
            />
            <Tab 
              icon={<LockIcon />} 
              iconPosition="start"
              label="Change Password" 
              {...a11yProps(1)} 
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <ProfileHolderEdit authToken={authToken} user={user} onLogout={onLogout} />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <ChangePassword authToken={authToken} user={user} onLogout={onLogout} />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default ProfileHolderSettings;