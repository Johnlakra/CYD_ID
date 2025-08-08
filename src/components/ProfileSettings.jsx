import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import ProfileInfo from './ProfileInfo';
import ChangePassword from './ChangePassword';
import UserManagement from './UserManagement';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
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
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const ProfileSettings = ({ authToken, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 300, mb: 1 }}>
        Profile & Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your account information and preferences
      </Typography>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="Profile settings tabs"
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
              icon={<PersonIcon />} 
              iconPosition="start"
              label="Profile Information" 
              {...a11yProps(0)} 
            />
            <Tab 
              icon={<LockIcon />} 
              iconPosition="start"
              label="Change Password" 
              {...a11yProps(1)} 
            />
            {isAdmin && (
              <Tab 
                icon={<AdminIcon />} 
                iconPosition="start"
                label="User Management" 
                {...a11yProps(2)} 
              />
            )}
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <ProfileInfo authToken={authToken} user={user} onLogout={onLogout} />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <ChangePassword authToken={authToken} user={user} onLogout={onLogout} />
        </TabPanel>

        {isAdmin && (
          <TabPanel value={activeTab} index={2}>
            <UserManagement authToken={authToken} user={user} onLogout={onLogout} />
          </TabPanel>
        )}
      </Paper>
    </Box>
  );
};

export default ProfileSettings;