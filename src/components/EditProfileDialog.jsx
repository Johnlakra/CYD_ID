import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Avatar,
  Typography,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { baseURL } from '../api/apiClient';

// Deaneries data (same as in your FormDetails component)
const deaneries = {
  Ajnala: ["Ajnala", "Chamiyari", "Chogawan", "Chuchakwal", "Karyal", "Othian", "Punga", "Ramdas"],
  // ... (include all deaneries from your existing code)
};

const levelOptions = ["parish", "deanery", "dexco"];
const designationOptions = [
  "Member", "President", "Vice-President", "Secretary", "Joint Secretary",
  "Treasurer", "Joint Treasurer", "Media Secretary", "Joint Media Secretary",
  "Boy Representative", "Girl Representative", "Boy Spokesperson", "Girl Spokesperson",
];

const EditProfileDialog = ({ open, onClose, profileData, authToken, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    father: '',
    mother: '',
    dob: '',
    designation: '',
    level: '',
    date_of_baptism: '',
    postal_address: '',
    parish: '',
    deanery: '',
    qualification: '',
    phone: '',
    involvement: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profileData && open) {
      setFormData({
        name: profileData.name || '',
        father: profileData.father || '',
        mother: profileData.mother || '',
        dob: profileData.dob || '',
        designation: profileData.designation || '',
        level: profileData.level || '',
        date_of_baptism: profileData.date_of_baptism || '',
        postal_address: profileData.postal_address || '',
        parish: profileData.parish || '',
        deanery: profileData.deanery || '',
        qualification: profileData.qualification || '',
        phone: profileData.phone || '',
        involvement: profileData.involvement || '',
      });
    }
  }, [profileData, open]);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profileData?.id) return;

    setLoading(true);
    try {
      const response = await axios.put(
        `${baseURL}/profiles/${profileData.id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Profile updated successfully!');
        onSuccess?.();
        onClose();
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableParishes = () => {
    return formData.deanery ? deaneries[formData.deanery] || [] : [];
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={profileData?.photo_url || ''} />
            <Typography variant="h6">Edit Profile</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Father's Name"
                value={formData.father}
                onChange={handleInputChange('father')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mother's Name"
                value={formData.mother}
                onChange={handleInputChange('mother')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={formData.dob}
                onChange={handleInputChange('dob')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Baptism"
                type="date"
                value={formData.date_of_baptism}
                onChange={handleInputChange('date_of_baptism')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Deanery</InputLabel>
                <Select
                  value={formData.deanery}
                  label="Deanery"
                  onChange={handleInputChange('deanery')}
                >
                  {Object.keys(deaneries).map((deanery) => (
                    <MenuItem key={deanery} value={deanery}>
                      {deanery}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Parish</InputLabel>
                <Select
                  value={formData.parish}
                  label="Parish"
                  onChange={handleInputChange('parish')}
                  disabled={!formData.deanery}
                >
                  {getAvailableParishes().map((parish) => (
                    <MenuItem key={parish} value={parish}>
                      {parish}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Level</InputLabel>
                <Select
                  value={formData.level}
                  label="Level"
                  onChange={handleInputChange('level')}
                >
                  {levelOptions.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Designation</InputLabel>
                <Select
                  value={formData.designation}
                  label="Designation"
                  onChange={handleInputChange('designation')}
                >
                  {designationOptions.map((designation) => (
                    <MenuItem key={designation} value={designation}>
                      {designation}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Educational Qualification"
                value={formData.qualification}
                onChange={handleInputChange('qualification')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Involvement Since"
                value={formData.involvement}
                onChange={handleInputChange('involvement')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Postal Address"
                multiline
                rows={3}
                value={formData.postal_address}
                onChange={handleInputChange('postal_address')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditProfileDialog;