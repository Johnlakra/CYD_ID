import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  AdminPanelSettings as AdminIcon,
  CalendarToday as DateIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import axios from 'axios';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { baseURL } from '../api/apiClient';

const schema = yup.object().shape({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .matches(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  email: yup
    .string()
    .required('Email is required')
    .email('Must be a valid email address'),
});

const ProfileInfo = ({ authToken, user, onLogout }) => {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      username: '',
      email: '',
    }
  });

  // Fetch user profile
  const fetchProfile = async () => {
    if (!authToken) return;

    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const userData = response.data.data.user;
        setProfileData(userData);
        reset({
          username: userData.username,
          email: userData.email,
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        onLogout();
      } else {
        toast.error('Failed to load profile information');
      }
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await axios.put(`${baseURL}/auth/profile`, data, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setProfileData(response.data.data.user);
        setEditMode(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        onLogout();
      } else {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    if (profileData) {
      reset({
        username: profileData.username,
        email: profileData.email,
      });
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [authToken]);

  if (loading && !profileData) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ borderRadius: 3, maxWidth: 800, mx: 'auto' }}>
        <CardHeader
          title="Profile Information"
          action={
            !editMode && (
              <Button
                startIcon={<EditIcon />}
                onClick={() => setEditMode(true)}
                variant="outlined"
              >
                Edit Profile
              </Button>
            )
          }
        />
        <CardContent>
          {/* Profile Avatar and Basic Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                fontSize: '2rem',
                mr: 3,
              }}
            >
              {profileData?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                {profileData?.username}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  icon={<AdminIcon />}
                  label={profileData?.role === 'admin' ? 'Administrator' : 'User'}
                  color={profileData?.role === 'admin' ? 'error' : 'primary'}
                  variant="outlined"
                  size="small"
                />
                <Chip
                  icon={<DateIcon />}
                  label={`Joined ${dayjs(profileData?.created_at).format('MMM DD, YYYY')}`}
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {editMode ? (
            /* Edit Form */
            <form onSubmit={handleSubmit(onSubmit)}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Update your profile information below. Changes will be saved immediately.
              </Alert>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="username"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Username"
                        fullWidth
                        error={!!errors.username}
                        helperText={errors.username?.message}
                        InputProps={{
                          startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Email Address"
                        fullWidth
                        error={!!errors.email}
                        helperText={errors.email?.message}
                        InputProps={{
                          startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  startIcon={<CancelIcon />}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </form>
          ) : (
            /* View Mode */
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Username
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1">{profileData?.username}</Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Email Address
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1">{profileData?.email}</Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Account Type
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AdminIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1">
                      {profileData?.role === 'admin' ? 'Administrator' : 'Standard User'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Member Since
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <DateIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1">
                      {dayjs(profileData?.created_at).format('MMMM DD, YYYY')}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {profileData?.updated_at && (
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Last Updated
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dayjs(profileData.updated_at).format('MMMM DD, YYYY [at] h:mm A')}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProfileInfo;