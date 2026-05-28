import React, { useState, useEffect } from 'react';
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
  useMediaQuery,
  CircularProgress,
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
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  PhotoCamera as PhotoIcon,
  Event as EventIcon,
  Apartment as ApartmentIcon,
  Schedule as ScheduleIcon,
  Campaign as CampaignIcon,
  Celebration as CelebrationIcon,
  ManageAccounts as ManageAccountsIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { baseURL } from '../api/apiClient';
import IDCardTabs from '../pages/IDCardTabs';
import AnubhavRegistration from '../pages/AnubhavRegistration';
import AccommodationManager from '../pages/AccommodationManager';
import TimetableManager from '../pages/TimetableManager';
import AnnouncementManager from '../pages/AnnouncementManager';
import AnubhavLiveBanner from '../pages/AnubhavLiveBanner';
import MyEvent from '../pages/MyEvent';
import RoleManagement from '../pages/RoleManagement';
import { PLACES } from '../utils/anubhavHelpers';
import ProfileSettings from '../components/ProfileSettings';
import ProfileHolderSettings from './ProfileHolderSettings';
import ProfileHolderDashboard from './ProfileHolderDashboard';
import { getMyRole } from '../api/anubhavApi';

const drawerWidth = 280;

const Dashboard = ({ authToken, user, onLogout }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [open, setOpen] = useState(!isMobile);
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [eventRole, setEventRole] = useState('none');
  const [locPlace, setLocPlace] = useState(null);

  useEffect(() => {
    getMyRole().then((res) => {
      if (res.success && res.data) {
        setEventRole(res.data.event_role || 'none');
        setLocPlace(res.data.loc_place || null);
      }
    });
  }, []);

  // Restrict menu items based on user role
  const getMenuItems = () => {
    const isEventManager = eventRole === 'loc' || eventRole === 'dexco';
    if (user?.role === 'profile_holder' && !isEventManager) {
      return [
        {
          id: 'dashboard',
          text: 'My Profile',
          icon: <PersonIcon />,
        },
        {
          id: 'anubhav-my-event',
          text: 'Anubhav 2026',
          icon: <CelebrationIcon />,
        },
        {
          id: 'profile',
          text: 'Settings',
          icon: <SettingsIcon />,
        },
      ];
    }

    // Default menu for admin/user
    const base = [
      {
        id: 'dashboard',
        text: 'Dashboard',
        icon: <DashboardIcon />,
      },
      {
        id: 'id-card',
        text: 'ID Card Management',
        icon: <CardIcon />,
      },
      {
        id: 'profile',
        text: 'Profile & Settings',
        icon: <PersonIcon />,
      },
    ];

    if (eventRole === 'loc' || eventRole === 'dexco' || user?.role === 'admin') {
      base.splice(2, 0, {
        id: 'anubhav-registration',
        text: 'Anubhav 2026',
        icon: <EventIcon />,
      });
      base.splice(3, 0, {
        id: 'anubhav-accommodation',
        text: 'Accommodation',
        icon: <ApartmentIcon />,
      });
      base.splice(4, 0, {
        id: 'anubhav-timetable',
        text: 'Timetable',
        icon: <ScheduleIcon />,
      });
      base.splice(5, 0, {
        id: 'anubhav-announcements',
        text: 'Announcements',
        icon: <CampaignIcon />,
      });
    }

    if (user?.role === 'admin') {
      base.push({
        id: 'role-management',
        text: 'Role Management',
        icon: <ManageAccountsIcon />,
      });
    }

    return base;
  };

  const menuItems = getMenuItems();

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleMenuItemClick = (menuId) => {
    setSelectedMenu(menuId);
    if (isMobile) {
      setOpen(false);
    }
  };

  // Fetch dashboard stats
  const fetchStats = async () => {
    if (!authToken) return;
    
    setLoading(true);
    try {
      // Try to fetch admin stats first
      const response = await axios.get(`${baseURL}/profiles/stats`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setStats(response.data.data.stats);
      }
    } catch (error) {
      // If not admin, fetch user's own profile count
      try {
        const userResponse = await axios.get(`${baseURL}/profiles?limit=1`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (userResponse.data.success) {
          const userStats = {
            total_profiles: userResponse.data.data.pagination.total,
            profiles_with_photos: userResponse.data.data.profiles.filter(p => p.photo_url).length,
            created_today: 0,
            created_this_week: 0,
            isUserStats: true
          };
          setStats(userStats);
        }
      } catch (userError) {
        console.error('Failed to fetch user stats:', userError);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMenu === 'dashboard') {
      fetchStats();
    }
  }, [selectedMenu, authToken]);

  const renderStatsCards = () => {
    if (loading) {
      return (
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} lg={3} key={item}>
              <Card sx={{ 
                borderRadius: 4, 
                height: 140,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CircularProgress />
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    }

    if (!stats) return null;

    const statsCards = [
      {
        title: 'Total Profiles',
        value: stats.total_profiles || 0,
        icon: <PeopleIcon sx={{ fontSize: 40 }} />,
        color: theme.palette.primary.main,
        gradient: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
      },
      {
        title: 'With Photos',
        value: stats.profiles_with_photos || 0,
        icon: <PhotoIcon sx={{ fontSize: 40 }} />,
        color: theme.palette.success.main,
        gradient: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.2)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
      },
      {
        title: 'Created Today',
        value: stats.created_today || 0,
        icon: <CalendarIcon sx={{ fontSize: 40 }} />,
        color: theme.palette.info.main,
        gradient: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.2)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
      },
      {
        title: 'This Week',
        value: stats.created_this_week || 0,
        icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
        color: theme.palette.warning.main,
        gradient: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.2)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
      },
    ];

    return (
      <Grid container spacing={3}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Card
              sx={{
                borderRadius: 4,
                background: card.gradient,
                border: `1px solid ${alpha(card.color, 0.1)}`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: `0 20px 40px ${alpha(card.color, 0.2)}`,
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 700,
                        color: card.color,
                        fontSize: { xs: '2rem', sm: '2.5rem' },
                        lineHeight: 1,
                        mb: 1,
                      }}
                    >
                      {card.value.toLocaleString()}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        fontWeight: 500,
                        fontSize: '0.875rem',
                      }}
                    >
                      {card.title}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      color: card.color,
                      opacity: 0.8,
                    }}
                  >
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderContent = () => {

    const isEventManager = eventRole === 'loc' || eventRole === 'dexco';
    if (user?.role === 'profile_holder' && !isEventManager) {
      switch (selectedMenu) {
        case 'anubhav-my-event':
          return <MyEvent user={user} />;
        case 'profile':
          return <ProfileHolderSettings authToken={authToken} user={user} onLogout={onLogout} />;
        default:
          return <ProfileHolderDashboard authToken={authToken} user={user} onLogout={onLogout} />;
      }
    }

    switch (selectedMenu) {
      case 'id-card':
        return <IDCardTabs authToken={authToken} user={user} onLogout={onLogout} />;
      case 'anubhav-registration':
        return (
          <AnubhavRegistration
            eventRole={eventRole}
            locPlace={locPlace}
            onLogout={onLogout}
          />
        );
      case 'anubhav-accommodation':
        return (
          <AccommodationManager
            eventRole={eventRole}
            locPlace={locPlace}
            onLogout={onLogout}
          />
        );
      case 'anubhav-timetable':
        return (
          <TimetableManager
            eventRole={eventRole}
            locPlace={locPlace}
            activePlace={locPlace || PLACES[0]}
            onLogout={onLogout}
          />
        );
      case 'anubhav-announcements':
        return (
          <AnnouncementManager
            eventRole={eventRole}
            locPlace={locPlace}
            activePlace={locPlace || PLACES[0]}
            onLogout={onLogout}
          />
        );
      case 'role-management':
        return <RoleManagement onLogout={onLogout} />;
      case 'profile':
        return <ProfileSettings authToken={authToken} user={user} onLogout={onLogout} />;
      default:
        return (
          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 300 }}>
                Welcome back, {user?.username}
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Here's an overview of your ID card management system
              </Typography>
            </Box>

            <AnubhavLiveBanner activePlace={locPlace || PLACES[0]} eventRole={eventRole} />

            {/* Stats Cards */}
            <Box sx={{ mb: 4 }}>
              {renderStatsCards()}
            </Box>

            {/* Quick Actions */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 3 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6} lg={4}>
                <Card 
                  sx={{ 
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
                    }
                  }}
                  onClick={() => handleMenuItemClick('id-card')}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CardIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        ID Card Management
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      Create new ID cards or manage existing profiles with advanced filtering and search capabilities
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6} lg={4}>
                <Card 
                  sx={{ 
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 20px 40px ${alpha(theme.palette.success.main, 0.15)}`,
                    }
                  }}
                  onClick={() => handleMenuItemClick('profile')}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PersonIcon sx={{ fontSize: 32, color: 'success.main', mr: 2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Profile & Settings
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      Manage your account information, change password, and customize your preferences
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
          width: { 
            xs: '100%', 
            lg: open ? `calc(100% - ${drawerWidth}px)` : `calc(100% - 64px)` 
          },
          ml: { 
            xs: 0, 
            lg: open ? `${drawerWidth}px` : '64px' 
          },
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
        variant={isMobile ? 'temporary' : 'permanent'}
        open={open}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          width: open ? drawerWidth : 64,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : (isMobile ? drawerWidth : 64),
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
          justifyContent: (open || isMobile) ? 'space-between' : 'center',
          px: 2,
          minHeight: '64px !important'
        }}>
          {(open || isMobile) && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <BadgeIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Cyd ID Card
              </Typography>
            </Box>
          )}
          {(open || isMobile) && !isMobile && (
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
                onClick={() => handleMenuItemClick(item.id)}
                selected={selectedMenu === item.id}
                sx={{
                  minHeight: 48,
                  justifyContent: (open || isMobile) ? 'initial' : 'center',
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
                    mr: (open || isMobile) ? 3 : 'auto',
                    justifyContent: 'center',
                    color: selectedMenu === item.id ? 'primary.main' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    opacity: (open || isMobile) ? 1 : 0,
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
              onClick={() => {
                onLogout();
                if (isMobile) {
                  setOpen(false);
                }
              }}
              sx={{
                minHeight: 48,
                justifyContent: (open || isMobile) ? 'initial' : 'center',
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
                  mr: (open || isMobile) ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Logout" 
                sx={{ 
                  opacity: (open || isMobile) ? 1 : 0,
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
          display: 'flex',
          flexDirection: 'column',
          ml: {
            xs: 0,
            lg: open ? `${drawerWidth/4}px` : '64px'
          },
          width: {
            xs: '100%',
            lg: open ? `calc(100% - ${drawerWidth}px)` : `calc(100% - 64px)`
          }
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          {renderContent()}
        </Box>
        <Box
          component="footer"
          sx={{
            py: 1.5,
            px: 3,
            textAlign: 'center',
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>
            Powered by — Softech Smart Solutions · In collaboration with Youth Commission, Diocese of Jalandhar
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;