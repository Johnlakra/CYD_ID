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
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  PhotoCamera as PhotoIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { baseURL } from '../api/apiClient';
import EncodeBase64 from '../components/EncodeBase64';

const ProfileHolderEdit = ({ authToken, user, onLogout }) => {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [fileInput, setFileInput] = useState('');
  const [imgSrc, setImgSrc] = useState('');
  
  const [editForm, setEditForm] = useState({
    photo: '',
    qualification: '',
    postal_address: '',
  });

  // Fetch profile data
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/profiles`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (response.data.success && response.data.data.profiles.length > 0) {
        const profile = response.data.data.profiles[0];
        setProfileData(profile);
        setEditForm({
          photo: '',
          qualification: profile.qualification || '',
          postal_address: profile.postal_address || '',
        });
        setImgSrc(profile.photo_url || '');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [authToken]);

  // Handle file upload
  const handleFileInputChange = async (file) => {
    const { files } = file.target;
    if (files[0]) {
      try {
        const base64 = await EncodeBase64(files[0]);
        setFileInput(base64);
        setImgSrc(base64);
        setEditForm(prev => ({ ...prev, photo: base64 }));
      } catch (error) {
        toast.error('Failed to process image');
      }
    }
  };

  // Update profile
  const updateProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.put(`${baseURL}/profiles/update-limited`, editForm, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (response.data.success) {
        setProfileData(response.data.data.profile);
        toast.success('Profile updated successfully');
        // Clear photo from form but keep the uploaded image
        setEditForm(prev => ({ ...prev, photo: '' }));
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        onLogout();
      } else {
        toast.error('Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profileData) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!profileData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No profile found. Please contact CYD Office.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ borderRadius: 3, maxWidth: 800, mx: 'auto' }}>
        <CardHeader
          title="Edit Profile"
          subheader="You can only update your photo"
        />
        <CardContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Limited Access:</strong> You can only edit your photo. 
              For other changes, please contact CYD Office.
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            {/* Photo Upload */}
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Profile Photo
                </Typography>
                <Avatar
                  src={imgSrc || profileData?.photo_url}
                  sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                />
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PhotoIcon />}
                  disabled={loading}
                >
                  Change Photo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileInputChange}
                  />
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                  Supported formats: JPG, PNG, GIF. Max size: 5MB
                </Typography>
              </Box>
            </Grid>

            {/* Read-only fields */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={profileData?.name || ''}
                disabled
                helperText="Contact CYD Office to change"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={profileData?.phone || ''}
                disabled
                helperText="Contact CYD Office to change"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Parish"
                value={profileData?.parish || ''}
                disabled
                helperText="Contact CYD Office to change"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Deanery"
                value={profileData?.deanery || ''}
                disabled
                helperText="Contact CYD Office to change"
              />
            </Grid>

            {/* Editable fields */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                disabled
                label="Qualification"
                value={editForm.qualification}
                onChange={(e) => setEditForm(prev => ({ ...prev, qualification: e.target.value }))}
                helperText="Contact CYD Office to change"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Postal Address"
                multiline
                disabled
                rows={3}
                value={editForm.postal_address}
                onChange={(e) => setEditForm(prev => ({ ...prev, postal_address: e.target.value }))}
                helperText="Contact CYD Office to change"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={updateProfile}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  sx={{ minWidth: 160 }}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProfileHolderEdit;