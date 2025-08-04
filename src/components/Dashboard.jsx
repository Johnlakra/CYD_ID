import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Paper,
  Grid,
  Card,
  CardContent,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Badge as BadgeIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  CardMembership as CardIcon,
} from '@mui/icons-material';
import FormDetails from '../pages/FormDetails';

const drawerWidth = 280;

const Dashboard = ({ authToken, user, onLogout }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState('dashboard');

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const menuItems = [
    {
      id: 'dashboard',
      text: 'Dashboard',
      icon: <DashboardIcon />,
    },
    {
      id: 'id-card',
      text: 'ID Card Form',
      icon: <CardIcon />,
    },
    {
      id: 'profile',
      text: 'Profile',
      icon: <PersonIcon />,
    },
    {
      id: 'settings',
      text: 'Settings',
      icon: <SettingsIcon />,
    },
  ];

  const renderContent = () => {
    switch (selectedMenu) {
      case 'id-card':
        return <FormDetails authToken={authToken} user={user} onLogout={onLogout} />;
      case 'profile':
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              Profile
            </Typography>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="body1">
                Profile management coming soon...
              </Typography>
            </Paper>
          </Box>
        );
      case 'settings':
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              Settings
            </Typography>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="body1">
                Settings panel coming soon...
              </Typography>
            </Paper>
          </Box>
        );
      default:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 300 }}>
              Welcome back, {user?.username}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
              Manage your ID cards and profile information
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6} lg={4}>
                <Card 
                  sx={{ 
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                    }
                  }}
                  onClick={() => setSelectedMenu('id-card')}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CardIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        Create ID Card
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Generate and download your digital ID card with all required information
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6} lg={4}>
                <Card 
                  sx={{ 
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                    }
                  }}
                  onClick={() => setSelectedMenu('profile')}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PersonIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        Profile
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Manage your personal information and account settings
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6} lg={4}>
                <Card 
                  sx={{ 
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                    }
                  }}
                  onClick={() => setSelectedMenu('settings')}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <SettingsIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        Settings
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Configure your preferences and application settings
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${open ? drawerWidth : 64}px)`,
          ml: `${open ? drawerWidth : 64}px`,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 'none',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="toggle drawer"
              onClick={handleDrawerToggle}
              edge="start"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 400 }}>
              {menuItems.find(item => item.id === selectedMenu)?.text || 'Dashboard'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: 'primary.main',
                fontSize: '0.875rem'
              }}
            >
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user?.username}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : 64,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : 64,
            boxSizing: 'border-box',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
            bgcolor: 'background.paper',
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Toolbar sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: open ? 'space-between' : 'center',
          px: 2,
          minHeight: '64px !important'
        }}>
          {open && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <BadgeIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Cyd ID Card
              </Typography>
            </Box>
          )}
          {open && (
            <IconButton onClick={handleDrawerToggle} size="small">
              <ChevronLeftIcon />
            </IconButton>
          )}
        </Toolbar>
        
        <Divider />
        
        <List sx={{ flex: 1, px: 1, py: 2 }}>
          {menuItems.map((item) => (
            <ListItem key={item.id} disablePadding sx={{ display: 'block', mb: 0.5 }}>
              <ListItemButton
                onClick={() => setSelectedMenu(item.id)}
                selected={selectedMenu === item.id}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                    },
                  },
                  '&:hover': {
                    bgcolor: alpha(theme.palette.action.hover, 0.5),
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                    color: selectedMenu === item.id ? 'primary.main' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    opacity: open ? 1 : 0,
                    '& .MuiListItemText-primary': {
                      fontSize: '0.875rem',
                      fontWeight: selectedMenu === item.id ? 500 : 400,
                    }
                  }} 
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider />
        
        <List sx={{ px: 1, py: 2 }}>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              onClick={onLogout}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                borderRadius: 2,
                '&:hover': {
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  color: 'error.main',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Logout" 
                sx={{ 
                  opacity: open ? 1 : 0,
                  '& .MuiListItemText-primary': {
                    fontSize: '0.875rem',
                  }
                }} 
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          mt: '64px',
          bgcolor: 'grey.50',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {renderContent()}
      </Box>
    </Box>
  );
};

export default Dashboard;