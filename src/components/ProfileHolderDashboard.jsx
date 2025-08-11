import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Grid,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  CardMembership as CardIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import axios from 'axios';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { baseURL } from '../api/apiClient';
import IDCard from '../components/IDCard';
import { capitalizeName } from '../utils/text-format';

const ProfileHolderDashboard = ({ authToken, user, onLogout }) => {
  const [profileData, setProfileData] = useState(null);
  const [idCardDialog, setIdCardDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch profile data
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/profiles`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (response.data.success && response.data.data.profiles.length > 0) {
        setProfileData(response.data.data.profiles[0]); // Profile holder only has one profile
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

  // Check ID card validity
  const getIdCardValidity = () => {
    if (!profileData?.issue_date) return null;
    
    const issueDate = dayjs(profileData.issue_date);
    const expiryDate = issueDate.add(2, 'years');
    const currentDate = dayjs();
    const daysUntilExpiry = expiryDate.diff(currentDate, 'days');
    
    return {
      issued: issueDate.format('DD/MM/YYYY'),
      expires: expiryDate.format('DD/MM/YYYY'),
      isValid: currentDate.isBefore(expiryDate),
      daysUntilExpiry: Math.max(0, daysUntilExpiry)
    };
  };

  const validity = getIdCardValidity();

  // View ID card
  const viewIdCard = () => {
    setIdCardDialog(true);
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
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 300, mb: 1 }}>
        My Profile
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        View your profile information and ID card
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Info Card */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  src={profileData?.photo_url || ''}
                  sx={{ width: 80, height: 80, mr: 2 }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {capitalizeName(profileData?.name)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {profileData?.designation} • {profileData?.level}
                  </Typography>
                  <Chip 
                    label={`${profileData?.deanery} - ${profileData?.parish}`} 
                    size="small" 
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Phone</Typography>
                  <Typography variant="body1">{profileData?.phone}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Date of Birth</Typography>
                  <Typography variant="body1">{dayjs(profileData?.dob).format('DD/MM/YYYY')}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Qualification</Typography>
                  <Typography variant="body1">{profileData?.qualification}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Father's Name</Typography>
                  <Typography variant="body1">{profileData?.father}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Address</Typography>
                  <Typography variant="body1">{profileData?.postal_address}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* ID Card Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>ID Card</Typography>
              
              {/* <Button
                fullWidth
                variant="contained"
                startIcon={<CardIcon />}
                onClick={viewIdCard}
                sx={{ mb: 2 }}
              >
                View My ID Card
              </Button> */}

              {validity && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <CalendarIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                    Issued: {validity.issued}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    <CalendarIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                    Expires: {validity.expires}
                  </Typography>
                  
                  {validity.isValid ? (
                    <Chip 
                      icon={<CheckIcon />}
                      label={validity.daysUntilExpiry > 60 ? 'Valid' : `Expires in ${validity.daysUntilExpiry} days`}
                      color={validity.daysUntilExpiry > 60 ? 'success' : 'warning'}
                      size="small"
                    />
                  ) : (
                    <Chip 
                      icon={<WarningIcon />}
                      label="Expired"
                      color="error"
                      size="small"
                    />
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Validity Alerts */}
          {validity && (
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Status</Typography>
                {!validity.isValid && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    Your ID card has expired. Please contact CYD Office for renewal.
                  </Alert>
                )}
                {validity.isValid && validity.daysUntilExpiry <= 60 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Your ID card will expire in {validity.daysUntilExpiry} days. Please contact CYD Office for renewal.
                  </Alert>
                )}
                {validity.isValid && validity.daysUntilExpiry > 60 && (
                  <Alert severity="success">
                    Your ID card is valid and in good standing.
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* ID Card Dialog */}
      <Dialog open={idCardDialog} onClose={() => setIdCardDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>My ID Card</DialogTitle>
        <DialogContent>
          {validity && !validity.isValid && (
            <Alert severity="error" sx={{ mb: 2 }}>
              This ID card has expired on {validity.expires}
            </Alert>
          )}
          {validity && validity.isValid && validity.daysUntilExpiry <= 60 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              This ID card will expire in {validity.daysUntilExpiry} days
            </Alert>
          )}
          <IDCard data={{
            ...profileData,
            photo: profileData?.photo_url,
            father_name: profileData?.father,
            mother_name: profileData?.mother,
            date_of_birth: profileData?.dob,
          }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIdCardDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfileHolderDashboard;